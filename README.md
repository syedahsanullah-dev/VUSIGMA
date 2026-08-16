# VU SIGMA — Software Engineering Documentation

## 1. Project Overview

VU SIGMA is a Next.js-based educational platform for Virtual University students. The application supports browsing subjects, practicing quizzes, reviewing past paper content, and managing academic materials through a dedicated admin control plane.

The system is organized around three primary concerns:

- Public learning experience for students
- Admin content workflow for quizzes, subjects, blogs, and question sets
- API-backed persistence and server-side authentication

## 2. Product Scope

### User-facing capabilities

- Subject catalog and subject detail pages
- Practice workflow for quiz-based learning
- Blog and informational pages
- Student authentication and registration
- Conditional access to role-based features

### Administrative capabilities

- Dashboard overview and analytics
- Blog management
- Subject / quiz / question management
- Schema and database inspection utilities
- Content audit and publication review
- Settings and activity logging

## 3. System Architecture

The project follows a server-rendered App Router architecture with a hybrid frontend and API design.

### Core architecture layers

1. Presentation layer
   - App Router pages under `app/`
   - Reusable UI in `components/`
   - Client-side state through Zustand stores in `store/`

2. API layer
   - Route handlers under `app/api/`
   - Server-side authorization and business logic
   - MongoDB-backed persistence operations

3. Data layer
   - Mongoose models under `models/`
   - Connection management in `lib/db.js`
   - Domain enums in `lib/enums.js`

4. Shared infrastructure
   - Authentication utilities in `lib/auth.js`
   - HTTP client wrapper in `lib/api.js`
   - Security and sanitization helpers in `utils/securitySanitizer.js`

## 4. Technology Stack

### Runtime and framework

- Next.js 16.2.12
- React 19.2.4
- Node.js-compatible server runtime

### Data and state

- MongoDB via Mongoose 9.x
- Zustand for client state
- Axios for API transport

### Security and auth

- JWT-based authentication
- Cookie-based token persistence
- Password hashing with `bcryptjs`
- Input sanitization utilities for XSS protection

### UI and styling

- Tailwind CSS
- Lucide icons
- `react-hot-toast` for notifications

## 5. Repository Structure

### App entry points

- `app/` — route-based pages and API handlers
- `components/` — shared UI components for public and admin workflows
- `lib/` — core service utilities, API wrappers, auth, analytics, database helpers
- `models/` — MongoDB schema definitions
- `store/` — Zustand state management
- `utils/` — audit logging, sanitization, schema validation, quiz processing helpers

### Main domain models

- `models/User.js` — user identity and role model
- `models/Subject.js` — academic subject definition
- `models/Quiz.js` — quiz metadata and grouping
- `models/Question.js` — question bank entries
- `models/Blog.js` — blog/article documents
- `models/AuditLog.js` — action provenance and traceability
- `models/Setting.js` — runtime configuration and key-value settings

## 6. Runtime Flow

### Request lifecycle

1. A browser request hits the Next.js App Router.
2. Public pages render server or client components depending on the route.
3. Client pages call API routes through the shared Axios client.
4. API routes connect to MongoDB, validate auth, and apply domain logic.
5. Response data is normalized and returned as JSON or rendered UI state.

### Authentication flow

- A user logs in through `/api/auth`.
- Server validates email and password.
- A JWT is signed using `JWT_SECRET`.
- The token is returned to the client and stored in a secure cookie.
- Protected routes read the token from the cookie or Authorization header.

## 7. Public and Admin Separation

The application is separated into two major UI areas:

- Public site routes such as `/`, `/subjects`, `/blog`, `/practice`, `/login`, `/signup`
- Admin area under `/admin` with role-gated screens for internal operations

The `ClientLayoutWrapper` component ensures that the public layout includes the navigation and footer, while the admin view renders independently with a dedicated layout shell.

## 8. API Surface Summary

### Authentication endpoints

- `POST /api/auth` — login or register
- `DELETE /api/auth` — logout
- `POST /api/admin/auth` — privileged admin sign-in

### Subject management

- `GET /api/subjects` — list active subjects and derived counts
- `POST /api/subjects` — create a subject
- `GET /api/subjects/[code]` — retrieve subject details
- `PUT /api/subjects/[code]` — update a subject
- `DELETE /api/subjects/[code]` — remove a subject

### Quiz and question orchestration

- `GET /api/quizzes` and `POST /api/quizzes`
- `GET /api/quizzes/[id]` and `PUT /api/quizzes/[id]`
- `GET /api/questions` and `POST /api/questions`
- `GET /api/questions/[id]` and `PUT /api/questions/[id]`
- `POST /api/questions/bulk` — bulk import / transformation workflow

### Blog and analytics endpoints

- `GET /api/blogs` and `POST /api/blogs`
- `GET /api/blogs/[slug]` and `PUT /api/blogs/[slug]`
- `GET /api/analytics` for analytics data
- `GET /api/audit` for audit visibility

## 9. Security Model

The app implements a basic but practical security posture:

- JWT signing and verification for session handling
- Password hashing before persistence
- Authorization checks on sensitive route handlers
- Sanitization for content snippets and question payloads
- Env-based secret management with local `.env*` files excluded from git

### Important security controls

- `lib/auth.js` provides token creation and token verification.
- `utils/securitySanitizer.js` strips unsafe HTML and JavaScript patterns from user-posed content.
- `lib/api.js` automatically adds the auth token to outgoing requests when present.

## 10. Environment and Configuration

The application expects configuration values from environment variables. The sample shape is documented in `exampleenv`.

### Required environment variables

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — signing secret for token validation
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — admin bootstrap credentials
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics measurement ID
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — AdSense client identifier
- `NEXT_PUBLIC_API_BASE_URL` — base client-side API URL

### Deployment note

The repository intentionally avoids committing local secrets. Environment variables should be managed through secure deployment environment settings or a local `.env.local` file outside the public repository.

## 11. State Management

The frontend uses Zustand stores to keep lightweight app state:

- `store/useAuthStore.js` — authentication and session state
- `store/useQuizStore.js` — subject list fetch / cache behavior
- `store/useThemeStore.js` — UI theme state

This keeps the client-side state separate from the server API and reduces prop-drilling in route components.

## 12. Operational Notes

### Development workflow

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## 13. Quality and Reliability Considerations

The current project demonstrates a feature-complete prototype structure with several strengths:

- Clear route-based organization
- Strong separation between public and admin UI
- Domain-driven Mongoose schemas
- API routes that centralize business rules

However, it also has engineering gaps that should be addressed for production maturity:

- Automated test coverage is limited
- There is no formal CI/CD pipeline in the repository
- Some admin flows rely on direct client-side orchestration and may benefit from stronger server-side validation
- Production environment hardening should be added around secrets, role checks, and error normalization

## 14. Recommended Next-Step Improvements

For a production-grade release, the team should prioritize:

1. Add unit and integration tests for auth, subjects, and quiz flows.
2. Introduce a formal CI pipeline for linting, build validation, and test execution.
3. Centralize validation using shared schema validators and stronger route guards.
4. Add structured logging and operational monitoring for API failures.
5. Harden the admin section with clear permission boundaries and audit policy enforcement.

## 15. Conclusion

VU SIGMA is a content-rich academic platform built on Next.js and MongoDB. Its architecture is well-suited to a learning portal with admin content operations, strong route separation, and a straightforward API-driven data model. The repository is already organized for scale, but it would benefit from test automation, security hardening, and release pipeline automation before being treated as a production-grade enterprise system.
