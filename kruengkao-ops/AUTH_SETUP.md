# Authentication & Access Control — Setup Guide

This app is locked to authenticated **team members only**, using Google
sign-in (Supabase Auth) plus auth-scoped Row Level Security (RLS). This
document explains how it works and how to (re)configure it.

## How it works

| Layer | Where | Responsibility |
| --- | --- | --- |
| Route gate | `src/proxy.ts` → `src/lib/supabase/session.ts` | Refreshes the Supabase session on every request; redirects signed-out users to `/login` (preserving `?next=`). **UX only — not a security boundary.** |
| Login | `src/app/login/` + `src/components/auth/login-form.tsx` | "Sign in with Google" button (PKCE OAuth). |
| Callback | `src/app/auth/callback/route.ts` | Exchanges the OAuth `code` for a session, then redirects to `next`. Shows `?error=not_authorized` if the signup gate rejected the account. |
| Sign-out / identity | `src/app/auth-actions.ts` + `src/components/auth/user-menu.tsx` | Avatar menu (in every page header) showing the signed-in email + "ออกจากระบบ". |
| **Security boundary** | `supabase/migrations/0006_auth_and_rls.sql` | Every app table is `authenticated`-only RLS. A `before insert` trigger on `auth.users` gates *who* may create an account. |

> **Important:** Next.js 16 renamed the `middleware` convention to `proxy`
> (`proxy.ts`, Node.js runtime). Per the Next docs, Server Actions are POSTs that
> can bypass proxy matchers, so **RLS is the real read/write boundary** — the
> proxy only handles the redirect-to-login experience.

## Who is allowed in

A Google account can sign in only if **its email domain is in
`allowed_domains`** OR **its exact address is in `allowed_emails`**. Everything
else is rejected at account-creation time by the `enforce_allowed_signup()`
trigger (the OAuth callback then shows a friendly "not authorized" message).

- Seeded domain: `kruengkao.com`
- Both lists have RLS enabled with **no policies**, so only the service role
  (SQL editor / Table editor) can read or change them — the app can't.

Manage access from the Supabase **SQL Editor**:

```sql
-- Allow an extra individual (e.g. a freelancer on Gmail)
insert into public.allowed_emails (email) values ('freelancer@gmail.com');

-- Allow an entire additional domain
insert into public.allowed_domains (domain) values ('anotherlabel.com');

-- Revoke access (existing sessions end at their next token refresh)
delete from public.allowed_emails  where email  = 'freelancer@gmail.com';
delete from public.allowed_domains where domain = 'anotherlabel.com';
```

## One-time setup (already completed)

### 1. Apply the migration
Supabase → **SQL Editor** → run `supabase/migrations/0006_auth_and_rls.sql`.
This locks down RLS on all app tables and installs the signup gate.

### 2. Create the Google OAuth client
Google Cloud Console → **APIs & Services → Credentials → Create OAuth client
ID → Web application**. Set the **Authorized redirect URI** to Supabase's
callback (not the app's):

```
https://awkmwqaxuocoxvmnvovp.supabase.co/auth/v1/callback
```

Copy the **Client ID** and **Client Secret**.

### 3. Enable Google in Supabase
Dashboard → **Authentication → Providers → Google** → enable, paste the Client
ID + Secret, save.

### 4. Configure Auth URLs
Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` for local dev (use the deployed URL in
  production).
- **Redirect URLs**: add `http://localhost:3000/**` (and the production URL
  when you deploy). This allows the app's own `/auth/callback` target.

### 5. Keep sign-ups enabled
With Google, a teammate's **first login creates their account** — the DB
trigger is what restricts *who* succeeds. Do **not** disable sign-ups, or even
allowed members won't be able to onboard.

## Verifying it works

- **Anonymous is blocked (RLS).** With only the public anon key (no session),
  `select` on `projects`/`tasks` returns `[]` and any `insert` fails with
  `42501 "new row violates row-level security policy"`. Confirmed ✔
- **OAuth is wired.** Visiting the Supabase `authorize` endpoint redirects to
  Google with the correct `client_id`, the Supabase `redirect_uri`, and
  `response_type=code`. Confirmed ✔
- **Sign-in success (do this with your own account):** open `/login`, click
  "เข้าสู่ระบบด้วย Google", pick your `@kruengkao.com` account → you should land
  on the dashboard with your email in the top-right avatar menu.
- **Outside-account rejection:** sign in with a Google account that is neither
  on an allowed domain nor in `allowed_emails` → you're bounced back to
  `/login` with "บัญชีนี้ยังไม่ได้รับอนุญาต…". The rejection is also visible in
  Supabase → **Authentication → Logs**.

## Production checklist

- [ ] Deploy the app and note its production URL (see **Deploying to Vercel**).
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
      host's environment (same values as `.env.local`; both are safe to expose —
      RLS is what protects the data).
- [ ] Supabase → **Authentication → URL Configuration**: set **Site URL** to the
      production URL and add `https://<prod-domain>/**` to **Redirect URLs**
      (keep `http://localhost:3000/**` for local dev). This is the #1 cause of a
      broken production login — an origin not on this list is refused.
- [ ] Google Cloud — **no change needed.** The OAuth client's authorized redirect
      URI is Supabase's callback
      (`https://awkmwqaxuocoxvmnvovp.supabase.co/auth/v1/callback`), which is the
      same across every environment. Only Supabase's Redirect URLs change per app
      origin, not Google's.
- [ ] Confirm `allowed_domains` / `allowed_emails` cover the whole team.
- [ ] Smoke-test on production: sign in with a `@kruengkao.com` account (lands on
      dashboard) and an outside account (bounced with the unauthorized message).

## Deploying to Vercel

The Next.js app lives in the **`kruengkao-ops/` subfolder** of the repo
(`wisitpow-gif/label-ops-dashboard`), so the Root Directory must be set
accordingly.

1. **Import** the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory** → set to `kruengkao-ops` (click *Edit* next to Root
   Directory during import). Framework preset auto-detects as **Next.js**; leave
   Build Command / Output Directory on their defaults.
3. **Environment Variables** → add the two `NEXT_PUBLIC_SUPABASE_*` values
   (Production, Preview, and Development scopes).
4. **Deploy.** Vercel gives you a `https://<project>.vercel.app` URL.
5. Back in **Supabase → Authentication → URL Configuration**, set **Site URL** to
   that URL and add `https://<project>.vercel.app/**` to **Redirect URLs**.
6. **Smoke-test** the production login (both the success and rejection paths).
7. *(Optional)* Add a custom domain in Vercel (e.g. `ops.kruengkao.com`), then
   add that origin to Supabase's Site URL + Redirect URLs too.

> **Preview deploys:** each PR gets its own `*.vercel.app` URL. Those origins are
> also refused by Supabase auth unless added to Redirect URLs. Either add the
> Vercel preview wildcard `https://*-<team>.vercel.app/**`, or simply test auth on
> the production/localhost origins.
