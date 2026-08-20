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

## Next up (prioritized 2026-08-20 — see decision log)

Pivot items first, since they're the current product direction; finance
backlog carried over below but deprioritized.

1. **Equipment service records** — smallest, most self-contained pivot
   feature. One new entity (`equipment`) with recurring service events (e.g.
   oil changes per tractor). Reuses the interval-recurrence logic salvaged
   from `tasks_module`'s `recurrence.ts` and establishes the "entity +
   recurring care event" pattern that livestock and field tracking also
   need. No external dependencies.
2. **Livestock care records** — same entity + recurring-care-event pattern
   as equipment (e.g. hoof trimming schedule per animal), built once
   equipment proves the pattern out.
3. **Weather / rain alerts** — standalone, no dependency on the entity
   pattern, but needs a weather API integration and likely
   `expo-notifications` (not currently a dependency) for alerting.
4. **Field-level tracking** — most complex: ties yield, expense, and service
   records together across a field. Best done after equipment/livestock
   validate the entity+recurrence data model.
5. **Reminders & calendar** (day-of-week orientation, birthdays) — likely a
   thin UI layer once the recurrence engine is salvaged; sequence after at
   least one real entity (equipment) exists to remind about.
6. Carried over from README's old roadmap checklist (deprioritized below the
   pivot, not dropped): PDF export for tax filing, offline support and sync,
   multi-farm/entity support, recurring transaction templates, bank account
   integration, mileage tracking, equipment depreciation calculator.

## Open decisions

- Is this still primarily "an accounting app that also reminds/tracks," or
  has the center of gravity shifted to "a farm-life companion that also does
  accounting"? Affects README's framing/tagline, IA, and possibly the app's
  positioning. Likely to resolve itself once the first pivot feature
  (equipment service records) ships — revisit then rather than forcing it
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
