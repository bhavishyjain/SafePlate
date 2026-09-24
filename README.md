# SafePlate

SafePlate is a food-redistribution application that connects food donors with NGOs. The backend records donations, calculates their nutritional value, matches them with suitable nearby NGOs, and tracks each donation from assignment to delivery.

This README explains the backend in beginner-friendly language so that every teammate can run it, understand how it is organized, and continue working on it safely.

## Current backend status

The approved backend scope is implemented.

Completed areas include:

- versioned REST APIs under `/api/v1`;
- donor, NGO, and admin roles;
- access tokens and rotating refresh tokens;
- logout, logout from all devices, and token revocation;
- login rate limiting and password reset through Resend;
- donation creation with multiple food items;
- nutrition lookup through an internal catalog;
- Gemini-assisted nutrition suggestions when the catalog has no match;
- donor confirmation before suggested nutrition values are used;
- NGO nutrition requirements calculated from beneficiary age groups;
- admin nutrition overrides with a required reason;
- donation expiry processing every five minutes;
- nutrition-and-distance-based NGO allocation;
- safe pickup, delivery, rejection, cancellation, and reassignment workflows;
- allocation history and explainable score snapshots;
- dashboard metrics, date filters, and daily trends;
- pagination and filtering for list endpoints;
- admin user search, account disabling, and session revocation; and
- an OpenAPI specification in [`backend/openapi.json`](backend/openapi.json).

The following features were intentionally left out of the current scope:

- in-app or push notifications;
- spoilage-risk scoring;
- storage-condition tracking; and
- a separate deployment/operations phase.

`packagingType` is still stored because it helps an NGO understand whether it may need to bring a container. Preparation time, pickup deadlines, expiry handling, and expiry reasons are also retained.

## Technology

- JavaScript with Node.js
- Express for HTTP routes and middleware
- MongoDB with Mongoose
- JSON Web Tokens for access tokens
- hashed, rotating refresh tokens
- bcrypt for password hashing
- Resend for password-reset email
- Gemini as an optional nutrition-estimation fallback
- node-cron for expired-donation processing
- Node's built-in test runner

No TypeScript is used in the backend.

## Repository structure

```text
SafePlate/
├── backend/                 Node.js and Express API
│   ├── openapi.json         Machine-readable API documentation
│   ├── src/
│   │   ├── config/          Environment and database configuration
│   │   ├── controllers/     HTTP request and response handling
│   │   ├── domain/          Small business rules and status transitions
│   │   ├── engines/         Nutrition and allocation calculations
│   │   ├── jobs/            Scheduled expiry processing
│   │   ├── middleware/      Authentication, validation, and errors
│   │   ├── models/          Mongoose schemas
│   │   ├── routes/          API endpoint declarations
│   │   ├── scripts/         Safe development utilities
│   │   ├── seeds/           Initial nutrition catalog data
│   │   ├── services/        Reusable business and database operations
│   │   ├── utils/           Date and pagination helpers
│   │   ├── app.js           Express application assembly
│   │   └── index.js         Database connection and server startup
│   └── test/                Automated backend tests
└── mobile/                  Mobile application workspace
```

### How an API request moves through the backend

```text
Client request
    ↓
Route
    ↓
Authentication and validation middleware
    ↓
Controller
    ↓
Service or calculation engine
    ↓
Mongoose model and MongoDB
    ↓
JSON response or centralized error response
```

Routes remain small. Controllers coordinate HTTP requests. Services contain reusable business and database logic. Engines perform calculations that can be tested without starting the API.

## Running the backend locally

### Requirements

- Node.js 18 or newer
- npm
- MongoDB locally, or a MongoDB Atlas connection string

MongoDB transactions require Atlas or another replica-set deployment. The backend also uses conditional updates as an additional protection against duplicate assignment.

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create the environment file

Copy `backend/.env.example` to `backend/.env`, then provide the values required for your environment.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safeplate
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=30
PASSWORD_RESET_MINUTES=15
RESEND_API_KEY=
RESEND_FROM=SafePlate <noreply@example.com>
APP_BASE_URL=http://localhost:8081
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
EXPIRY_CRON=*/5 * * * *
MAXIMUM_PICKUP_RADIUS_KM=25
ALLOCATION_NUTRITION_WEIGHT=0.7
ALLOCATION_DISTANCE_WEIGHT=0.3
MAXIMUM_PAGE_SIZE=100
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
JSON_LIMIT=1mb
```

Important rules:

- Never commit `.env` or real API keys.
- Production requires an explicit `JWT_SECRET` and `MONGODB_URI`.
- Allocation weights must total `1.0`.
- Resend is required only when password-reset email must actually be sent.
- Gemini is optional. If it is unavailable and no catalog match exists, the nutrition analysis reports that a suggestion is unavailable.

### 3. Seed the nutrition catalog

```bash
npm run seed:nutrition-catalog
```

This creates or updates the internal food nutrition records used before Gemini is considered.

### 4. Start the API

For development with automatic restart:

```bash
npm run dev
```

For normal startup:

```bash
npm start
```

The default API address is:

```text
http://localhost:5000/api/v1
```

Health check:

```text
GET http://localhost:5000/api/v1/health
```

### Development database reset

Development data can be reset when schema changes make old test data incompatible. The reset is deliberately guarded:

```powershell
$env:CONFIRM_DATABASE_RESET="SAFEPLATE_RESET"
npm run reset:development
```

The script refuses to run in production. Read `backend/src/scripts/resetDevelopmentData.js` before using it, because it deletes development collections while preserving user accounts.

## User roles

| Role | Main permissions |
| --- | --- |
| `DONOR` | Register, log in, analyze food nutrition, create donations, view owned donations, edit or discard pending donations |
| `NGO` | Maintain an NGO profile, view nutrition status, view assigned donations, confirm pickup and delivery, reject an assignment |
| `ADMIN` | Run allocation, view score details, manage assignments, manage the nutrition catalog, view dashboard metrics, manage user access |

Authorization is checked on the server. Hiding a button in the mobile or web interface is not considered a security control.

## Authentication and account security

### Access and refresh tokens

- Access tokens expire after 15 minutes by default.
- Refresh tokens expire after 30 days by default.
- Only a cryptographic hash of each refresh token is stored.
- Refreshing rotates the token: the old token is revoked and a new one is returned.
- Reusing a revoked refresh token revokes the remaining token family.
- Logout revokes the supplied refresh token.
- Logout-all revokes every active refresh token belonging to the user.
- Password reset also revokes all existing refresh-token sessions.

Refresh tokens are returned in JSON because the project includes a mobile client. The mobile app should store them in secure device storage, not normal local storage.

### Login protection

Login attempts are limited by email and IP address. Five failed attempts within 15 minutes block another attempt temporarily.

Admin-disabled accounts cannot log in, refresh a session, or continue using an existing access token. Disabling an account also revokes its refresh tokens.

### Password reset

The forgot-password endpoint always returns the same public response, whether or not the email exists. This prevents attackers from using the endpoint to discover registered accounts.

## Donation and nutrition flow

1. A donor enters one or more food items and their measured weights.
2. Each item must contain at least 250 grams.
3. The backend checks the internal nutrition catalog first.
4. If there is no catalog match and Gemini is configured, Gemini suggests calories and protein per 100 grams.
5. Gemini values are suggestions, not automatically trusted values.
6. The donor reviews and confirms the nutrition values.
7. The confirmed values are stored on the donation as a snapshot.
8. Allocation always uses that stored snapshot, so later catalog or Gemini changes cannot silently alter an existing donation.

Example donation item:

```json
{
  "name": "Cooked rice",
  "quantityGrams": 5000,
  "nutritionPer100g": {
    "calories": 130,
    "proteinGrams": 2.7
  },
  "nutritionSource": "CATALOG",
  "donorConfirmed": true
}
```

A donation also stores:

- donor;
- preparation time;
- pickup deadline;
- GeoJSON location in `[longitude, latitude]` order;
- packaging type;
- calculated total weight;
- current status; and
- discard or expiry reason when applicable.

## NGO nutrition requirements

An NGO enters beneficiary groups instead of manually guessing a daily target.

Supported groups include:

- children aged 1–5;
- children aged 6–9;
- children aged 10–12;
- teenagers aged 13–15;
- teenagers aged 16–18;
- adults aged 19–29;
- adults aged 30–59; and
- older adults aged 60 and above.

The backend multiplies each group count by its nutrition reference, then stores the calculated daily calorie and protein requirement with a reference version. An admin may override both targets, but must provide a reason.

Delivered calories and protein are tracked by the current `Asia/Kolkata` operational day.

## Donation lifecycle

```text
PENDING ──→ ASSIGNED ──→ PICKED_UP ──→ DELIVERED
   │             │
   │             └──→ PENDING after rejection or cancellation
   └──→ DISCARDED after donor cancellation or deadline expiry
```

- Only pending donations can be edited by their donor.
- Only the assigned NGO or an admin can confirm pickup and delivery.
- Delivery cannot be confirmed before pickup.
- Repeating a successful pickup or delivery is safe and does not apply the operation twice.
- A repeated delivery cannot add the same nutrition to the NGO twice.
- Reasons are mandatory for rejection, cancellation, and reassignment.
- Allocation history is retained for auditing.

The expiry job runs every five minutes by default. It marks overdue pending donations as discarded with a standard expiry reason. Optimization performs an expiry check as an additional safety measure.

## How allocation works

Allocation is deterministic: the same inputs and evaluation time produce the same result.

### Eligibility

- The donation must still be pending and before its pickup deadline.
- The NGO must be within 25 km using Haversine straight-line distance.
- An NGO that previously rejected that donation is excluded.

### Processing order

Donations with the earliest pickup deadline are processed first. Equal deadlines are resolved using creation time and then the donation ID, giving stable results.

### Nutrition score

The backend calculates how much of an NGO's remaining daily calorie and protein gap the donation can fill. Calories and protein receive equal importance inside the nutrition score.

Nutrition already delivered during the current `Asia/Kolkata` day is subtracted first. Running totals are also updated during one optimization run so the same NGO is not repeatedly treated as completely unfed.

### Distance score

Closer NGOs receive a higher proximity score:

```text
proximityScore = 1 - min(distanceKm / 25, 1)
```

### Final match score

```text
matchScore = 0.7 × nutritionScore + 0.3 × proximityScore
```

Nutrition is the primary goal, while distance still matters for practical pickup. If every eligible NGO has already met its daily target, the closest eligible NGO receives the donation.

Each allocation stores its component scores, weights, radius, calculated nutrition, distance, evaluation time, and algorithm version. Detailed score information is returned to admins, not NGOs.

### Concurrency safety

- A database-backed optimization lock prevents multiple optimization runs from operating simultaneously.
- A conditional update changes a donation from `PENDING` to `ASSIGNED` only if it is still eligible.
- Each donation has at most one allocation record.
- MongoDB transactions are used when supported.
- Assignment, donation status, delivery nutrition, and audit history are updated together where transactions are available.

## Rejection, cancellation, and reassignment

### NGO rejection

The assigned NGO can reject an assignment before pickup and must provide a reason. The backend:

1. records the rejection in allocation history;
2. adds the NGO to the donation's rejected-NGO list;
3. returns the donation to `PENDING`; and
4. automatically tries to assign it to another eligible NGO.

If no alternative NGO is eligible, the donation remains pending.

### Admin cancellation

An admin may cancel an active assignment before pickup with a mandatory reason. The donation returns to pending so that an admin may decide what to do next.

### Admin reassignment

An admin may manually reassign an eligible donation to a different NGO. The selected NGO must be within the pickup radius and must not have rejected the donation previously.

## Dashboard and list endpoints

The admin dashboard reports:

- kilograms donated;
- kilograms assigned;
- kilograms delivered;
- kilograms discarded;
- distinct NGOs that received delivered food;
- delivery success rate;
- unmatched donation count; and
- daily donated and delivered weight trends.

Dashboard results support `from` and `to` date filters.

Donation, allocation, and admin-user lists use page-based pagination:

```text
?page=1&limit=20&sort=-createdAt
```

The maximum page size is 100 by default.

## API overview

All application endpoints begin with `/api/v1`.

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a donor or NGO user |
| `POST` | `/auth/login` | Log in and receive access/refresh tokens |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `POST` | `/auth/logout` | Revoke one refresh token |
| `POST` | `/auth/logout-all` | Revoke all sessions |
| `POST` | `/auth/forgot-password` | Request a password-reset email |
| `POST` | `/auth/reset-password` | Reset the password using a token |
| `GET` | `/auth/me` | Read the current user |

### Donations and nutrition

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/nutrition/analyze` | Suggest nutrition for food items |
| `GET` | `/nutrition/catalog` | List active catalog items |
| `POST` | `/nutrition/catalog` | Create a catalog item as admin |
| `PATCH` | `/nutrition/catalog/:id` | Update a catalog item as admin |
| `POST` | `/donations` | Create a confirmed donation |
| `GET` | `/donations` | List visible donations |
| `GET` | `/donations/:id` | Read an authorized donation |
| `PATCH` | `/donations/:id` | Edit a pending donation |
| `PATCH` | `/donations/:id/status` | Discard a pending donation |

### NGOs and allocation

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/ngos` | Create or update an NGO profile |
| `GET` | `/ngos/:id` | Read an authorized NGO profile |
| `GET` | `/ngos/:id/nutrition-status` | View daily targets, delivery, and remaining gaps |
| `PATCH` | `/ngos/:id/nutrition-override` | Set an admin nutrition override |
| `DELETE` | `/ngos/:id/nutrition-override` | Remove an override |
| `POST` | `/optimize` | Run allocation as admin |
| `GET` | `/allocations` | List visible allocations |
| `PATCH` | `/allocations/:id/pickup` | Confirm pickup |
| `PATCH` | `/allocations/:id/delivered` | Confirm delivery |
| `PATCH` | `/allocations/:id/reject` | Reject and automatically re-optimize |
| `PATCH` | `/allocations/:id/cancel` | Cancel as admin |
| `PATCH` | `/allocations/:id/reassign` | Reassign as admin |

### Administration

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/dashboard/summary` | Read dashboard metrics |
| `GET` | `/admin/users` | Search and paginate users |
| `PATCH` | `/admin/users/:id/status` | Enable or disable an account |
| `POST` | `/admin/users/:id/revoke-sessions` | Revoke all refresh-token sessions |

See [`backend/openapi.json`](backend/openapi.json) for the machine-readable API summary. The source route files remain the final authority if the implementation changes before the specification is updated.

## Error responses

Errors use a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "requestId": "request-identifier",
    "details": []
  }
}
```

The request ID helps connect a client error with server logs. Validation errors may include a `details` array describing individual fields.

## Tests and checks

Run the backend test suite:

```bash
cd backend
npm test
```

Run the startup-file syntax check:

```bash
npm run check
```

The current tests cover configuration, HTTP basics, security helpers, validation, schemas, operational dates, nutrition calculation, allocation scoring, radius handling, rejected NGOs, deterministic ordering, and pagination.

A real MongoDB Atlas or replica-set integration test is still recommended before a production release because the lightweight test suite does not start a transaction-capable MongoDB instance.

## Git workflow for teammates

### Publishing your branch

From the repository root:

```bash
git status
git add README.md
git commit -m "docs: document completed backend workflows"
git push origin dev/sahil
```

Pushing `dev/sahil` updates only that remote branch. It does not replace `main`.

### Reviewing and merging

1. Open a pull request from `dev/sahil` into `main`.
2. Ask teammates to review the backend changes and this README.
3. Resolve any conflicts or review comments.
4. Merge the pull request after approval.

### Getting the merged work as a teammate

After the pull request is merged:

```bash
git switch main
git pull origin main
```

To inspect the development branch before it is merged:

```bash
git fetch origin
git switch dev/sahil
git pull origin dev/sahil
```

If a teammate has uncommitted work, they should commit or stash it before switching branches or pulling.

## Suggested reading order for beginners

Read these files side by side with this README:

1. `backend/src/domain/donationStatus.js` — small and readable state-transition rules.
2. `backend/src/utils/date.js` — operational-day calculations.
3. `backend/src/app.js` — how Express middleware and routes are assembled.
4. `backend/src/routes/donations.js` — a simple view of endpoint declarations.
5. `backend/src/controllers/donationController.js` — how requests coordinate database work.
6. `backend/src/models/Donation.js` — how donation data is validated and stored.
7. `backend/src/middleware/auth.js` — access-token authentication and account checks.
8. `backend/src/services/tokenService.js` — refresh rotation and revocation.
9. `backend/src/services/nutritionAnalysisService.js` — catalog-first and Gemini-fallback logic.
10. `backend/src/engines/AllocationEngine.js` — pure allocation calculations.
11. `backend/src/services/allocationService.js` — transactions, lifecycle safety, and fulfilment.
12. `backend/test/allocationEngine.test.js` — examples of expected allocation behavior.

This order moves from small pure functions to the most complex business workflow.
