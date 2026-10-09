# SafePlate

SafePlate is a full-stack food-redistribution platform that connects food donors with nearby NGOs. Donors publish safe surplus food with confirmed nutrition information, NGOs manage beneficiary needs and fulfil assignments, and administrators oversee allocation, users, NGO targets, and the nutrition catalog.

The repository contains an Expo application for Android, iOS, and web plus a Node.js API backed by MongoDB.

## How it works

1. A donor records surplus food, measured weight, preparation time, pickup deadline, packaging, and location.
2. Nutrition is resolved from the internal catalog or suggested through Gemini when configured.
3. The donor explicitly confirms the nutrition snapshot stored with the donation.
4. SafePlate ranks eligible NGOs using their remaining nutrition need and distance.
5. The selected NGO can reject the assignment or progress it through pickup and delivery.
6. Delivered nutrition is credited to the NGO's current Asia/Kolkata operational day.
7. Administrators monitor outcomes and manage operational exceptions.

## Roles and features

### Donor

- Register, sign in, and recover an account.
- Create multi-item donations and confirm nutrition values.
- View donation history and lifecycle status.
- Edit or discard pending donations.

### NGO

- Maintain an NGO profile, location, type, and beneficiary groups.
- View calculated or administrator-overridden daily nutrition targets.
- Review assigned food, pickup information, and donor contact details.
- Reject assignments or confirm pickup and delivery.

### Administrator

- View dashboard totals and donated-versus-delivered trends.
- Run allocation and inspect explainable match scores.
- Manage donations and assignment lifecycle actions.
- Search users, change account status, and revoke sessions.
- Manage NGO nutrition overrides and nutrition catalog records.

## Technology

### Application

- Expo 54 and React Native 0.81
- Expo Router
- React Native Paper, NativeWind, and Lucide icons
- Axios with rotating access-token refresh
- Expo Secure Store for native session persistence
- English and Thai localization

### API

- Node.js and Express
- MongoDB and Mongoose
- JWT access tokens and hashed rotating refresh tokens
- bcrypt password hashing
- Resend password-reset delivery
- Optional Gemini nutrition suggestions
- Scheduled donation-expiry processing with node-cron

## Repository structure

```text
SafePlate/
├── backend/
│   ├── openapi.json          API contract
│   └── src/
│       ├── config/           Environment and database configuration
│       ├── controllers/      Request handlers
│       ├── domain/           Lifecycle rules
│       ├── engines/          Allocation calculations
│       ├── jobs/             Scheduled expiry processing
│       ├── middleware/       Authentication, authorization, and validation
│       ├── models/           Mongoose models
│       ├── routes/           Versioned API routes
│       ├── scripts/          Database and seed utilities
│       ├── seeds/            Nutrition catalog seed data
│       ├── services/         Business operations
│       ├── utils/            Shared backend utilities
│       ├── app.js            Express application
│       └── index.js          API entry point
└── mobile/
    ├── app/                  Expo Router screens for all roles
    ├── assets/               Images and translations
    ├── components/           Shared forms and UI components
    ├── constants/            Domain options, formatting, and validation
    ├── services/             Domain API clients
    └── utils/                Session, networking, theme, and localization
```

## Requirements

- Node.js 18 or newer
- npm
- Android Studio for an Android emulator
- MongoDB, MongoDB Atlas, or the included project-local development database

## Backend setup

Install dependencies:

```bash
cd backend
npm install
```

Development defaults use port `5000`, `mongodb://localhost:27017/safeplate`, and a local-only JWT secret. Production requires explicit `MONGODB_URI` and `JWT_SECRET` values.

Common optional environment variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safeplate
JWT_SECRET=replace-with-at-least-32-random-characters
RESEND_API_KEY=
RESEND_FROM=SafePlate <noreply@example.com>
APP_BASE_URL=http://localhost:8081
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Never commit real credentials or `.env` files.

If MongoDB is not installed, start the included persistent development database in a separate terminal:

```bash
npm run db:development
```

Seed the complete demo environment:

```bash
npm run seed:development
```

Start the API:

```bash
npm run dev
```

The API is available at `http://localhost:5000/api/v1`. Its machine-readable contract is in `backend/openapi.json`.

## Application setup

In another terminal:

```bash
cd mobile
npm install
npm start
```

Run a platform directly when needed:

```bash
npm run android
npm run web
```

Android emulators use `http://10.0.2.2:5000` by default. Web and iOS use `http://localhost:5000`. Override the host for a physical device or remote API:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000
```

Do not include `/api/v1` in `EXPO_PUBLIC_API_URL`; the application adds it automatically.

## Demo accounts

After `npm run seed:development`, these accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Donor | `donor@safeplate.dev` | `SafePlate123!` |
| NGO | `ngo@safeplate.dev` | `SafePlate123!` |
| Administrator | `admin@safeplate.dev` | `SafePlate123!` |

The seed is idempotent and includes linked donations, assignments, nutrition progress, catalog records, dashboard history, and secondary accounts for operational scenarios.

## Commands

### Backend

```bash
npm start                       # Start the API
npm run dev                     # Start with Node watch mode
npm run check                   # Validate the backend entry file
npm run db:development          # Start the local persistent MongoDB instance
npm run seed:nutrition-catalog  # Seed only nutrition references
npm run seed:development        # Seed all demo workflows
```

### Application

```bash
npm start        # Start Expo
npm run android  # Build and run Android
npm run ios      # Build and run iOS on a supported host
npm run web      # Start the web application
npm run lint     # Run Expo linting
npm run check    # Run lint and TypeScript validation
```

## Core business rules

- Each food item must weigh at least 250 grams.
- Nutrition suggestions require donor confirmation before submission.
- Pickup deadlines must be in the future and later than preparation time.
- GeoJSON coordinates use `[longitude, latitude]` order.
- Only pending donations can be edited or discarded.
- Rejecting, cancelling, reassigning, and overriding nutrition requires a reason.
- Pickup must be confirmed before delivery.
- NGO eligibility uses a configurable pickup radius, nutrition need, and distance.
- Existing donation nutrition snapshots do not change when the catalog changes.
- Backend authorization remains authoritative even when the interface hides unavailable actions.

## Current scope

SafePlate supports authentication, donations, nutrition analysis, NGO profiles and targets, deterministic allocation, fulfilment, administrative management, localization, themes, and responsive Android/web interfaces.

Push notifications, chat, donation image uploads, live route tracking, spoilage scoring, storage-condition tracking, and deployment automation are outside the current implementation.
