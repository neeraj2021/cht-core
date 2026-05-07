# Report Page Data Flow

## URL Pattern

```
localhost:5988/#/reports/a628b9bc-f116-47f0-a356-78366678c2bc
```

The part after `/reports/` is the CouchDB document `_id`.

## Complete Flow: URL → Screen

```
1. User navigates to /#/reports/:id
        ↓
2. Angular Router matches route
   webapp/src/ts/modules/reports/reports.routes.ts:28
   { path: ':id', component: ReportsContentComponent }
        ↓
3. ReportsContentComponent reads route param
   webapp/src/ts/modules/reports/reports-content.component.ts:86-88
   this.route.params.subscribe(params => {
     this.reportsActions.selectReportToOpen(params.id);
   });
        ↓
4. NgRx Action dispatched: selectReportToOpen
        ↓
5. ReportsEffects handles the action
   webapp/src/ts/effects/reports.effects.ts:81-88
   selectReportToOpen = createEffect(() => {
     return this.reportViewModelGeneratorService.get(reportId)
       .then(report => this.reportActions.openReportContent(report))
   });
        ↓
6. ReportViewModelGeneratorService._get()
   webapp/src/ts/services/report-view-model-generator.service.ts:38
   → calls lineageModelGeneratorService.report(id)
   → calls formatDataRecordService.format(model.doc)
   → calls getSummariesService.get([model.doc._id])
        ↓
7. LineageModelGeneratorService._report()
   webapp/src/ts/services/lineage-model-generator.service.ts:86
   → calls lineageLib.fetchHydratedDoc(id)
   → reads from LOCAL PouchDB (IndexedDB) — NO HTTP REQUEST
        ↓
8. FormatDataRecordService.format()
   webapp/src/ts/services/format-data-record.service.ts
   → builds displayFields array from doc.fields
   → resolves translation keys for field labels
        ↓
9. NgRx Store updated → Angular re-renders the report detail view
```

## Key Insight: Why No Network Request?

`lineageLib.fetchHydratedDoc(id)` reads from the **local PouchDB** instance:

```ts
// db.service.ts:160
get({ remote=this.isOnlineOnly, ... }={}) {
  // remote=false for offline users → reads IndexedDB
  return window.PouchDB('medic-user-neeraj', ...);
}
```

For offline users (`isOnlineOnly = false`), all reads go to local IndexedDB.

## Where to Add Debuggers

| Step | File | Line | What to debug |
|---|---|---|---|
| Route param | `reports-content.component.ts` | ~87 | `selectReportToOpen` called |
| Effect | `reports.effects.ts` | ~86 | `reportViewModelGeneratorService.get()` |
| ViewModel | `report-view-model-generator.service.ts` | ~41 | lineage + format calls |
| DB read | `lineage-model-generator.service.ts` | ~88 | actual PouchDB read |
| Format | `format-data-record.service.ts` | ~476 | field building logic |

## doc.fields Structure

The report document in CouchDB/PouchDB has this shape:
```json
{
  "_id": "a628b9bc-...",
  "type": "data_record",
  "form": "phq9",
  "fields": {
    "group_summary": {
      "lbl_score_val": "7",
      "lbl_severity_val": "Mild"
    },
    "total_score": "7",
    "severity_category": "Mild"
  }
}
```

`doc.fields` is what gets displayed on the report page. It comes directly from the XForm submission.
