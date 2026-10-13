import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

# Load environment configuration
load_dotenv()

from db import test_connection
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.disasters import disasters_bp
from routes.emergency_requests import emergency_bp
from routes.rescue_teams import rescue_teams_bp
from routes.shelters import shelters_bp

def create_app():
    app = Flask(__name__)

    # Apply ProxyFix for deployment behind reverse proxies (Render, Railway, Fly.io, Nginx)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Detect production environment
    is_production = (
        os.getenv('FLASK_ENV') == 'production' or
        os.getenv('ENVIRONMENT') == 'production' or
        os.getenv('RENDER') == 'true' or
        os.getenv('RAILWAY_ENVIRONMENT') is not None
    )

    # Production vs Development session cookie configuration
    cookie_secure = os.getenv('SESSION_COOKIE_SECURE', 'true' if is_production else 'false').lower() == 'true'
    # When frontend and backend reside on different domains (e.g. Vercel + Render),
    # browsers mandate SameSite='None' and Secure=True for cross-origin credentials.
    cookie_samesite = os.getenv('SESSION_COOKIE_SAMESITE', 'None' if cookie_secure else 'Lax')

    app.secret_key = os.getenv('SECRET_KEY', 'disaster-management-dev-secret-key-2026')
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=cookie_samesite,
        SESSION_COOKIE_SECURE=cookie_secure,
        PERMANENT_SESSION_LIFETIME=int(os.getenv('SESSION_LIFETIME_SECONDS', '86400'))  # 24 hours
    )

    # Cross-Origin Resource Sharing for React Vite frontend
    frontend_env = os.getenv('FRONTEND_URL', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
    allowed_origins = [o.strip().rstrip('/') for o in frontend_env.split(',') if o.strip()]
    # Ensure default local development origins are always permitted
    for default_dev in ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']:
        if default_dev not in allowed_origins:
            allowed_origins.append(default_dev)

    CORS(app, supports_credentials=True, origins=allowed_origins)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(disasters_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(rescue_teams_bp)
    app.register_blueprint(shelters_bp)

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'service': 'Smart Disaster Management & Emergency Response API',
            'version': '1.0.0',
            'status': 'online',
            'health_check': '/api/health'
        }), 200

    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_alive, db_msg = test_connection()
        return jsonify({
            'status': 'healthy' if db_alive else 'degraded',
            'service': 'Smart Disaster Management & Emergency Response API',
            'database': {
                'provider': 'Aiven Cloud MySQL',
                'connected': db_alive,
                'status': 'connected' if db_alive else 'disconnected',
                'message': db_msg
            }
        }), (200 if db_alive else 500)


    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal server error occurred'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"Starting Smart Disaster Management Server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

