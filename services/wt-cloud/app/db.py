import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models.entities import Base, Tenant, Squad, ScopeDriftEvent, TribalKnowledgeNode

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wt_cloud_dev.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        # Check if default demo tenant exists, if not seed initial demo data
        tenant = session.query(Tenant).first()
        if not tenant:
            demo_tenant_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
            dept_core_id = uuid.UUID("22222222-2222-2222-2222-222222222222")

            demo_tenant = Tenant(
                tenant_id=demo_tenant_id,
                org_name="Swiggy Delivery Core GCC",
                verified_email_domains=["swiggy.in", "company.com"],
                dpdp_retention_days=90,
            )
            session.add(demo_tenant)

            # Squad 1: 8 engineers (>= 5)
            squad_checkout = Squad(
                squad_id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
                tenant_id=demo_tenant_id,
                squad_name="Checkout & Payments Squad",
                parent_department_id=dept_core_id,
                active_member_count=8,
            )

            # Squad 2: 6 engineers (>= 5)
            squad_logistics = Squad(
                squad_id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
                tenant_id=demo_tenant_id,
                squad_name="Order Logistics Squad",
                parent_department_id=dept_core_id,
                active_member_count=6,
            )

            # Squad 3: 3 engineers (< 5) - rolls up to dept_core_id
            squad_auth = Squad(
                squad_id=uuid.UUID("55555555-5555-5555-5555-555555555555"),
                tenant_id=demo_tenant_id,
                squad_name="Identity & Auth Sub-Squad",
                parent_department_id=dept_core_id,
                active_member_count=3,
            )

            # Seed Scope Drift Events
            drift_1 = ScopeDriftEvent(
                drift_id=uuid.uuid4(),
                tenant_id=demo_tenant_id,
                squad_id=squad_checkout.squad_id,
                sprint_id="Sprint-42",
                spoken_commitment_summary="Client verbally requested bulk CSV export for monthly reconciliation audit on Friday review call.",
                closest_jira_ticket_key="PAY-1082",
                cosine_similarity_to_sprint=0.48, # Flagged (< 0.65)
                estimated_story_point_impact=8.0,
                status="FLAGGED",
            )

            drift_2 = ScopeDriftEvent(
                drift_id=uuid.uuid4(),
                tenant_id=demo_tenant_id,
                squad_id=squad_checkout.squad_id,
                sprint_id="Sprint-42",
                spoken_commitment_summary="Client requested custom webhook signature with legacy HMAC SHA1 for older banking partner.",
                closest_jira_ticket_key="PAY-990",
                cosine_similarity_to_sprint=0.52,
                estimated_story_point_impact=5.0,
                status="CONVERTED_TO_BILLED_CR",
            )

            # Seed initial Tribal Knowledge Node
            node_reconciler = TribalKnowledgeNode(
                node_id=uuid.uuid4(),
                tenant_id=demo_tenant_id,
                source_type="GITHUB_PR_REVIEW",
                ast_symbol_paths=[
                    "services/settlement/PaymentReconciler.ts",
                    "services/settlement/PaymentReconciler.ts#reconcileBatch",
                ],
                ticket_key="PAY-1082",
                pr_id="412",
                author_role_alias="Lead Architect [Settlement]",
                rationale_markdown=(
                    "HDFC Core Banking rate limiter silently returns HTTP 200 without updating ledger "
                    "if webhook retry batches are spaced under 500ms. Kept 500ms jittered backoff."
                ),
                synthetic_tts_audio_s3_key="audio/synthetic_clip_412.mp3",
                embedding=[0.01] * 1536,
            )

            session.add_all([squad_checkout, squad_logistics, squad_auth, drift_1, drift_2, node_reconciler])
            session.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
