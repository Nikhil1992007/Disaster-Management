from flask import Blueprint, jsonify
from mysql.connector import Error
from db import get_db_connection

shelters_bp = Blueprint('shelters', __name__, url_prefix='/api/shelters')

@shelters_bp.route('', methods=['GET'])
def list_shelters():
    """
    Returns list of shelters with capacity, occupancy, and manager information.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT s.ShelterID, s.ShelterName, s.Location, s.City, s.Capacity, s.Occupancy,
                   s.Facilities, s.FoodStock, s.WaterStock, s.MedicineStock, s.BlanketStock,
                   s.Contact, s.Status,
                   u.Name AS ManagerName, u.Phone AS ManagerPhone
            FROM SHELTER s
            LEFT JOIN SHELTER_MANAGER sm ON s.ManagerID = sm.ManagerID
            LEFT JOIN USER u ON sm.UserID = u.UserID
            ORDER BY s.ShelterID;
        """
        cursor.execute(query)
        shelters = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'shelters': shelters}), 200

    except Error as e:
        return jsonify({'error': f'Failed to fetch shelters: {str(e)}'}), 500
