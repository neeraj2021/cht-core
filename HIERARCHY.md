# CHT App Hierarchy & Configuration Notes

## Contact Type Hierarchy

```
State
│
└── District
    │
    └── District Hospital
        │
        └── Community Health Center (CHC)
            │
            └── Primary Health Center (PHC)
                │
                └── Health & Wellness Center (HWC)
                    │
                    └── Village
                        ├── Person/Patient 1
                        ├── Person/Patient 2
                        └── Person/Patient 3
```

## Contact Type IDs

| Level | ID | Parent |
|---|---|---|
| State | `state` | *(root, no parent)* |
| District | `district` | `state` |
| District Hospital | `district_hospital` | `district` |
| Community Health Center | `community_health_center` | `district_hospital` |
| Primary Health Center | `primary_health_center` | `community_health_center` |
| Health & Wellness Center | `health_and_wellness_center` | `primary_health_center` |
| Village | `village` | `health_and_wellness_center` |
| Person (Patient) | `person` | `village`, `health_and_wellness_center`, `primary_health_center`, `community_health_center` |

> `person` can be created under multiple levels to allow health workers at different levels to register patients directly.

## Roles

| Key | Display Name (translation key) | Offline |
|---|---|---|
| `medical_officer` | `usertype.medical_supervisor` | false |
| `nurse` | `usertype.medical_officer` | false |
| `physician` | `usertype.physician` | false |
| `anm` | `usertype.anm` | false |
| `mpw` | `usertype.mpw` | false |
| `cho` | `usertype.cho` | false |
| `chw` | `usertype.chw` | false |
| `asha` | `usertype.asha` | false |

> **Note on translation keys:** Role keys were renamed but translation keys intentionally left unchanged.
> `medical_supervisor` key → renamed to `medical_officer` (keeps `usertype.medical_supervisor`)
> `medical_officer` key → renamed to `nurse` (keeps `usertype.medical_officer`)
> Translation keys will be updated in a later pass.

> **Note on offline:** All roles are currently set to `offline: false` for easier development and to avoid sync issues. This will be updated before production.

## Contact Form XML Files (`config/default/forms/contact/`)

| File | Status | Notes |
|---|---|---|
| `state-create.xml` / `state-edit.xml` | ✅ Used | |
| `district-create.xml` / `district-edit.xml` | ✅ Used | |
| `district_hospital-create.xml` / `district_hospital-edit.xml` | ✅ Used | |
| `community_health_center-create.xml` / `community_health_center-edit.xml` | ✅ Used | |
| `primary_health_center-create.xml` / `primary_health_center-edit.xml` | ✅ Used | |
| `health_and_wellness_center-create.xml` / `health_and_wellness_center-edit.xml` | ✅ Used | Created from `sub_center`, roles updated |
| `village-create.xml` / `village-edit.xml` | ✅ Used | |
| `person-create.xml` / `person-edit.xml` | ✅ Used | |
| `block-create.xml` / `block-edit.xml` | ❌ Ignored | `block` removed from hierarchy |
| `clinic-create.xml` / `clinic-edit.xml` | ❌ Ignored | Not part of this hierarchy |
| `health_center-create.xml` / `health_center-edit.xml` | ❌ Ignored | Not part of this hierarchy |
| `sub_center-create.xml` / `sub_center-edit.xml` | ❌ Ignored | Replaced by `health_and_wellness_center` |
| `PLACE_TYPE-create.xlsx` / `PLACE_TYPE-edit.xlsx` | ❌ Ignored | Template files only |
| `place-types.json` | ❌ Ignored | Not used in this config |

> **Role values in XMLs:** All contact form XMLs use role keys: `asha`, `chw`, `anm`, `mpw`, `cho`, `nurse`, `medical_officer`, `physician`, `patient`, `other`

## History / Decisions

- `block` contact type was removed — it was an extra level between `state` and `district` that is not needed in this hierarchy.
- `sub_center` was renamed to `health_and_wellness_center` (HWC) to better reflect its real-world name.
- No separate `patient` role exists — patients are represented as `person` contact type, which is the standard CHT pattern.
