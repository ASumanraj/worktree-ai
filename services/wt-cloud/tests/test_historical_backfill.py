import uuid
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.models.entities import Base, Tenant, TribalKnowledgeNode
from app.workers.backfill import HistoricalBackfillWorker


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_github_pr_backfill_extraction(db_session: Session):
    tenant_id = uuid.uuid4()
    tenant = Tenant(
        tenant_id=tenant_id,
        org_name="Fintech GCC Bengaluru",
        verified_email_domains=["fintech.in"],
        dpdp_retention_days=90,
    )
    db_session.add(tenant)
    db_session.commit()

    worker = HistoricalBackfillWorker(db_session)

    sample_pr = {
        "number": 412,
        "title": "fix(settlement): add 500ms delay between batch webhook retries [PAY-1082]",
        "body": "Resolves silent dropped webhooks on legacy HDFC settlement gateway.",
        "author": "Raghunath",
        "changed_files": [
            "services/settlement/PaymentReconciler.ts",
            "services/settlement/webhook_handler.go",
        ],
        "review_comments": [
            {
                "user": "Ananya",
                "body": "Can we reduce this to 50ms? 500ms might cause queue buildup during peak diwali sales.",
            },
            {
                "user": "Raghunath",
                "body": "No, HDFC bank rate limiter silently returns HTTP 200 without updating ledger if spaced < 500ms.",
            },
        ],
    }

    node = worker.process_github_pr(tenant_id, sample_pr)
    db_session.commit()

    assert node is not None
    assert node.ticket_key == "PAY-1082"
    assert node.source_type == "GITHUB_PR_REVIEW"
    assert "services/settlement/PaymentReconciler.ts" in node.ast_symbol_paths
    assert "HDFC bank rate limiter silently returns HTTP 200" in node.rationale_markdown
    # Ensure PII de-identification is active
    assert "Raghunath" not in node.author_role_alias or "Lead Architect" in node.author_role_alias


def test_jira_incident_backfill_extraction(db_session: Session):
    tenant_id = uuid.uuid4()
    tenant = Tenant(
        tenant_id=tenant_id,
        org_name="Logistics Tech Gurgaon",
        verified_email_domains=["logistics.in"],
        dpdp_retention_days=90,
    )
    db_session.add(tenant)
    db_session.commit()

    worker = HistoricalBackfillWorker(db_session)

    sample_incident = {
        "key": "INC-402",
        "summary": "Out of memory crash on OrderProcessor consumer threads",
        "description": "Kafka partitions became unbalanced during flash sale spike.",
        "resolution_notes": "Added thread pool backpressure and upgraded heap to 4GB.",
        "affected_components": ["services/order/OrderProcessor.java"],
    }

    node = worker.process_jira_issue(tenant_id, sample_incident)
    db_session.commit()

    assert node is not None
    assert node.ticket_key == "INC-402"
    assert node.source_type == "JIRA_POSTMORTEM"
    assert "services/order/OrderProcessor.java" in node.ast_symbol_paths
    assert "Added thread pool backpressure" in node.rationale_markdown
