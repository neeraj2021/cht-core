# Form Visibility & Permissions in CHT

## The Two Approaches

CHT gives you two ways to control which users see a form in the "New Report" dialog:

| Method | Where | Best for |
|--------|-------|----------|
| `expression` in `.properties.json` | Per-form file | Quick role checks, inline logic |
| `permissions` in `app_settings.json` | Central config | Reusable, multi-role, manageable |

---

## Method 1: Expression in `.properties.json`

Every app form has a companion `<form_name>.properties.json` file.

### File location
```
config/demo/forms/app/cbac.properties.json
```

### Structure
```json
{
  "title": "CBAC",
  "icon": "icon-healthcare-generic-2",
  "context": {
    "person": true,
    "place": false,
    "expression": "user.role !== 'chw'"
  }
}
```

### What `context` fields do

| Field | Type | Effect |
|-------|------|--------|
| `person` | boolean | Show form when viewing a person contact |
| `place` | boolean | Show form when viewing a place contact |
| `expression` | JS string | Evaluated at runtime — form shown only if `true` |

### Available variables in `expression`

| Variable | What it contains |
|----------|-----------------|
| `user` | The logged-in user object |
| `user.role` | Their role string: `"chw"`, `"chw_supervisor"`, etc. |
| `user.parent` | Their assigned place doc |
| `user.parent.type` | Place type: `"clinic"`, `"health_center"`, etc. |
| `contact` | The contact being viewed (if in contact context) |
| `summary` | Contact summary object |

### Example expressions

```js
// Hide from chw
"expression": "user.role !== 'chw'"

// Only show to chw_supervisor
"expression": "user.role === 'chw_supervisor'"

// Show to multiple roles
"expression": "['chw_supervisor', 'program_officer'].includes(user.role)"

// Show only when viewing a female patient
"expression": "contact.gender === 'female'"

// Combine role + contact check
"expression": "user.role !== 'chw' && contact.gender === 'female'"
```

### Pros / Cons

| Pros | Cons |
|------|------|
| No app_settings.json change needed | Logic scattered across many files |
| Can use contact/summary context | Hard to audit who can see what |
| Good for dynamic/contextual rules | Must redeploy forms to change |

---

## Method 2: Permissions in `app_settings.json`

### How it works

1. Define a custom permission in `app_settings.json → permissions`
2. Assign that permission to specific roles (those who CAN see the form)
3. Reference it in the form's `expression` using `userHasPermission()`

### Step 1 — Add permission to `app_settings.json`

```json
"permissions": {
  "can_view_cbac": [
    "data_entry",
    "analytics",
    "program_officer",
    "crfo",
    "chw_supervisor"
  ],
  ...
}
```

Roles listed here CAN see the form. Roles NOT listed (like `chw`) cannot.

### Step 2 — Reference in `.properties.json`

```json
{
  "title": "CBAC",
  "icon": "icon-healthcare-generic-2",
  "context": {
    "person": true,
    "place": false,
    "expression": "userHasPermission('can_view_cbac')"
  }
}
```

### `userHasPermission()` built-in

This is a CHT runtime helper available inside `expression`. It looks up the logged-in user's roles and checks if any of them appear in the permission's role list.

```js
// Single permission
"expression": "userHasPermission('can_view_cbac')"

// Multiple permissions (user must have ALL)
"expression": "userHasPermission('can_view_cbac') && userHasPermission('can_create_records')"
```

### Pros / Cons

| Pros | Cons |
|------|------|
| All role logic in one place (`app_settings.json`) | Requires uploading app_settings too |
| Easy to audit: grep `can_view_cbac` | Slightly more setup |
| Add/remove roles without touching form files | Can't use contact/summary context |
| Reuse same permission across multiple forms | |

---

## Real Example: CBAC Form Hidden from CHW

### File: `config/demo/forms/app/cbac.properties.json`
```json
{
  "title": "CBAC",
  "icon": "icon-healthcare-generic-2",
  "context": {
    "person": true,
    "place": false,
    "expression": "userHasPermission('can_view_cbac')"
  }
}
```

### File: `config/demo/app_settings.json` (permissions section)
```json
"permissions": {
  "can_view_cbac": [
    "data_entry",
    "analytics",
    "program_officer",
    "crfo",
    "chw_supervisor"
  ],
  ...
}
```

**Result:** `chw` logs in → CBAC does NOT appear in "New Report" dialog. All other roles see it normally.

---

## Roles in This Demo Config

```
national_admin    →  system-wide (above hierarchy)
program_officer   →  district_hospital level
crfo              →  district_hospital level
chw_supervisor    →  health_center level  (offline)
chw               →  clinic level         (offline)
data_entry        →  data entry only
analytics         →  read-only
gateway           →  SMS gateway
```

Defined in `app_settings.json → roles`.

---

## Deploying Changes

```bash
# Upload only app settings (permissions change)
cht --url=http://medic:password@localhost:5988 upload-app-settings

# Upload only form properties (expression change)
cht --url=http://medic:password@localhost:5988 upload-app-forms

# Upload both
cht --url=http://medic:password@localhost:5988 upload-app-settings upload-app-forms
```

After upload, **log out and log back in** — CHT caches the user's permissions at login time.

---

## Which Method to Use?

| Scenario | Use |
|----------|-----|
| Simple role gate (hide from one role) | Either — expression is faster |
| Same permission needed on multiple forms | `app_settings.json` permissions |
| Logic depends on patient data (gender, age) | `expression` with contact variables |
| You want a central audit of who sees what | `app_settings.json` permissions |
| CHW area / place-level gating | `expression` with `user.parent.type` |
