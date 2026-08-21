# The Farm Wife — Roadmap

Living source of truth for what this app is, what's built, and what's next.
Updated inside Claude Code (plan mode) at the start of any planning session —
never edited from chat.

## What this is

Started as a Schedule F farm accounting app (React Native/Expo/Supabase) —
income/expense tracking, tax categories, receipt capture. Pivoting to a
broader companion app for a farmer's day-to-day: reminders (what day it is,
birthdays), weather/rain, equipment service history, livestock care, and
field-level yield/expense tracking, on top of the accounting core. Solo-
developed, Android. See README.md for setup/run instructions and current
tech stack — this file is for what's next and why, not how to run the app.

## Built

(Per README + preview build testing)
- User authentication (Supabase Auth), show/hide password toggle
- Transaction management (add/view/delete), Schedule F categories
- Natural language transaction entry ("sold 50 cattle for $45,000")
- Receipt capture (photo, cloud storage)
- AI receipt scanning — Claude vision reads a receipt photo and pre-fills
  date/category/description/amount (`supabase/functions/parse-receipt`)
- Financial summaries (income/expense/profit)
- YTD category breakdown — tap-to-reveal summary tiles by category
- CSV export — done, verified in person (husband tested it), includes
  receipt image URLs, filterable by date range/type/category
- Date range filtering (current year, last year, any prior year, custom)
- **Equipment service records** (merged to `main` 2026-08-20, gated off by
  default via `user_settings.enabled_modules` — opt in per account) —
  `equipment` entity with Year/Make/Model/Serial Number fields, camera +
  gallery tag/nameplate scanning (Claude vision reads the ID plate and
  pre-fills the fields, `supabase/functions/parse-equipment-tag`), and
  recurring service events (e.g. oil changes per tractor) with due-date
  notifications. Tag scanning verified in person; service records and
  notifications not yet exercised by real usage. `MainTabs` bottom-tab nav
  (Finance/Equipment) only appears once the equipment module is enabled for
  an account — otherwise unchanged single-screen Finance app. Since
  merging, also gained: service history (completed records, previously
  invisible once logged, now viewable grouped by equipment via
  `ServiceHistoryList`) and a native date picker on the due-date field.
- **Livestock care records** (merged to `main` 2026-08-20, gated off by
  default via `user_settings.enabled_modules`, same as equipment) — a
  `livestock` entity that's a group/herd by default (name + headcount) with
  individually-tracked animals as an option (tag number, birthdate), plus
  an attached photo (camera or gallery, no AI parsing — just capture and
  store, unlike equipment's tag OCR), and `livestock_care_records` for
  vaccination/deworming/hoof-trimming schedules reusing equipment's
  recurrence engine and notification scheduling. `MainTabs` adds a third
  tab when enabled. Care history view included from the start (see below).
  Verified in person: group/individual records, photo capture, all three
  recurrence types, completing a record. Building this surfaced two shared
  fixes applied to both equipment and livestock: (1) completed
  service/care records had no way to be reviewed after logging — pending
  lists only ever showed the next occurrence — so `ServiceHistoryList`/
  `CareHistoryList` were added; (2) a `PhotoCapture` component was
  extracted from `ReceiptCapture`/`TagScanner` (this was the third
  near-duplicate camera+gallery UI) and is now shared by all three photo
  features. Also added: a native date picker
  (`@react-native-community/datetimepicker`, via a shared `DatePicker`
  component) on service/care due-date fields and the transaction date
  field, replacing free-text YYYY-MM-DD entry everywhere in the app.

## Next up (prioritized 2026-08-20 — see decision log)

Pivot items first, since they're the current product direction; finance
backlog carried over below but deprioritized.

1. **Weather / rain alerts** — standalone, no dependency on the entity
   pattern, but needs a weather API integration and likely
   `expo-notifications` (now a dependency, added for equipment service
   reminders) for alerting.
2. **Field-level tracking** — most complex: ties yield, expense, and service
   records together across a field. Best done now that equipment/livestock
   have validated the entity+recurrence data model.
3. **Reminders & calendar** (day-of-week orientation, birthdays) — likely a
   thin UI layer once the recurrence engine is salvaged; sequence after at
   least one real entity (equipment) exists to remind about.
4. Carried over from README's old roadmap checklist (deprioritized below the
   pivot, not dropped): PDF export for tax filing, offline support and sync,
   multi-farm/entity support, recurring transaction templates, bank account
   integration, mileage tracking, equipment depreciation calculator.

## Open decisions

- Is this still primarily "an accounting app that also reminds/tracks," or
  has the center of gravity shifted to "a farm-life companion that also does
  accounting"? Affects README's framing/tagline, IA, and possibly the app's
  positioning. Equipment and livestock (the first two pivot features) are
  now merged, both still gated off by default — revisit this once they've
  been used enough in practice to have an opinion, rather than forcing it
  now.
- Data model for "field" and "equipment" entities, and how service/care
  records relate to the existing reminder system. Partially informed by the
  2026-08-20 decision log entry below (salvage `recurrence.ts`, don't reuse
  the old `tasks` table schema wholesale) but the actual entity schema is
  still undesigned.

## Decision log

(Append here as real architecture/product decisions get made in plan mode —
date, decision, why. This is what keeps future-you from re-litigating things.)

- **2026-08-20** — Reconciled the `tasks_module` branch (commit `6cbd07e`,
  unmerged, built for the old Life OS spec) against this roadmap's pivot.
  Decision: `tasks_module`'s `recurrence.ts` (interval/weekday/monthly due-
  date logic) and its `user_settings.enabled_modules` module-gating pattern
  are reusable groundwork for the new reminder system and should be salvaged
  when building equipment/livestock reminders. The rest of that branch —
  custody-week recurrence, co-parent sharing (`shared_with`/
  `shared_permissions`), the Discovery Mode `activity_log` table, and the
  grocery/meal-planning/family-life category taxonomy — belongs to the
  superseded Life OS plan and should NOT be merged as-is; none of it models
  farm entities (equipment/livestock/field), only task-category labels.
  `docs/farmwife-life-os-spec.md` (present only on `tasks_module`) is
  formally superseded by this file. Why: avoids duplicating the recurrence
  engine from scratch while avoiding dragging in unrelated family-life
  scope that doesn't fit the farm-companion direction.
- **2026-08-20** — Expanded equipment service records mid-branch to add
  Year/Make/Model/Serial Number fields plus camera+gallery tag/nameplate
  scanning (`supabase/functions/parse-equipment-tag`), beyond the original
  name+category+notes scope. Merged `feat/equipment-service-records` to
  `main` the same day after tag scanning was verified in person — service
  records and notifications were not yet exercised by real usage at merge
  time. Why: the module is off by default per-account
  (`user_settings.enabled_modules`), so merging early to unblock starting
  livestock care records (which reuses this branch's recurrence pattern)
  carries no risk to other users; testing continues on `main` rather than
  blocking the next feature on a separate branch.
- **2026-08-20** — Livestock care records built and merged same day as
  equipment. Confirmed shape mid-plan: tracking is group/herd by default
  with individual animals as an alternative row type (not one-row-per-
  animal-only, not bulk-apply), livestock photos are captured and stored
  as-is (no Claude vision parsing, unlike equipment's tag OCR), and care
  types are Vaccination/Deworming/Hoof Trimming/Other. In-person testing
  of equipment surfaced that completed records had no way to be reviewed
  (pending lists only show the next occurrence) — fixed for both features
  via `ServiceHistoryList`/`CareHistoryList` rather than deferring the fix
  to a follow-up. Also extracted `PhotoCapture` as a shared component (the
  third near-duplicate camera+gallery UI, after `ReceiptCapture` and
  equipment's `TagScanner`) and added a native date picker
  (`@react-native-community/datetimepicker`) everywhere a date was
  previously free-text — including the core transaction date field, which
  predates the pivot. Why: both the history gap and the date-entry UX were
  real usability problems surfaced by hands-on testing, not scope creep —
  fixing them once, shared across equipment/livestock/finance, was cheaper
  than fixing equipment's copy now and livestock's copy later.
