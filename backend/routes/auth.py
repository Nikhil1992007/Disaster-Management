from functools import wraps
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import Error
from db import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        if session.get('user_type') != 'Admin':
            return jsonify({'error': 'Access denied. Administrator privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
def register_citizen():
    """
    Registers a new citizen.
    Creates records in both USER and CITIZEN tables inside a single transaction.
    """
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    address = data.get('address', '').strip()
    city = data.get('city', '').strip()
    emergency_contact = data.get('emergency_contact', '').strip() or phone

    # Validation
    if not name or not email or not phone or not password or not city:
        return jsonify({'error': 'Name, email, phone, password, and city are required fields.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check for duplicate email using parameterized query
        cursor.execute("SELECT UserID FROM USER WHERE Email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'An account with this email address already exists.'}), 409

        # Hash password securely using Werkzeug
        hashed_password = generate_password_hash(password)

        # Begin transaction: Insert USER
        insert_user_sql = """
            INSERT INTO USER (Name, Email, Phone, Password, UserType, Address, City, Status)
            VALUES (%s, %s, %s, %s, 'Citizen', %s, %s, 'Active')
        """
        cursor.execute(insert_user_sql, (name, email, phone, hashed_password, address, city))
        new_user_id = cursor.lastrowid

        # Insert CITIZEN
        insert_citizen_sql = """
            INSERT INTO CITIZEN (UserID, EmergencyContact)
            VALUES (%s, %s)
        """
        cursor.execute(insert_citizen_sql, (new_user_id, emergency_contact))
        new_citizen_id = cursor.lastrowid

        # Commit transaction
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Citizen registered successfully.',
            'user': {
                'user_id': new_user_id,
                'citizen_id': new_citizen_id,
                'name': name,
                'email': email,
                'user_type': 'Citizen',
                'city': city
            }
        }), 201

    except Error as e:
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': f'Database error during registration: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticates a user and sets session cookies.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT u.UserID, u.Name, u.Email, u.Phone, u.Password, u.UserType, u.Address, u.City, u.Status,
                   c.CitizenID
            FROM USER u
            LEFT JOIN CITIZEN c ON u.UserID = c.UserID
            WHERE u.Email = %s
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user or not check_password_hash(user['Password'], password):
            return jsonify({'error': 'Invalid email or password.'}), 401

        if user['Status'] != 'Active':
            return jsonify({'error': f'Account is {user["Status"]}. Please contact support.'}), 403

        # Set session
        session['user_id'] = user['UserID']
        session['user_type'] = user['UserType']
        session['citizen_id'] = user['CitizenID']
        session['name'] = user['Name']
        session['email'] = user['Email']

        return jsonify({
            'message': 'Login successful.',
            'user': {
                'user_id': user['UserID'],
                'citizen_id': user['CitizenID'],
                'name': user['Name'],
                'email': user['Email'],
                'phone': user['Phone'],
                'user_type': user['UserType'],
                'city': user['City'],
                'address': user['Address']
            }
        }), 200

    except Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Clears the authenticated session.
    """
    session.clear()
    return jsonify({'message': 'Logged out successfully.'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Retrieves the currently authenticated user's profile.
    """
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 200

    user_id = session['user_id']
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT u.UserID, u.Name, u.Email, u.Phone, u.UserType, u.Address, u.City, u.Status, u.CreatedAt,
                   c.CitizenID, c.EmergencyContact
            FROM USER u
            LEFT JOIN CITIZEN c ON u.UserID = c.UserID
            WHERE u.UserID = %s
        """
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            session.clear()
            return jsonify({'authenticated': False}), 200

        return jsonify({
            'authenticated': True,
            'user': {
                'user_id': user['UserID'],
                'citizen_id': user['CitizenID'],
                'name': user['Name'],
                'email': user['Email'],
                'phone': user['Phone'],
                'user_type': user['UserType'],
                'address': user['Address'],
                'city': user['City'],
                'emergency_contact': user['EmergencyContact'],
                'created_at': user['CreatedAt'].isoformat() if user['CreatedAt'] else None
            }
        }), 200

    except Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
