"""Read-only consistency checks on the database. Run from vetly-back: python -m scripts.data_check

In production: docker compose exec backend python -m scripts.data_check
Each check is a query that should return no rows. Nothing is changed. Exit code 1 when a
check marked serious finds rows.
"""
import sys

from sqlalchemy import text

from app.db.session import SessionLocal

# scheduled_at is clinic-local (Athens) wall time; created_at is UTC.
NOW_LOCAL = "(now() at time zone 'Europe/Athens')"

# (severity, description, SQL returning the offending rows)
CHECKS = [
    ("serious", "Appointment booked for a pet that belongs to another owner", """
        select a.id, a.scheduled_at from appointments a join pets p on p.id = a.pet_id
        where p.pet_owner_id <> a.pet_owner_id"""),
    ("serious", "Two active appointments for the same vet at the same time (not one group booking)", f"""
        select a.vet_id, a.scheduled_at, count(*) from appointments a
        where lower(a.status::text) in ('pending', 'confirmed') and a.scheduled_at > {NOW_LOCAL}
        group by a.vet_id, a.scheduled_at
        having count(*) > 1 and count(distinct coalesce(a.group_id::text, a.id::text)) > 1"""),
    ("serious", "Active appointments of one vet that overlap in time", f"""
        select a.id, b.id, a.scheduled_at, b.scheduled_at from appointments a join appointments b
          on a.vet_id = b.vet_id and a.id < b.id
         and a.scheduled_at < b.scheduled_at + make_interval(mins => b.duration_minutes)
         and b.scheduled_at < a.scheduled_at + make_interval(mins => a.duration_minutes)
        where lower(a.status::text) in ('pending', 'confirmed') and lower(b.status::text) in ('pending', 'confirmed')
          and a.scheduled_at > {NOW_LOCAL}
          and (a.group_id is null or a.group_id is distinct from b.group_id)"""),
    ("serious", "Upcoming active appointment for a deleted pet", f"""
        select a.id, a.scheduled_at from appointments a join pets p on p.id = a.pet_id
        where p.deleted_at is not null and lower(a.status::text) in ('pending', 'confirmed') and a.scheduled_at > {NOW_LOCAL}"""),
    ("serious", "Upcoming active appointment with a vet who is suspended or closed", f"""
        select a.id, a.scheduled_at, v.email from appointments a join vets v on v.id = a.vet_id
        where (v.is_verified = false or v.deactivated_at is not null)
          and lower(a.status::text) in ('pending', 'confirmed') and a.scheduled_at > {NOW_LOCAL}"""),
    ("serious", "Visit marked completed before its day", f"""
        select id, scheduled_at from appointments
        where lower(status::text) = 'completed' and scheduled_at::date > ({NOW_LOCAL})::date"""),
    ("serious", "Appointment uses a service that belongs to another vet", """
        select a.id from appointments a join service_types s on s.id = a.service_type_id where s.vet_id <> a.vet_id"""),
    ("serious", "Accounts whose email differs only by letter case (owners)", """
        select lower(email), count(*) from pet_owners where email is not null group by lower(email) having count(*) > 1"""),
    ("serious", "Accounts whose email differs only by letter case (vets)", """
        select lower(email), count(*) from vets group by lower(email) having count(*) > 1"""),
    ("serious", "Owner has a password but no email", """
        select id from pet_owners where password_hash is not null and email is null"""),
    ("serious", "Notification with no recipient", """
        select id, type from notifications where pet_owner_id is null and vet_id is null"""),
    ("serious", "Reminder whose owner is not the pet's owner", """
        select r.id from reminders r join pets p on p.id = r.pet_id
        where r.pet_owner_id is not null and r.pet_owner_id <> p.pet_owner_id"""),
    ("serious", "Client card linked to an owner whose pet list does not contain the linked pet", """
        select cp.id from vet_client_pets cp join vet_clients c on c.id = cp.vet_client_id join pets p on p.id = cp.pet_id
        where c.pet_owner_id is not null and p.pet_owner_id <> c.pet_owner_id"""),
    ("serious", "Vet rating does not match its reviews", """
        select v.id, v.rating_average, v.reviews_count, coalesce(round(avg(r.rating), 2), 0) as real_avg, count(r.id) as real_count
        from vets v left join reviews r on r.vet_id = v.id group by v.id
        having v.reviews_count <> count(r.id) or abs(v.rating_average - coalesce(round(avg(r.rating), 2), 0)) > 0.01"""),
    ("serious", "More than one review by the same owner for the same vet", """
        select vet_id, pet_owner_id, count(*) from reviews group by vet_id, pet_owner_id having count(*) > 1"""),
    ("serious", "Demo request marked converted without a vet account", """
        select id from demo_requests where status = 'converted' and vet_id is null"""),
    ("minor", "Past appointment still pending or confirmed (never completed or cancelled)", f"""
        select id, status, scheduled_at from appointments
        where lower(status::text) in ('pending', 'confirmed') and scheduled_at < {NOW_LOCAL} - interval '1 day'"""),
    ("minor", "Active medication whose end date has passed", """
        select id, name, end_date from medications where is_active and end_date is not null and end_date < current_date"""),
    ("minor", "Unsent reminder of a vet whose account is closed", """
        select r.id from reminders r join vets v on v.id = r.vet_id
        where v.deactivated_at is not null and r.is_sent = false and r.is_dismissed = false"""),
    ("minor", "Active vet without a public slug or working hours (cannot be booked)", """
        select id, email from vets where is_verified and deactivated_at is null and password_hash is not null
          and (slug is null or hours is null)"""),
    ("minor", "Active vet with no services (owners cannot pick one)", """
        select v.id, v.email from vets v where v.is_verified and v.deactivated_at is null and v.password_hash is not null
          and not exists (select 1 from service_types s where s.vet_id = v.id and s.is_active)"""),
    ("minor", "Verified vet without the email confirmed or without a password (left from the old registration)", """
        select id, email from vets where is_verified and deactivated_at is null and (email_verified = false or password_hash is null)
          and created_at < now() - interval '8 days'"""),
    ("minor", "Appointment in the future on a day the vet has time off", f"""
        select a.id, a.scheduled_at from appointments a join vet_time_off t on t.vet_id = a.vet_id
        where lower(a.status::text) in ('pending', 'confirmed') and a.scheduled_at > {NOW_LOCAL}
          and a.scheduled_at::date between t.start_date and t.end_date and t.start_time is null"""),
]


def main() -> None:
    serious = 0
    with SessionLocal() as db:
        for severity, description, sql in CHECKS:
            rows = db.execute(text(sql)).all()
            mark = "ok " if not rows else ("!! " if severity == "serious" else "-- ")
            print(f"{mark}{len(rows):>4}  [{severity}] {description}")
            for row in rows[:5]:
                print("          ", tuple(str(value) for value in row))
            if rows and severity == "serious":
                serious += 1
    print(f"\n{serious} serious check(s) with findings.")
    sys.exit(1 if serious else 0)


if __name__ == "__main__":
    main()
