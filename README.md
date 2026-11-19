# SkillBridge

SkillBridge keeps the original HTML/CSS/vanilla JavaScript frontend and serves it from a single Express app. Page-specific JavaScript uses `js/api.js`; backend functionality is separated by feature into route, controller, and service modules. MongoDB connections and shared Mongoose models are centralized.

## Setup (PowerShell)

Requirements: Node.js 18+ and MongoDB Atlas or a local MongoDB server.

```powershell
Copy-Item .env.example .env
```

Set these values in `.env` (never commit this file):

```text
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<a random secret of at least 32 characters>
PORT=5000
CLIENT_ORIGIN=http://localhost:5000
```

Generate `JWT_SECRET` locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Install and run:

```powershell
npm install
npm run dev
```

Open `http://localhost:5000`. Check `http://localhost:5000/api/health`; it returns `200` only when MongoDB is connected.

For Atlas: create a free cluster and database user, allow only your development IP in Network Access, copy the driver connection string, replace its database name with `skillbridge`, and set the URI in `.env`. Never put Atlas credentials in frontend files or documentation.

## Structure

```text
app.js, server.js
config/db.js
middleware/                 JWT, validation, origin, rate limits, errors
models/                     User, Skill, Mentor, Request, Feedback
modules/{auth,home,explore,skills,mentors,requests,feedback}/
  <feature>.routes.js
  <feature>.controller.js
  <feature>.service.js
js/api.js                   Shared Fetch API configuration
js/<page>.js                Existing page-specific frontend behavior
scripts/seed.js             Idempotent import of existing skills/mentors
tests/api.test.js
```

MongoDB stores users, skills, mentors, requests and feedback in the `skillbridge` database. Requests hold Mongoose references to their learner, skill and optional mentor. Mentor signup creates a linked mentor profile. Password hashes are hidden from queries and never returned. JWTs are held in HttpOnly, SameSite cookies; browser JavaScript keeps only the current page's user display data in memory.

The seed script preserves the existing JSON skill and mentor samples by importing them with stable legacy IDs and `$setOnInsert`. It does not create accounts, fake user requests or feedback. New mentor accounts receive a linked profile; an administrator must be provisioned by an authorized database operator.

To provision an administrator, first register the trusted account through the app. Connect MongoDB Compass or `mongosh` to the same database, select `skillbridge`, and run this update for that account's email:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Only promote a trusted account. Never expose the database URI or use an administrator account for ordinary testing.

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Server/database readiness |
| POST | `/api/auth/register` | Public | Register as learner or mentor |
| POST | `/api/auth/login` | Public | Authenticate and set JWT cookie |
| GET | `/api/auth/me` | Signed in | Read current user |
| POST | `/api/auth/logout` | Signed in | Clear authentication cookie |
| DELETE | `/api/auth/me` | Signed in, password confirmation | Delete the current account and its private requests |
| GET | `/api/auth/users` | Admin | List users without password hashes |
| PATCH | `/api/auth/users/:id/role` | Admin | Change user role |
| GET | `/api/home` | Public | Featured skills, mentor highlights and counts |
| GET | `/api/home/featured-skills` | Public | Featured MongoDB skills |
| GET | `/api/home/statistics` | Public | Database-backed counts |
| GET | `/api/explore/skills` | Public | Search/filter/paginate skills |
| GET | `/api/explore/categories` | Public | Available skill categories |
| GET | `/api/skills`, `/api/skills/:id` | Public | Browse or retrieve a skill |
| POST/PUT/DELETE | `/api/skills[/:id]` | Admin | Manage skills |
| GET | `/api/mentors`, `/api/mentors/:id` | Public | Browse mentors (supports search and expertise filters) |
| GET | `/api/mentors/me` | Mentor | Retrieve linked mentor profile |
| PUT | `/api/mentors/me` | Mentor | Update the signed-in mentor's own profile |
| POST/PUT/DELETE | `/api/mentors[/:id]` | Admin | Manage mentor records |
| POST | `/api/requests` | Signed in | Create request referencing a valid skill and optional mentor |
| GET | `/api/requests/my` | Signed in | Retrieve own requests |
| GET | `/api/requests/assigned` | Mentor/Admin | Retrieve assigned requests |
| GET | `/api/requests` | Admin | Retrieve all requests |
| PATCH | `/api/requests/:id/status` | Assigned mentor/Admin | Persist an allowed status transition |
| POST | `/api/feedback` | Public, rate-limited | Validate and save feedback |
| GET/DELETE | `/api/feedback[/:id]` | Admin | Retrieve or delete feedback |

Public content browsing and feedback submission do not require login. Learning requests require an account. Role checks and request ownership are enforced server-side. Unsafe requests require an exact `Origin` match and a double-submit CSRF token from `GET /api/csrf-token`; the frontend obtains and sends it automatically. JWTs expire after two hours and logout increments a server-side token version to invalidate copied tokens. CORS is restricted to `CLIENT_ORIGIN`; Helmet, input validation, operator-key rejection, origin checks, and authentication/feedback rate limits are enabled.

## Tests and feedback verification

```powershell
npm test
```

Local verification: `npm test` passes all 27 tests, all project JavaScript files pass `node --check`, and `npm audit` reports zero known dependency vulnerabilities. `npm start` was attempted but could not connect to the configured MongoDB server (`MongooseServerSelectionError`). Therefore database connectivity and real signup/login, skill reads, request persistence and feedback persistence are not verified in this environment. Configure Atlas access or a reachable MongoDB instance, then repeat the workflows before treating this as deployment-ready.

With the server running and MongoDB connected, submit a test feedback record from PowerShell:

```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/feedback' -Method Post -Headers @{ Origin = 'http://localhost:5000' } -ContentType 'application/json' -Body (@{
  name = 'Test User'
  email = 'test@example.com'
  rating = 5
  message = 'Testing feedback persistence.'
} | ConvertTo-Json)
```

Verify the saved record in MongoDB Compass under `skillbridge.feedback`; the document includes its submission timestamp. Listing feedback through `GET /api/feedback` is admin-only. To verify via the API, sign in as an admin and fetch that endpoint with the browser session cookie.

The automated API and security tests cover validation, middleware access controls, health reporting, and static-file exposure. Database persistence and full signup/request/feedback flows require a reachable MongoDB instance and are not reported as tested until run against one. See [SECURITY.md](./SECURITY.md) for security controls, test results and known limitations.
