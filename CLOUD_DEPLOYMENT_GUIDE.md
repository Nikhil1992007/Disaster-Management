# Cloud Deployment Guide: Smart Disaster Management System

This guide explains how to deploy the **Smart Disaster Management & Emergency Response System** with a **managed cloud MySQL database**, a **cloud-hosted Flask backend**, and a **cloud-hosted React (Vite) frontend**.

Once deployed, anyone on any laptop can access the application through their browser without installing MySQL, Python, or Node.js.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          Client Browser              │
                      │  (Any laptop, no software needed)    │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼ HTTPS
                      ┌──────────────────────────────────────┐
                      │    Frontend: Vercel / Netlify        │
                      │   (React 18 + Vite + Tailwind)       │
                      │ URL: https://disaster-resq.vercel.app│
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼ HTTPS (/api/*)
                      ┌──────────────────────────────────────┐
                      │     Backend: Render / Railway        │
                      │      (Python Flask + Gunicorn)       │
                      │ URL: https://disaster-api.onrender.com
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼ TLS/SSL (Port 15432/3306)
                      ┌──────────────────────────────────────┐
                      │   Cloud MySQL: Aiven / Railway / AWS │
                      │   (11 Relational Tables + Triggers)  │
                      └──────────────────────────────────────┘
```

---

## 1. Cloud Database Setup (Aiven for MySQL - Free Tier)

### Step 1.1: Create Aiven Account
1. Visit [https://aiven.io/](https://aiven.io/) and click **Sign Up** (free tier available with trial credits, or free community tier).
2. Alternative providers:
   - **Railway** ([https://railway.app](https://railway.app)): Managed MySQL service (free $5 trial credit).
   - **TiDB Serverless** ([https://tidbcloud.com](https://tidbcloud.com)): MySQL 8.0 compatible, 25 GB free forever.
   - **Clever Cloud** ([https://www.clever-cloud.com](https://www.clever-cloud.com)): Free MySQL add-on (5 MB dev).

### Step 1.2: Create MySQL Service on Aiven
1. In the Aiven Console, click **Create Service**.
2. Select **MySQL** (version 8.0).
3. Select your cloud provider and nearest region (e.g., AWS / Mumbai or Europe).
4. Click **Create Service**. Wait 1–2 minutes until status shows **Running**.

### Step 1.3: Copy Connection Details
In the Aiven Service Overview, you will see:
- **Service URI**: `mysql://avnadmin:PASSWORD@mysql-xxx.aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED`
- Host: `mysql-xxx.aivencloud.com`
- Port: `15432` (or similar)
- User: `avnadmin`
- Password: `<your_generated_password>`
- Database: `defaultdb`

> [!NOTE]
> Keep this URI confidential. Never commit it to GitHub.

---

## 2. Initialize the Cloud Database (One-Click Migration)

You only need to run the migration script **once** from your computer to provision all 11 tables, triggers, and sample data on the cloud database.

### Step 2.1: Run the Migration Command
In your local terminal, navigate to the `backend/` directory:

```bash
cd backend
python init_cloud_db.py --admin-email admin@disaster.gov --admin-pass admin123
```

To run it directly using the Cloud Database URI:
```bash
# Windows PowerShell
$env:DATABASE_URL="mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED"
python init_cloud_db.py

# Linux / macOS
DATABASE_URL="mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED" python init_cloud_db.py
```

### What This Script Does:
1. Connects via secure TLS/SSL to your cloud MySQL instance.
2. Creates the 11 relational tables (`USER`, `CITIZEN`, `SHELTER_MANAGER`, `SHELTER`, `DISASTER`, `RESCUE_TEAM`, `VOLUNTEER`, `NGO`, `VICTIM`, `EMERGENCY_REQUEST`, `NGO_DONATION`).
3. Installs all MySQL triggers (request validation + rescue team status automation).
4. Seeds realistic baseline disaster records, relief camps, rescue units, and users.
5. Hashes and provisions the Admin account (`admin@disaster.gov` / `admin123`).
6. Prints a complete verification report.

---

## 3. Deploy the Backend (Render.com - Free Tier)

### Step 3.1: Push Project to GitHub
Create a private or public repository on GitHub (the provided `.gitignore` automatically prevents your `.env` from ever being uploaded):
```bash
git init
git add .
git commit -m "Deploy Smart Disaster Management System"
git remote add origin https://github.com/<your-username>/smart-disaster-management.git
git branch -M main
git push -u origin main
```

### Step 3.2: Create Render Web Service
1. Log in to [Render.com](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `smart-disaster-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Region**: Nearest to your MySQL database
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 2 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`
   - **Plan**: `Free`

### Step 3.3: Set Environment Variables on Render
Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mysql://avnadmin:PASS@HOST:PORT/defaultdb?ssl-mode=REQUIRED` | Cloud MySQL connection URI |
| `SECRET_KEY` | `generate-a-random-32-character-secret-key` | Session encryption key |
| `FLASK_ENV` | `production` | Enables production security |
| `SESSION_COOKIE_SECURE` | `true` | Mandates HTTPS cookies |
| `SESSION_COOKIE_SAMESITE`| `None` | Enables cross-origin cookies between Vercel and Render |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Allowed CORS origin (update once frontend is deployed) |

5. Click **Create Web Service**.
6. When deployment finishes, copy your Render URL: e.g., `https://smart-disaster-api.onrender.com`.
7. Verify health: Open `https://smart-disaster-api.onrender.com/api/health` in your browser. It should return `{"status": "healthy", "database": {"connected": true}}`.

---

## 4. Deploy the Frontend (Vercel - Free Tier)

### Step 4.1: Deploy via Vercel
1. Log in to [Vercel.com](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit, select `frontend`
5. Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://smart-disaster-api.onrender.com` | Your deployed backend URL |

6. Click **Deploy**.
7. In ~60 seconds, your application is live at a URL like:
   👉 **`https://smart-disaster-management.vercel.app`**

### Step 4.2: Update Backend CORS
Return to **Render.com** -> your Web Service -> **Environment Variables**:
- Set `FRONTEND_URL` to your Vercel URL (e.g., `https://smart-disaster-management.vercel.app`).
- Save changes. Render will auto-reload with the updated allowed origin.

---

## 5. Sharing the Application

You can now share your Vercel URL with anyone (faculty, students, evaluators):
- **Web App URL**: `https://<your-project>.vercel.app`
- **Default Admin Login**:
  - Email: `admin@disaster.gov`
  - Password: `admin123`
- **Citizen Registration**:
  - Anyone can click "Register for a new citizen account", sign up with their name/phone, report emergencies, and track rescue responses in real time.

---

## 6. Local Testing vs Cloud Deployment Summary

| Feature | Local Development | Cloud Deployment |
| :--- | :--- | :--- |
| **Database** | Localhost MySQL 8.0 (`port 3306`) | Managed Cloud MySQL (Aiven / Railway / AWS RDS) |
| **Backend** | `python app.py` (`http://localhost:5000`) | Gunicorn on Render / Railway (`HTTPS`) |
| **Frontend** | `npm run dev` (`http://localhost:5173`) | Static SPA on Vercel / Netlify CDN (`HTTPS`) |
| **Session Cookies** | `SameSite=Lax; Secure=False` | `SameSite=None; Secure=True` |
| **User Requirement** | Requires Python, Node, MySQL | **Zero setup: browser only** |
