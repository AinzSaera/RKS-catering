# RKS Catering — GitHub Pages + Supabase

A responsive, gold-and-cream catering website for RKS Catering. The supplied event posters are used as **event-gallery highlights**, not represented as written customer reviews. All inquiry buttons are intended for Messenger. Phone, email, and map links remain available in the Contact section.

## Files

- `index.html` — website structure, navigation, contact buttons, visible Admin login
- `styles.css` — responsive premium styling, hover states, reveal animations, mobile navigation
- `script.js` — gallery rendering, Messenger inquiry form, Supabase authentication and admin gallery manager
- `config.js` — public Supabase URL/key and the RKS Messenger page link
- `supabase.sql` — gallery table, secure row-level policies, sample gallery rows and admin membership table
- `assets/` — the original logo and event assets, plus the four new event photos (all committed locally so they display on GitHub Pages)

## Step 1 — Upload to GitHub

1. Download and extract `RKS_Catering_Updated_Inquiry_Form.zip`.
2. Open the GitHub repository used for Sir MJ's website.
3. Replace the existing site files with the files in this folder. Keep the `assets` folder.
4. Commit the changes.
5. In **Settings → Pages**, select the correct branch and root folder if Pages is not already enabled.

## Step 2 — Configure Supabase safely

1. Open the correct Supabase project.
2. Go to **Project Settings → API** (or the project's API keys page).
3. Copy the **Project URL** and the **publishable key** (or legacy anon public key).
4. Open `config.js` and replace only:
   - `https://YOUR-PROJECT-REF.supabase.co`
   - `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
5. Set `MESSENGER_URL` to the actual RKS Catering Facebook Messenger URL, e.g. the page's `https://m.me/...` link.
6. Do **not** use a `service_role` key or any secret key in `config.js`. This file is public on GitHub Pages.

## Step 3 — Create the database

1. In Supabase, open **SQL Editor → New query**.
2. Paste the complete contents of `supabase.sql`.
3. Run it.
4. The `rks_gallery` table and starter event items will be created. Public visitors can read published items; only approved admin accounts can create, update, or delete gallery items.

## Step 4 — Give admin access to Sir MJ only

1. In Supabase, go to **Authentication → Users → Add user**.
2. Create or invite Sir MJ's account with his own email. Do not share his password in chat.
3. Copy the new user's **UID**.
4. In SQL Editor, run the following after replacing the placeholder with the exact UID:
   ```sql
   insert into public.admin_users (user_id, label)
   values ('PASTE-SIR-MJ-AUTH-USER-UUID-HERE'::uuid, 'Sir MJ')
   on conflict (user_id) do nothing;
   ```
5. Do not add other user UIDs. The admin button remains visible on the site, but database changes are protected by Supabase Row Level Security and membership in `admin_users`.

## Step 5 — Test

1. Open the published GitHub Pages URL and hard-refresh (`Ctrl + F5`).
2. Check the Services, Our Events, Contact, phone, email and directions links.
3. Click **Admin Login** in the header or **Admin login** in the footer.
4. Sign in with Sir MJ's authorized account.
5. Add or edit an event. For the supplied images, use paths such as `assets/nicoles-18th-birthday.png`. Use `assets/...` for images committed to GitHub or an HTTPS URL for externally hosted images.
6. Confirm that a published gallery change appears on the public website after refresh.
7. Click Sign out and confirm the dashboard closes.

## Important notes

- **Messenger:** update `MESSENGER_URL` in `config.js`; the real RKS page username/link was not provided in the uploaded images, so the default is intentionally a placeholder.
- **Admin security:** hiding the dashboard is not the security boundary; Supabase RLS and `admin_users` membership are. Never put a service-role secret in frontend files.
- **Google reviews:** no review API has been connected and the event posters are not customer review records. This version labels them honestly as event highlights. Add a verified Google Business Profile review link separately if desired.
- **Photo uploads:** the starter admin manager supports local paths or HTTPS image URLs; it does not upload files to Supabase Storage. To add a new photo locally, commit it inside `assets/` and use its path in the admin manager.
- **Supabase limits/cost:** GitHub Pages can host static files at no charge under its current plan, and Supabase offers a free tier subject to its limits. Custom domains and usage beyond included quotas may cost extra.


## Included assets

The `assets/` folder retains the original starter logo and event images, along with the newer RKS logo crop and the four newly sent images: Nicole’s 18th Birthday, Olivia Turns Six, the wedding reception, and the RKS event highlight. The gallery displays clean image cards; contact information is kept in the Contact section only.


## Event inquiry form

The Event Inquiry section collects a name, contact number, event date, celebration type, guest estimate, venue/city, and optional preferences. On submit, it prepares a formatted message, attempts to copy it, and opens the configured Messenger page. The visitor must paste and send the message themselves. No inquiry is automatically sent or stored in Supabase.
