# Enketo Form Rendering

## What is Enketo?

Enketo is an open-source XForms renderer. CHT uses it to render forms in the browser. It takes XForm XML and renders it as interactive HTML.

## Flow: XForm XML → HTML Form

```
CouchDB: doc { _id: 'form:phq9', _attachments: { 'phq9.xml': ... } }
    ↓  Enketo reads XML
XForm XML parsed
    ↓  Enketo renders
HTML form in browser
    ↓  User fills form + clicks Submit
XForm data collected
    ↓  CHT saves to CouchDB
doc.fields populated in CouchDB
```

## How Enketo Handles Field Types

| XLSForm type | XForm bind | HTML rendered | Saved to doc.fields? |
|---|---|---|---|
| `string` | `type="string"` | text input | Yes (if user fills it) |
| `integer` | `type="int"` | number input | Yes |
| `calculate` | `calculate="xpath"` | hidden input | Yes (auto-computed) |
| `note` | `readonly="true()"` | display text | No |
| `hidden` | `type="string"` | no UI | Yes (pre-filled value) |
| `select_one` | `type="string"` | dropdown | Yes |

## select-contact Widget — How Dropdowns Work

The `appearance="select-contact type-person"` field creates a **contact picker dropdown**.

### How it works:

1. **XLSForm** survey row:
   ```
   type: string
   name: _id
   appearance: select-contact type-person
   ```

2. **Converted to XML**:
   ```xml
   <input ref="/data/inputs/contact/_id" appearance="select-contact type-person">
   ```

3. **Enketo widget** (`db-object-widget.js`) matches `or-appearance-select-contact` CSS class:
   - Replaces plain `<input>` with Select2 dropdown
   - Initializes `Select2SearchService`

4. **Select2SearchService** queries local PouchDB:
   ```ts
   this.searchService.search('contacts', { types: { selected: ['person'] } })
   // reads from IndexedDB — no HTTP request
   ```

5. **On selection** — `db-object-widget.js` `updateFields()` auto-fills sibling fields:
   - `contact/name` ← `doc.name`
   - `contact/patient_id` ← `doc.patient_id`
   - `contact/date_of_birth` ← `doc.date_of_birth`
   - All `hidden` fields under the same group get auto-populated

### Relevant files:
- `webapp/src/js/enketo/widgets/db-object-widget.js` — Select2 widget
- `webapp/src/ts/services/select2-search.service.ts` — search + hydrate logic

## XForm XML Structure

```xml
<h:html>
  <h:head>
    <model>
      <!-- itext: translations for labels -->
      <itext>
        <translation lang="en">
          <text id="/data/field:label"><value>Label text</value></text>
        </translation>
      </itext>

      <!-- instance: data structure (mirrors doc.fields) -->
      <instance>
        <data id="form_id">
          <field_name/>           <!-- string field -->
          <group_name>
            <nested_field/>
          </group_name>
        </data>
      </instance>

      <!-- bind: field rules (type, calculate, relevant, required) -->
      <bind nodeset="/data/field_name" type="string"/>
      <bind nodeset="/data/computed" type="string"
            calculate="/data/q1 + /data/q2"/>
      <bind nodeset="/data/optional" relevant="/data/flag = 'yes'"/>
    </model>
  </h:head>

  <h:body>
    <!-- UI elements — only what user sees -->
    <input ref="/data/field_name">
      <label ref="jr:itext('/data/field_name:label')"/>
    </input>
    <!-- calculate fields have NO body element — hidden from UI -->
  </h:body>
</h:html>
```

## Why `<output value="..."/>` Doesn't Save Data

```xml
<!-- This ONLY displays during form filling — NOT saved -->
<label>Score: <output value="/data/total_score"/></label>

<!-- This SAVES the value to doc.fields -->
<bind nodeset="/data/display_score" type="string"
      calculate="/data/total_score"/>
```

`<output>` is purely a display mechanism in the label text. The only way to persist data is via a `<bind>` with `calculate`.
