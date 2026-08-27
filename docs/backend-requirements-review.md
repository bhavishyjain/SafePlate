# SafePlate Backend Requirements Review

**Status:** Draft for owner review  
**Purpose:** Edit this document and return it before further backend implementation.  
**Implementation rule:** No item in this document should be implemented until its choices are confirmed.

---

## 1. Confirmed Direction Changes

### 1.1 API versioning

- [x] Remove all unversioned API routes.
- [x] Retain only `/api/v1/...` routes.
- [ ] Confirm whether `/health` should also be removed, leaving only `/api/v1/health`.

**Owner answer:**

> Yes

### 1.2 Backend folder structure

- [x] Route files should contain only route declarations and middleware composition.
- [x] Request-handling logic should move into a separate `controllers/` directory.
- [ ] Confirm whether business logic should also move into a separate `services/` directory.

Recommended structure:

```text
backend/src/
  config/
  controllers/
  domain/
  engines/
  middleware/
  models/
  routes/
  services/
  utils/
```

**Recommendation:** Use controllers for HTTP handling and services for reusable database/business operations. Engines should remain pure calculation modules.

**Owner answer:**

> Yes

### 1.3 Operating timezone

- [x] Replace UTC operational-day grouping with Indian local-day grouping.
- [x] Use the canonical IANA timezone identifier `Asia/Kolkata`.

`Asia/Mumbai` is not the standard IANA timezone identifier used by JavaScript runtimes. `Asia/Kolkata` represents Indian Standard Time and should be used for day boundaries, nutrition logs, expiry displays, and scheduled jobs.

Storage recommendation:

- Store timestamps in MongoDB as UTC dates.
- Convert to `Asia/Kolkata` only when calculating an operational day or presenting a local date.

### 1.4 Storage-condition terminology

- [x] Replace the storage enum `AMBIENT` with `ROOM_TEMPERATURE`.
- [ ] Confirm whether existing records need a migration from `AMBIENT` to `ROOM_TEMPERATURE`.

**Owner answer:**

> YES

### 1.5 Expired donation processing

- [x] Add scheduled expired-donation processing.
- [ ] Choose the execution mechanism.
- [ ] Choose the execution interval.

Recommended MVP behavior:

1. Run every five minutes.
2. Find donations where `status = PENDING` and `pickupDeadline <= now`.
3. Change them to `DISCARDED` with an expiry reason.
4. Keep the same expiry check inside optimization as a safety fallback.
5. Ensure only one scheduler instance performs the update when multiple backend instances exist.

Execution choices:

- **Option A — `node-cron`:** Simple for a single always-running backend instance.
- **Option B — Hosting-provider scheduled job:** More reliable when the API can sleep or scale horizontally.
- **Option C — Queue worker:** Most robust, but unnecessarily complex for the current college MVP.

**Recommendation:** Use `node-cron` for local/demo deployment and document that production should use the hosting provider's scheduler. Adding `node-cron` introduces a new package and requires approval.

**Owner answer:**

> Scheduler option: cron
> Interval:  5 min
> Add discard/expiry reason field: Yes - make a default statement then

---

## 2. Packaging Terminology

The current meanings are:

### `COOKED_LOOSE`

Cooked food kept in bulk, exposed, loosely covered, or not stored in a properly closed food-grade container. Examples include food in an open tray, serving vessel, large cooking pot, or buffet pan.

This category has a higher spoilage multiplier because exposure and repeated handling may increase contamination risk.

### `COOKED_CONTAINER`

Cooked food placed in a closed food-grade container after preparation. Examples include a closed steel container, casserole, lidded food box, or sealed catering container.

This category has a lower spoilage multiplier than loose/exposed cooked food.

### Recommended clearer enum names

```text
SEALED_PACKAGED
CLOSED_CONTAINER
OPEN_OR_BULK
```

Suggested display labels:

```text
Sealed packaged food
Cooked food in a closed container
Cooked food stored open or in bulk
```

- [ ] Keep the current packaging enum names.
- [ ] Replace them with the clearer names above.
- [ ] Provide different names below.

**Owner answer:**

> Works

---

## 3. Authentication and Account Security

The following features are requested:

- [x] Refresh tokens.
- [x] Refresh-token rotation.
- [x] Logout.
- [x] Token revocation.
- [x] Password reset.
- [x] Login rate limiting.
- [x] Email verification.
- [x] Resend API for transactional email, subject to final confirmation.

### 3.1 Proposed token design

- Access token lifetime: 15 minutes.
- Refresh token lifetime: 30 days.
- Store only a cryptographic hash of each refresh token in MongoDB.
- Rotate the refresh token every time it is used.
- Revoke the full token family if an already-used refresh token is presented again.
- Revoke the current session on logout.
- Provide an optional logout-all-devices endpoint.

### 3.2 Proposed endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

### 3.3 Proposed verification and reset behavior

- Registration creates an unverified account.
- A one-time verification token is emailed through Resend.
- Verification tokens are stored as hashes and expire after 30 minutes.
- Login is blocked until the email is verified.
- Password-reset requests always return the same response whether the email exists or not.
- Password-reset tokens are stored as hashes and expire after 15 minutes.
- A successful password reset revokes all refresh tokens for the user.

### 3.4 Proposed login rate limit

- Five failed login attempts per email and IP address in 15 minutes.
- Return HTTP `429` after the limit is exceeded.
- Reset or reduce the failure count after a successful login.

### 3.5 Decisions required

- [ ] Is email verification mandatory before login?
- [ ] Should phone number remain required if verification is email-based?
- [ ] Should `logout-all` be included?
- [ ] Confirm access-token lifetime.
- [ ] Confirm refresh-token lifetime.
- [ ] Confirm verification-token lifetime.
- [ ] Confirm password-reset-token lifetime.
- [ ] Confirm login rate limit.
- [ ] Confirm Resend as the email provider.
- [ ] Provide the sender domain/address that will be verified in Resend.
- [ ] Decide whether refresh tokens are returned in JSON or stored in secure HTTP-only cookies.

**Recommendation:** Web should use a secure HTTP-only cookie. React Native usually needs secure device storage and a JSON token response. If both clients will exist, the backend may need an explicitly documented client-specific approach.

**Owner answer:**

> Email verification required before login:  No
> Phone still required:  Yes
> Include logout-all:  Yes
> Access-token lifetime: 15 min 
> Refresh-token lifetime:  30 days
> Email provider:  Resend
> Resend sender address/domain:  
> Refresh-token transport:  
> Rate-limit rule:  
Let's remove email verification thing completely 

---

## 4. Donation Food Input and Nutrition Calculation

### 4.1 Requested direction

- Remove the existing `FoodType` master-data model.
- Remove food-type IDs from donations.
- Allow a donor to describe donated food using text input.
- Consider using the Gemini API to calculate calories and protein.

### 4.2 Important impact on the original project scope

The original LLD explicitly defines SafePlate as a deterministic, rule-based system with no AI or machine learning. Using Gemini to infer nutrition would materially change:

- The project scope and report.
- System architecture.
- Reliability guarantees.
- Testing strategy.
- API cost and availability.
- Privacy considerations.
- The ability to reproduce allocation results.

Gemini nutrition values may also vary between calls or be incorrect when a description is vague, such as “one tray of rice and curry.” The model cannot reliably know ingredients, serving weight, cooking oil, or recipe proportions from free text alone.

### 4.3 Recommendation

Do not make free-form Gemini output the authoritative source for allocation.

Recommended hybrid design:

1. A donation contains an array of food items rather than one food-type ID.
2. Each item includes a name and measured weight.
3. The backend first attempts deterministic matching against a curated nutrition catalog.
4. Gemini may suggest a catalog match or estimated values only when no match exists.
5. The donor must review and confirm Gemini-generated values.
6. The backend stores the confirmed calories, protein, shelf life, and calculation source as a snapshot.
7. Allocation always uses the stored snapshot, never a new live Gemini response.

Possible item structure:

```json
{
  "name": "Cooked rice",
  "quantityKg": 4,
  "nutritionPer100g": {
    "calories": 130,
    "proteinGrams": 2.7
  },
  "baseShelfLifeHours": 6,
  "nutritionSource": "CATALOG",
  "donorConfirmed": true
}
```

If Gemini is used, `nutritionSource` could be `GEMINI_ESTIMATE`.

### 4.4 Design questions

- [ ] Should the project officially change from “No AI/ML” to an AI-assisted system?
- [ ] Should Gemini be authoritative or suggestion-only?
- [ ] Will donors enter one combined description or multiple food items?
- [ ] Must donors provide weight for every item?
- [ ] Can one donation contain items with different packaging and storage conditions?
- [ ] Should the donor confirm estimated calories, protein, and shelf life?
- [ ] What happens when Gemini is unavailable?
- [ ] Should raw donor descriptions be sent to Gemini?
- [ ] Should Gemini responses be stored for auditing?
- [ ] Should an admin be able to correct an estimate?
- [ ] Should the existing food catalog be deleted or retained internally as a deterministic fallback?

### 4.5 Available choices

#### Option A — Deterministic catalog only

- Donor types a food name.
- Backend searches a curated catalog.
- Donor selects the closest result.
- Fully consistent with the original no-AI scope.

#### Option B — Catalog with Gemini-assisted fallback

- Catalog is tried first.
- Gemini suggests values only for unmatched descriptions.
- Donor confirms the result.
- Recommended if AI assistance is required.

#### Option C — Gemini only

- Every description is sent to Gemini.
- Simplest donor interface.
- Highest reliability, cost, repeatability, and availability risk.
- Not recommended for authoritative nutrition allocation.

**Owner answer:**

> Selected option:  B
> Keep or remove internal catalog:  Keep
> Single description or item array:  item array
> Weight required per item:  250g
> Donor confirmation required:  yes 
> Gemini outage behavior:  didnt understand
> Admin correction allowed:  yes

---

## 5. Dynamic NGO Nutrition Requirements

### 5.1 Requested direction

- Remove manually entered `targetCaloriesPerDay`.
- Remove manually entered `targetProteinPerDay`.
- Calculate daily needs dynamically using NGO type and beneficiary count.

### 5.2 Required clarification

NGO type and total capacity alone are not enough to calculate nutrition requirements accurately.

Examples:

- A school may serve children from multiple age groups.
- An orphanage may include young children and teenagers.
- A shelter may serve adults, families, and children.
- An old-age home may have different resident activity and health profiles.

Recommended model:

```json
{
  "type": "SCHOOL",
  "beneficiaryGroups": [
    {
      "category": "CHILD_6_TO_12",
      "count": 30
    },
    {
      "category": "TEEN_13_TO_18",
      "count": 20
    }
  ]
}
```

The backend would use reviewed per-person reference values:

```text
dailyCalories = sum(group count × group calorie reference)
dailyProtein = sum(group count × group protein reference)
```

### 5.3 Suggested beneficiary categories

```text
CHILD_1_TO_5
CHILD_6_TO_12
TEEN_13_TO_18
ADULT
OLDER_ADULT
```

These are proposed categories only. Final nutrition references should be selected from an authoritative Indian source and documented in the project report before coding.

### 5.4 Storage choices

#### Option A — Calculate on every request

- Store beneficiary groups only.
- Calculate targets dynamically.
- Reference updates immediately affect all NGOs.

#### Option B — Store calculated target snapshots

- Store beneficiary groups and calculated targets.
- Recalculate when the profile or reference version changes.
- Easier to audit and reproduce allocations.

**Recommendation:** Option B with a `nutritionReferenceVersion` field. This keeps allocations explainable.

### 5.5 Decisions required

- [ ] Confirm beneficiary categories.
- [ ] Can an NGO contain multiple beneficiary categories?
- [ ] Choose the authoritative nutrition-reference source.
- [ ] Choose calculate-on-read or stored snapshots.
- [ ] Should an admin be able to override calculated requirements?
- [ ] Should pregnancy, illness, activity level, or dietary restrictions remain out of scope?
- [ ] Should `capacity` be removed or retained as the sum of beneficiary counts?

**Owner answer:**

> Beneficiary categories:  yes add age groups  for adult andd older adults
> Multiple categories allowed:  yes
> Nutrition source:  idk like it should be autocalculated with the data we are giving
> Calculation/storage option:  B
> Admin override allowed:  yes
> Capacity behavior:  didn't get that

---

## 6. Data-Migration Decisions

The repository appears to be in early development, but schema changes still require an explicit choice.

- [ ] Confirm that existing development data can be deleted and reseeded.
- [ ] Or require a migration script that preserves existing users, NGOs, and donations.

Affected data:

- `FoodType` collection.
- `Donation.foodType` references.
- NGO calorie and protein target fields.
- `AMBIENT` storage values.
- Existing nutrition logs.

**Recommendation:** If there is no important test/demo data, reset and reseed the development database after the redesigned schema is approved. Do not delete anything until explicitly authorized.

**Owner answer:**

> Preserve existing data / Development reset allowed:  allowed to reset

---

## 7. Remaining Backend Features Not Yet Implemented

### 7.1 Core allocation system

- [ ] Integrate the spoilage engine into optimization.
- [ ] Integrate nutrition calculation into optimization.
- [ ] Implement real geographic distance calculation.
- [ ] Decide maximum pickup radius.
- [ ] Normalize distance scores.
- [ ] Confirm allocation weights.
- [ ] Maintain running NGO nutrition totals during optimization.
- [ ] Add deterministic tie-breaking.
- [ ] Return explainable score components.
- [ ] Handle donations for which no NGO is eligible.

### 7.2 Allocation persistence and concurrency

- [ ] Prevent simultaneous optimize runs from assigning the same donation twice.
- [ ] Use transactions or atomic claims.
- [ ] Keep allocation and donation status synchronized.
- [ ] Decide immediate assignment versus admin proposal confirmation.
- [ ] Decide whether admin reassignment is required.
- [ ] Add allocation history or audit records if required.

### 7.3 Pickup and delivery safety

- [ ] Verify NGO ownership before pickup.
- [ ] Verify NGO ownership before delivery.
- [ ] Enforce lifecycle transitions.
- [ ] Make pickup idempotent.
- [ ] Make delivery idempotent.
- [ ] Prevent duplicate nutrition-log increments.
- [ ] Define admin override behavior.

### 7.4 Notifications

- [ ] Add in-app notification collection/model.
- [ ] Notify NGO when a donation is assigned.
- [ ] Notify donor when pickup is confirmed.
- [ ] Notify donor and admin when delivery is confirmed.
- [ ] Add unread count.
- [ ] Add mark-as-read behavior.
- [ ] Decide whether assignment cancellation/reassignment notifications are required.
- [ ] Decide whether native push notifications remain out of scope.

### 7.5 Dashboard and reporting

- [ ] Correct “NGOs served” to count NGOs with delivered allocations.
- [ ] Use MongoDB aggregations.
- [ ] Add date filters.
- [ ] Report donated, assigned, delivered, and discarded kilograms.
- [ ] Report average spoilage risk.
- [ ] Decide whether delivery rate is required.
- [ ] Decide whether fairness metrics remain a stretch feature.

### 7.6 API completeness

- [ ] Pagination.
- [ ] Filtering and sorting.
- [ ] Admin user-management endpoints.
- [ ] NGO profile update contract after nutrition redesign.
- [ ] Food-description/nutrition-analysis endpoints after design approval.
- [ ] Consistent response schemas for list endpoints.
- [ ] OpenAPI documentation.

### 7.7 Testing

- [ ] MongoDB integration tests.
- [ ] Authentication lifecycle tests.
- [ ] Refresh-token replay tests.
- [ ] Email verification tests with a mocked Resend client.
- [ ] Password-reset tests.
- [ ] Allocation engine boundary tests.
- [ ] Concurrent optimization tests.
- [ ] Complete donor-to-delivery end-to-end test.

### 7.8 Deployment and operations

- [ ] Dockerfile.
- [ ] Docker Compose.
- [ ] Production readiness endpoint.
- [ ] Structured logging.
- [ ] CI test workflow.
- [ ] Render/Railway/other hosting decision.
- [ ] Resend environment configuration.
- [ ] Gemini environment configuration if approved.
- [ ] Scheduler deployment strategy.
- [ ] Secret-management documentation.

### 7.9 Stretch features requiring separate approval

- [ ] Dietary constraint filtering.
- [ ] Fairness metric.
- [ ] Native push notifications.
- [ ] Multi-stop routing.
- [ ] Traffic-aware routing.
- [ ] Gemini or other AI features beyond nutrition suggestion.

---

## 8. Proposed Implementation Order After Requirements Approval

Each phase requires a review before implementation begins.

### Phase A — Structural cleanup and terminology

1. Remove unversioned routes.
2. Split routes and controllers.
3. Add services only if approved.
4. Rename `AMBIENT` to `ROOM_TEMPERATURE`.
5. Rename packaging enums if approved.
6. Switch operational-day calculations to `Asia/Kolkata`.
7. Add or omit data migrations based on the owner decision.

### Phase B — Authentication and email security

1. Design refresh-token and one-time-token models.
2. Add Resend through an adapter so it can be mocked.
3. Add verification, refresh, logout, revocation, and password reset.
4. Add rate limiting.
5. Add security tests.

### Phase C — Donation and NGO nutrition redesign

1. Implement the approved food-input option.
2. Remove or retain the internal food catalog based on the decision.
3. Add Gemini only if explicitly approved.
4. Implement beneficiary groups.
5. Implement reviewed nutrition-reference calculations.
6. Update donation and NGO endpoints.
7. Add migrations or reseeding behavior.

### Phase D — Expiry scheduler

1. Implement the approved scheduler mechanism.
2. Add expiry reason if approved.
3. Add single-run/concurrency protection.
4. Retain optimize-time expiry protection.
5. Add scheduler tests.

### Phase E — Allocation engines

1. Integrate spoilage calculations.
2. Integrate approved nutrition calculations.
3. Implement distance scoring.
4. Implement greedy allocation with running totals.
5. Add explainability and deterministic tests.

### Phase F — Safe fulfilment

1. Make optimization atomic.
2. Secure pickup and delivery ownership.
3. Make fulfilment idempotent.
4. Prevent duplicate nutrition updates.
5. Add end-to-end tests.

### Phase G — Notifications, dashboard, documentation, and deployment

These should be broken into separately approved phases when the core flow is stable.

---

## 9. Final Approval Checklist

Before implementation resumes, confirm:

- [ ] API route policy.
- [ ] Controller/service folder structure.
- [ ] Packaging terminology.
- [ ] Expiry scheduler mechanism and interval.
- [ ] Authentication token lifetimes and transport.
- [ ] Resend configuration and email behavior.
- [ ] Food-input and Gemini approach.
- [ ] Whether the project officially includes AI.
- [ ] Beneficiary categories and nutrition reference source.
- [ ] Dynamic-target calculation/storage strategy.
- [ ] Development data reset or migration requirement.
- [ ] Phase A is approved as the first implementation phase.

**Owner approval/comments:**

> 
