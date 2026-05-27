---
name: generate-docs
description: Generate or update developer-only documentation for the cht-poc (TANUH AI DEMO) project. Writes comprehensive markdown docs covering environment setup, architecture, place hierarchy, roles, forms, tasks, AI workflow, and how to add new forms/tasks. Output goes to DEVELOPER.md in the cht-poc repo. Documentation is strictly for developers — not end users, not health workers, not clinical staff.
---

# Generate Developer Documentation

> ⚠️ **Audience: Developers only.**
> This skill produces technical documentation intended exclusively for **software developers** working on the cht-poc CHT DEMO project. It must NOT contain:
> - Clinical guidance or medical instructions
> - End-user (health worker) how-to guides
> - Patient-facing language
> - UI walkthroughs aimed at non-technical users
>
> Every section must assume the reader is a developer who can read JavaScript, JSON, and XLSForm structures.

This skill generates (or regenerates) the full developer documentation for the **cht-poc** CHT DEMO project at `/home/neeraj/cht-poc`.

## Project context

- **Project name in all headings:** `TANUH AI`
- **Source repo:** `/home/neeraj/cht-poc`
- **Output:** always write to `/home/neeraj/cht-poc/docs/` as **split files** (one per section)
- **Entry point:** `docs/README.md` — index file with links to every section file
- **Do NOT touch** the existing `/home/neeraj/cht-poc/DEVELOPER.md` — it is kept as a legacy reference
- **Generation strategy:** generate 100% fresh from the source code + CHT docs reference — do not copy from the existing `DEVELOPER.md`
- **Reference docs:** https://docs.communityhealthtoolkit.org/ — consult when filling in setup steps or CHT concepts not explicit in the source files

## What This Skill Does

When invoked, it:

1. **Reads the current project state** — scans `tasks.js`, `targets.js`, `app_settings.json`, `app_settings/base_settings.json`, `forms/app/`, `forms/contact/`, `translations/`, `resources.json`, `package.json`, and `contact-summary.templated.js`.
2. **Writes split markdown files** into `/home/neeraj/cht-poc/docs/` — one file per section, plus a `README.md` index.
3. **Never modifies** `/home/neeraj/cht-poc/DEVELOPER.md`.

## When to Use

- A new developer is joining the project and needs onboarding docs.
- Forms, tasks, roles, or the hierarchy have changed and the docs need refreshing.
- The user types `/generate-docs` or asks to "update the developer documentation".
- The user asks to "add a new section" to the existing docs.

## Arguments

The skill accepts an optional argument after `/generate-docs`:

| Argument | Effect |
|----------|--------|
| *(none)* | Generate all section files fresh into `docs/` |
| `--section <name>` | Regenerate only a specific section file (e.g. `--section tasks`) |
| `--diff` | Show what would be written without actually writing any files |

## Execution Steps

### Step 1 — Read source files

Read (in order):
```
/home/neeraj/cht-poc/package.json
/home/neeraj/cht-poc/tasks.js
/home/neeraj/cht-poc/targets.js
/home/neeraj/cht-poc/contact-summary.templated.js
/home/neeraj/cht-poc/app_settings.json          (top-level: hierarchy types, locales)
/home/neeraj/cht-poc/app_settings/base_settings.json  (roles, permissions)
/home/neeraj/cht-poc/resources.json
/home/neeraj/cht-poc/translations/messages-en.properties
```

Also list:
```bash
ls /home/neeraj/cht-poc/forms/app/
ls /home/neeraj/cht-poc/forms/contact/
```

### Step 2 — Build document sections

Generate each section from the source data. **Never hallucinate** — every fact must come from the files read in Step 1.

#### Required sections (in order):

| # | Section heading | Source |
|---|-----------------|--------|
| 1 | Development Environment Setup | `package.json` + `CLAUDE.md` knowledge |
| 2 | How CHT Works | Architecture overview |
| 3 | Place Hierarchy & User Management | `app_settings.json` → `place_hierarchy_types` and `contact_types` |
| 4 | Roles & Permissions | `base_settings.json` → `roles` + `permissions` |
| 5 | Contact Forms | `forms/contact/` directory listing |
| 6 | App Forms | `forms/app/` + each `.properties.json` |
| 7 | AI Recommendation (Oral Cancer) | `tasks.js` oral cancer section + `ncd-media/` |
| 8 | Clinical Workflows & Task Logic | Full `tasks.js` — one subsection per workflow |
| 9 | Form Media Folders | `*-media/` directories under `forms/app/` |
| 10 | Resources (Icons & Logos) | `resources.json` |
| 11 | Translations | `translations/messages-en.properties` |
| 12 | Reports Tab & Tasks Tab | General CHT knowledge |
| 13 | Common Commands | `package.json` → `scripts` |
| 14 | How to Add a New Form | Step-by-step tutorial |
| 15 | How to Add a New Task | Step-by-step tutorial with code template |

### Step 3 — Write split files into docs/

Always write to `/home/neeraj/cht-poc/docs/`:

```
/home/neeraj/cht-poc/docs/
  ├── README.md                    (index — links to every section below)
  ├── 01-setup.md                  (Development Environment Setup)
  ├── 02-architecture.md           (How CHT Works)
  ├── 03-hierarchy-users.md        (Place Hierarchy & User Management)
  ├── 04-roles-permissions.md      (Roles & Permissions)
  ├── 05-contact-forms.md          (Contact Forms)
  ├── 06-app-forms.md              (App Forms)
  ├── 07-ai-oral-cancer.md         (AI Recommendation — Oral Cancer)
  ├── 08-clinical-workflows.md     (Clinical Workflows & Task Logic)
  ├── 09-form-media.md             (Form Media Folders)
  ├── 10-resources-icons.md        (Resources & Icons)
  ├── 11-translations.md           (Translations)
  ├── 12-reports-tasks-tab.md      (Reports Tab & Tasks Tab)
  ├── 13-commands.md               (Common Commands)
  ├── 14-adding-forms.md           (How to Add a New Form)
  └── 15-adding-tasks.md           (How to Add a New Task)
```

**Never write to or modify `/home/neeraj/cht-poc/DEVELOPER.md`.**

Each file must begin with:
```markdown
# TANUH AI — <Section Title>

> Part of the [TANUH AI Developer Docs](README.md)
```

`docs/README.md` must contain a table of contents with relative links to all 15 section files, plus a one-line description of each.

### Step 4 — Confirm

Tell the user:
- All file paths written
- Which sections were generated from source vs filled from CHT reference docs (flag the latter)
- Any sections that could not be fully populated due to missing source data
- Remind them that `DEVELOPER.md` was intentionally left untouched

## Writing Standards

Follow these standards when generating the documentation:

### Audience (non-negotiable)
- **Readers are developers** — people who will clone the repo, edit source files, run CLI commands, and write JavaScript.
- Do NOT write for health workers, clinic staff, or end users of the CHT app.
- Do NOT explain how to use the CHT app UI (e.g. "click the + button") except where it is needed to verify that a developer's code change worked correctly.
- Do NOT include clinical descriptions of what a disease is or how a screening protocol works — only describe what the form/task *does in code*.

### Tone & style
- Written for **new developers joining the project** — assume familiarity with JavaScript and web development but not with CHT.
- Every code block has a comment or caption explaining what it does.
- Use tables for structured data (roles, forms, tasks, icons).
- Use ASCII flow diagrams (like `├─` trees) for workflows — mirrors the style already in `tasks.js` comments.

### Accuracy rules
- **Form IDs** must match the `name` field from `settings` sheet of the `.xlsx` (or the filename stem if `settings` is not readable) — verify against the directory listing.
- **Task names** must match the `name:` field in `tasks.js` exactly.
- **Role keys** must match the keys in `base_settings.json` exactly.
- **Permission keys** must match the keys in `base_settings.json` exactly.
- If a `.properties.json` file cannot be read (XML-only forms), note that and use the filename stem as the form ID.

### What NOT to do
- Do not copy-paste raw `tasks.js` code blocks into the documentation — summarise in prose and workflow diagrams instead.
- Do not include any credentials or secrets.
- Do not document internal CHT Core framework internals (those live in `cht-core/CLAUDE.md`).
- Do not write sentences like "As an ASHA, you should..." — this is not a user manual.
- Do not explain medical terminology (PHQ-9, CBAC, NCD) from a clinical perspective — only explain what the corresponding code artifact (form ID, task name, field path) does.
- Do not include screenshots or UI navigation steps beyond what is needed for a developer to smoke-test their changes.

## Section Templates

### Section 14 — How to Add a New Form

```markdown
## 14. How to Add a New Form

### Step 1: Create the XLSForm source
Copy an existing form as a template:
\`\`\`bash
cp forms/app/cbac.xlsx forms/app/my_new_form.xlsx
\`\`\`
Edit the three sheets: `survey`, `choices`, `settings`.
Set `form_id` in the `settings` sheet to `my_new_form`.

### Step 2: Create the properties file
Create `forms/app/my_new_form.properties.json`:
\`\`\`json
{
  "title": "My New Form",
  "icon": "icon-healthcare-generic-2",
  "context": {
    "person": true,
    "place": false,
    "permission": "can_view_my_new_form"
  }
}
\`\`\`

### Step 3: Add a permission (if needed)
In `app_settings/base_settings.json`, under `permissions`, add:
\`\`\`json
"can_view_my_new_form": ["cho"]
\`\`\`

### Step 4: Compile and upload
\`\`\`bash
npm run convert          # XLSX → XML
npm run validate         # check for XForm errors
npm run upload-forms     # push to CHT
npm run upload-settings  # push updated permissions
\`\`\`

### Step 5: Test
Open the CHT app as a user with the relevant role and navigate to a patient
contact — the new form button should appear.
```

### Section 15 — How to Add a New Task

```markdown
## 15. How to Add a New Task

All tasks live in `tasks.js`. Each task object has:

| Key | Required | Description |
|-----|----------|-------------|
| `name` | ✅ | Unique task identifier (used in `resolvedIf` cross-references) |
| `icon` | ✅ | Icon key from `resources.json` |
| `title` | ✅ | Display title or translation key |
| `appliesTo` | ✅ | `'reports'` or `'contacts'` |
| `appliesToType` | ✅ | Array of form IDs that trigger this task |
| `appliesIf` | ✅ | Function returning `true` when the task should appear |
| `resolvedIf` | ✅ | Function returning `true` when the task should disappear |
| `actions` | ✅ | Array of `{ type, form, label, modifyContent }` objects |
| `events` | ✅ | Array of `{ id, days, start, end }` or `{ id, dueDate, start, end }` |

### Minimal task template
\`\`\`js
{
  name: 'my_task_name',
  icon: 'icon-healthcare-generic-2',
  title: 'My Task Title',
  appliesTo: 'reports',
  appliesToType: ['trigger_form_id'],
  appliesIf: function (contact, report) {
    return user.role === 'cho' && isAlive(contact);
  },
  resolvedIf: function (contact, report) {
    return contact.reports.some(function (r) {
      return r.form === 'resolution_form_id' &&
        r.reported_date > report.reported_date;
    });
  },
  actions: [{
    type: 'report',
    form: 'target_form_id',
    label: 'Open Target Form',
    modifyContent: function (content, contact, report) {
      content.source_id = report._id;
    }
  }],
  events: [{
    id: 'my-task-event',
    days: 0,
    start: 0,
    end: 7,
  }],
}
\`\`\`

### Key patterns used in this project
- **Most-recent-only**: Use `getNewestReport(contact.reports, ['form_id'])` to limit tasks to only the newest report.
- **Cross-form resolution**: In `resolvedIf`, check `r.fields.inputs.source_id === report._id` to close a task only when the resolution form references this specific report.
- **Role routing**: `user.role === UserRole.PHYSICIAN` (PHC) vs `user.role === UserRole.MEDICAL_OFFICER` (CHC) determines which facility receives the task.
- **Scheduled due date**: Use `dueDate: function(event, contact, report) { return getDateISOLocal(getField(report, 'path.to.date')); }` to schedule on a field value.
```

## Error Handling

| Situation | What to do |
|-----------|------------|
| `tasks.js` cannot be read | Abort and tell the user — task documentation is the core of this project |
| A `.properties.json` is missing for a form | Note it in the docs as "properties unknown" and continue |
| `base_settings.json` cannot be read | Use `app_settings.json` top-level for what's available; note roles section is incomplete |
| Existing `DEVELOPER.md` is newer than source files | Warn the user that the existing file may already be up to date; offer `--diff` |
