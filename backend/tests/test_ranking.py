from datetime import datetime, timedelta
from app.models.rfq import RFQ, RFQStatus, AuctionConfiguration, ExtensionTriggerType
from app.models.quotation import Quotation
from app.services.ranking_service import RankingService

def test_ranking_calculation_and_tie_breaking(db_session, buyer_user, suppliers):
    now = datetime.utcnow()
    rfq = RFQ(
        reference_id="RFQ-RANK-01",
        name="Ranking Test RFQ",
        buyer_id=buyer_user.id,
        bid_start_time=now - timedelta(hours=1),
        original_close_time=now + timedelta(hours=1),
        current_close_time=now + timedelta(hours=1),
        forced_close_time=now + timedelta(hours=2),
        pickup_service_date=now + timedelta(days=2),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(hours=1)
    )
    db_session.add(rfq)
    db_session.flush()

    _, s1 = suppliers[0]
    _, s2 = suppliers[1]
    _, s3 = suppliers[2]

    # Supplier 1 submits ₹50,000 at T-30m
    q1 = Quotation(
        rfq_id=rfq.id, supplier_id=s1.id, carrier_name="Car1",
        freight_charges=40000, origin_charges=5000, destination_charges=5000,
        total_amount=50000, transit_time="2d", quote_validity="10d",
        submitted_at=now - timedelta(minutes=30)
    )
    # Supplier 2 submits ₹45,000 at T-20m (L1)
    q2 = Quotation(
        rfq_id=rfq.id, supplier_id=s2.id, carrier_name="Car2",
        freight_charges=35000, origin_charges=5000, destination_charges=5000,
        total_amount=45000, transit_time="2d", quote_validity="10d",
        submitted_at=now - timedelta(minutes=20)
    )
    # Supplier 3 submits ₹50,000 at T-10m (Same as S1, but submitted later -> S1 should be L2, S3 should be L3)
    q3 = Quotation(
        rfq_id=rfq.id, supplier_id=s3.id, carrier_name="Car3",
        freight_charges=40000, origin_charges=5000, destination_charges=5000,
        total_amount=50000, transit_time="2d", quote_validity="10d",
        submitted_at=now - timedelta(minutes=10)
    )
    db_session.add_all([q1, q2, q3])
    db_session.commit()

    items, lowest, l1_id = RankingService.calculate_rankings(db_session, rfq.id)
    assert len(items) == 3
    assert lowest == 45000.0
    assert l1_id == s2.id

    assert items[0].supplier_id == s2.id
    assert items[0].rank == "L1"

    assert items[1].supplier_id == s1.id
    assert items[1].rank == "L2"  # Earlier submission wins the tie

    assert items[2].supplier_id == s3.id
    assert items[2].rank == "L3"
