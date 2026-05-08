# CHT Hierarchy & Contact Types

Source: https://docs.communityhealthtoolkit.org/design/mapping-hierarchy/

## The 4-Level Hierarchy

```
Level 0 (Root):  district_hospital   ← "Health Facility"
                        |
Level 1:         health_center       ← "CHW Area"
                        |
Level 2:         clinic              ← "Household"
                        |
Level 3 (Leaf):  person              ← Individual People
```

- **Administrator** is a special role that operates *outside* the hierarchy — system-wide access, not assigned to any specific place.
- All people registered in the app **must** be associated with a place.
- The hierarchy can be extended with more levels for specific implementations.

---

## ER Diagram

```
┌──────────────────────┐
│   district_hospital  │   ← Root place (no parent)
│──────────────────────│
│ _id (PK)             │
│ type = "district_    │
│         hospital"    │
│ name                 │
│ parent: null/""      │◄──── Top of hierarchy
│ contact._id ─────────┼──┐  (linked person = facility head)
└──────────────────────┘  │
           │ 1            │
           │ has many     │
           ▼ *            │
┌──────────────────────┐  │
│    health_center     │  │   ← CHW Supervisor's area
│──────────────────────│  │
│ _id (PK)             │  │
│ type = "health_      │  │
│         center"      │  │
│ name                 │  │
│ parent._id ──────────┼──┼──► district_hospital._id
│ contact._id ─────────┼──┤   (linked person = CHW supervisor)
└──────────────────────┘  │
           │ 1            │
           │ has many     │
           ▼ *            │
┌──────────────────────┐  │
│       clinic         │  │   ← Household / Family
│──────────────────────│  │
│ _id (PK)             │  │
│ type = "clinic"      │  │
│ name                 │  │
│ parent._id ──────────┼──┼──► health_center._id
│ contact._id ─────────┼──┤   (linked person = household head)
└──────────────────────┘  │
           │ 1            │
           │ has many     │
           ▼ *            │
┌──────────────────────┐  │
│        person        │◄─┘   ← Community member / CHW / Nurse
│──────────────────────│
│ _id (PK)             │
│ type = "person"      │
│ name                 │
│ phone                │
│ parent._id ──────────┼──────► clinic._id  (or health_center or
└──────────────────────┘                      district_hospital)
           │ *
           │ linked via facility_id
           ▼ 1
┌──────────────────────┐
│   _users (CouchDB)   │   ← SEPARATE DATABASE
│──────────────────────│
│ _id (PK)             │
│ name (username)      │
│ roles[]              │   ← ["chw"], ["chw_supervisor"], ["admin"]
│ facility_id[] ───────┼──────► place._id  (their assigned place)
└──────────────────────┘
```

---

## Where Is the Hierarchy Stored?

| What | Database | Doc `type` field |
|------|----------|-----------------|
| Places (district_hospital, health_center, clinic) | `medic` | `"district_hospital"`, `"health_center"`, `"clinic"` |
| People (members, CHWs, nurses) | `medic` | `"person"` |
| Reports / submitted forms | `medic` | `"data_record"` |
| User accounts + roles + facility assignment | `_users` | CouchDB user docs |
| Sentinel processing state | `medic-sentinel` | infodocs |

**Key insight:** All hierarchy documents (places + people) live in a single flat CouchDB collection in the `medic` database. There are no separate tables — the `type` field distinguishes them.

---

## CouchDB Queries

### Find all place documents (top-level facilities)
```bash
curl -s "http://medic:password@localhost:5984/medic/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {"type": "district_hospital"},
    "fields": ["_id","type","name","parent","contact"]
  }'
```

### Find all place types at once
```bash
curl -s "http://medic:password@localhost:5984/medic/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {"type": {"$in": ["district_hospital","health_center","clinic","person"]}},
    "fields": ["_id","type","name","parent","contact"],
    "limit": 50
  }'
```

### Find all users with their roles and assigned facility
```bash
curl -s "http://medic:password@localhost:5984/_users/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {"type": "user"},
    "fields": ["_id","name","roles","facility_id"]
  }'
```

### Find all health_centers under a specific district_hospital
```bash
curl -s "http://medic:password@localhost:5984/medic/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {
      "type": "health_center",
      "parent._id": "<district_hospital_id>"
    },
    "fields": ["_id","name","parent","contact"]
  }'
```

### Find all persons under a specific clinic (household)
```bash
curl -s "http://medic:password@localhost:5984/medic/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {
      "type": "person",
      "parent._id": "<clinic_id>"
    },
    "fields": ["_id","name","phone","parent"]
  }'
```

---

## Roles Mapped to Hierarchy Levels

```
national_admin    ──  Above all levels (system-wide, online only)
program_officer   ──  district_hospital level (online)
crfo              ──  district_hospital level (online)
chw_supervisor    ──  health_center level     (offline capable)
chw               ──  clinic level            (offline capable)
data_entry        ──  data entry only
analytics         ──  read-only analytics
gateway           ──  SMS gateway
```

Roles are defined in `app_settings.json` → `roles` key.  
Offline roles (`chw`, `chw_supervisor`) get a filtered PouchDB replication to their device.

---

## How the Parent Reference Works (Denormalized Lineage)

Every place/person document stores the full parent **chain** inline:

```json
{
  "_id": "019dfc18-11ff-7cce-...",
  "type": "health_center",
  "name": "TN Health Center 1",
  "parent": {
    "_id": "019dfc17-771b-7cce-...",
    "parent": {
      "_id": null
    }
  },
  "contact": {
    "_id": "019dfc1f-bcf4-7881-..."
  }
}
```

- Only `_id` is stored in the parent reference (not the full doc)
- The full lineage chain is embedded so offline clients don't need extra fetches
- Managed by the `@medic/lineage` shared-lib at `shared-libs/lineage/`
- Hydrating (filling in full parent docs) vs minifying (storing only `_id`) is the lineage lib's job

---

## Config Source Files

| File | Purpose |
|------|---------|
| `config/default/app_settings.json` → `contact_types[]` | Defines types + parent relationships |
| `config/default/forms/contact/place-types.json` | Maps type IDs to display names |
| `shared-libs/cht-datasource/src/place.ts` | TypeScript API for querying places |
| `shared-libs/cht-datasource/src/person.ts` | TypeScript API for querying persons |
| `shared-libs/lineage/` | Hydrate/minify parent lineage chains |

---

## Live Data in This Dev Instance

From CouchDB queries on `localhost:5984`:

```
district_hospital (3):
  - TN Health Facility
  - 's Health Facility  (x2 test entries)

health_center (1):
  - TN Health Center 1  → parent: TN Health Facility

clinic (1):
  - TN Health Area 1    → parent: TN Health Center 1

person (7):
  - TN Program Officer
  - TN CHW SuperWiser
  - Marijjjjj
  - (+ 4 more)

Users (_users DB):
  - neeraj         → role: chw           → facility: clinic
  - neeraj_chw_sw  → role: chw_supervisor → facility: health_center
  - test_user_2    → role: chw           → facility: district_hospital
  - medic          → role: admin
```
