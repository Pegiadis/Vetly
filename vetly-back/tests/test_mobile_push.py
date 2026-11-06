from datetime import date, datetime, time, timedelta
from types import SimpleNamespace
import httpx
import pytest
from sqlalchemy import select, func
from app.core.config import settings
from app.db.base import Medication, Notification, Pet
from app.models.push import PushDevice, PushDelivery
from app.services.push import medication_due, create_medication_notifications, process_push
from app.services.scheduling import ATHENS

TOKEN = 'ExponentPushToken[mobile_test_device]'

@pytest.mark.parametrize('frequency,day,expected', [('daily',2,True),('weekly',2,False),('weekly',8,True),('once',1,True),('once',2,False)])
def test_medication_calendar(frequency,day,expected):
    med=SimpleNamespace(is_active=True,start_date=date(2026,10,1),end_date=None,frequency=frequency,time=time(9,30))
    assert medication_due(med,datetime(2026,10,day,9,31,tzinfo=ATHENS)) is expected
    assert not medication_due(med,datetime(2026,10,day,9,29,tzinfo=ATHENS))
    assert not medication_due(med,datetime(2026,10,day,10,0,tzinfo=ATHENS))
    med.is_active=False
    assert not medication_due(med,datetime(2026,10,day,9,31,tzinfo=ATHENS))

def test_medication_generation_deduplicates(db,registered_owner):
    pet=Pet(pet_owner_id=registered_owner.id,name='Mobile med',type='Dog',breed='Mixed',age=2,weight=5,gender='Male')
    db.add(pet);db.flush()
    med=Medication(pet_id=pet.id,name='Prescribed drug',dosage='Vet instructions',frequency='daily',time=time(9,30),start_date=date(2026,10,1),end_date=date(2026,10,2),is_active=True)
    db.add(med);db.commit()
    now=datetime(2026,10,2,9,31,tzinfo=ATHENS)
    create_medication_notifications(db,now);create_medication_notifications(db,now)
    assert db.scalar(select(func.count()).select_from(Notification).where(Notification.source_key.like(f'medication:{med.id}:%')))==1
    create_medication_notifications(db,datetime(2026,10,3,9,31,tzinfo=ATHENS))
    assert db.scalar(select(func.count()).select_from(Notification).where(Notification.source_key.like(f'medication:{med.id}:%')))==1

def test_registration_revoke_and_validation(client,owner_auth_header,db,registered_owner):
    assert client.post('/api/v1/owner/push-devices',json={'token':TOKEN,'platform':'ios'}).status_code==401
    assert client.post('/api/v1/owner/push-devices',headers=owner_auth_header,json={'token':'bad','platform':'ios'}).status_code==422
    for _ in range(2):
        result=client.post('/api/v1/owner/push-devices',headers=owner_auth_header,json={'token':TOKEN,'platform':'ios'})
        assert result.status_code==200,result.text
    rows=db.scalars(select(PushDevice).where(PushDevice.token==TOKEN)).all()
    assert len(rows)==1 and rows[0].owner_id==registered_owner.id
    assert client.request('DELETE','/api/v1/owner/push-devices',headers=owner_auth_header,json={'token':TOKEN}).status_code==200
    db.refresh(rows[0]);assert not rows[0].enabled

def setup_delivery(db,owner):
    now=datetime.utcnow()
    device=PushDevice(owner_id=owner.id,token=TOKEN,platform='ios',auth_version=owner.auth_version,enabled=True,registered_at=now-timedelta(minutes=1),last_seen_at=now)
    note=Notification(pet_owner_id=owner.id,type='appointment_confirm',title='Confirmed',message='Private details',is_read=False,created_at=now)
    db.add_all([device,note]);db.commit()
    return device,note,now+timedelta(seconds=1)

def test_push_ticket_receipt_and_no_duplicate(db,registered_owner,monkeypatch):
    monkeypatch.setattr(settings,'PUSH_NOTIFICATIONS_ENABLED',True)
    device,note,now=setup_delivery(db,registered_owner)
    sent=[]
    def handler(req):
        sent.append(req)
        if req.url.path.endswith('getReceipts'): return httpx.Response(200,json={'data':{'ticket-one':{'status':'ok'}}})
        assert b'Private details' not in req.content
        return httpx.Response(200,json={'data':{'status':'ok','id':'ticket-one'}})
    with httpx.Client(transport=httpx.MockTransport(handler)) as mock:
        assert process_push(db,mock,now)==1
        assert process_push(db,mock,now+timedelta(seconds=30))==0
        process_push(db,mock,now+timedelta(minutes=16))
    delivery=db.scalar(select(PushDelivery).where(PushDelivery.notification_id==note.id))
    assert delivery.status=='delivered'
    assert len(sent)==2

def test_push_transport_retry_and_invalid_device(db,registered_owner,monkeypatch):
    monkeypatch.setattr(settings,'PUSH_NOTIFICATIONS_ENABLED',True)
    device,note,now=setup_delivery(db,registered_owner)
    with httpx.Client(transport=httpx.MockTransport(lambda r:httpx.Response(503))) as mock:
        process_push(db,mock,now)
    delivery=db.scalar(select(PushDelivery).where(PushDelivery.notification_id==note.id))
    assert delivery.status=='pending' and delivery.attempts==1
    with httpx.Client(transport=httpx.MockTransport(lambda r:httpx.Response(200,json={'data':{'status':'error','details':{'error':'DeviceNotRegistered'}}}))) as mock:
        process_push(db,mock,now+timedelta(minutes=3))
    db.refresh(device)
    assert not device.enabled and delivery.status=='failed'

def test_revoked_owner_never_sends(db,registered_owner,monkeypatch):
    monkeypatch.setattr(settings,'PUSH_NOTIFICATIONS_ENABLED',True)
    device,note,now=setup_delivery(db,registered_owner)
    registered_owner.auth_version+=1;db.commit()
    with httpx.Client(transport=httpx.MockTransport(lambda r:pytest.fail('Must not send'))) as mock:
        assert process_push(db,mock,now)==0
