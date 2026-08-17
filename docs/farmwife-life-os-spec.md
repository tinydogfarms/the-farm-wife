# Farm Wife — Life OS Spec
**Handoff document for Claude Code**
**Version:** 1.0 | **Date:** June 2026

---

## Overview

Farm Wife is being expanded from a farm accounting app into a full life OS for a work-from-home data engineer who also manages a household, small farm, two kids (alternating weekly custody), and a husband. The goal is a single source of truth that replaces: Outlook (personal/family), a grocery list app, a to-do app, and Sweepy (cleaning rotation tracker).

The existing income/expense tracker (Schedule F) is **in production and must not be touched** during this build. All new work is additive.

### Core design principles
- **The app remembers, not the user.** Every recurring task, prescription refill, cleaning cycle, and animal care item lives in the app — not in her head.
- **Staged, review-gated execution.** Never auto-create, auto-delete, or auto-schedule anything without user approval. Surface recommendations → user confirms → system executes.
- **Friction is the enemy.** Capture must be fast. If logging takes more than a few seconds, it won't happen.
- **One data model.** Animal care, household tasks, grocery lists, to-dos, admin, medical, and kid logistics all live in the same task engine, not separate modules.

---

## Users

- **Primary:** Amanda (existing auth user)
- **Secondary:** Husband (separate auth account, shared access to designated content)

Sharing is **per-list and per-task-category**, not global. Some lists are fully shared (both can edit), some are read-only for husband, some are Amanda-only. This is set at creation time.

---

## Phase 1: Core Task Engine + Categories

### Schema

#### `tasks` table
```sql
id                  uuid primary key
user_id             uuid references auth.users -- owner/creator
title               text not null
category            text not null  -- see categories below
owner               text not null  -- 'amanda' | 'husband' | 'shared'
recurrence_type     text           -- 'none' | 'interval' | 'weekday' | 'monthly' | 'custody_week'
recurrence_interval integer        -- days between recurrence (if interval)
recurrence_day      text           -- day of week or day of month (if weekday/monthly)
custody_week        text           -- 'mine' | 'theirs' (if custody_week type)
next_due            timestamptz
estimated_duration  integer        -- minutes; populated by Discovery Mode
notes               text
status              text default 'pending' -- 'pending' | 'complete' | 'skipped'
completed_at        timestamptz
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

#### Categories
- `animal` — feeding, medications, pen maintenance, vet appointments
- `household` — dishes, laundry, general tasks
- `cleaning` — rotation-based cleaning tasks (Sweepy replacement)
- `grocery` — linked to a list
- `admin` — bills, appointments, paperwork
- `medical` — prescriptions (monthly refills), doctor appointments
- `kid` — school, activities, custody-week-dependent tasks
- `farm_ops` — farm-specific non-animal tasks (equipment, seasonal)

#### RLS Policy
Enable RLS on `tasks`. Users can only read/write their own rows. Husband's shared access is handled at the application layer via a `shared_with` field, not by relaxing RLS.

---

### Shared Access Model

```sql
-- Add to tasks table:
shared_with         text[]         -- array of user_ids who have access
shared_permissions  text           -- 'read' | 'edit'
```

When a task or list is shared with husband's user_id and `shared_permissions = 'edit'`, he can mark complete, add items, and update status. With `'read'` he can only view.

---

### Recurring Task Engine

When a task with `recurrence_type != 'none'` is marked complete:
1. Record completion in `activity_log`
2. Calculate next `next_due` based on recurrence rules
3. Create a new pending task row (do not mutate the completed row)
4. Surface to user: "Next [task] scheduled for [date] — confirm or adjust?"

**Custody week logic:**
- App tracks current custody week (Amanda's week vs. not)
- Tasks with `recurrence_type = 'custody_week'` only appear during the designated week
- Kid activities, school pickups, etc. use this type

---

## Phase 2: Lists (Grocery + To-Do)

Lists are flexible named containers, separate from the recurring task engine but living in the same app.

### Schema

#### `lists` table
```sql
id                  uuid primary key
user_id             uuid references auth.users
name                text not null          -- 'Costco', 'Tractor Supply', 'This Week', etc.
list_type           text not null          -- 'shopping' | 'todo'
is_template         boolean default false  -- if true, items persist after archive for reuse
shared_with         uuid[]                 -- husband's user_id if shared
shared_permissions  text                   -- 'read' | 'edit'
archived_at         timestamptz            -- null = active
created_at          timestamptz default now()
```

#### `list_items` table
```sql
id                  uuid primary key
list_id             uuid references lists
added_by            uuid references auth.users
title               text not null
quantity            text                   -- optional, free text ('2 bags', '1 lb')
notes               text
is_checked          boolean default false
checked_at          timestamptz
checked_by          uuid references auth.users
sort_order          integer
created_at          timestamptz default now()
```

### List behaviors
- **One-off lists:** archive when done, items don't persist
- **Template lists:** archive clears checked state but preserves all items for next use (e.g., standard Costco run)
- **Multiple active lists at once** — user can have Costco, Target, and farm supply lists open simultaneously
- Lists are accessible from a dedicated **Lists** tab, separate from the task dashboard

---

## Phase 3: Discovery Mode

A 2-week calibration phase that learns the user's actual routine before hard-coding recurring tasks. **Off by default, user-initiated.**

### Schema

#### `activity_log` table
```sql
id                  uuid primary key
user_id             uuid references auth.users
raw_label           text not null          -- what the user said/tapped
category            text                   -- mapped category
source              text not null          -- 'recap' | 'tap_timer' | 'dread_timer'
duration_seconds    integer                -- null if recap without timing
started_at          timestamptz
ended_at            timestamptz
discovery_session   boolean default true   -- false after Discovery Mode ends
created_at          timestamptz default now()
```

### Three capture modes

#### 1. End-of-day recap (primary mode)
- Single text or voice input: "Fed the animals, about 15 min. Did dishes. Refilled prescriptions."
- AI call parses the recap into structured `activity_log` entries with estimated durations
- User reviews parsed entries before they're saved — never auto-save raw AI output
- Accessible from a persistent "Log my day" button

#### 2. Tap-timer
- Tap a task → timer starts → tap done → logs duration
- Used for tasks where precision matters
- Available during and after Discovery Mode as a general feature

#### 3. Dread-timer
- Same mechanism as tap-timer but framed differently in UI
- Entry point: "Time a dreaded task" — prominent, easy to reach
- After stopping: shows actual duration + running average ("This has averaged 8 min across 6 sessions")
- Purpose: surfacing the gap between anticipated and actual effort to remove mental blocks

### Discovery Mode output
After 2 weeks, the app clusters `activity_log` entries and surfaces candidates:
- "You did this ~12 times over 14 days, averaging 9 minutes — add as a recurring task?"
- User reviews each candidate and approves, edits, or dismisses
- Approved candidates graduate to `tasks` table with `estimated_duration` populated
- Seasonal/infrequent tasks are noted as not captured — user adds manually

---

## Phase 4: Calendar + Outlook Sync

### In-app calendar
- Displays tasks with `next_due` dates
- Custody week toggle — shows kid tasks only during Amanda's weeks by default, toggle to view all
- Color-coded by category

### Outlook sync (one-way: Farm Wife → Outlook)
- Pushes tasks with `next_due` to Outlook personal calendar via Microsoft Graph API
- Work calendar stays in Outlook only — no read from Outlook into Farm Wife
- Sync triggers on task creation, update, and completion
- Each pushed event includes category, estimated duration, and notes in the event body
- Sync is one-way — changes in Outlook do not write back to Farm Wife

### Implementation notes
- Requires Microsoft Graph API OAuth flow — user authenticates once, token stored securely
- Only push tasks where `owner = 'amanda'` or `owner = 'shared'` (not husband-only tasks)
- Do not push grocery list items or to-do list items — tasks only

---

## Phase 5: Admin + Medical Recurring Tasks

### Prescriptions
- Monthly recurring tasks with configurable lead time ("remind me 5 days before due")
- Separate entries per prescription per person (Amanda / husband)
- Notes field for pharmacy, Rx number, etc.

### Bills
- Monthly recurring with due date
- Status: pending → paid
- No payment processing — this is a reminder system only

### Appointments
- One-off tasks with `next_due` = appointment datetime
- Category: `admin` or `medical`
- Pushed to Outlook calendar

---

## Phased Build Order

### Phase 1 — Foundation (build first)
- `tasks` table + RLS
- `activity_log` table + RLS
- Basic task CRUD: create, view, complete, edit, delete (with confirmation)
- Category filter view
- Recurring task engine (completion → next_due calculation → new row)
- Shared access model

### Phase 2 — Lists + Meal Planning (build together)
These two modules are tightly coupled — the meal plan generates grocery lists directly.

#### Lists
- `lists` and `list_items` tables + RLS
- Lists tab: create, archive, template toggle
- Per-list sharing + permissions
- Check off items; template reset on archive

#### Meal Planning
- `meals`, `freezer_inventory`, `recipe_inspiration`, `meal_plan` tables + RLS
- Meal pool: add, edit, retire meals; tag with cut, frequency, kid-friendliness
- Freezer inventory: cuts + rough quantities; bulk update when restocking whole cow
- Rotation engine: suggests ~5 meals per week based on freezer inventory, last_served, repeat_frequency_days; one slot per week flagged as "try something new"
- Inventory awareness: low stock on a cut surfaces in suggestions
- Inspiration inbox: receives shared links via iOS/Android share sheet; AI extracts title and protein cut; user promotes to meal pool or dismisses
- Grocery list push: confirm a planned meal → one tap appends ingredients to any active grocery list, excluding what's in freezer inventory

### Phase 3 — Discovery Mode
- Discovery Mode toggle (off by default)
- End-of-day recap input + AI parsing call + user review
- Tap-timer
- Dread-timer with running average display
- Candidate surfacing + approval flow → graduates to tasks table

### Phase 4 — Calendar + Outlook sync
- In-app calendar view with category colors
- Custody week toggle
- Microsoft Graph API OAuth
- One-way push to Outlook on task create/update/complete

### Phase 5 — Admin + Medical
- Prescription recurring tasks with lead-time reminders
- Bill recurring tasks
- Appointment one-off tasks

---

## Constraints + Non-Negotiables

- **Never auto-execute.** Every write to the database that originates from AI (recap parsing, candidate generation) must be staged for user review first.
- **Never touch the existing finance module.** `transactions` table, receipt storage, CSV export, and all related components are off-limits.
- **Husband's access is additive.** He gets his own auth account. Shared content is surfaced to him based on `shared_with` field. He does not see Amanda-only tasks.
- **RLS on every new table.** No exceptions.
- **Confirm before delete.** Every destructive action needs an `Alert.alert` confirmation, consistent with the pattern already in ReceiptCapture.tsx.
- **No payment processing** anywhere in the app.
- **Discovery Mode is opt-in.** It does not run passively in the background.

---

## Module System

Farm Wife is built as a modular app. Each phase beyond the core is a discrete module that can be enabled or disabled per user. This architecture supports future monetization without retrofitting — today all modules are enabled for all users, but the infrastructure is in place to gate them behind a subscription when Farm Wife becomes a product.

### Schema

#### `user_settings` table
```sql
id                  uuid primary key
user_id             uuid references auth.users unique
enabled_modules     text[] default '{tasks,lists,discovery,calendar,admin_medical}'
subscription_tier   text default 'free'    -- 'free' | 'premium' (not enforced yet, reserved)
custody_week_start  date                   -- first day of Amanda's first custody week
custody_alternates  boolean default true   -- true = alternates every 7 days from start date
outlook_token       text                   -- encrypted OAuth token for Graph API (Phase 4)
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### Module definitions

| Module key        | Phase | Description                                      | Core or Add-on |
|-------------------|-------|--------------------------------------------------|----------------|
| `tasks`           | 1     | Recurring task engine, all categories, shared access | Core       |
| `lists`           | 2     | Grocery + to-do lists, templates, per-list sharing | Core         |
| `discovery`       | 3     | Discovery Mode, recap, tap-timer, dread-timer    | Add-on         |
| `calendar`        | 4     | In-app calendar + one-way Outlook sync           | Add-on         |
| `admin_medical`   | 5     | Prescriptions, bills, appointment reminders      | Add-on         |

### Implementation rules
- On app load, fetch `user_settings` for the authenticated user and store `enabled_modules` in app state
- Every module's tab, entry point, and navigation route checks `enabled_modules` before rendering
- If a module is disabled, its tab/button is hidden entirely — not grayed out, not locked with a padlock, just absent. Paywall UI comes later when there's actually something to gate.
- The finance module (Schedule F) is **not part of the module system** — it is always enabled and outside this architecture
- When a new user is created, insert a default `user_settings` row with all modules enabled

### Future monetization path (not built now)
When ready to productize:
1. Add a `subscription_tier` check alongside the `enabled_modules` check
2. `free` tier gets `tasks` + `lists` only
3. `premium` tier unlocks `discovery`, `calendar`, `admin_medical`
4. Add paywall UI at that point — the feature boundaries are already clean

---

## Open Questions (resolve before or during Phase 4)

1. Does Amanda already have a Microsoft 365 account for Graph API OAuth, or is this personal Outlook (consumer)?
2. Should custody week be a manual toggle in the app or calculated from a start date + alternating pattern?
3. Should the dread-timer running average persist across Discovery Mode (i.e., available always as a feature)?

---

*This document is the single source of truth for the Farm Wife Life OS expansion. Build phases sequentially. Stage all changes for review before committing to the database or pushing to GitHub.*

---

## Phase 2 Detail: Meal Planning

### Schema

```sql
meals (
  id                    uuid primary key,
  user_id               uuid references auth.users,
  title                 text not null,
  source_url            text,
  protein_cut           text,
  prep_minutes          integer,
  is_kid_friendly       boolean default false,
  cuisine_type          text,
  repeat_frequency_days integer,
  last_served           date,
  notes                 text,
  status                text default 'active'   -- 'active' | 'retired'
)

freezer_inventory (
  id                    uuid primary key,
  user_id               uuid references auth.users,
  cut                   text not null,
  quantity_lbs          decimal,
  notes                 text,
  last_updated          timestamptz default now()
)

recipe_inspiration (
  id                    uuid primary key,
  user_id               uuid references auth.users,
  source_url            text,
  title                 text,
  thumbnail_url         text,
  raw_notes             text,
  ai_extracted_cut      text,
  status                text default 'inbox'    -- 'inbox' | 'added_to_pool' | 'dismissed',
  created_at            timestamptz default now()
)

meal_plan (
  id                    uuid primary key,
  user_id               uuid references auth.users,
  meal_id               uuid references meals,
  planned_for           date,
  is_new_recipe         boolean default false,
  grocery_list_id       uuid references lists,
  status                text default 'planned'  -- 'planned' | 'made' | 'skipped'
)
```

### Module key
Add `meal_planning` to the `enabled_modules` array in `user_settings`. Default: enabled.
