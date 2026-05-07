# NgRx & Angular Data Flow in CHT Webapp

## What is NgRx?

NgRx is Angular's state management library (similar to Redux). Instead of components talking directly to services, everything goes through:

```
Action → Effect → Service → Store → Component re-renders
```

## CHT NgRx Store Slices

| Slice | What it holds |
|---|---|
| `global` | Loading state, selected item, title, sidebar |
| `reports` | Report list, selected report, select mode |
| `contacts` | Contact list, selected contact |
| `messages` | Message threads |
| `tasks` | Task list |
| `analytics` | Analytics data |

## Report Page: Complete NgRx Flow

```
User visits /#/reports/:id
        ↓
ReportsContentComponent (subscribes to route params)
webapp/src/ts/modules/reports/reports-content.component.ts:87
        ↓ dispatches
Action: selectReportToOpen({ reportId: 'abc123' })
        ↓
ReportsEffects.selectReportToOpen  (handles the action)
webapp/src/ts/effects/reports.effects.ts:77-95
        ↓ calls service
ReportViewModelGeneratorService.get(reportId)
webapp/src/ts/services/report-view-model-generator.service.ts
        ↓ calls
LineageModelGeneratorService.report(id)  → reads PouchDB
FormatDataRecordService.format(doc)      → formats for display
GetSummariesService.get([id])            → gets subject info
        ↓ dispatches
Action: openReportContent(report)
        ↓
ReportsEffects.openReportContent
webapp/src/ts/effects/reports.effects.ts:44-75
        ↓ dispatches
Action: setSelectedReport(model)
        ↓
Reducer updates store.reports.selectedReport
        ↓
ReportsContentComponent re-renders with new data
```

## Path Aliases (shortcuts in import statements)

| Alias | Maps to |
|---|---|
| `@mm-services/*` | `webapp/src/ts/services/` |
| `@mm-components/*` | `webapp/src/ts/components/` |
| `@mm-modules/*` | `webapp/src/ts/modules/` |
| `@mm-reducers/*` | `webapp/src/ts/reducers/` |
| `@mm-selectors/*` | `webapp/src/ts/selectors/` |
| `@mm-effects/*` | `webapp/src/ts/effects/` |
| `@mm-actions/*` | `webapp/src/ts/actions/` |

## Key Service Files

| Service | File | Purpose |
|---|---|---|
| `DbService` | `services/db.service.ts` | PouchDB instance (local or remote) |
| `LineageModelGeneratorService` | `services/lineage-model-generator.service.ts` | Fetch doc + lineage from PouchDB |
| `ReportViewModelGeneratorService` | `services/report-view-model-generator.service.ts` | Build full report model |
| `FormatDataRecordService` | `services/format-data-record.service.ts` | Format doc.fields for display |
| `Select2SearchService` | `services/select2-search.service.ts` | Contact picker search |
| `SearchService` | `services/search.service.ts` | Search contacts/reports in PouchDB |

## DbService: Local vs Remote

```ts
// webapp/src/ts/services/db.service.ts:160
get({ remote=this.isOnlineOnly, meta=false, usersMeta=false }={}) {
  const name = this.getDbName(remote, meta, usersMeta);
  return window.PouchDB(name, this.getParams(remote, meta, usersMeta));
}
```

- `isOnlineOnly = false` (offline user) → `remote = false` → reads local IndexedDB
- `isOnlineOnly = true` (online-only user) → `remote = true` → reads CouchDB directly via HTTP

## FormatDataRecordService: How doc.fields → Display Fields

```ts
// services/format-data-record.service.ts:476
private getFields(doc, results, values, labelPrefix, depth) {
  Object.keys(values).forEach((key) => {
    const value = values[key];
    const label = labelPrefix + '.' + key;
    if (_.isObject(value)) {
      results.push({ label, depth });           // group header
      this.getFields(doc, results, value, label, depth + 1);
    } else {
      results.push({ label, value, depth });    // leaf with value
    }
  });
}
// label built as: 'report.phq9.group_summary.lbl_score_val'
// → translated using app translation files
```

## Where to Add Debuggers

```ts
// 1. ReportsContentComponent — when report URL is opened
// reports-content.component.ts:87
this.route.params.subscribe(params => {
  debugger; // ← add here
  this.reportsActions.selectReportToOpen(params.id);
});

// 2. ReportsEffects — when effect handles the action
// reports.effects.ts:86
return of(this.reportViewModelGeneratorService
  .get(reportId)  // ← add debugger inside .get()
  .then(report => ...));

// 3. LineageModelGeneratorService — actual PouchDB read
// lineage-model-generator.service.ts:88
return this.lineageLib
  .fetchHydratedDoc(id, { throwWhenMissingLineage: true }) // ← before this
```
