import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.entities import (
    Base,
    Tenant,
    Squad,
    build_k5_privacy_query,
)


@pytest.fixture
def db_session():
    # In-memory SQLite for testing privacy query logic
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_k5_squad_differential_privacy_rollup(db_session: Session):
    tenant_id = uuid.uuid4()
    dept_a_id = uuid.uuid4()
    dept_b_id = uuid.uuid4()

    tenant = Tenant(
        tenant_id=tenant_id,
        org_name="Enterprise GCC India",
        verified_email_domains=["company.com"],
        dpdp_retention_days=90,
    )
    db_session.add(tenant)

    # Squad 1: 6 members (>= 5) -> Should report at squad level
    squad_1 = Squad(
        squad_id=uuid.uuid4(),
        tenant_id=tenant_id,
        squad_name="Checkout Squad",
        parent_department_id=dept_a_id,
        active_member_count=6,
    )

    # Squad 2: 3 members (< 5) in Dept A
    squad_2 = Squad(
        squad_id=uuid.uuid4(),
        tenant_id=tenant_id,
        squad_name="Payments Squad",
        parent_department_id=dept_a_id,
        active_member_count=3,
    )

    # Squad 3: 4 members (< 5) in Dept A
    # Squad 2 + Squad 3 roll up to Dept A (3 + 4 = 7 members >= 5) -> Should report under Dept A
    squad_3 = Squad(
        squad_id=uuid.uuid4(),
        tenant_id=tenant_id,
        squad_name="Billing Squad",
        parent_department_id=dept_a_id,
        active_member_count=4,
    )

    # Squad 4: 2 members (< 5) in Dept B (Dept B has only 2 members total < 5)
    # Must be FILTERED OUT entirely by HAVING SUM >= 5
    squad_4 = Squad(
        squad_id=uuid.uuid4(),
        tenant_id=tenant_id,
        squad_name="Isolated Squad",
        parent_department_id=dept_b_id,
        active_member_count=2,
    )

    db_session.add_all([squad_1, squad_2, squad_3, squad_4])
    db_session.commit()

    query = build_k5_privacy_query(tenant_id)
    results = db_session.execute(query).fetchall()

    # We expect exactly 2 reporting units:
    # 1. squad_1.squad_id (Checkout Squad, 6 members)
    # 2. dept_a_id (Rollup of squad_2 & squad_3, 7 members)
    # squad_4 must NOT appear (only 2 members)
    assert len(results) == 2

    reporting_units = {r.reporting_unit_id: r.total_engineers for r in results}
    
    assert reporting_units[squad_1.squad_id] == 6
    assert reporting_units[dept_a_id] == 7
    assert dept_b_id not in reporting_units
