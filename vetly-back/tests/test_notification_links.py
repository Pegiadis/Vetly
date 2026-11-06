from unittest.mock import Mock
from uuid import uuid4
from app.services.notification import NotificationService
from app.repositories.notification import NotificationRepository


def test_appointment_link_persisted_without_email_payload_change():
    db = Mock()
    service = NotificationService(db)
    service.repository = Mock()
    service._send_vet_email = Mock()
    vet, appointment = uuid4(), uuid4()
    service.notify_vet(vet, 'appointment_new', 'title', 'message', appointment_id=appointment)
    assert service.repository.create.call_args.kwargs['appointment_id'] == appointment
    assert service.repository.create.call_args.kwargs['vet_id'] == vet
    assert 'appointment_id' not in service._send_vet_email.call_args.kwargs


def test_filtered_list_and_count_both_keep_vet_scope():
    db = Mock()
    db.scalars.return_value.all.return_value = []
    db.scalar.return_value = 0
    vet = uuid4()
    NotificationRepository(db).get_by_vet(vet, is_read=False)
    for query in [db.scalars.call_args.args[0], db.scalar.call_args.args[0]]:
        sql = str(query)
        assert 'notifications.vet_id =' in sql
        assert 'notifications.is_read = false' in sql
        assert vet in query.compile().params.values()
