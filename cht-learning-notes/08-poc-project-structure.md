# CHT POC Project Structure

## What is the POC Project?

The POC (Proof of Concept) repo is a **CHT configuration project** — it contains only forms, settings, and resources. It has NO app code. It deploys configuration to a running CHT Core instance.

## Folder Structure

```
cht-poc/
├── forms/
│   └── app/
│       ├── phq9.xlsx        ← XLSForm source (you edit this)
│       ├── phq9.xml         ← Generated XForm (auto-generated, don't edit)
│       └── phq9.properties.json  ← Form metadata (title, icon, subject)
├── resources/               ← Images and icons
├── resources.json           ← Resource manifest
├── app_settings.json        ← App configuration
├── contact-summary.js       ← Contact page summary logic
├── targets.js               ← Health targets/goals
└── package.json             ← npm scripts
```

## npm scripts in POC

```json
{
  "convert": "cht convert-app-forms",
  "upload-forms": "cht upload-app-forms"
}
```

Usage:
```bash
npm run convert       # xlsx → xml
npm run upload-forms  # xml → CouchDB
```

## .properties.json File

Controls how the form appears in the CHT app:

```json
{
  "title": "PHQ-9 Mental Health Assessment",
  "icon": "icon-healthcare-assessment",
  "subject_key": "patient_name",
  "hidden_fields": ["inputs"]
}
```

| Field | Purpose |
|---|---|
| `title` | Form name shown in UI |
| `icon` | Icon shown next to form |
| `subject_key` | Which field to use as report subject/patient name |
| `hidden_fields` | Groups hidden from report display (e.g. `inputs`) |

## The `inputs` Group Convention

CHT forms always have a special `inputs` group at the top:

```
begin group  inputs
  hidden     source        (always 'user')
  hidden     source_id
  begin group  contact
    string   _id           (contact picker — appearance: select-contact type-person)
    hidden   name
    hidden   patient_id
    hidden   date_of_birth
    ...
  end group
end group
```

- `inputs` group is always **hidden** from the report display (`hidden_fields: ['inputs']`)
- The `contact` subgroup is auto-populated when user selects a patient
- After the inputs group, `calculate` fields copy values out:
  ```
  calculate  patient_name    calculation: ../inputs/contact/name
  calculate  patient_uuid    calculation: ../inputs/contact/_id
  ```

## Form Upload to CouchDB

When you run `cht upload-app-forms`, the form is saved as:
```json
{
  "_id": "form:phq9",
  "type": "form",
  "_attachments": {
    "phq9.xml": { "content_type": "application/xml", "data": "..." },
    "phq9.properties.json": { "content_type": "application/json", "data": "..." }
  }
}
```

## Report Document Structure After Submission

```json
{
  "_id": "a628b9bc-f116-47f0-a356-78366678c2bc",
  "type": "data_record",
  "form": "phq9",
  "reported_date": 1746441234567,
  "contact": {
    "_id": "contact-uuid",
    "name": "Marijjjj",
    "phone": "+13432343234"
  },
  "fields": {
    "patient_name": "Marijjjj",
    "total_score": "7",
    "severity_category": "Mild",
    "group_summary": {
      "lbl_score_val": "7",
      "lbl_severity_val": "Mild"
    }
  }
}
```

`doc.fields` keys come directly from the `name` column in xlsx survey sheet.

## Workflow for Form Changes

```bash
# 1. Edit phq9.xlsx in LibreOffice/Excel

# 2. Convert to XML
npm run convert

# 3. Upload to CouchDB
npm run upload-forms

# 4. Hard refresh browser (Ctrl+Shift+R)
# Wait for PouchDB sync or clear IndexedDB

# 5. Submit a new form to test
# (old submissions won't have new fields)
```
