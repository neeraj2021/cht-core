# CHT Learning Notes — Index

Notes from exploring the CHT Core codebase and building a PHQ-9 form.

## Files

| # | File | Topic |
|---|---|---|
| 01 | [01-cht-architecture-overview.md](01-cht-architecture-overview.md) | Overall system: webapp, API, CouchDB, Sentinel |
| 02 | [02-offline-first-pouchdb-couchdb.md](02-offline-first-pouchdb-couchdb.md) | How PouchDB ↔ CouchDB sync works, filtered replication |
| 03 | [03-report-page-data-flow.md](03-report-page-data-flow.md) | How /#/reports/:id loads data (Angular → PouchDB) |
| 04 | [04-xlsform-to-ui-flow.md](04-xlsform-to-ui-flow.md) | xlsx → xml → form UI → doc.fields pipeline |
| 05 | [05-cht-conf-cli.md](05-cht-conf-cli.md) | cht-conf CLI: convert, upload, how it connects to CouchDB |
| 06 | [06-enketo-form-rendering.md](06-enketo-form-rendering.md) | How Enketo renders XML, select-contact widget, output vs calculate |
| 07 | [07-ngrx-angular-flow.md](07-ngrx-angular-flow.md) | NgRx actions → effects → services → store flow |
| 08 | [08-poc-project-structure.md](08-poc-project-structure.md) | POC repo structure, inputs group, form submission doc shape |
| 09 | [09-tasks.md](09-tasks.md) | What tasks are, tasks.js schema, simple/complex examples, deploy & test |

## Quick Reference

### Most Important Concepts

1. **No network request on report page** → data is in local PouchDB (IndexedDB), not fetched via HTTP
2. **`calculate` type is the ONLY way to save computed values** → `note` and `<output>` only display, don't save
3. **`doc.fields` = what you see on report page** → comes from XForm field `name` column
4. **cht-conf talks directly to CouchDB** → not via CHT API REST endpoints
5. **Each user has their own filtered PouchDB copy** → `_pouch_medic-user-{username}`

### Key File Locations in CHT Core

```
webapp/src/ts/
├── effects/reports.effects.ts              — NgRx effects for reports
├── services/
│   ├── db.service.ts                       — PouchDB instance
│   ├── lineage-model-generator.service.ts  — fetch doc from PouchDB
│   ├── report-view-model-generator.service.ts — build report model
│   ├── format-data-record.service.ts       — format doc.fields for UI
│   └── select2-search.service.ts           — contact picker search
├── modules/reports/
│   ├── reports.routes.ts                   — /#/reports/:id route
│   └── reports-content.component.ts        — report detail component
└── js/enketo/widgets/
    └── db-object-widget.js                 — select-contact dropdown widget
```
