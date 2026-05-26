# Aidaxis - Digital Health Companion

A comprehensive health management application with nutrition tracking, medication reminders, health risk assessment, blood donor platform, and digital health document storage.

## Features

- **Dashboard** - Overview of health metrics with quick actions
- **Nutrition Tracker** - Log meals, track calories, protein, carbs, fat, and sugar with analytics
- **Medication Reminders** - Manage medications with scheduling and adherence tracking
- **Health Risk Analyzer** - AI-powered health risk assessment based on BMI, blood pressure, and glucose
- **Blood Donor Platform** - Create and manage blood donation requests
- **Health Locker** - Securely store and organize health documents

## Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: SQLite (sql.js)

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Start the development servers:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client && npm run dev
```

3. Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/dashboard` - Dashboard summary
- `GET/POST /api/nutrition/meals` - Meal management
- `GET/POST /api/medications` - Medication management
- `POST /api/health-risk/analyze` - Health risk analysis
- `GET/POST /api/blood-donor/requests` - Blood requests
- `GET/POST /api/health-locker/documents` - Document management
