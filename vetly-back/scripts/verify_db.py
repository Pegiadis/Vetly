"""
Database verification script
Tests database connection and queries sample data
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal
# Import through db.base to ensure all models are registered
from app.db import base


def test_connection():
    """Test basic database connection"""
    print("Testing database connection...")
    
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        db.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def test_tables_exist():
    """Verify all tables exist"""
    print("\nVerifying tables exist...")
    
    db = SessionLocal()
    
    tables = [
        "users", "vets", "pets", "medical_events", "weight_history",
        "medications", "appointments", "reviews", "notifications",
        "blog_posts", "sessions"
    ]
    
    try:
        for table in tables:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"✓ Table '{table}' exists with {count} rows")
        
        db.close()
        return True
    except Exception as e:
        print(f"✗ Error checking tables: {e}")
        db.close()
        return False


def test_data_queries():
    """Test various data queries using SQL"""
    print("\nTesting data queries...")
    
    db = SessionLocal()
    
    try:
        # Test users with SQL
        result = db.execute(text("SELECT name, email FROM users LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"✓ Found users")
            print(f"  - Example: {row[0]} ({row[1]})")
        
        # Test vets with SQL
        result = db.execute(text("SELECT name, specialty FROM vets LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"✓ Found vets")
            print(f"  - Example: {row[0]} - {row[1]}")
        
        # Test pets with SQL
        result = db.execute(text("SELECT name, type FROM pets LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"✓ Found pets")
            print(f"  - Example: {row[0]} ({row[1]})")
        
        # Test appointments with SQL
        result = db.execute(text("SELECT type, date FROM appointments LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"✓ Found appointments")
            print(f"  - Example: {row[0]} on {row[1]}")
        
        # Test blog posts with SQL
        result = db.execute(text("SELECT title FROM blog_posts LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"✓ Found blog posts")
            print(f"  - Example: {row[0]}")
        
        db.close()
        return True
    except Exception as e:
        print(f"✗ Error querying data: {e}")
        db.close()
        return False


def test_relationships():
    """Test relationships using SQL joins"""
    print("\nTesting relationships...")
    
    db = SessionLocal()
    
    try:
        # Test User -> Pets relationship with SQL
        result = db.execute(text("""
            SELECT u.name, COUNT(p.id) as pet_count
            FROM users u
            LEFT JOIN pets p ON u.id = p.user_id
            GROUP BY u.id, u.name
            LIMIT 1
        """))
        row = result.fetchone()
        if row:
            print(f"✓ User '{row[0]}' has {row[1]} pets")
        
        # Test Pet -> Medical Events relationship
        result = db.execute(text("""
            SELECT p.name, COUNT(me.id) as event_count
            FROM pets p
            LEFT JOIN medical_events me ON p.id = me.pet_id
            GROUP BY p.id, p.name
            LIMIT 1
        """))
        row = result.fetchone()
        if row:
            print(f"✓ Pet '{row[0]}' has {row[1]} medical events")
        
        # Test Vet -> Appointments relationship
        result = db.execute(text("""
            SELECT v.name, COUNT(a.id) as appt_count
            FROM vets v
            LEFT JOIN appointments a ON v.id = a.vet_id
            GROUP BY v.id, v.name
            LIMIT 1
        """))
        row = result.fetchone()
        if row:
            print(f"✓ Vet '{row[0]}' has {row[1]} appointments")
        
        db.close()
        return True
    except Exception as e:
        print(f"✗ Error testing relationships: {e}")
        db.close()
        return False


def main():
    """Run all verification tests"""
    print("=" * 60)
    print("Database Verification Script")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Connection", test_connection()))
    results.append(("Tables", test_tables_exist()))
    results.append(("Queries", test_data_queries()))
    results.append(("Relationships", test_relationships()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Verification Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:15} : {status}")
    
    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All tests passed! Database is ready.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the output above.")
        return 1


if __name__ == "__main__":
    exit(main())
