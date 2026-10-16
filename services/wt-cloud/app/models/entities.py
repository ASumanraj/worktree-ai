import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    ARRAY,
    JSON,
    Text,
    CheckConstraint,
    Uuid,
    select,
    func,
    case,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None


class Base(DeclarativeBase):
    pass


class Tenant(Base):
    __tablename__ = "tenants"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_name: Mapped[str] = mapped_column(String(255), nullable=False)
    verified_email_domains: Mapped[List[str]] = mapped_column(
        ARRAY(String).with_variant(JSON, "sqlite"), nullable=False
    )
    dpdp_retention_days: Mapped[int] = mapped_column(Integer, default=90)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    squads: Mapped[List["Squad"]] = relationship(
        "Squad", back_populates="tenant", cascade="all, delete-orphan"
    )
    tribal_nodes: Mapped[List["TribalKnowledgeNode"]] = relationship(
        "TribalKnowledgeNode", back_populates="tenant", cascade="all, delete-orphan"
    )


class Squad(Base):
    __tablename__ = "squads"

    squad_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False
    )
    squad_name: Mapped[str] = mapped_column(String(120), nullable=False)
    parent_department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    active_member_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="squads")
    scope_drift_events: Mapped[List["ScopeDriftEvent"]] = relationship(
        "ScopeDriftEvent", back_populates="squad"
    )


class TribalKnowledgeNode(Base):
    __tablename__ = "tribal_knowledge_nodes"

    node_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False
    )
    source_type: Mapped[str] = mapped_column(
        String(32),
        CheckConstraint(
            "source_type IN ('GITHUB_PR_REVIEW', 'JIRA_POSTMORTEM', 'MEETING_ADR', 'CH1_INVERSE_INFERENCE')"
        ),
        nullable=False,
    )
    ast_symbol_paths: Mapped[List[str]] = mapped_column(
        ARRAY(String).with_variant(JSON, "sqlite"), nullable=False
    )
    ticket_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    pr_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    author_role_alias: Mapped[str] = mapped_column(String(120), nullable=False)
    rationale_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    synthetic_tts_audio_s3_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # In PostgreSQL with pgvector, use Vector(1536). In SQLite fallback, use JSON.
    embedding = (
        mapped_column(Vector(1536).with_variant(JSON, "sqlite"), nullable=False)
        if Vector is not None
        else mapped_column(ARRAY(Float).with_variant(JSON, "sqlite"), nullable=False)
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="tribal_nodes")


class ScopeDriftEvent(Base):
    __tablename__ = "scope_drift_events"

    drift_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False
    )
    squad_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("squads.squad_id"), nullable=True
    )
    sprint_id: Mapped[str] = mapped_column(String(64), nullable=False)
    spoken_commitment_summary: Mapped[str] = mapped_column(Text, nullable=False)
    closest_jira_ticket_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    cosine_similarity_to_sprint: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_story_point_impact: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        CheckConstraint("status IN ('FLAGGED', 'CONVERTED_TO_BILLED_CR', 'DISMISSED')"),
        default="FLAGGED",
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    squad: Mapped[Optional["Squad"]] = relationship("Squad", back_populates="scope_drift_events")


def build_k5_privacy_query(tenant_id: uuid.UUID):
    """
    Enforces Invariant 5: k >= 5 Squad Differential Privacy.
    If a squad has fewer than 5 members, it automatically rolls up
    to its parent_department_id. Teams with < 5 engineers across the reporting unit
    are strictly filtered out by the HAVING clause.
    """
    reporting_unit = case(
        (Squad.active_member_count >= 5, Squad.squad_id),
        else_=Squad.parent_department_id,
    )

    query = (
        select(
            Squad.tenant_id,
            reporting_unit.label("reporting_unit_id"),
            func.count(Squad.squad_id).label("aggregated_squads"),
            func.sum(Squad.active_member_count).label("total_engineers"),
        )
        .where(Squad.tenant_id == tenant_id)
        .group_by(Squad.tenant_id, reporting_unit)
        .having(func.sum(Squad.active_member_count) >= 5)
    )
    return query
