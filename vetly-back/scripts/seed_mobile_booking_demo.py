"""Fill missing local demo booking catalogs; never run against production."""
import argparse
import json
import sys
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.db.base import ServiceType, Vet
from app.db.session import SessionLocal, engine


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    url = make_url(settings.DATABASE_URL)
    if settings.ENVIRONMENT != 'development' or url.host not in {'localhost', '127.0.0.1', '::1'}:
        raise SystemExit('Only a development database on localhost is allowed.')
    engine.echo = False
    catalog = [
        ('Κλινική εξέταση', 30, '30.00'),
        ('Εμβολιασμός', 30, '35.00'),
        ('Επανεξέταση', 30, '20.00'),
    ]
    hours = {day: {'closed': False, 'morning': {'open': '09:00', 'close': '18:00'}}
             for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']}
    hours['saturday'] = {'closed': False, 'morning': {'open': '10:00', 'close': '14:00'}}
    hours['sunday'] = {'closed': True}
    changes = []
    with SessionLocal() as db:
        for vet in db.scalars(select(Vet).where(Vet.is_verified.is_(True)).with_for_update()).all():
            active = db.scalar(select(ServiceType.id).where(
                ServiceType.vet_id == vet.id, ServiceType.is_active.is_(True)).limit(1))
            added = []
            if active is None:
                for name, duration, price in catalog:
                    service = ServiceType(vet_id=vet.id, name=name, duration_minutes=duration,
                        price=Decimal(price), is_active=True,
                        description='Δοκιμαστική υπηρεσία τοπικού περιβάλλοντος Vetly. Ενδεικτική τιμή για έλεγχο κρατήσεων.')
                    db.add(service)
                    added.append(name)
            added_hours = not vet.hours
            if added_hours:
                vet.hours = hours
            if added or added_hours:
                changes.append({'vet_id': str(vet.id), 'name': vet.name,
                                'services_added': added, 'demo_hours_added': added_hours})
        if args.apply:
            db.commit()
        else:
            db.rollback()
    print(json.dumps({'applied': args.apply, 'changes': changes}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
