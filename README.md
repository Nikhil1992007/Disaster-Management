# Smart Disaster Management & Emergency Response System (Part 1)

A complete college DBMS laboratory and project implementation for emergency response coordination and disaster management, built with **React (Vite) + Tailwind CSS**, **Python Flask**, and **MySQL 8.0**.

---

## 1. Project Objective & Overview

This system bridges citizens in distress and emergency disaster responders.
- **Citizens** can report new disaster incidents with GPS coordinates, track ongoing emergencies, and submit emergency assistance requests (Medical, Rescue, Food, Water, Transport, Shelter) with the number of affected persons.
- **Emergency Administrators** monitor live situation dashboards, assign specialized rescue teams (NDRF, SDRF, Coast Guard), track live shelter capacities, and update incident statuses.

Built with a complete 11-table relational schema from day one, using **pure parameterized SQL** via `mysql-connector-python` (no ORM) to demonstrate fundamental Database Management System (DBMS) concepts.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide React icons, Recharts
- **Backend**: Python Flask, Werkzeug password hashing (scrypt), Flask Sessions, python-dotenv
- **Database**: MySQL 8.0
- **DB Connection**: `mysql-connector-python` (Raw parameterized queries and transactions)
- **UI Design System**: Minimalistic SaaS interface inspired by Launch UI (clean light-grey background `#fafafa`, dark charcoal typography, restrained blue accent `#2563eb`, subtle card borders, responsive sidebar and navigation)

---

## 3. Database Schema (11 Exact Tables)

Database Name: `DisasterManagement`

### Entity-Relationship Architecture:
1. **`USER`**: Superclass authentication and profile entity (Citizen, Volunteer, NGO, ShelterManager, Admin).
2. **`CITIZEN`**: One-to-one subtype of `USER`.
3. **`SHELTER_MANAGER`**: One-to-one subtype of `USER`.
4. **`SHELTER`**: Relief facility managed by `SHELTER_MANAGER` (one-to-many relationship).
5. **`DISASTER`**: Incidents reported by a `CITIZEN` (one-to-many relationship).
6. **`RESCUE_TEAM`**: First responder battalions dispatched to emergency requests.
7. **`VOLUNTEER`**: One-to-one subtype of `USER`, assigned to 0 or 1 `DISASTER`.
8. **`NGO`**: One-to-one subtype of `USER`.
9. **`VICTIM`**: Affected individuals connected to `DISASTER`, `SHELTER` (optional), and `RESCUE_TEAM` (optional).
10. **`EMERGENCY_REQUEST`**: Assistance requests submitted by `CITIZEN`, tied to `DISASTER`, with 0 or 1 assigned `RESCUE_TEAM`.
11. **`NGO_DONATION`**: Material and monetary relief donated by `NGO`, optionally associated with a `DISASTER`.

---

## 4. Mandatory MySQL Triggers

The system implements automated business logic directly inside the database engine:

### Trigger 1: Emergency Request Validation (`trg_validate_emergency_request_insert`)
- **Event**: `BEFORE INSERT` and `BEFORE UPDATE` on `EMERGENCY_REQUEST`
- **Logic**: Rejects any request where:
  - `PeopleCount < 1`
  - `Priority` is not in `('Low', 'Medium', 'High', 'Critical')`
  - `RequestType` is not in `('Medical', 'Rescue', 'Food', 'Water', 'Transport', 'Shelter', 'Other')`
  - `Location` is null or empty
- **Error Handling**: Raises `SIGNAL SQLSTATE '45000'` with clear descriptive error messages.

### Trigger 2: Rescue Team Availability Automation (`trg_rescue_team_assigned_insert` & `trg_rescue_team_status_update`)
- **Event**: `AFTER INSERT` and `AFTER UPDATE` on `EMERGENCY_REQUEST`
- **Logic**:
  - Assigning a rescue team to an active request switches the team status to **`Busy`**.
  - Reassigning to a new team updates the new team to **`Busy`** and checks if the previous team has any other active requests. If not, the previous team returns to **`Available`**.
  - Changing request status to `Completed` or `Cancelled` checks whether the team has other active assignments. If zero active requests remain, the team status automatically becomes **`Available`**.
  - Non-recursive trigger design ensures complete safety and standard MySQL 8 compliance.

---

## 5. Directory Structure

```text
smart-disaster-management/
├── database/
│   ├── schema.sql              # Complete 11-table DDL schema
│   ├── triggers.sql            # Validation and Availability triggers
│   ├── seed.sql                # Realistic sample data for all 11 tables
│   └── practical_queries.sql   # Practical DBMS queries demonstration
├── backend/
│   ├── app.py                  # Flask app factory, session and CORS config
│   ├── db.py                   # Cloud and local MySQL connection pool & TLS
│   ├── init_cloud_db.py        # Cloud/local turnkey schema, triggers & admin setup
│   ├── test_all_features.py    # Automated test suite for triggers, auth & features
│   ├── requirements.txt        # Backend dependencies
│   ├── Procfile                # Production gunicorn configuration
│   └── routes/
│       ├── __init__.py
│       ├── auth.py             # Citizen registration, login, logout, me
│       ├── dashboard.py        # Real-time SQL aggregations and metrics
│       ├── disasters.py        # Multi-filter search, reporting, and updates
│       ├── emergency_requests.py# Role-isolated requests and team dispatch
│       ├── rescue_teams.py     # Live team status listing
│       └── shelters.py         # Shelter capacity and occupancy
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # React Router routing
│       ├── index.css           # Tailwind base styles
│       ├── services/
│       │   ├── api.js          # Fetch client with credentials
│       │   └── AuthContext.jsx # Global user session management
│       ├── components/
│       │   ├── AppLayout.jsx   # Topbar + Sidebar layout wrapper
│       │   ├── Sidebar.jsx     # Responsive SaaS navigation sidebar
│       │   ├── Badge.jsx       # Status & priority indicators
│       │   └── Modal.jsx       # Accessible modal dialog
│       └── pages/
│           ├── LandingPage.jsx # Launch UI inspired hero & features
│           ├── LoginPage.jsx   # Auth form with demo logins
│           ├── RegisterPage.jsx# Citizen + User registration form
│           ├── DashboardPage.jsx# Live metrics, Recharts charts, recent tables
│           ├── DisastersPage.jsx# Multi-criteria filter table & report modal
│           ├── EmergencyRequestsPage.jsx# Role-based requests & team dispatch
│           ├── RescueTeamsPage.jsx# Rescue team live availability directory
│           └── ProfilePage.jsx # Authenticated user profile & logout
├── .env.example
├── .env
└── README.md
```

---

## 6. Quick Start & Setup Guide

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your Aiven Cloud MySQL connection URI in `.env`:
```env
DATABASE_URL=mysql://avnadmin:your_secure_password@mysql-your-project.aivencloud.com:15432/defaultdb?ssl-mode=REQUIRED
PORT=5000
FRONTEND_URL=http://localhost:5173
```
*(All local MySQL fallbacks, hardcoded root credentials, and localhost references have been removed. The backend exclusively connects via `DATABASE_URL`.)*


### Step 2: Initialize Database and Schema (Cloud or Local)
Run the turnkey database initializer:
```bash
cd backend
python init_cloud_db.py
```
This automatically deploys all 11 tables, creates database triggers, loads seed data, and configures the default Admin account.

### Step 3: Verify All Features & Triggers Automatically
In the `backend/` directory, run:
```bash
python test_all_features.py
```
All 15 assertions (triggers, auth, disaster reports, team dispatch, shelter capacity) will run and print formatted PASS/FAIL reports.

### Step 4: Start the Flask Backend
```bash
python app.py
```
Backend API will start at: `http://localhost:5000`

### Step 5: Start the Frontend Application
```bash
cd ../frontend
npm run dev
```
Open your browser at: `http://localhost:5173`


---

## 7. Demo User Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@disaster.gov` | `admin123` | View all emergency requests, assign rescue teams, change disaster status, system metrics |
| **Citizen** | `rahul.sharma@example.com` | `password123` | Report disasters, request emergency help, view own requests |
| **Citizen** | `priya.patel@example.com` | `password123` | Report disasters, request emergency help, view own requests |

---

## 8. DBMS Curriculum Demonstration Queries

Inspect `database/practical_queries.sql` for complete examples covering:
- `CREATE TABLE` and `ALTER TABLE` constraints
- `INSERT`, `SELECT`, `UPDATE`, `DELETE` operations
- `WHERE`, `AND`, `OR`, `NOT` logical filtering
- `LIKE`, `IN`, `BETWEEN`, `IS NULL` operators
- `ORDER BY` multi-column sorting
- `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` aggregate functions
- `GROUP BY` and `HAVING` analytical groupings
- `INNER JOIN` and `LEFT JOIN` relational queries
- Nested subqueries (Scalar and correlated)
- Database Views (`vw_disaster_incident_overview`)
- ACID Transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`)
- Automated trigger execution and verification
