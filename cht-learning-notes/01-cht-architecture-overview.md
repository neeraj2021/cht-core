# CHT Architecture Overview

## What is CHT?

Community Health Toolkit (CHT) is a digital health platform for community health workers. It runs as a **multi-service application** with offline-first mobile/web capabilities.

## Main Services

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Angular)                 │
│         webapp/ — Angular 20 SPA + NgRx             │
│         Uses PouchDB (IndexedDB) locally            │
└────────────────────┬────────────────────────────────┘
                     │ HTTP (sync only)
┌────────────────────▼────────────────────────────────┐
│                  API (Node.js/Express)               │
│         api/ — REST endpoints + auth proxy          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  CouchDB (Database)                  │
│         localhost:5984 — document store             │
└────────────────────┬────────────────────────────────┘
                     │ watches changes feed
┌────────────────────▼────────────────────────────────┐
│                 Sentinel (Node.js worker)            │
│         Background doc processing (transitions)     │
└─────────────────────────────────────────────────────┘
```

## CouchDB Databases

| Database | Purpose |
|---|---|
| `medic` | Everything: contacts, reports, forms, settings, translations |
| `medic-sentinel` | Sentinel metadata (transition state per doc) |
| `medic-user-{username}-meta` | Read receipts, telemetry per user |
| `medic-users-meta` | Aggregate user meta |
| `_users` | CouchDB user accounts (login credentials) |
| `medic-audit` | Audit log of all changes |

## Key Ports

| Port | Service |
|---|---|
| `5988` | CHT webapp (via API/nginx) |
| `5984` | CouchDB directly (Fauxton UI) |

## Tech Stack

- **Frontend**: Angular 20, NgRx (state management), PouchDB, Enketo (forms)
- **Backend**: Node.js, Express
- **Database**: CouchDB (server), PouchDB (browser IndexedDB)
- **Forms**: XLSForm → XForm XML → Enketo renders in browser
