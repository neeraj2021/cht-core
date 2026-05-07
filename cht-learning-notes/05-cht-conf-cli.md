# cht-conf CLI Tool

## What is cht-conf?

`cht-conf` is an npm package that provides the `cht` CLI binary. It's used to deploy configuration (forms, resources, translations, app settings) to a running CHT instance.

## Installation

```bash
npm install -g cht-conf
# or locally in project
npm install cht-conf
```

## Common Commands

```bash
# Convert XLSForm xlsx → XForm xml
cht convert-app-forms

# Upload forms to CouchDB
cht upload-app-forms

# Convert + upload in one step
cht convert-app-forms upload-app-forms

# Upload resources (images, icons)
cht upload-resources

# Upload app settings
cht upload-app-settings

# Upload everything
cht --local
```

## How cht-conf Connects to CHT

cht-conf connects **directly to CouchDB** via PouchDB HTTP adapter — it does NOT go through the CHT API.

```js
// node_modules/cht-conf/src/lib/db.js
return new PouchDB(environment.apiUrl, { session: environment.sessionToken });
// apiUrl = 'http://medic:password@localhost:5988/medic'
```

```
cht CLI
  ↓  PouchDB HTTP adapter
localhost:5988/medic  (CouchDB proxied via API)
  ↓  stored as CouchDB document
medic database
```

## Upload Flow for Forms

```
phq9.xlsx
  ↓  cht convert-app-forms
phq9.xml  (generated locally)
  ↓  cht upload-app-forms
CouchDB: doc { _id: 'form:phq9', _attachments: { 'phq9.xml': ... } }
  ↓  PouchDB sync
Browser IndexedDB
  ↓  Enketo reads form from local PouchDB
Form rendered at /#/reports/add/phq9
```

## Upload Flow for Resources

```
resources/          (folder with images/icons)
resources.json      (manifest file)
  ↓  cht upload-resources
CouchDB: doc { _id: 'resources', _attachments: { ... } }
```

Code reference:
- `node_modules/cht-conf/src/fn/upload-resources.js` — action handler
- `node_modules/cht-conf/src/lib/upload-configuration-docs.js` — builds + saves CouchDB doc
- `shared-libs/constants/src/index.js:8` — `RESOURCES: 'resources'` (the doc _id)

## Common Errors

### "Missing calculation" error
```
Error: Could not convert phq9.xlsx: [row : 49] Missing calculation
```
**Cause**: A row has `type: calculate` but the `calculation` column is empty.
**Fix**: Add a value in the `calculation` column for every `calculate` type row.

### Authentication error
**Cause**: Wrong credentials in cht-conf config.
**Fix**: Check `~/.chtrc` or the `--url` flag.

## POC Project Commands

In the CHT POC project:
```bash
npm run convert       # runs cht convert-app-forms
npm run upload-forms  # runs cht upload-app-forms
```
