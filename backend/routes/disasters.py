from flask import Blueprint, request, jsonify, session
from mysql.connector import Error
from db import get_db_connection
from routes.auth import login_required, admin_required

disasters_bp = Blueprint('disasters', __name__, url_prefix='/api/disasters')

@disasters_bp.route('', methods=['GET'])
def list_disasters():
    """
    Lists disasters with dynamic filtering by type, city, severity, status, and search query.
    Uses parameterized SQL queries.
    """
    disaster_type = request.args.get('type', '').strip()
    city = request.args.get('city', '').strip()
    severity = request.args.get('severity', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    conditions = []
    params = []

    if disaster_type:
        conditions.append("d.DisasterType = %s")
        params.append(disaster_type)

    if city:
        conditions.append("d.City = %s")
        params.append(city)

    if severity:
        conditions.append("d.Severity = %s")
        params.append(severity)

    if status:
        conditions.append("d.Status = %s")
        params.append(status)

    if search:
        conditions.append("(d.DisasterType LIKE %s OR d.Description LIKE %s OR d.Location LIKE %s OR d.City LIKE %s)")
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard, wildcard])

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

    query = f"""
        SELECT d.DisasterID, d.DisasterType, d.Severity, d.Description, d.Location, d.City,
               d.Latitude, d.Longitude,
               DATE_FORMAT(d.ReportedAt, '%Y-%m-%d %H:%i') AS ReportedAt,
               d.Status, d.ReportedByCitizenID,
               u.Name AS ReportedByName, u.Phone AS ReporterPhone, u.Email AS ReporterEmail
        FROM DISASTER d
        JOIN CITIZEN c ON d.ReportedByCitizenID = c.CitizenID
        JOIN USER u ON c.UserID = u.UserID
        {where_clause}
        ORDER BY d.ReportedAt DESC;
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        disasters = cursor.fetchall()

        # Also get distinct cities and types for dropdown filters
        cursor.execute("SELECT DISTINCT City FROM DISASTER ORDER BY City;")
        cities = [row['City'] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT DisasterType FROM DISASTER ORDER BY DisasterType;")
        types = [row['DisasterType'] for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            'disasters': disasters,
            'filters': {
                'cities': cities,
                'types': types,
                'severities': ['Low', 'Moderate', 'High', 'Critical'],
                'statuses': ['Reported', 'Verified', 'Ongoing', 'Resolved', 'Closed']
            }
        }), 200

    except Error as e:
        return jsonify({'error': f'Failed to fetch disasters: {str(e)}'}), 500

@disasters_bp.route('/<int:disaster_id>', methods=['GET'])
def get_disaster_detail(disaster_id):
    """
    Retrieves full details of a single disaster, along with related emergency requests and victim count.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT d.DisasterID, d.DisasterType, d.Severity, d.Description, d.Location, d.City,
                   d.Latitude, d.Longitude,
                   DATE_FORMAT(d.ReportedAt, '%Y-%m-%d %H:%i') AS ReportedAt,
                   d.Status, d.ReportedByCitizenID,
                   u.Name AS ReportedByName, u.Phone AS ReporterPhone, u.Email AS ReporterEmail
            FROM DISASTER d
            JOIN CITIZEN c ON d.ReportedByCitizenID = c.CitizenID
            JOIN USER u ON c.UserID = u.UserID
            WHERE d.DisasterID = %s;
        """
        cursor.execute(query, (disaster_id,))
        disaster = cursor.fetchone()

        if not disaster:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Disaster record not found.'}), 404

        # Related emergency requests
        cursor.execute("""
            SELECT er.RequestID, er.RequestType, er.Priority, er.PeopleCount, er.Location, er.Status,
                   DATE_FORMAT(er.RequestTime, '%Y-%m-%d %H:%i') AS RequestTime,
                   rt.TeamName AS AssignedTeam
            FROM EMERGENCY_REQUEST er
            LEFT JOIN RESCUE_TEAM rt ON er.RescueTeamID = rt.RescueTeamID
            WHERE er.DisasterID = %s
            ORDER BY er.RequestTime DESC;
        """, (disaster_id,))
        requests_list = cursor.fetchall()

        # Related victim metrics
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_victims,
                SUM(CASE WHEN RescueStatus = 'Rescued' THEN 1 ELSE 0 END) AS rescued_count,
                SUM(CASE WHEN RescueStatus = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN RescueStatus = 'Missing' THEN 1 ELSE 0 END) AS missing_count
            FROM VICTIM
            WHERE DisasterID = %s;
        """, (disaster_id,))
        victim_stats = cursor.fetchone()

        cursor.close()
        conn.close()

        disaster['emergency_requests'] = requests_list
        disaster['victim_stats'] = victim_stats

        return jsonify({'disaster': disaster}), 200

    except Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@disasters_bp.route('', methods=['POST'])
@login_required
def create_disaster():
    """
    Submits a new disaster report.
    Only authenticated citizens (or admins) can report.
    """
    data = request.get_json() or {}
    disaster_type = data.get('disaster_type', '').strip()
    severity = data.get('severity', 'Moderate').strip()
    description = data.get('description', '').strip()
    location = data.get('location', '').strip()
    city = data.get('city', '').strip()
    latitude = data.get('latitude') or None
    longitude = data.get('longitude') or None

    if not disaster_type or not location or not city:
        return jsonify({'error': 'Disaster type, location, and city are required.'}), 400

    if severity not in ('Low', 'Moderate', 'High', 'Critical'):
        return jsonify({'error': 'Invalid severity value. Must be Low, Moderate, High, or Critical.'}), 400

    # Determine reporting CitizenID
    citizen_id = session.get('citizen_id')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if not citizen_id:
            # If user is Admin or has no citizen record, associate with first citizen or create one
            cursor.execute("SELECT CitizenID FROM CITIZEN LIMIT 1;")
            first_citizen = cursor.fetchone()
            if first_citizen:
                citizen_id = first_citizen['CitizenID']
            else:
                return jsonify({'error': 'No active citizen profile available to register disaster.'}), 400

        insert_sql = """
            INSERT INTO DISASTER (DisasterType, Severity, Description, Location, City, Latitude, Longitude, Status, ReportedByCitizenID)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Reported', %s)
        """
        cursor.execute(insert_sql, (disaster_type, severity, description, location, city, latitude, longitude, citizen_id))
        new_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Disaster reported successfully.',
            'disaster_id': new_id
        }), 201

    except Error as e:
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': f'Failed to create disaster report: {str(e)}'}), 500

@disasters_bp.route('/<int:disaster_id>/status', methods=['PATCH'])
@admin_required
def update_disaster_status(disaster_id):
    """
    Updates disaster status. Restricted to Administrators.
    """
    data = request.get_json() or {}
    new_status = data.get('status', '').strip()

    valid_statuses = ('Reported', 'Verified', 'Ongoing', 'Resolved', 'Closed')
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Allowed values: {", ".join(valid_statuses)}'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE DISASTER SET Status = %s WHERE DisasterID = %s", (new_status, disaster_id))
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Disaster not found.'}), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': f'Disaster status updated to {new_status}.'}), 200

    except Error as e:
        return jsonify({'error': f'Failed to update status: {str(e)}'}), 500
