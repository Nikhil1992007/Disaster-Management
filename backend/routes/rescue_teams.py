from flask import Blueprint, request, jsonify
from mysql.connector import Error
from db import get_db_connection

rescue_teams_bp = Blueprint('rescue_teams', __name__, url_prefix='/api/rescue-teams')

@rescue_teams_bp.route('', methods=['GET'])
def list_rescue_teams():
    """
    Returns list of all rescue teams and their live deployment status.
    """
    status_filter = request.args.get('status', '').strip()
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if status_filter:
            query = """
                SELECT RescueTeamID, TeamName, LeaderName, Phone, Specialization,
                       MembersCount, Equipment, CurrentLocation, Status
                FROM RESCUE_TEAM
                WHERE Status = %s
                ORDER BY RescueTeamID;
            """
            cursor.execute(query, (status_filter,))
        else:
            query = """
                SELECT RescueTeamID, TeamName, LeaderName, Phone, Specialization,
                       MembersCount, Equipment, CurrentLocation, Status
                FROM RESCUE_TEAM
                ORDER BY RescueTeamID;
            """
            cursor.execute(query)

        teams = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'teams': teams}), 200

    except Error as e:
        return jsonify({'error': f'Failed to fetch rescue teams: {str(e)}'}), 500
