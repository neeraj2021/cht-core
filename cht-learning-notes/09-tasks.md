# CHT Tasks — What They Are and How to Create Them

## What Are Tasks?

Tasks are **action prompts** shown to CHW (Community Health Worker) users on the Tasks tab of the CHT app. They tell a CHW "you need to do X for patient Y by date Z."

Key characteristics:
- Only visible to **offline users** (CHWs, not supervisors viewing online)
- Generated **client-side** by the rules engine running in the browser/app
- Driven by a `tasks.js` config file deployed with `cht-conf`
- Each task links to a **form** the user fills in to complete it
- A task disappears once its `resolvedIf` condition is satisfied (or the window expires)

### Real-world examples
- "Complete a first assessment for new patient within 7 days of registration"
- "Follow up on this pregnancy at week 20 of LMP"
- "Check in on a muted household"

---

## How Tasks Work (Engine Overview)

```
tasks.js config
      │
      ▼
Rules Engine (runs in browser)
  - iterates over contacts and/or reports
  - evaluates appliesIf() for each
  - generates task documents with due dates
      │
      ▼
Tasks Tab (Angular UI)
  - displays active tasks in date order
  - user taps a task → opens the linked form
  - form submission → resolvedIf() re-evaluated → task disappears
```

The rules engine re-runs whenever contacts/reports change (new sync, form submission).

---

## File: `tasks.js`

Located at the root of your CHT app config (alongside `app_settings.json`, `forms/`, etc.).

```
config/
├── app_settings.json
├── tasks.js          ← task definitions go here
├── targets.js
├── forms/
│   └── app/
│       └── assessment.xlsx
└── translations/
```

`tasks.js` exports an **array** of task definition objects:

```javascript
module.exports = [
  { /* task 1 */ },
  { /* task 2 */ },
];
```

---

## Task Definition Schema

### Top-level properties

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Unique identifier — used to query task completeness |
| `title` | translation key | yes | User-facing label shown on the Tasks tab |
| `icon` | string | no | Icon name from `resources.json` (e.g. `'icon-healthcare'`) |
| `appliesTo` | `'contacts'` \| `'reports'` | yes | Whether task is driven per-contact or per-report |
| `appliesToType` | string[] | no | Filter by contact type (e.g. `['patient']`) or form name |
| `appliesIf` | function(contact, report) | no | Extra condition — return `true` to create the task |
| `actions` | object[] | yes | Forms opened when user taps the task |
| `events` | object[] | yes | Timing windows that define when the task appears |
| `resolvedIf` | function(contact, report, event, dueDate) | no | Return `true` when task is done — default: never auto-resolve |
| `priority` | object \| function | no | Mark task as high-priority (shows "high risk" badge) |
| `contactLabel` | string \| function | no | Override the contact name shown on the task card |

---

### `events` — timing windows

Defines **when** the task appears on the Tasks tab. An array of event objects:

```javascript
events: [{
  id: 'first-assessment',   // descriptive string (required for multi-event tasks)
  days: 7,                  // task is due N days after contact.reported_date
  start: 7,                 // show task this many days BEFORE the due date
  end: 0,                   // hide task this many days AFTER the due date (0 = same day)
  dueDate: function() { … } // OR compute due date dynamically (overrides `days`)
}]
```

**Timeline example** with `days: 7, start: 7, end: 0`:
```
Day 0 (registration)
Day 0  → Day 7 (due date): task IS visible
Day 8+            : task disappears (window expired)
```

---

### `actions` — what happens on tap

```javascript
actions: [{
  type: 'report',           // 'report' (default) or 'contact'
  form: 'assessment',       // form code to open
  label: 'Complete Assessment',  // shown on multi-action screens
  modifyContent: function(content, contact, report, event) {
    // set fields that will be passed as inputs to the form
    content.patient_id = contact.contact._id;
    content.t_followup_count = '1';
  }
}]
```

`modifyContent` lets you **pre-populate form fields** from task context.

---

### `resolvedIf` — completion logic

```javascript
resolvedIf: function(contact, report, event, dueDate) {
  const windowStart = Utils.addDate(dueDate, -event.start).getTime();
  const windowEnd   = Utils.addDate(dueDate, event.end + 1).getTime();
  return Utils.isFormSubmittedInWindow(
    contact.reports, 'assessment', windowStart, windowEnd
  );
}
```

Without `resolvedIf`, the task only disappears when the window expires.

---

### `priority` — high-risk badge

```javascript
priority: {
  level: 1,
  label: 'High Risk'
}

// or dynamically:
priority: function(contact, report) {
  return contact.contact.high_risk
    ? { level: 1, label: 'High Risk' }
    : null;
}
```

---

## Example 1 — Simple Task (Contact-Based)

Prompt CHW to complete a first assessment within 7 days of patient registration.

```javascript
module.exports = [{
  name: 'assessment-after-registration',
  title: 'First Assessment',
  icon: 'icon-healthcare',
  appliesTo: 'contacts',
  appliesToType: ['patient'],

  // Only for CHW users; skip dead/muted patients
  appliesIf: function(contact) {
    return user.parent &&
           user.parent.contact_type === 'chw_area' &&
           !contact.contact.date_of_death &&
           !contact.contact.muted;
  },

  actions: [{ form: 'assessment' }],

  events: [{
    start: 7,   // appear 7 days before due date (i.e. immediately on registration)
    days: 7,    // due 7 days after reported_date
    end: 0,     // disappear on due date
  }],
}];
```

---

## Example 2 — Complex Task (Multiple Events, Report-Based)

8 scheduled pregnancy follow-up visits based on LMP date. Resolves if either of two forms is submitted in the window.

```javascript
const { Utils } = require('@medic/cht-conf-test-harness');
const { DateTime } = require('luxon');

module.exports = [{
  name: 'pregnancy-visit',
  title: 'Pregnancy Visit',
  icon: 'icon-pregnancy',
  appliesTo: 'contacts',
  appliesToType: ['patient'],

  appliesIf: function(contact) {
    if (!user.parent || user.parent.contact_type !== 'chw_area') return false;
    if (contact.contact.date_of_death || contact.contact.muted) return false;

    const registration = Utils.getMostRecentReport(contact.reports, 'pregnancy_registration');
    if (!registration) return false;

    // Store LMP date on `this` so events and resolvedIf can access it
    this.lmp = DateTime.fromMillis(Utils.getLmpDate(registration).getTime());
    return true;
  },

  // 8 visits at specific weeks after LMP
  events: [12, 20, 26, 30, 34, 36, 38, 40].map(week => ({
    id: `pregnancy-visit-week-${week}`,
    start: week > 30 ? 6 : 7,
    end:   week > 30 ? 7 : 14,
    dueDate: function() {
      return this.lmp.plus({ weeks: week }).toJsDate();
    },
  })),

  resolvedIf: function(contact, report, event, dueDate) {
    const start = Utils.addDate(dueDate, -event.start).getTime();
    const end   = Utils.addDate(dueDate,  event.end + 1).getTime();
    return Utils.isFormSubmittedInWindow(contact.reports, 'pnc_followup', start, end)
        || Utils.isFormSubmittedInWindow(contact.reports, 'assessment_followup', start, end);
  },

  actions: [{
    form: 'pnc_followup',
    modifyContent: function(content, contact, report, event) {
      // Tell the form which visit number this is
      const visitNumber = this.definition.events
        .findIndex(e => e.id === event.id) + 1;
      content.t_visit_number = visitNumber.toString();
    },
  }],
}];
```

---

## Utility Functions (`Utils`)

Available via `const { Utils } = require('@medic/cht-conf-test-harness')` in config context:

| Function | Purpose |
|---|---|
| `Utils.addDate(date, days)` | Returns a new Date shifted by N days |
| `Utils.isTimely(date, event)` | Check if a date falls inside an event window |
| `Utils.getMostRecentReport(reports, formName)` | Get the latest submitted report of a given form |
| `Utils.isFormSubmittedInWindow(reports, form, start, end)` | Check if form was submitted between two timestamps |
| `Utils.getLmpDate(doc)` | Extract LMP date from a pregnancy registration doc |
| `Utils.getSchedule(name)` | Load a named schedule from app settings |

---

## CHT API (v3.12.0+)

Available via `cht.v1` inside task functions:

```javascript
appliesIf: function(contact) {
  if (!cht.v1.hasPermissions('can_view_tasks')) return false;
  // ...
}
```

| API | Purpose |
|---|---|
| `cht.v1.hasPermissions(perm)` | Check if current user has a permission |
| `cht.v1.getExtensionLib(name)` | Load a shared extension library |
| `cht.v1.analytics.getTargetDocs()` | Access target aggregate calculations |

---

## Deploy Workflow

```bash
# 1. Write/edit tasks.js in your config folder

# 2. Compile and upload
cht --url=https://<user>:<pass>@<host> compile-app-settings upload-app-settings

# 3. Test (as an offline CHW user)
#    - Create a patient contact
#    - Switch to the Tasks tab
#    - Verify the task appears within the correct window
#    - Submit the linked form
#    - Verify the task disappears
```

---

## Testing Tasks

Use `cht-conf-test-harness` for unit testing without a real server:

```javascript
const { Harness } = require('@medic/cht-conf-test-harness');

const harness = new Harness({ /* config */ });

it('assessment task appears after registration', async () => {
  await harness.loadContact(patientContact);
  const tasks = await harness.getTasks();
  expect(tasks).to.have.length(1);
  expect(tasks[0].title).to.equal('First Assessment');
});

it('task resolves after form submission', async () => {
  await harness.fillForm('assessment', /* answers */);
  const tasks = await harness.getTasks();
  expect(tasks).to.be.empty;
});
```

---

## Common Gotchas

| Gotcha | Detail |
|---|---|
| Tasks only show for offline users | Supervisors logged in online won't see them |
| `this` context in functions | `appliesIf`, `dueDate`, `resolvedIf`, and `modifyContent` share a `this` — use it to pass state between them |
| Dead/muted contacts | Always guard with `!contact.contact.date_of_death && !contact.contact.muted` |
| No `resolvedIf` = never auto-resolves | Task stays until window expires unless you define resolution logic |
| `days` is relative to `reported_date` | For report-based tasks, it's the report's `reported_date`; for contacts, it's the contact's `reported_date` |
| Luxon vs native Date | Use Luxon for complex date arithmetic (weeks, months); plain `Utils.addDate` for days |

---

## Where to Find Tasks Code in CHT Core

```
shared-libs/rules-engine/src/
├── rules-engine.js           — main engine, evaluates tasks.js config
├── task-fetcher.js           — fetches task docs from PouchDB
└── nools/
    └── task-emitter.js       — emits task documents

webapp/src/ts/
├── effects/tasks.effects.ts  — NgRx effects loading tasks into the store
├── services/
│   └── rules-engine.service.ts  — wraps shared-libs rules engine for Angular
└── modules/tasks/
    └── tasks.component.ts    — Tasks tab component
```
