from datetime import datetime, timedelta
from sqlalchemy import select
from app.db.base import PetOwner, Pet, Appointment
from app.models.pet import PetType, Gender
from app.models.appointment import AppointmentStatus
from app.services.notification import NotificationService
BASE='/api/v1/owner/settings'

def test_preferences(client,owner_auth_header,vet_auth_header):
    assert client.get(BASE,headers=owner_auth_header).json()['email_reminders'] is True
    assert client.put(BASE,headers=owner_auth_header,json={'email_appointments':False,'email_reminders':False}).status_code==200
    assert client.get(BASE,headers=owner_auth_header).json()['email_reminders'] is False
    assert client.get(BASE,headers=vet_auth_header).status_code==401
    assert client.get(BASE).status_code==401

def test_password_and_revocation(client,registered_owner,owner_auth_header):
    data={'current_password':'wrong','new_password':'Newpassword123'}
    assert client.post(BASE+'/password',headers=owner_auth_header,json=data).status_code==400
    data['current_password']='test123456'
    assert client.post(BASE+'/password',headers=owner_auth_header,json=data).status_code==204
    assert client.get(BASE,headers=owner_auth_header).status_code==401
    assert client.post('/api/v1/auth/pet-owner/login',json={'email':registered_owner.email,'password':'test123456'}).status_code==401
    response=client.post('/api/v1/auth/pet-owner/login',json={'email':registered_owner.email,'password':'Newpassword123'})
    assert response.status_code==200
    headers={'Authorization':'Bearer '+response.json()['access_token']}
    assert client.get(BASE,headers=headers).status_code==200
    assert client.post(BASE+'/logout-all',headers=headers,json={'current_password':'Newpassword123'}).status_code==204
    assert client.get(BASE,headers=headers).status_code==401

def test_password_rules(client,owner_auth_header):
    for value in ['short1','longbutnonumber','1'*12,'α'*40+'1']:
        assert client.post(BASE+'/password',headers=owner_auth_header,json={'current_password':'test123456','new_password':value}).status_code==422

def test_email_preferences(db,registered_owner,monkeypatch):
    calls=[]
    monkeypatch.setattr('app.services.notification.send_notification_email',lambda *args:calls.append(args))
    service=NotificationService(db)
    registered_owner.email_appointments=False;registered_owner.email_reminders=False;db.commit()
    for kind in ['appointment_confirm','reminder']:
        service._send_owner_email(registered_owner.id,kind,None,'Pet','Tomorrow','Checkup')
    assert calls==[]
    registered_owner.email_reminders=True;db.commit()
    service._send_owner_email(registered_owner.id,'reminder',None,'Pet','Tomorrow','Checkup',title='Reminder')
    assert len(calls)==1

def test_delete(client,db,registered_owner,registered_vet,owner_auth_header,monkeypatch):
    oid=registered_owner.id
    pet=Pet(pet_owner_id=oid,name='Pet',breed='Mixed',age=2,weight=10,type=PetType.DOG,gender=Gender.MALE)
    db.add(pet);db.flush()
    appt=Appointment(vet_id=registered_vet.id,pet_owner_id=oid,pet_id=pet.id,scheduled_at=datetime.now()+timedelta(days=1),type='Checkup',status=AppointmentStatus.CONFIRMED)
    db.add(appt);db.commit()
    data={'current_password':'test123456','confirmation':'ΔΙΑΓΡΑΦΗ'}
    assert client.post(BASE+'/delete-account',headers=owner_auth_header,json={**data,'confirmation':'no'}).status_code==422
    assert client.post(BASE+'/delete-account',headers=owner_auth_header,json={**data,'current_password':'wrong'}).status_code==400
    assert client.post(BASE+'/delete-account',headers=owner_auth_header,json=data).status_code==409
    appt.status=AppointmentStatus.CANCELLED;db.commit()
    monkeypatch.setattr('app.api.v1.endpoints.owner_settings.delete_upload',lambda url:None)
    assert client.post(BASE+'/delete-account',headers=owner_auth_header,json=data).status_code==204
    assert db.scalar(select(PetOwner.id).where(PetOwner.id==oid)) is None
    assert db.scalar(select(Pet.id).where(Pet.pet_owner_id==oid)) is None
    assert client.get(BASE,headers=owner_auth_header).status_code==401

