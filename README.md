# Aid-Axis - Personal Health Management System

Aid-Axis is a digital healthcare web application designed to support personal health management through an integrated set of tools for nutrition tracking, medication reminders, blood donor requests, and digital health document storage. The platform helps users organize their daily health activities, monitor important health-related data, and access essential records in one place through a simple and user-friendly interface.

## Features

- **Dashboard** - View health metrics, quick actions, and overall health activity summary.
- **Nutrition Tracker** - Log meals and track calories, protein, carbohydrates, fat, and sugar with visual analytics.
- **Medication Reminders** - Manage medications with schedules, reminder tracking, and adherence insights.
- **Health Insights** - View simple graphs and risk-related insights based on nutrition and medication data.
- **Blood Donor Platform** - Create and manage blood donation requests.
- **Health Locker** - Store and organize health-related documents digitally.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express
- **Database:** SQLite using sql.js
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

1. Install dependencies:

```bash
npm install
cd client && npm install

2. Start the development servers.

**Terminal 1 - Backend:**

```bash
npm run server
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

3. Open the app in your browser:

```text
http://localhost:3000
```

## API Endpoints

* `GET /api/dashboard` - Dashboard summary
* `GET/POST /api/nutrition/meals` - Meal management
* `GET/POST /api/medications` - Medication management
* `GET/POST /api/blood-donor/requests` - Blood donation request management
* `GET/POST /api/health-locker/documents` - Health document management

## Live Demo

```text
https://aid-axis.vercel.app
```
