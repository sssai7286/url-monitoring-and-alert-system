# URL Monitoring & Alert System

A production-quality MERN stack app to monitor URLs, track uptime, and receive alerts when sites go down.

## How to Run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000  
Backend runs on http://localhost:5000

### 3. MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```
Or use a MongoDB Atlas connection string in `MONGO_URI`.

---

## Key Architecture Decisions

### Monitoring Scheduler
A single cron job runs every minute. It fetches all active monitors and checks
if enough time has elapsed since the last check (based on each monitor's interval).
This avoids per-monitor timers and scales cleanly.

### Retry Mechanism
Before marking a site DOWN, the checker retries up to 2 times with a 2-second
delay between attempts. This prevents false positives from transient network blips.

### Uptime Calculation
`uptime% = (successfulChecks / totalChecks) * 100`
Tracked as running counters on the Monitor document. The history endpoint also
calculates uptime from the last 100 checks for a time-windowed view.

### Alert Cooldown
Alerts are only sent when status changes (UP→DOWN or DOWN→UP).
A configurable cooldown (default 10 min) prevents duplicate alerts if a site
flaps between states rapidly.

### Email Alerts
Configure SMTP in `.env`. If `EMAIL_USER` is not set, alerts are printed to
the console (mock mode) — useful for development.
