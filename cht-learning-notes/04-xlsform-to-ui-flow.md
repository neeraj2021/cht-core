# XLSForm → XML → UI Flow

## The Complete Pipeline

```
phq9.xlsx  (you edit this)
    ↓  npm run convert  (cht-conf tool)
phq9.xml   (generated XForm)
    ↓  npm run upload-forms  (cht-conf pushes to CouchDB)
CouchDB medic database
    ↓  PouchDB sync
Browser IndexedDB
    ↓  Enketo renders
Form UI at localhost:5988/#/reports/add/phq9
    ↓  User fills + submits
doc.fields saved in CouchDB/PouchDB
    ↓  Report page reads doc.fields
Report displayed at localhost:5988/#/reports/:id
```

## XLSForm Structure (the .xlsx file)

An XLSForm has these sheets:

### `survey` sheet — defines all fields
| Column | Purpose |
|---|---|
| `type` | Field type: `string`, `integer`, `calculate`, `begin group`, `end group`, `hidden`, `select_one`, `note` |
| `name` | Field name → becomes the key in `doc.fields` |
| `label` | Text shown to user during form filling |
| `calculation` | XPath expression (only for `calculate` type) |
| `relevant` | Show/hide condition (XPath expression) |
| `required` | Validation: `true()` or condition |
| `appearance` | UI hint: `field-list`, `select-contact type-person`, `multiline`, `hidden` |
| `constraint` | Validation rule |
| `default` | Default value |
| `instance::tag` | Set to `hidden` to hide field from report display |

### `choices` sheet — dropdown options
| Column | Purpose |
|---|---|
| `list_name` | Group name, referenced in survey as `select_one list_name` |
| `name` | Stored value |
| `label` | Display text |

### `settings` sheet — form metadata
| Column | Purpose |
|---|---|
| `form_title` | Display name |
| `form_id` | URL slug (e.g. `phq9`) |
| `default_language` | `en` |
| `style` | `pages` (multi-page) or blank (single page) |

## Field Types Explained

| type | What it does |
|---|---|
| `string` | Text input |
| `integer` | Number input |
| `calculate` | **No UI shown** — computes value via XPath, saves to `doc.fields` |
| `note` | Display-only text, NOT saved |
| `hidden` | Like `string` but hidden from UI, value can be pre-filled |
| `select_one list_name` | Dropdown from choices sheet |
| `begin group / end group` | Groups fields together |

## Critical: `calculate` vs `note` vs `<output>`

### `calculate` type — SAVES to doc.fields ✓
```
type: calculate
name: total_score
calculation: /data/q1 + /data/q2 + /data/q3
```
→ `doc.fields.total_score = "7"` (saved in CouchDB)

### `note` type — Display only, NOT saved ✗
```
type: note
name: some_label
label: Your score is ${total_score}
```
→ Shows during form filling, nothing saved to doc.fields

### `<output value="..."/>` in label — Display only, NOT saved ✗
```xml
<label>Score: <output value="/data/total_score"/></label>
```
→ Shows during form filling, nothing saved to doc.fields

**Rule: The ONLY way to persist a computed value is `calculate` type with a `calculation` column.**

## XPath Reference Syntax

In the `calculation` column, reference other fields using XPath:

```
/data/fieldname              — absolute path from root
../sibling_field             — relative path (sibling)
${fieldname}                 — shorthand (converted to XPath by cht-conf)
```

### Common XPath functions
```
if(condition, value_if_true, value_if_false)
concat('text', /data/field, ' more text')
string(/data/field)
number(/data/field)
/data/q1 + /data/q2 + /data/q3    — arithmetic
```

## PHQ-9 group_summary Fix Example

### Problem: fields showed empty in report
The `group_summary` fields had `readonly="true()"` in XML but NO `calculate` attribute.

### Root cause in xlsx:
```
type: string (wrong — string with no calculation never auto-fills)
name: lbl_score_val
label: ${total_score}   ← only shows during form, not saved
calculation: (empty)
```

### Fix in xlsx:
```
type: calculate          ← changed to calculate
name: lbl_score_val
label: Score Value
calculation: /data/total_score   ← XPath to the field we want to copy
```

### Full group_summary fix table:
| name | type | calculation |
|---|---|---|
| `lbl_filled_by_lbl` | `calculate` | `'Filled by:'` |
| `lbl_filled_by_val` | `calculate` | `/data/reporter_name` |
| `lbl_patient_lbl` | `calculate` | `'Patient:'` |
| `lbl_patient_val` | `calculate` | `/data/patient_name` |
| `lbl_score_lbl` | `calculate` | `'PHQ-9 Score:'` |
| `lbl_score_val` | `calculate` | `/data/total_score` |
| `lbl_severity_lbl` | `calculate` | `'Severity:'` |
| `lbl_severity_val` | `calculate` | `/data/severity_category` |
