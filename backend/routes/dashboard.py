from flask import Blueprint, jsonify, session
from mysql.connector import Error
from db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Computes dashboard statistics using raw SQL queries.
    Provides admin-level operational aggregates AND citizen-tailored personal tracking.
    """
    user_type = session.get('user_type')
    citizen_id = session.get('citizen_id')
    user_id = session.get('user_id')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # -------------------------------------------------------------
        # GLOBAL SYSTEM-WIDE METRICS (Used by Admin)
        # -------------------------------------------------------------
        # 1. Total Disasters
        cursor.execute("SELECT COUNT(*) AS count FROM DISASTER;")
        total_disasters = cursor.fetchone()['count']

        # 2. Active Disasters (Reported, Verified, Ongoing)
        cursor.execute("SELECT COUNT(*) AS count FROM DISASTER WHERE Status IN ('Reported', 'Verified', 'Ongoing');")
        active_disasters = cursor.fetchone()['count']

        # 3. Pending Emergency Requests
        cursor.execute("SELECT COUNT(*) AS count FROM EMERGENCY_REQUEST WHERE Status = 'Pending';")
        pending_requests = cursor.fetchone()['count']

        # 4. Rescued Victims
        cursor.execute("SELECT COUNT(*) AS count FROM VICTIM WHERE RescueStatus = 'Rescued';")
        rescued_victims = cursor.fetchone()['count']

        # 5. Total and Available Rescue Teams
        cursor.execute("SELECT COUNT(*) AS count FROM RESCUE_TEAM WHERE Status = 'Available';")
        available_rescue_teams = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) AS count FROM RESCUE_TEAM;")
        total_rescue_teams = cursor.fetchone()['count']

        # 6. Shelter Overview
        cursor.execute("""
            SELECT COUNT(*) AS total_shelters,
                   COALESCE(SUM(Capacity), 0) AS total_capacity,
                   COALESCE(SUM(Occupancy), 0) AS total_occupancy
            FROM SHELTER;
        """)
        shelter_stats = cursor.fetchone()

        # 7. Recent Disaster Reports (Top 5)
        cursor.execute("""
            SELECT d.DisasterID, d.DisasterType, d.Severity, d.City, d.Location, d.Status,
                   DATE_FORMAT(d.ReportedAt, '%Y-%m-%d %H:%i') AS ReportedAt,
                   u.Name AS ReportedBy
            FROM DISASTER d
            JOIN CITIZEN c ON d.ReportedByCitizenID = c.CitizenID
            JOIN USER u ON c.UserID = u.UserID
            ORDER BY d.ReportedAt DESC
            LIMIT 5;
        """)
        recent_disasters = cursor.fetchall()

        # 8. Recent Emergency Requests (Top 5)
        cursor.execute("""
            SELECT er.RequestID, er.RequestType, er.Priority, er.PeopleCount, er.Location, er.Status,
                   DATE_FORMAT(er.RequestTime, '%Y-%m-%d %H:%i') AS RequestTime,
                   u.Name AS CitizenName,
                   COALESCE(rt.TeamName, 'Unassigned') AS AssignedTeam
            FROM EMERGENCY_REQUEST er
            JOIN CITIZEN c ON er.CitizenID = c.CitizenID
            JOIN USER u ON c.UserID = u.UserID
            LEFT JOIN RESCUE_TEAM rt ON er.RescueTeamID = rt.RescueTeamID
            ORDER BY er.RequestTime DESC
            LIMIT 5;
        """)
        recent_requests = cursor.fetchall()

        # 9. Severity Distribution Chart Data
        cursor.execute("""
            SELECT Severity, COUNT(*) AS count
            FROM DISASTER
            GROUP BY Severity
            ORDER BY 
                CASE Severity
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Moderate' THEN 3
                    WHEN 'Low' THEN 4
                END;
        """)
        severity_distribution = cursor.fetchall()

        # 10. Request Status Distribution Chart Data
        cursor.execute("""
            SELECT Status, COUNT(*) AS count
            FROM EMERGENCY_REQUEST
            GROUP BY Status
            ORDER BY count DESC;
        """)
        request_status_distribution = cursor.fetchall()

        # -------------------------------------------------------------
        # CITIZEN-SPECIFIC PERSONAL DATA & ALERTS
        # -------------------------------------------------------------
        citizen_data = None
        if user_type == 'Citizen' and citizen_id:
            # 1. Citizen's user city
            cursor.execute("SELECT City FROM USER WHERE UserID = %s;", (user_id,))
            user_row = cursor.fetchone()
            user_city = user_row['City'] if user_row else 'Mumbai'

            # 2. Citizen's own submitted requests
            cursor.execute("""
                SELECT COUNT(*) AS total,
                       SUM(CASE WHEN Status IN ('Pending', 'Assigned', 'In Progress') THEN 1 ELSE 0 END) AS active
                FROM EMERGENCY_REQUEST
                WHERE CitizenID = %s;
            """, (citizen_id,))
            req_counts = cursor.fetchone()

            # 3. Disasters reported by this citizen
            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM DISASTER
                WHERE ReportedByCitizenID = %s;
            """, (citizen_id,))
            reported_disasters_count = cursor.fetchone()['total']

            # 4. Open shelters count & available beds
            cursor.execute("""
                SELECT COUNT(*) AS total,
                       COALESCE(SUM(Capacity - Occupancy), 0) AS total_available_beds
                FROM SHELTER
                WHERE Status = 'Open';
            """)
            shelters_avail = cursor.fetchone()

            # 5. Citizen's own emergency requests with live status
            cursor.execute("""
                SELECT er.RequestID, er.RequestType, er.Priority, er.PeopleCount, er.Location, er.Description,
                       er.Status, DATE_FORMAT(er.RequestTime, '%Y-%m-%d %H:%i') AS RequestTime,
                       d.DisasterType, d.City AS DisasterCity,
                       COALESCE(rt.TeamName, 'Waiting for Responder') AS AssignedTeam,
                       rt.LeaderName, rt.Phone AS TeamPhone, rt.Status AS TeamStatus
                FROM EMERGENCY_REQUEST er
                JOIN DISASTER d ON er.DisasterID = d.DisasterID
                LEFT JOIN RESCUE_TEAM rt ON er.RescueTeamID = rt.RescueTeamID
                WHERE er.CitizenID = %s
                ORDER BY er.RequestTime DESC;
            """, (citizen_id,))
            my_requests = cursor.fetchall()

            # 6. Disasters reported by this citizen
            cursor.execute("""
                SELECT DisasterID, DisasterType, Severity, City, Location, Status, Description,
                       DATE_FORMAT(ReportedAt, '%Y-%m-%d %H:%i') AS ReportedAt
                FROM DISASTER
                WHERE ReportedByCitizenID = %s
                ORDER BY ReportedAt DESC;
            """, (citizen_id,))
            my_disasters = cursor.fetchall()

            # 7. Active local/city alerts
            cursor.execute("""
                SELECT DisasterID, DisasterType, Severity, City, Location, Status, Description,
                       DATE_FORMAT(ReportedAt, '%Y-%m-%d %H:%i') AS ReportedAt
                FROM DISASTER
                WHERE Status IN ('Reported', 'Verified', 'Ongoing')
                ORDER BY 
                    CASE WHEN City = %s THEN 0 ELSE 1 END,
                    ReportedAt DESC
                LIMIT 4;
            """, (user_city,))
            active_alerts = cursor.fetchall()

            # 8. Available shelters for immediate safety
            cursor.execute("""
                SELECT ShelterID, ShelterName, City, Location, Capacity, Occupancy,
                       (Capacity - Occupancy) AS AvailableBeds, Facilities, Contact, Status
                FROM SHELTER
                WHERE Status = 'Open'
                ORDER BY (Capacity - Occupancy) DESC
                LIMIT 4;
            """)
            safe_shelters = cursor.fetchall()

            citizen_data = {
                'user_city': user_city,
                'counts': {
                    'my_total_requests': req_counts['total'] or 0,
                    'my_active_requests': req_counts['active'] or 0,
                    'my_reported_disasters': reported_disasters_count or 0,
                    'open_shelters': shelters_avail['total'] or 0,
                    'available_beds': shelters_avail['total_available_beds'] or 0
                },
                'my_requests': my_requests,
                'my_disasters': my_disasters,
                'active_alerts': active_alerts,
                'safe_shelters': safe_shelters
            }

        cursor.close()
        conn.close()

        return jsonify({
            'user_type': user_type,
            'counts': {
                'total_disasters': total_disasters,
                'active_disasters': active_disasters,
                'pending_requests': pending_requests,
                'rescued_victims': rescued_victims,
                'available_rescue_teams': available_rescue_teams,
                'total_rescue_teams': total_rescue_teams,
                'total_shelters': shelter_stats['total_shelters'],
                'shelter_capacity': shelter_stats['total_capacity'],
                'shelter_occupancy': shelter_stats['total_occupancy']
            },
            'recent_disasters': recent_disasters,
            'recent_requests': recent_requests,
            'charts': {
                'severity_distribution': severity_distribution,
                'request_status_distribution': request_status_distribution
            },
            'citizen_data': citizen_data
        }), 200

    except Error as e:
        return jsonify({'error': f'Failed to load dashboard metrics: {str(e)}'}), 500
