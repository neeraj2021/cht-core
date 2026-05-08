# CHT Hierarchy Explorer Tool

A single-file web app for visually exploring the CHT hierarchy from any CouchDB doc ID.

**File:** `cht-core/hierarchy_ui/index.html`  
**Serve with:** `cd cht-core/hierarchy_ui && python3 -m http.server 8090`  
**Open at:** `http://localhost:8090`

---

## Features

| Feature | How it works |
|---------|-------------|
| Search by ID | Enter any doc ID → fetches that doc, builds subtree downward + breadcrumb upward |
| Empty search | Leave blank → loads all `district_hospital` roots + full tree for each |
| Ancestry breadcrumb | Shows parent chain above the searched node; each crumb is clickable |
| Collapse/expand | Every branch has a toggle button to hide/show children |
| Searched node highlight | Amber outline + "Searched" badge on the matching card; auto-scrolls to it |
| Role chip | Each card shows the person's `role` field as a grey chip on the right |
| Copy ID | Clipboard icon on every card ID; also in sidebar header |
| Click card → sidebar | Slide-in panel with full doc details |
| Sidebar: Formatted view | Key-value rows; nested objects collapsible with `show` toggle |
| Sidebar: Raw JSON | Syntax-highlighted JSON (toggle between views) |
| Associated Contact | For place docs with a `contact._id`, fetches and shows the linked person's details in the sidebar; click to navigate to that person |

---

## How `contact` Field Works on Place Docs

Every place type (`district_hospital`, `health_center`, `clinic`) can have a linked primary contact person:

```json
{
  "_id": "03eb8926-...",
  "type": "district_hospital",
  "name": "TN Health Facility",
  "contact": {
    "_id": "784edf27-..."    ← _id of the linked person doc
  }
}
```

- `contact` is either `{ "_id": "..." }` (linked) or `""` (empty string = no contact)
- Always fetch the full person doc separately using `contact._id` — the place doc only stores the reference
- The linked person is typically the facility head, CHW supervisor, or household head depending on the place type

---

## CouchDB CORS Setup (one-time)

Required for the browser to call CouchDB directly from `localhost:8090`:

```bash
AUTH='-H "Authorization: Basic bWVkaWM6cGFzc3dvcmQ="'

curl -X PUT http://127.0.0.1:5984/_node/_local/_config/httpd/enable_cors \
  -H 'Authorization: Basic bWVkaWM6cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json' -d '"true"'

curl -X PUT http://127.0.0.1:5984/_node/_local/_config/cors/enable \
  -H 'Authorization: Basic bWVkaWM6cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json' -d '"true"'

curl -X PUT http://127.0.0.1:5984/_node/_local/_config/cors/origins \
  -H 'Authorization: Basic bWVkaWM6cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json' -d '"*"'

curl -X PUT http://127.0.0.1:5984/_node/_local/_config/cors/methods \
  -H 'Authorization: Basic bWVkaWM6cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json' -d '"GET, POST, PUT, DELETE, OPTIONS"'

curl -X PUT http://127.0.0.1:5984/_node/_local/_config/cors/headers \
  -H 'Authorization: Basic bWVkaWM6cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json' -d '"Accept, Authorization, Content-Type, Origin"'
```

These settings persist in CouchDB config — only needed once per CouchDB instance.

---

## Credentials

| | |
|--|--|
| Username | `medic` |
| Password | `password` |
| Base64 | `bWVkaWM6cGFzc3dvcmQ=` |

To change: update `const AUTH = 'Basic <base64>'` in the `<script>` section.  
Generate: `echo -n "username:password" | base64`

---

## How the Tree Is Built

```
1. fetchDoc(id)                     → get the root doc
2. fetchAncestors(doc)              → walk doc.parent._id chain upward
3. buildSubtree(doc)                → recursively fetchChildren(id) downward
     fetchChildren uses _find with selector: { "parent._id": id }
     stops recursing when type === "person" (leaf node)
4. Render breadcrumb (ancestors) + tree (subtree)
5. If id === '' → fetchAllRoots() first, then buildSubtree for each
```

All fetched docs are cached in `docCache{}` — re-clicking the same card doesn't re-fetch.

---

## Quick Test IDs

```
019dfc17-771b-7cce-af60-d7a104b75935  →  TN Health Facility   (district_hospital, full tree root)
019dfc18-11ff-7cce-af60-e77996975e13  →  TN Health Center 1   (health_center)
019dfc18-97ad-7cce-af60-e9e9cd5fbe46  →  TN Health Area 1     (clinic)
```
