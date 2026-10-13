from flask import Blueprint, request, jsonify, session
from mysql.connector import Error
from db import get_db_connection
from routes.auth import login_required, admin_required

emergency_bp = Blueprint('emergency', __name__, url_prefix='/api/emergency-requests')

@emergency_bp.route('', methods=['GET'])
@login_required
def list_emergency_requests():
    """
    Lists emergency requests.
    Role-based authorization:
    - Citizens see ONLY their own requests.
    - Admins see ALL requests.
    """
    user_type = session.get('user_type')
    citizen_id = session.get('citizen_id')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        conditions = []
        params = []

        # Enforce Citizen role isolation
        if user_type == 'Citizen':
            if not citizen_id:
                cursor.close()
                conn.close()
                return jsonify({'requests': []}), 200
            conditions.append("er.CitizenID = %s")
            params.append(citizen_id)

        # Filters for admins or citizens
        status = request.args.get('status', '').strip()
        priority = request.args.get('priority', '').strip()
        request_type = request.args.get('type', '').strip()

        if status:
            conditions.append("er.Status = %s")
            params.append(status)
        if priority:
            conditions.append("er.Priority = %s")
            params.append(priority)
        if request_type:
            conditions.append("er.RequestType = %s")
            params.append(request_type)

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

        query = f"""
            SELECT er.RequestID, er.RequestType, er.Priority, er.PeopleCount, er.Location, er.Description,
                   er.CitizenID, er.DisasterID, er.RescueTeamID,
                   DATE_FORMAT(er.RequestTime, '%Y-%m-%d %H:%i') AS RequestTime,
                   er.Status,
                   u.Name AS CitizenName, u.Phone AS CitizenPhone,
                   d.DisasterType, d.City AS DisasterCity,
                   rt.TeamName, rt.LeaderName, rt.Phone AS TeamPhone, rt.Status AS TeamStatus
            FROM EMERGENCY_REQUEST er
            JOIN CITIZEN c ON er.CitizenID = c.CitizenID
            JOIN USER u ON c.UserID = u.UserID
            JOIN DISASTER d ON er.DisasterID = d.DisasterID
            LEFT JOIN RESCUE_TEAM rt ON er.RescueTeamID = rt.RescueTeamID
            {where_clause}
            ORDER BY 
                CASE er.Priority
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END,
                er.RequestTime DESC;
        """

        cursor.execute(query, tuple(params))
        requests_list = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'requests': requests_list}), 200

    except Error as e:
        return jsonify({'error': f'Failed to load emergency requests: {str(e)}'}), 500

@emergency_bp.route('', methods=['POST'])
@login_required
def create_emergency_request():
    """
    Submits a new emergency request.
    Data is validated by application logic AND mandatory MySQL BEFORE INSERT Trigger.
    """
    data = request.get_json() or {}
    request_type = data.get('request_type', '').strip()
    priority = data.get('priority', 'Medium').strip()
    people_count = data.get('people_count')
    location = data.get('location', '').strip()
    description = data.get('description', '').strip()
    disaster_id = data.get('disaster_id')

    # Convert people_count to integer if possible
    try:
        people_count = int(people_count)
    except (ValueError, TypeError):
        people_count = 0  # Will trigger the MySQL Trigger validation error

    if not disaster_id:
        # If disaster_id not selected, associate with first active disaster
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT DisasterID FROM DISASTER WHERE Status IN ('Reported', 'Verified', 'Ongoing') ORDER BY ReportedAt DESC LIMIT 1;")
            active_d = cursor.fetchone()
            if active_d:
                disaster_id = active_d['DisasterID']
            else:
                cursor.execute("SELECT DisasterID FROM DISASTER LIMIT 1;")
                any_d = cursor.fetchone()
                disaster_id = any_d['DisasterID'] if any_d else 1
            cursor.close()
            conn.close()
        except Exception:
            disaster_id = 1

    citizen_id = session.get('citizen_id')
    if not citizen_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT CitizenID FROM CITIZEN LIMIT 1;")
            first_c = cursor.fetchone()
            citizen_id = first_c['CitizenID'] if first_c else 1
            cursor.close()
            conn.close()
        except Exception:
            citizen_id = 1

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        insert_sql = """
            INSERT INTO EMERGENCY_REQUEST (RequestType, Priority, PeopleCount, Location, Description, CitizenID, DisasterID, Status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
        """
        # Execute parameterized SQL query
        cursor.execute(insert_sql, (request_type, priority, people_count, location, description, citizen_id, disaster_id))
        new_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Emergency request submitted successfully. First responders have been notified.',
            'request_id': new_id
        }), 201

    except Error as e:
        if conn:
            conn.rollback()
            conn.close()
        # Handles trigger signals (SQLSTATE 45000)
        return jsonify({'error': str(e.msg if hasattr(e, 'msg') else str(e))}), 400

@emergency_bp.route('/<int:request_id>/status', methods=['PATCH'])
@admin_required
def update_request_status(request_id):
    """
    Updates the status of an emergency request (e.g., In Progress, Completed, Cancelled).
    Restricted to Admins.
    Trigger 2 automatically resets team status to Available if completed/cancelled.
    """
    data = request.get_json() or {}
    new_status = data.get('status', '').strip()

    valid_statuses = ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled')
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Allowed values: {", ".join(valid_statuses)}'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE EMERGENCY_REQUEST SET Status = %s WHERE RequestID = %s", (new_status, request_id))
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Emergency request not found.'}), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': f'Request status successfully updated to {new_status}.'}), 200

    except Error as e:
        return jsonify({'error': f'Failed to update request status: {str(e)}'}), 500

@emergency_bp.route('/<int:request_id>/assign-team', methods=['PATCH'])
@admin_required
def assign_rescue_team(request_id):
    """
    Assigns or reassigns a Rescue Team to an emergency request.
    Restricted to Admins.
    Trigger 2 automatically sets newly assigned team to 'Busy' and old team to 'Available' (if idle).
    """
    data = request.get_json() or {}
    team_id = data.get('rescue_team_id')

    if team_id is not None:
        try:
            team_id = int(team_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid rescue team ID.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if request exists
        cursor.execute("SELECT RequestID, Status FROM EMERGENCY_REQUEST WHERE RequestID = %s", (request_id,))
        req = cursor.fetchone()
        if not req:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Emergency request not found.'}), 404

        # If team_id is provided, verify team exists
        if team_id:
            cursor.execute("SELECT RescueTeamID, TeamName, Status FROM RESCUE_TEAM WHERE RescueTeamID = %s", (team_id,))
            team = cursor.fetchone()
            if not team:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Selected rescue team does not exist.'}), 404

            # Assign team and set status to 'Assigned' if it was 'Pending'
            new_status = 'Assigned' if req['Status'] == 'Pending' else req['Status']
            cursor.execute("""
                UPDATE EMERGENCY_REQUEST
                SET RescueTeamID = %s, Status = %s
                WHERE RequestID = %s
            """, (team_id, new_status, request_id))
        else:
            # Unassign team
            cursor.execute("""
                UPDATE EMERGENCY_REQUEST
                SET RescueTeamID = NULL, Status = 'Pending'
                WHERE RequestID = %s
            """, (request_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Rescue team assignment updated successfully.'}), 200

    except Error as e:
        return jsonify({'error': f'Failed to assign rescue team: {str(e)}'}), 500
