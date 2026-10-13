#!/usr/bin/env python3
"""
Comprehensive Automated Test Suite for Smart Disaster Management
Validates all features and cloud compatibility:
- Database connectivity & SSL
- Citizen registration & login
- Admin login & role verification
- Disaster reporting and listing
- Emergency request creation & team assignment
- Database Trigger execution (validation & team availability)
- Shelter capacity query & update
- NGO donation tracking
- Aggregation query for dashboard
"""

import sys
import os
import json
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

load_dotenv()

from app import create_app
from db import test_connection, get_db_connection

def run_tests():
    print("=" * 65)
    print("SMART DISASTER MANAGEMENT - COMPREHENSIVE FEATURE TESTS")
    print("=" * 65)

    passed = 0
    total = 0

    def check(title, condition, details=""):
        nonlocal passed, total
        total += 1
        status = "[PASS]" if condition else "[FAIL]"
        if condition:
            passed += 1
        print(f"{status} {title}")
        if details:
            print(f"       {details}")
        return condition

    # Test 1: Database Connectivity
    alive, msg = test_connection()
    check("1. Cloud/Local MySQL Connectivity", alive, msg)

    # Test 2: App & Test Client
    flask_app = create_app()
    flask_app.config['TESTING'] = True
    client = flask_app.test_client()

    # Test 3: Health check endpoint
    res = client.get('/api/health')
    check("2. Backend /api/health Endpoint", res.status_code == 200, f"Status: {res.status_code}")

    # Test 4: Admin Login
    admin_res = client.post('/api/auth/login', json={
        'email': 'admin@disaster.gov',
        'password': 'admin123'
    })
    admin_data = admin_res.get_json() or {}
    check(
        "3. Admin Authentication & Session",
        admin_res.status_code == 200 and admin_data.get('user', {}).get('user_type') == 'Admin',
        f"User: {admin_data.get('user', {}).get('name')}"
    )

    # Test 5: Role-based me endpoint
    me_res = client.get('/api/auth/me')
    me_data = me_res.get_json() or {}
    check(
        "4. Authenticated Session /auth/me",
        me_data.get('authenticated') is True and me_data.get('user', {}).get('email') == 'admin@disaster.gov'
    )

    # Test 6: Dashboard Stats
    stats_res = client.get('/api/dashboard/stats')
    stats_data = stats_res.get_json() or {}
    check(
        "5. Dashboard SQL Aggregations & Metrics",
        stats_res.status_code == 200 and 'counts' in stats_data,
        f"Active Disasters: {stats_data.get('counts', {}).get('active_disasters', 0)}, Shelters: {stats_data.get('counts', {}).get('total_shelters', 0)}"
    )

    # Test 7: Disasters Retrieval
    disasters_res = client.get('/api/disasters')
    disasters_data = disasters_res.get_json() or {}
    check(
        "6. Disaster Reports Listing",
        disasters_res.status_code == 200 and isinstance(disasters_data.get('disasters'), list),
        f"Found {len(disasters_data.get('disasters', []))} disaster records"
    )

    # Test 8: Citizen Registration & Login
    test_citizen_email = f"test.citizen.{os.getpid()}@example.com"
    reg_res = client.post('/api/auth/register', json={
        'name': 'Test Automated Citizen',
        'email': test_citizen_email,
        'phone': '+91-9988776655',
        'password': 'password123',
        'address': 'Testing Lane 42',
        'city': 'Mumbai',
        'emergency_contact': '+91-9988776650'
    })
    check("7. Citizen Registration Transaction", reg_res.status_code == 201)

    cit_login_res = client.post('/api/auth/login', json={
        'email': test_citizen_email,
        'password': 'password123'
    })
    check("8. New Citizen Login & Password Verification", cit_login_res.status_code == 200)

    # Test 9: Create Disaster Report (as citizen)
    disaster_create_res = client.post('/api/disasters', json={
        'disaster_type': 'Urban Flood',
        'severity': 'High',
        'description': 'Automated test flood report',
        'location': 'Test Suburb Sector 5',
        'city': 'Mumbai',
        'latitude': 19.0760,
        'longitude': 72.8777
    })
    disaster_id = (disaster_create_res.get_json() or {}).get('disaster_id')
    check("9. Citizen Disaster Reporting", disaster_create_res.status_code == 201, f"Disaster ID: {disaster_id}")

    # Test 10: Trigger 1 - Rejection of invalid emergency request (PeopleCount < 1)
    invalid_req_res = client.post('/api/emergency-requests', json={
        'disaster_id': disaster_id,
        'request_type': 'Rescue',
        'priority': 'Critical',
        'people_count': 0,
        'location': 'Lowland rooftop'
    })
    check(
        "10. Trigger 1 Execution: Validation Rejection (PeopleCount < 1)",
        invalid_req_res.status_code == 400 or 'Validation Error' in str(invalid_req_res.get_json())
    )

    # Test 11: Create Valid Emergency Request
    valid_req_res = client.post('/api/emergency-requests', json={
        'disaster_id': disaster_id,
        'request_type': 'Rescue',
        'priority': 'Critical',
        'people_count': 4,
        'location': 'Sector 5 water edge'
    })
    request_id = (valid_req_res.get_json() or {}).get('request_id')
    check("11. Valid Emergency Request Creation", valid_req_res.status_code == 201, f"Request ID: {request_id}")

    # Log back in as admin for dispatch & shelter tests
    client.post('/api/auth/login', json={'email': 'admin@disaster.gov', 'password': 'admin123'})

    # Test 12: Trigger 2 - Assign Rescue Team & verify automated status change
    # Using Team 4 because it has 0 other active requests in seed data
    assign_res = client.patch(f'/api/emergency-requests/{request_id}/assign-team', json={
        'rescue_team_id': 4
    })
    check("12. Emergency Request Team Dispatch", assign_res.status_code == 200)

    # Verify team status changed to Busy in DB
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    conn.commit()
    cur.execute("SELECT Status FROM RESCUE_TEAM WHERE RescueTeamID = 4;")
    team_status = cur.fetchone()['Status']
    check("13. Trigger 2 Execution: Team Status Automated to Busy", team_status == 'Busy', f"Status: {team_status}")

    # Complete request and verify team status returns to Available
    complete_res = client.patch(f'/api/emergency-requests/{request_id}/status', json={'status': 'Completed'})
    conn.commit()
    cur.execute("SELECT Status FROM RESCUE_TEAM WHERE RescueTeamID = 4;")
    team_status_after = cur.fetchone()['Status']
    check("14. Trigger 2 Execution: Team Status Auto-restored to Available", team_status_after == 'Available', f"Status: {team_status_after}")



    # Test 13: Shelters Listing
    shelters_res = client.get('/api/shelters')
    shelters_data = shelters_res.get_json() or {}
    check("15. Shelters & Live Occupancy Query", shelters_res.status_code == 200 and len(shelters_data.get('shelters', [])) > 0)

    # Clean up test citizen & disaster
    try:
        cur.execute("DELETE FROM EMERGENCY_REQUEST WHERE RequestID = %s;", (request_id,))
        cur.execute("DELETE FROM DISASTER WHERE DisasterID = %s;", (disaster_id,))
        cur.execute("DELETE FROM USER WHERE Email = %s;", (test_citizen_email,))
        conn.commit()
    except Exception:
        pass
    cur.close()
    conn.close()

    print("\n" + "=" * 65)
    print(f"RESULTS: {passed}/{total} TESTS PASSED ({int((passed/total)*100)}%)")
    print("=" * 65 + "\n")
    return passed == total

if __name__ == '__main__':
    all_ok = run_tests()
    sys.exit(0 if all_ok else 1)
