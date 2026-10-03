# Regency Events AV Tracker v18 - shared crew login setup

v18 includes working crew PIN logins and an Activity Tracker. The current app stores its data locally in the browser so it can be used immediately without a server.

For the same crew accounts and the same jobs/equipment to work across multiple phones, the app needs a shared backend. Supabase is the planned backend because the app is already a static GitHub Pages PWA.

## What will be needed for shared mode

1. Create a Supabase project.
2. Enable Email/Password authentication.
3. Create a `regency_state` table with:
   - `org_id` text primary key
   - `state` jsonb not null
   - `updated_at` timestamptz default now()
4. Enable Row Level Security and allow authenticated users in the same Regency organisation to read/write that row.
5. Add the Supabase project URL and anon/publishable key to the app configuration.

Do NOT put a Supabase service-role/secret key into GitHub Pages.

The v18 local PIN system is intentionally separate from cloud authentication. This means you can start using named crew logins now without exposing a secret key or pretending the current browser storage is a shared database.
