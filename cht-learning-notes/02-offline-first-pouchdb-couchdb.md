# Offline-First: PouchDB vs CouchDB

## The Core Concept

CHT is **offline-first** — the browser works without internet by keeping a local copy of data in IndexedDB (via PouchDB). Data syncs to/from CouchDB in the background.

## Two Copies of Data — Always

```
CouchDB (localhost:5984)          PouchDB (Browser IndexedDB)
medic database — ALL data   ←→   _pouch_medic-user-neeraj — neeraj's subset
        81 docs                          fewer docs (filtered)
```

## The Sync Flow

```
User fills form (browser)
        ↓  save immediately
_pouch_medic-user-neeraj  (IndexedDB — instant, offline capable)
        ↓  background replication when online
medic  (CouchDB on localhost:5984 — permanent storage)
        ↓  Sentinel watches changes feed
medic-sentinel  (stores transition processing state)
```

## Filtered Replication — Each User Gets Their Own Subset

When neeraj logs in, CHT does NOT sync all 81 CouchDB docs to his browser.
It syncs only docs neeraj is **allowed to see**:

```
CouchDB medic (81 docs — ALL users)
        ↓  filter: only neeraj's hierarchy
_pouch_medic-user-neeraj (browser)
    ✓ contacts in neeraj's health facility
    ✓ reports for patients under neeraj
    ✓ shared docs: app_settings, resources, forms, translations
    ✗ contacts/reports from other districts
```

## Why No Network Request When Opening a Report?

When you open `localhost:5988/#/reports/some-id`:
- Data is read from **local PouchDB** (IndexedDB) — instant
- No HTTP request visible in Network tab
- PouchDB syncs from CouchDB in the background separately

## IndexedDB Database Names

| IndexedDB name | What it is |
|---|---|
| `_pouch_medic-user-neeraj` | neeraj's local copy of medic DB |
| `_pouch_medic-user-neeraj-meta` | neeraj's local meta DB |
| `_pouch_medic-user-test_user_2` | test_user_2's local copy |
| `_pouch_medic-user-neeraj-mrview-*` | PouchDB view/query indexes (auto-generated) |
| `_pouch_telemetry-2026-5-5-neeraj` | Performance telemetry |

## Querying PouchDB from Browser Console

```js
// Check doc count in neeraj's local DB
window.PouchDB('medic-user-neeraj').info().then(console.log);

// Find all person contacts
window.PouchDB('medic-user-neeraj').find({
  selector: { type: 'person' }
}).then(r => console.log(r.docs));

// Find all reports
window.PouchDB('medic-user-neeraj').find({
  selector: { type: 'data_record' }
}).then(r => console.log(r.docs));

// All docs
window.PouchDB('medic-user-neeraj').allDocs({ include_docs: true })
  .then(r => console.log('Total:', r.total_rows));
```

## Querying CouchDB via Fauxton (localhost:5984)

Fauxton supports **Mango queries** (similar to MongoDB):

```json
// All person contacts
{ "selector": { "type": "person" } }

// All PHQ-9 reports
{ "selector": { "type": "data_record", "form": "phq9" } }

// All reports by neeraj
{ "selector": { "type": "data_record", "reported_by": "neeraj" } }
```

## Summary Table

| | CouchDB (Fauxton) | PouchDB (Browser) |
|---|---|---|
| URL | `localhost:5984` | Browser DevTools console |
| Contains | ALL data (all users) | Only this user's filtered subset |
| Query UI | Mango query in Fauxton | Browser JS console |
| Persistent | Yes (server disk) | Yes (browser IndexedDB) |
| Cleared when | Never (unless deleted) | Browser data cleared |
