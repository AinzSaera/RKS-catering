# RKS Catering — Complete Website + Customer Reviews

This is the full RKS Catering website package based on the working gold-and-cream version. It keeps the homepage, services, event gallery, about section, Messenger-only inquiry form, contact links, Supabase admin login, and event gallery manager, and integrates customer star ratings/reviews into the same site and admin portal.

## Files

- `index.html` — complete website, including the integrated Reviews section and admin portal.
- `styles.css` — complete responsive gold-and-cream styling, including review cards and forms.
- `script.js` — navigation, Messenger inquiry, Supabase gallery manager, customer review submission, public ratings, and admin review moderation.
- `config.js` — existing public Supabase connection and RKS Facebook page link. The Supabase publishable key is designed for browser use; never replace it with a service-role/secret key.
- `supabase.sql` — gallery setup/policies and the `rks_reviews` table/policies. It is safe to rerun for the same schema; gallery seed rows are not duplicated.
- `assets/` — the existing RKS logo and event images.

## Deploy to the same GitHub Pages repository

1. Download and extract this ZIP.
2. Open the existing `RKS-catering` GitHub repository.
3. Upload/replace the files from this folder in the repository root. Keep the entire `assets` folder. Do not upload the ZIP itself as the website.
4. Commit the changes. GitHub Pages should redeploy from the same branch/root setting as before.
5. Open the published website and hard-refresh with `Ctrl + F5`.

## Supabase setup

1. Open the same Supabase project used by the existing website.
2. Go to **SQL Editor → New query**.
3. Paste the complete `supabase.sql` file and run it. It keeps the gallery/admin setup and adds the customer reviews table and row-level security policies.
4. The existing `admin_users` row for Sir MJ is preserved. The website checks membership in `admin_users` before showing the admin tools.

## How customer reviews work

1. A visitor submits their name, a 1–5 star rating, and written feedback.
2. The review is saved as **pending** and is not visible publicly yet.
3. Sir MJ signs in using the existing **Admin Login** button.
4. In **Customer reviews manager**, he can select **Approve & publish**, **Hide review**, or **Delete**.
5. Published reviews appear in the Reviews section with an automatically calculated average rating and published review count.

The rating is calculated from reviews submitted through this website. It is not represented as a Google rating or imported Google Reviews data. Only publish genuine customer feedback.

## Messenger inquiry

The event inquiry form prepares a formatted message and opens the RKS Catering Facebook page. The visitor must paste/send the message themselves. The inquiry is not automatically sent or stored in Supabase.

## Safety and troubleshooting

- Never place a Supabase service-role key, database password, or admin password in frontend files.
- Public visitors can submit pending reviews and read published reviews. Only accounts listed in `admin_users` can view pending reviews, approve/hide, or delete reviews; RLS policies enforce this in Supabase.
- If the review section says the database is unavailable, check that `supabase.sql` completed successfully in the same Supabase project configured in `config.js`.
- If the admin login says the account is unauthorized, verify that Sir MJ's Auth UID is present in `public.admin_users`.
- GitHub Pages and Supabase free tiers have usage limits; charges may apply if you add paid services or exceed plan limits.
