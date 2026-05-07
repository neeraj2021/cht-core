# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHT Core is the framework for the [Community Health Toolkit](https://communityhealthtoolkit.org), a digital health platform. It runs as a multi-service application backed by CouchDB, with offline-first mobile/web capabilities and SMS support.

## Key Commands

### Build

```bash
# Full dev build (webapp + static files)
npm run build-dev

# Watch mode for active development
npm run build-dev-watch

# Build and watch just the API
npm run dev-api

# Build and watch just Sentinel
npm run dev-sentinel
```

### Lint

```bash
npm run lint                  # ESLint + blank link check + shellcheck
npm run lint-translations     # Check translation files
```

### Unit Tests

```bash
# Run all unit tests
npm run unit

# Individual suites
npm run unit-webapp           # Angular (karma) + mocha tests
npm run unit-api              # Mocha tests for API
npm run unit-sentinel         # Mocha tests for Sentinel
npm run unit-shared-lib       # All shared-libs workspaces
npm run unit-admin            # Karma tests for admin app

# Run a single API test file
UNIT_TEST_ENV=1 mocha 'api/tests/mocha/path/to/test.js'

# Run a single sentinel test file
UNIT_TEST_ENV=1 mocha 'sentinel/tests/unit/path/to/test.js'

# Run webapp mocha tests (not karma) in specific timezone
TZ=Africa/Monrovia cd webapp && npm run unit:mocha
```

### Integration Tests (API)

Requires Docker for CouchDB:
```bash
npm run integration-api       # Starts CouchDB via docker compose, runs tests, stops CouchDB
```

Or manually:
```bash
./api/tests/integration/couch-start.sh
COUCH_URL=http://admin:pass@localhost:5984/medic mocha --config ./api/tests/integration/.mocharc.js
./api/tests/integration/couch-stop.sh
```

### E2E Tests (WebdriverIO)

```bash
npm run wdio-local            # Build images + run default e2e tests
```

## Architecture Overview

The application is composed of these main services:

### `webapp/`
An **Angular 20** single-page application (with NgRx state management) that serves as the primary user interface. Key architectural patterns:
- **Path aliases**: `@mm-services/*`, `@mm-components/*`, `@mm-modules/*`, `@mm-reducers/*`, `@mm-selectors/*`, `@mm-effects/*`, etc. map to `src/ts/<category>/`
- **State management**: NgRx store with slices for `global`, `contacts`, `reports`, `messages`, `tasks`, `analytics`, `targetAggregates`, `services`
- **Modules**: Feature modules under `src/ts/modules/` — `contacts`, `reports`, `messages`, `tasks`, `analytics`, `trainings`, etc.
- **Offline-first**: Uses PouchDB locally, syncing with CouchDB on the server
- **Enketo**: XForms-based form rendering via `enketo-core`
- **`cht-datasource` integration**: Uses `getLocalDataContext` or `getRemoteDataContext` depending on online/offline mode

### `api/`
A **Node.js/Express** backend service that:
- Proxies requests to CouchDB with authorization middleware
- Exposes REST endpoints for users, contacts, forms, exports, messaging, etc.
- Manages migrations, config, and CouchDB design docs
- Uses `@medic/cht-datasource` with `getLocalDataContext` (via `api/src/services/data-context.js`) for data access
- Integration tests require a live CouchDB instance (see `api/tests/integration/compose.yml`)

### `sentinel/`
A **Node.js** background worker that watches the CouchDB changes feed and runs **transitions** (document processing rules). Key files:
- `src/lib/feed.js` — listens to CouchDB changes
- `src/transitions.js` — orchestrates transition loading
- Transitions are defined in `shared-libs/transitions/src/transitions/` and cover: registration, muting, death reporting, scheduled messages, outbound push, etc.

### `shared-libs/`
npm workspaces under the root package. Key libraries:
- **`cht-datasource`** — TypeScript library providing a unified API for CHT data (Person, Place, Contact, Report, Target). Supports both local (PouchDB) and remote (HTTP) data contexts.
- **`rules-engine`** — Task and target calculation engine using nools rules
- **`transitions`** — Document processing transitions (shared between sentinel and API)
- **`lineage`** — Hydrates/minifies CouchDB document lineage
- **`settings`** — Reads app settings from CouchDB
- **`logger`** — Winston-based logging
- **`contacts`**, **`user-management`**, **`search`**, **`phone-number`**, **`message-utils`**, etc.

### `admin/`
An older **AngularJS** (1.x) app for administrative configuration (accessed at `/admin`). Uses Karma for tests.

### `ddocs/`
CouchDB design documents organized by database (`medic-db/`, `sentinel-db/`, `users-db/`, etc.). Compiled during build.

### `config/`
Default and example app configurations (`default/`, `demo/`, `covid-19/`). Each has its own test suite using `cht-conf-test-harness`.

## Database Structure

- **`medic`** — Primary database: contacts, reports, forms, settings, translations, branding
- **`medic-sentinel`** — Sentinel metadata (infodocs, transition state)
- **`medic-users-meta`** — User activity telemetry
- **`_users`** — CouchDB user accounts
- **`medic-logs`** — Application logs

## Commit Convention

Commits use [Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint`. Examples:
```
feat(#issue): short description
fix(#issue): short description
chore: short description
```

## Code Patterns

- **UNIT_TEST_ENV=1**: Set this env var when running unit tests — it stubs out the CouchDB connections in `api/src/db.js` and `sentinel/src/db.js`
- **`TZ=UTC`**: Both API and Sentinel run with `TZ=UTC` in development; webapp mocha tests run across multiple timezones
- **Shared libs** are referenced as `@medic/<lib-name>` — the root `package.json` defines workspaces pointing to `./shared-libs/*`
- **`cht-datasource`** must be built before other packages: `npm run --prefix shared-libs/cht-datasource build`
- The **admin app** uses AngularJS (1.x), not Angular — it has a different test runner (Karma via `scripts/ci/run-karma.js`)
