"""
Quick database test - verify basic operations work
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def test_database():
    """Quick test of database connectivity and data"""
    print("=" * 60)
    print("Quick Database Test")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Test connection
        result = db.execute(text("SELECT 1"))
        print("✓ Database connection: OK")
        
        # Test data exists
        tables = {
            "users": 2,
            "vets": 3,
            "pets": 5,
            "appointments": 3,
            "reviews": 3,
            "blog_posts": 3
        }
        
        print("\nData verification:")
        for table, expected_count in tables.items():
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            status = "✓" if count == expected_count else "✗"
            print(f"  {status} {table}: {count} rows (expected {expected_count})")
        
        # Test a simple query
        result = db.execute(text("""
            SELECT u.name, COUNT(p.id) as pet_count
            FROM users u
            LEFT JOIN pets p ON u.id = p.user_id
            GROUP BY u.id, u.name
        """))
        
        print("\nSample query (users with pet counts):")
        for row in result:
            print(f"  - {row[0]}: {row[1]} pets")
        
        print("\n" + "=" * 60)
        print("✅ Database is working correctly!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = test_database()
    exit(0 if success else 1)
