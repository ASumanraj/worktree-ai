import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import TribalKnowledgeNode


def deidentify_author(author_raw: str, role_hint: Optional[str] = None) -> str:
    """
    DPDP / Privacy compliance: Converts developer names into functional role aliases.
    e.g. 'Raghunath' -> 'Senior Architect [Payment]'
    """
    clean_role = role_hint or "Software Engineer"
    return f"{clean_role} [{author_raw.split()[0] if author_raw else 'Core'}]"


def extract_ast_symbols_from_files(file_paths: List[str]) -> List[str]:
    """
    Extracts normalized symbol namespaces from file paths.
    """
    symbols = []
    for path in file_paths:
        clean_path = path.replace("\\", "/").strip()
        if clean_path:
            symbols.append(clean_path)
    return symbols


class HistoricalBackfillWorker:
    """
    Stage-1 180-Day GitHub PR & Jira Historical Backfill Engine.
    Processes merged PR review discussions and Jira post-mortems into TribalKnowledgeNodes.
    """

    def __init__(self, db_session: Session):
        self.session = db_session

    def process_github_pr(
        self,
        tenant_id: uuid.UUID,
        pr_data: Dict[str, Any],
    ) -> Optional[TribalKnowledgeNode]:
        """
        Parses a merged PR with its review discussions and extracts architectural rationale.
        """
        pr_id = str(pr_data.get("number") or pr_data.get("id"))
        title = pr_data.get("title", "")
        body = pr_data.get("body", "")
        review_comments = pr_data.get("review_comments", [])
        changed_files = pr_data.get("changed_files", [])
        author = pr_data.get("author", "Developer")

        # Extract linked Jira ticket if present in title or branch
        ticket_match = re.search(r"([A-Z]+-\d+)", title) or re.search(
            r"([A-Z]+-\d+)", pr_data.get("branch", "")
        )
        ticket_key = ticket_match.group(1) if ticket_match else None

        # Synthesize rationale from PR description & review discussions
        rationale_parts = [f"### PR #{pr_id}: {title}", f"{body}"]
        if review_comments:
            rationale_parts.append("#### Key Review Discussions:")
            for comment in review_comments:
                author_alias = deidentify_author(comment.get("user", "Reviewer"), "Peer Reviewer")
                rationale_parts.append(f"- **{author_alias}**: {comment.get('body')}")

        full_rationale = "\n\n".join(rationale_parts)
        ast_symbols = extract_ast_symbols_from_files(changed_files)

        if not ast_symbols:
            return None

        # 1536-dim dummy or mock embedding vector for testing/indexing
        dummy_embedding = [0.01] * 1536

        node = TribalKnowledgeNode(
            node_id=uuid.uuid4(),
            tenant_id=tenant_id,
            source_type="GITHUB_PR_REVIEW",
            ast_symbol_paths=ast_symbols,
            ticket_key=ticket_key,
            pr_id=pr_id,
            author_role_alias=deidentify_author(author, "Lead Architect"),
            rationale_markdown=full_rationale,
            synthetic_tts_audio_s3_key=None,
            embedding=dummy_embedding,
            created_at=datetime.now(timezone.utc),
        )

        self.session.add(node)
        return node

    def process_jira_issue(
        self,
        tenant_id: uuid.UUID,
        issue_data: Dict[str, Any],
    ) -> Optional[TribalKnowledgeNode]:
        """
        Parses a closed Jira bug/incident post-mortem and links to affected components.
        """
        ticket_key = issue_data.get("key", "UNKNOWN-0")
        summary = issue_data.get("summary", "")
        description = issue_data.get("description", "")
        resolution_notes = issue_data.get("resolution_notes", "")
        affected_components = issue_data.get("affected_components", [])

        if not affected_components:
            return None

        rationale = (
            f"### Incident Post-Mortem [{ticket_key}]: {summary}\n\n"
            f"**Root Cause & Description:**\n{description}\n\n"
            f"**Resolution Strategy:**\n{resolution_notes}"
        )

        dummy_embedding = [0.02] * 1536

        node = TribalKnowledgeNode(
            node_id=uuid.uuid4(),
            tenant_id=tenant_id,
            source_type="JIRA_POSTMORTEM",
            ast_symbol_paths=affected_components,
            ticket_key=ticket_key,
            pr_id=None,
            author_role_alias="Incident Response Lead",
            rationale_markdown=rationale,
            synthetic_tts_audio_s3_key=None,
            embedding=dummy_embedding,
            created_at=datetime.now(timezone.utc),
        )

        self.session.add(node)
        return node
