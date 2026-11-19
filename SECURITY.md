# SkillBridge Security

SkillBridge applies layered controls, but it is a prototype and is not guaranteed to be secure. Run the security tests and deployment checks for the exact release environment; MongoDB-backed integration behavior has not been verified without a reachable database.

## Authentication and authorization

- Passwords are hashed with bcryptjs at 12 rounds. The password hash and session token version are excluded from normal Mongoose queries, and public user serializers omit both.
- JWTs expire after two hours and are stored in an HttpOnly, SameSite=Strict cookie. `Secure` is enabled in production. JWT secrets must be generated randomly, kept in environment variables, and never shared with the browser.
- Every protected request verifies the JWT signature and expiry, fetches the user and checks a server-side token version. Logout increments that version, invalidating previously copied tokens.
- Registration allows only the learner or mentor roles. Admin promotion is an operator-only database action; never expose or reuse database operator credentials.
- Learners' requests are queried by their authenticated user ID. Mentor request queries and status changes are scoped to the mentor profile associated with the authenticated user. Admin routes require the admin role.
- Account deletion requires the current password. It runs in a MongoDB transaction, prevents deleting the last administrator, blocks mentor deletion while assigned requests are pending/accepted, detaches historical mentor requests and deletes the user's own requests. The transaction requires a replica set (MongoDB Atlas supports this); there is not currently a deletion UI.
- Successful administrative reads and writes emit actor ID, action, resource ID, status and timestamp to application logs. Configure restricted access and retention for those logs.

## Database access and data handling

- Use a dedicated MongoDB application user with only `readWrite` on the `skillbridge` database. Do not use an Atlas organization, project, cluster or database administrator credential in the app.
- Restrict Atlas Network Access to the deployed application's egress addresses. Production startup requires authenticated MongoDB credentials and TLS (`mongodb+srv` or an explicit TLS option).
- Store `MONGODB_URI` and `JWT_SECRET` in the deployment secret manager or an untracked `.env`; `.env` is ignored by Git. Never place either value in frontend files, browser storage, logs, screenshots or issue reports.
- Mongoose schemas validate records and the user email has a unique index. Routes build database filters from explicitly validated fields; operator-like keys, dotted keys and duplicate query parameters are rejected. Admin create/update services use field allowlists.
- Public mentor serializers omit email addresses and user IDs. Requests sent to a mentor expose only the learner's name, not email. Feedback records can be listed or deleted only by administrators.
- Configure Atlas automated backups/PITR as supported by the selected tier. Keep encrypted exports outside the cluster under restricted access and retention. Test restoration into an isolated staging database before relying on backups. Backups and restores are deployment responsibilities and are not configured or verified by this repository.
- Account deletion removes private user request records; feedback submissions are anonymous and are not currently linked to user accounts. Define retention and deletion obligations for feedback and backups before production use.

## API, browser and deployment controls

- Helmet sets security headers and a Content Security Policy. Scripts are restricted to self; the existing design requires inline styles, so `style-src 'unsafe-inline'` remains enabled. Do not add inline scripts or third-party scripts without reviewing the CSP.
- CORS allows only `CLIENT_ORIGIN`. Unsafe methods require an exact matching `Origin` plus a random double-submit CSRF cookie/header token. Auth cookies use `SameSite=Strict`; the readable CSRF cookie contains no authentication secret.
- Login, registration and feedback writes are rate-limited; learning-request creation is also throttled. Request JSON is limited to 20 KB; validation, safe error responses and duplicate-query/operator-key rejection are active. No file-upload endpoint exists.
- Frontend code builds DOM content using safe text APIs; automated checks reject `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write` in page scripts. Treat any new HTML rendering path as a security-sensitive change.
- Production must terminate HTTPS at a trusted reverse proxy/load balancer, set `NODE_ENV=production`, use an HTTPS `CLIENT_ORIGIN`, provide the MongoDB TLS URI and a random JWT secret, and restrict proxy trust to the configured deployment topology. Do not expose the app directly over plain HTTP.
- Express rate limits use the process's in-memory store. A multi-instance deployment needs a shared rate-limit store; behind a proxy, configure the exact trusted proxy topology so IP-based limits cannot be spoofed or collapsed.
- The health endpoint reports database readiness only. Do not add debug routes or verbose error responses to production. Error logs intentionally omit stack traces, query contents and request bodies; infrastructure operators may need restricted diagnostic tooling.

Generate a secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Set that value as `JWT_SECRET` only in the environment. `.env.example` contains placeholders, not usable credentials.

## Security test results

Run `npm test` for the HTTP middleware, service-level authorization and serializer tests. The latest local run passed 27 tests. They cover missing/invalid/expired JWTs, login cookie flags and logout invalidation, role denial, learner/mentor query scoping, mentor self-profile field allowlisting and authenticated API updates, unauthorized feedback access, privilege escalation validation, duplicate registration and invalid credentials (service branches are mocked), CSRF/origin enforcement, NoSQL-style operator keys, duplicate query parameters, invalid IDs, malformed/oversized bodies, authentication, feedback and learning-request rate limits, password hashing, safe public serializers, CSP/frontend source safety and production environment checks.

The tests that mock Mongoose methods do not establish database-backed isolation or persistence. The latest `npm start` attempt failed with `MongooseServerSelectionError` while connecting to the configured MongoDB server. Therefore registration/login against MongoDB, real duplicate-key races, request/feedback persistence, account deletion transactions, MongoDB authentication/TLS, backups and restoration are **not verified**. Do not treat those checks as passed.

The latest `npm audit` run reported zero known vulnerabilities across dependencies. Rerun the audit before deployment; this is a point-in-time result, not a future guarantee. Configure CI to run tests, dependency audits and secret scanning on changes.

## Known limitations and reporting

- Admin role provisioning is an authorized operator action; it is not exposed as public signup.
- Rate limiting and audit logs are process-local/stdout until configured with shared production services.
- Database integration, Atlas permissions/network policy, transport termination and backup restoration require environment-specific verification.
- No penetration test or external security review has been performed. No claim of complete or 100% security is made.

Report suspected vulnerabilities privately to the repository maintainers using GitHub's private security advisory/reporting feature. Do not include passwords, JWTs, connection strings or unredacted personal data in a report. If private reporting is not enabled for the repository, contact its owners directly before disclosing details publicly.
