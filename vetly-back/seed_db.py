#!/usr/bin/env python3
"""
Database seeding entry point
Run: python seed_db.py
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import SessionLocal
from app.db.seed import seed_database


def main():
    """Main entry point for database seeding"""
    print("Connecting to database...")
    db = SessionLocal()

    try:
        seed_database(db)
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
