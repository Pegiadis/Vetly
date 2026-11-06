from datetime import datetime, timezone
from unittest.mock import Mock
from uuid import uuid4
from app.services.clinic_home import get_clinic_home


def test_home_queries_scoped_and_counts_not_limited():
    db = Mock()
    db.scalar.side_effect = [120, 4, 95, 10, 6]
    db.scalars.return_value.all.return_value = []
    vet = uuid4()
    result = get_clinic_home(db, vet, datetime(2026, 10, 22, 21, 30, tzinfo=timezone.utc))
    assert result.date == '2026-10-23'  # Athens day, not UTC day
    assert result.today_confirmed == 120
    assert result.pending_total == 95
    assert result.next_appointment is None
    for call in db.scalar.call_args_list + db.scalars.call_args_list:
        query = call.args[0]
        assert 'appointments.vet_id =' in str(query)
        assert vet in query.compile().params.values()
    for call in db.scalar.call_args_list:
        assert 'LIMIT' not in str(call.args[0])
    next_query = db.scalars.call_args_list[0].args[0]
    assert datetime(2026, 10, 23, 0, 30) in next_query.compile().params.values()
    assert 'appointments.scheduled_at >=' in str(next_query)
    assert 'confirmed' in next_query.compile().params.values()
    assert not db.commit.called
