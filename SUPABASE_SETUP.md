# Regency Events Cloud Sync setup

1. In Supabase, open **SQL Editor** and run `supabase-schema.sql`.
2. In **Authentication → Providers**, keep Email enabled. For easiest crew setup you can disable email confirmation while testing, then enable it later if desired.
3. Deploy the complete V19/V18 package to GitHub Pages.
4. Open the app and tap **Cloud Login**. Each crew member can create their own email/password account.
5. The first device with existing local data should log in first. If the cloud table is empty, the app uploads the existing local data.
6. Other phones log in with their own cloud accounts and download the shared state. Changes are pushed to Supabase and broadcast to other phones.

The browser uses only the Supabase publishable key. Never put a `service_role` or secret key in the GitHub repository.

Current initial architecture: one shared Regency state document with Supabase Realtime. This is suitable for the single-company deployment. Later, if needed, the state can be split into individual database tables for finer-grained permissions and conflict handling.
