# Regency Events Cloud Sync setup

1. In Supabase, open **SQL Editor** and run `supabase-schema.sql`.
2. In **Authentication → Providers**, keep Email enabled. For easiest crew setup you can disable email confirmation while testing, then enable it later if desired.
3. Deploy the complete V48 package to GitHub Pages.
4. Open the app and tap **Cloud Login**. Each crew member can create their own email/password account.
5. The first device with existing local data should log in first. If the cloud table is empty, the app uploads the existing local data.
6. Other phones log in with their own cloud accounts and download the shared state. Changes are pushed to Supabase and broadcast to other phones.

The browser uses only the Supabase publishable key. Never put a `service_role` or secret key in the GitHub repository.

Current initial architecture: one shared Regency state document with Supabase Realtime. This is suitable for the single-company deployment. Later, if needed, the state can be split into individual database tables for finer-grained permissions and conflict handling.


## Health & Safety cloud storage (V48)

Run the complete `supabase-schema.sql` in the Supabase SQL Editor. The V48 schema creates the private `regency-hs` Storage bucket and policies for authenticated Regency users.

After that, H&S documents and uploaded training videos are stored in Supabase Storage and their metadata is synchronised through `regency_state`. The browser keeps a local cache for fast/offline access. Existing H&S files on the first device are automatically uploaded to the cloud after login.
