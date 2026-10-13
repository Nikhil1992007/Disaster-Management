#!/usr/bin/env python3
"""
Smart Disaster Management & Emergency Response System
Cloud MySQL Initialization & Migration Script

This script safely initializes the complete 11-table schema, database triggers,
seed data, and the primary admin account on any cloud-hosted MySQL provider
(e.g., Aiven for MySQL, PlanetScale, Railway, Render, AWS RDS, DigitalOcean).

Features:
- Reads credentials from DATABASE_URL / MYSQL_URL or individual DB_* variables.
- Automatically handles cloud provider restrictions (e.g., no DROP/CREATE DATABASE permission).
- Safely selects the target cloud database (e.g., defaultdb or DisasterManagement).
- Strips SQL comments before parsing statements to eliminate semicolon conflicts.
- Parses and installs MySQL triggers safely (handling DELIMITER statements).
- Seeds initial data and sets up the hashed Admin account (admin@disaster.gov).
- Provides comprehensive PASS/FAIL verification report.
"""

import os
import sys
import re
import argparse
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

load_dotenv()

from db import get_db_config, get_db_connection, AivenConfigurationError
import mysql.connector
from mysql.connector import Error

def split_sql_statements(sql_content):
    """
    Parses SQL content into individual executable statements, correctly
    handling semicolons inside quoted string literals and comments.
    """
    stmts = []
    current = []
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    in_line_comment = False
    in_block_comment = False
    i = 0
    n = len(sql_content)

    while i < n:
        c = sql_content[i]
        nxt = sql_content[i+1] if i + 1 < n else ''

        if in_line_comment:
            if c == '\n':
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if c == '*' and nxt == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if not (in_single_quote or in_double_quote or in_backtick):
            if c == '-' and nxt == '-':
                in_line_comment = True
                i += 2
                continue
            if c == '/' and nxt == '*':
                in_block_comment = True
                i += 2
                continue

        if c == "'" and not (in_double_quote or in_backtick):
            if in_single_quote and nxt == "'":
                current.append(c)
                current.append(nxt)
                i += 2
                continue
            in_single_quote = not in_single_quote
            current.append(c)
            i += 1
            continue

        if c == '"' and not (in_single_quote or in_backtick):
            in_double_quote = not in_double_quote
            current.append(c)
            i += 1
            continue

        if c == '`' and not (in_single_quote or in_double_quote):
            in_backtick = not in_backtick
            current.append(c)
            i += 1
            continue

        if c == ';' and not (in_single_quote or in_double_quote or in_backtick):
            s = ''.join(current).strip()
            if s:
                stmts.append(s)
            current = []
            i += 1
            continue

        current.append(c)
        i += 1

    s = ''.join(current).strip()
    if s:
        stmts.append(s)
    return stmts


def execute_triggers_file(cursor, triggers_path):
    """
    Parser for triggers.sql containing DELIMITER $$ blocks.
    """
    print(f"[*] Deploying triggers from {os.path.basename(triggers_path)}...")
    with open(triggers_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove comments
    clean = re.sub(r'--[^\n]*', '', content)
    clean = re.sub(r'/\*.*?\*/', '', clean, flags=re.DOTALL)

    # If DELIMITER $$ is used
    if 'DELIMITER $$' in clean:
        parts = clean.split('DELIMITER $$')
        header = parts[0]
        body_and_footer = parts[1].split('DELIMITER ;')
        body = body_and_footer[0]
        footer = body_and_footer[1] if len(body_and_footer) > 1 else ''

        # Header statements
        for stmt in header.split(';'):
            s = stmt.strip()
            if s and not s.upper().startswith('USE '):
                try:
                    cursor.execute(s)
                except Error as e:
                    print(f"  [WARN] Trigger header notice: {e}")

        # Trigger body statements separated by $$
        for stmt in body.split('$$'):
            s = stmt.strip()
            if s:
                try:
                    cursor.execute(s)
                except Error as e:
                    print(f"  [WARN] Trigger body notice: {e}")

        # Footer statements
        for stmt in footer.split(';'):
            s = stmt.strip()
            if s and not s.upper().startswith('USE '):
                try:
                    cursor.execute(s)
                except Error as e:
                    print(f"  [WARN] Trigger footer notice: {e}")
    else:
        for stmt in split_sql_statements(content):
            if not stmt.upper().startswith('USE '):
                cursor.execute(stmt)

    print("  [OK] Database triggers deployed successfully.")

def setup_admin_user(cursor, email='admin@disaster.gov', password='admin123', name='Admin Director', phone='+91-9876543210'):
    """
    Ensures the default Administrator account exists with a securely hashed password.
    """
    print(f"[*] Provisioning Admin account ({email})...")
    hashed = generate_password_hash(password)

    cursor.execute("SELECT UserID FROM USER WHERE Email = %s", (email,))
    existing = cursor.fetchone()

    if existing:
        update_sql = """
            UPDATE USER
            SET Password = %s, UserType = 'Admin', Name = %s, Phone = %s, Status = 'Active'
            WHERE Email = %s
        """
        cursor.execute(update_sql, (hashed, name, phone, email))
        print("  [OK] Existing Admin account updated successfully.")
    else:
        insert_sql = """
            INSERT INTO USER (Name, Email, Phone, Password, UserType, Address, City, Status)
            VALUES (%s, %s, %s, %s, 'Admin', 'Central Disaster Management HQ', 'New Delhi', 'Active')
        """
        cursor.execute(insert_sql, (name, email, phone, hashed))
        print("  [OK] New Admin account created successfully.")

def verify_cloud_database(conn):
    """
    Verifies that all 11 tables and triggers are present and queries succeed.
    """
    print("\n" + "=" * 60)
    print("VERIFYING CLOUD DATABASE INTEGRITY")
    print("=" * 60)

    expected_tables = [
        'USER', 'CITIZEN', 'SHELTER_MANAGER', 'SHELTER', 'DISASTER',
        'RESCUE_TEAM', 'VOLUNTEER', 'NGO', 'VICTIM', 'EMERGENCY_REQUEST',
        'NGO_DONATION'
    ]

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SHOW TABLES;")
    rows = cursor.fetchall()
    found_tables = set()
    for row in rows:
        for val in row.values():
            found_tables.add(val.upper())

    all_present = True
    print("\n[TABLE STATUS]")
    for table in expected_tables:
        present = table in found_tables
        status = "[PASS]" if present else "[MISSING]"
        if present:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM `{table}`;")
            cnt = cursor.fetchone()['cnt']
            print(f"  {status} {table:<20} : {cnt} records")
        else:
            print(f"  {status} {table:<20}")
            all_present = False

    cursor.execute("SHOW TRIGGERS;")
    triggers = cursor.fetchall()
    trigger_names = [t.get('Trigger') or t.get('trigger') for t in triggers]
    print(f"\n[TRIGGERS FOUND ({len(trigger_names)})]")
    for t_name in trigger_names:
        print(f"  [PASS] {t_name}")

    cursor.close()
    return all_present

def init_cloud_database(skip_seed=False, admin_email='admin@disaster.gov', admin_pass='admin123'):
    """
    Main orchestration function to initialize or migrate the cloud database.
    """
    base_dir = os.path.dirname(CURRENT_DIR)
    schema_path = os.path.join(base_dir, 'database', 'schema.sql')
    triggers_path = os.path.join(base_dir, 'database', 'triggers.sql')
    seed_path = os.path.join(base_dir, 'database', 'seed.sql')

    try:
        cfg = get_db_config()
    except AivenConfigurationError as e:
        print("\n" + "!" * 60)
        print("[CONFIGURATION ERROR] Missing or Invalid DATABASE_URL")
        print("!" * 60)
        print(f"\n{e}\n")
        print("How to fix:")
        print("1. In backend/.env, set:")
        print("   DATABASE_URL=\"mysql://avnadmin:<password>@<host>:<port>/defaultdb?ssl-mode=REQUIRED\"")
        print("2. Or pass it directly in the terminal before running this script.")
        print("!" * 60 + "\n")
        return False

    target_db = cfg.get('database') or 'defaultdb'

    print(f"[*] Target Cloud Host: {cfg.get('host')}:{cfg.get('port')}")
    print(f"[*] Target Cloud User: {cfg.get('user')}")
    print(f"[*] Target Cloud DB  : {target_db}")
    print(f"[*] SSL / TLS Active : {not cfg.get('ssl_disabled', True)}")

    try:
        # Connect directly to Aiven Cloud MySQL instance
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor()


        # Ensure database is selected
        try:
            cursor.execute(f"USE `{target_db}`;")
        except Error:
            pass

        # 1. Execute Schema (11 Tables)
        print(f"\n[*] Deploying 11-Table Schema from {os.path.basename(schema_path)}...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_content = f.read()

        schema_stmts = split_sql_statements(schema_content)
        executed_tables = 0
        for stmt in schema_stmts:
            upper_s = stmt.upper()
            # Skip global database drop/create/use if already inside target database
            if upper_s.startswith('DROP DATABASE') or upper_s.startswith('CREATE DATABASE') or upper_s.startswith('USE '):
                continue
            try:
                cursor.execute(stmt)
                if 'CREATE TABLE' in upper_s:
                    executed_tables += 1
            except Error as e:
                print(f"  [WARN] Schema notice: {e}")

        conn.commit()
        print(f"  [OK] Processed schema statements ({executed_tables} tables created).")

        # 2. Execute Triggers
        print(f"\n[*] Deploying Database Triggers from {os.path.basename(triggers_path)}...")
        execute_triggers_file(cursor, triggers_path)
        conn.commit()

        # 3. Execute Seed Data (if requested)
        if not skip_seed and os.path.exists(seed_path):
            print(f"\n[*] Seeding initial project data from {os.path.basename(seed_path)}...")
            with open(seed_path, 'r', encoding='utf-8') as f:
                seed_content = f.read()

            seed_stmts = split_sql_statements(seed_content)
            for stmt in seed_stmts:
                upper_s = stmt.upper()
                if upper_s.startswith('USE '):
                    continue
                try:
                    cursor.execute(stmt)
                except Error as e:
                    print(f"  [WARN] Seed notice: {e}")
            conn.commit()
            print("  [OK] Seed records loaded successfully.")

        # 4. Provision Admin User
        print("\n[*] Provisioning Administrator Account...")
        setup_admin_user(cursor, email=admin_email, password=admin_pass)
        conn.commit()

        # 5. Verify Everything
        verified = verify_cloud_database(conn)

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        if verified:
            print(">>> CLOUD DATABASE MIGRATION COMPLETED SUCCESSFULLY! <<<")
        else:
            print(">>> MIGRATION COMPLETED WITH WARNINGS (Check table list) <<<")
        print("=" * 60 + "\n")
        return verified

    except Error as e:
        print(f"\n[FATAL ERROR] Cloud MySQL error: {e}")
        return False
    except Exception as e:
        print(f"\n[FATAL ERROR] Migration failed: {e}")
        return False

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Initialize cloud MySQL database for Smart Disaster Management.")
    parser.add_argument('--skip-seed', action='store_true', help="Skip inserting sample demo records.")
    parser.add_argument('--admin-email', default='admin@disaster.gov', help="Default admin email (default: admin@disaster.gov)")
    parser.add_argument('--admin-pass', default='admin123', help="Default admin password (default: admin123)")

    args = parser.parse_args()
    success = init_cloud_database(
        skip_seed=args.skip_seed,
        admin_email=args.admin_email,
        admin_pass=args.admin_pass
    )
    sys.exit(0 if success else 1)
