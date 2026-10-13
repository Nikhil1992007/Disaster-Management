"""
Database Connection Utility for Smart Disaster Management System
Aiven Cloud MySQL Exclusive Connector

Exclusively parses and connects using DATABASE_URL (or MYSQL_URL).
Local fallback connections, localhost defaults, and hardcoded root credentials
have been completely removed.
"""

import os
import urllib.parse
import tempfile
import mysql.connector
from mysql.connector import Error, pooling
from dotenv import load_dotenv

# Load environment configuration from .env if present
load_dotenv()

class AivenConfigurationError(Exception):
    """Raised when Aiven Cloud MySQL configuration is missing or invalid."""
    pass

def get_db_config(database_override=None):
    """
    Parses and validates the Aiven Cloud MySQL configuration from DATABASE_URL.
    Enforces cloud SSL/TLS connection. Localhost fallback is disabled.
    """
    db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')

    if not db_url:
        raise AivenConfigurationError(
            "DATABASE_URL is not configured. An Aiven Cloud MySQL connection URL is required "
            "(format: mysql://<user>:<password>@<host>:<port>/<database>?ssl-mode=REQUIRED). "
            "Local MySQL fallbacks have been removed."
        )

    db_url = db_url.strip()
    parsed = urllib.parse.urlparse(db_url)

    if not parsed.scheme or not parsed.hostname:
        raise AivenConfigurationError(
            f"Invalid DATABASE_URL format: '{db_url[:20]}...'. Expected valid MySQL URI "
            "(format: mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED)."
        )

    if not parsed.username or not parsed.password:
        raise AivenConfigurationError(
            "DATABASE_URL is missing username or password credentials for Aiven Cloud MySQL."
        )

    host = parsed.hostname
    port = parsed.port or 15432  # Standard Aiven MySQL port default
    user = urllib.parse.unquote(parsed.username)
    password = urllib.parse.unquote(parsed.password)
    database = database_override or (parsed.path.lstrip('/') if parsed.path else 'defaultdb')

    # Parse query parameters (e.g. ?ssl-mode=REQUIRED)
    query_params = urllib.parse.parse_qs(parsed.query)
    ssl_mode_param = query_params.get('ssl-mode', [None])[0] or query_params.get('ssl_mode', [None])[0]

    config = {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'charset': 'utf8mb4',
        'use_unicode': True,
        'autocommit': False,
        'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT', '15'))
    }

    if database:
        config['database'] = database

    # -------------------------------------------------------------------------
    # Aiven SSL/TLS Configuration
    # Managed Aiven Cloud MySQL requires secure encrypted transport.
    # -------------------------------------------------------------------------
    config['ssl_disabled'] = False

    # 1. Custom CA Certificate file path (e.g., Aiven ca.pem)
    ca_cert_path = os.getenv('AIVEN_CA_CERT') or os.getenv('DB_SSL_CA')
    
    # 2. Inline CA Certificate data (useful on cloud platforms like Render/Heroku)
    ca_cert_data = os.getenv('AIVEN_CA_CERT_DATA')
    if ca_cert_data and not ca_cert_path:
        temp_cert = tempfile.NamedTemporaryFile(delete=False, suffix='.pem', mode='w', encoding='utf-8')
        temp_cert.write(ca_cert_data.strip())
        temp_cert.close()
        ca_cert_path = temp_cert.name

    if ca_cert_path and os.path.exists(ca_cert_path):
        config['ssl_ca'] = ca_cert_path

    # Verify identity setting (default true, can be set to false for proxy/self-signed setups)
    if os.getenv('DB_SSL_VERIFY_IDENTITY', 'true').lower() == 'false':
        config['ssl_verify_identity'] = False
        config['ssl_verify_cert'] = False

    return config

# Global connection pool instance
_pool = None

def get_connection_pool():
    global _pool
    if _pool is None:
        try:
            cfg = get_db_config()
            pool_size = int(os.getenv('DB_POOL_SIZE', '5'))
            _pool = pooling.MySQLConnectionPool(
                pool_name="aiven_cloud_pool",
                pool_size=pool_size,
                pool_reset_session=True,
                **cfg
            )
        except Exception:
            _pool = None
    return _pool

def get_db_connection(database=None):
    """
    Creates and returns a raw MySQL database connection to Aiven Cloud MySQL.
    Uses connection pooling when available with automatic reconnection.
    No ORM is used.
    """
    pool = get_connection_pool() if database is None else None

    if pool is not None:
        try:
            conn = pool.get_connection()
            # Verify connection is still alive, reconnect if server closed idle connection
            conn.ping(reconnect=True, attempts=3, delay=1)
            return conn
        except Exception:
            pass

    # Direct connection fallback (or when specific database override is requested)
    config = get_db_config(database_override=database)
    conn = mysql.connector.connect(**config)
    try:
        conn.ping(reconnect=True, attempts=2, delay=1)
    except Exception:
        pass
    return conn

def test_connection():
    """
    Verifies that the Aiven Cloud MySQL database connection is alive and can query.
    Safe for production: never exposes credentials or sensitive connection strings.
    """
    try:
        cfg = get_db_config()
    except AivenConfigurationError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Configuration error: {str(e)[:100]}"

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return True, "Aiven Cloud MySQL connected successfully."
    except Error as e:
        return False, f"Aiven Cloud MySQL connection failed (Error {getattr(e, 'errno', 'unknown')})"
    except Exception as e:
        return False, f"Aiven Cloud MySQL error: {str(e)[:100]}"
