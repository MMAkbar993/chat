# Website & Social Ownership Verification System

This document describes the implementation of the Website and Social Ownership Verification System for fraud prevention.

## Overview

The system verifies that users actually own the websites or social profiles they claim, preventing scammers from pretending to represent companies they do not own.

---

## How to verify your website (step-by-step)

1. **Log in** to the app and open **Settings** (or **Profile** → **Account**).
2. **Add your website**  
   In the **Website** or **Social Profiles** section, enter your site URL in the website field. Accepted formats:
   - `example.com`
   - `www.example.com`
   - `https://example.com`
   - `http://example.com`  
   Submit or save (the app will call the API to add the website).
3. **Get your verification meta tag**  
   After adding the website, the app will show a **verification meta tag**, for example:
   ```html
   <meta name="greenunimind-verification" content="guv-8F3K29X" />
   ```  
   (The `content` value is unique to your website entry.)
4. **Add the meta tag to your site**  
   - Open the **HTML source** of your website (the real site you entered, e.g. example.com).
   - Find the `<head>` section (near the top, before `</head>`).
   - Paste the **entire** meta tag **inside** `<head>`, for example:
   ```html
   <head>
       <meta charset="UTF-8">
       <meta name="greenunimind-verification" content="guv-8F3K29X" />
       <!-- other tags -->
   </head>
   ```
   - Save and **publish** your site so the change is live.
5. **Click Verify**  
   Back in the app, use the **Verify** button (or **Verify website**) next to that website. The server will:
   - Fetch your site’s HTML
   - Look for the meta tag in `<head>`
   - If it finds the tag with the matching token, the website is marked **Verified**.
6. **If verification fails**  
   - Ensure the meta tag is **inside** `<head>` (not in `<body>`).
   - Ensure the site is **publicly reachable** (not only on localhost, unless you are testing locally).
   - Ensure there are **no typos** in the meta tag and that you **saved and published** the page.
   - Try **Verify** again after a short delay (cache may need to update).

**Note:** The first user to verify a website becomes the **Company Admin** for that domain. Other users who add the same domain will see “This website has already been verified” and can **Request Representation** instead.

---

## 1. Website Verification (Meta Tag Method)

### Verification Flow

1. **User enters website URL** – Accepted formats:
   - `www.example.com`
   - `example.com`
   - `https://example.com`
   - `http://example.com`

   All formats normalize to the same domain before validation.

2. **Generate Verification Token**
   - When user submits a website, a unique verification ID is generated (e.g. `guv-8F3K29X`)
   - User is shown instructions to add this meta tag inside `<head>`:
   ```html
   <meta name="greenunimind-verification" content="guv-8F3K29X" />
   ```

3. **Verify Ownership**
   - Backend fetches website HTML
   - Checks `<head>` for the meta tag
   - Confirms token matches database record
   - If found → Website is **VERIFIED**

### Company Admin Logic

- **First verified user** becomes **Company Admin (Website Owner)**
- Confirmation message: *"You are the first user to verify this website and will become the company administrator. You will manage representation requests."*
- Only ONE admin per verified website

### Duplicate Website Handling

- If another user enters a website that is already verified:
  - System displays: *"This website has already been verified."*
  - Button: **Request Representation**

### Representation Request Flow

1. User clicks **Request Representation**
2. Request sent to company admin with: Requester Name, Email, User ID, Message
3. Admin sees: **Approve** | **Deny**
4. **If Approved**: Website appears in requester's profile; user becomes Authorized Representative
5. **If Denied**: Website field remains empty; request marked rejected

---

## 2. API Endpoints

### Website Endpoints (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/websites` | List user's websites |
| POST | `/api/websites/store` | Add website (returns meta tag or already_verified) |
| POST | `/api/websites/check-domain` | Check if domain is already verified |
| POST | `/api/websites/request-representation` | Request to represent an already-verified website |
| POST | `/api/websites/authorized-users` | List pending requests & representatives (Company Admin only) |
| POST | `/api/websites/{id}/verify` | Trigger meta tag verification |
| POST | `/api/websites/representation/{id}/approve` | Approve representation request |
| POST | `/api/websites/representation/{id}/deny` | Deny representation request |
| DELETE | `/api/websites/{id}` | Remove website |
| DELETE | `/api/websites/{websiteId}/representative/{userId}` | Remove representative |
| POST | `/api/websites/reorder` | Reorder websites |

### Social Account Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social-accounts` | List OAuth-verified social accounts |
| DELETE | `/api/social-accounts/{id}` | Disconnect social account |

### Web Routes (Session auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/connect/{platform}` | Redirect to OAuth (Facebook, Instagram, X, LinkedIn, YouTube, Twitch, Kick) |
| GET | `/connect/{platform}/callback` | OAuth callback |

---

## 3. Database Schema

### `websites`
- `id`, `domain` (unique), `admin_user_id`, `verified_at`, `created_at`, `updated_at`

### `user_websites` (modified)
- Added: `website_id`, `relationship_type` (owner|representative)

### `website_representatives`
- `id`, `website_id`, `user_id`, `status` (pending|approved|denied), `message`, `decided_by`, `requested_at`, `decided_at`

### `social_accounts`
- `id`, `user_id`, `platform`, `platform_user_id`, `username`, `profile_url`, `oauth_verified`, `oauth_data`

---

## 4. Social OAuth Platforms

Profile Settings **require** each entered social link to be verified via OAuth before saving. Users click **Verify** next to each social field, complete the provider’s OAuth flow, then can save.

| Platform | Socialite Driver | Config Keys | Callback URL |
|----------|------------------|-------------|--------------|
| Facebook | `facebook` | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI` | `{APP_URL}/connect/facebook/callback` |
| Instagram | `instagram` | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` | `{APP_URL}/connect/instagram/callback` |
| X (Twitter) | `twitter` | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI` | `{APP_URL}/connect/x/callback` |
| LinkedIn | `linkedin` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | `{APP_URL}/connect/linkedin/callback` |
| YouTube | `google` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | `{APP_URL}/connect/youtube/callback` |
| Twitch | `twitch` | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI` | `{APP_URL}/connect/twitch/callback` |
| Kick | `kick` | `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI` | `{APP_URL}/connect/kick/callback` (if supported) |

**What you need to do (per provider):**
- Create a developer app (e.g. Facebook Developer, Twitter Developer Portal, Google Cloud Console, LinkedIn Developer, Twitch Dev Console).
- Get **Client ID** and **Client Secret**.
- Register the **callback URL** as above (replace `{APP_URL}` with your site URL, e.g. `https://yoursite.com`).
- Add the same values to `.env` (and optionally to `.env.example` for your team).
- For **Instagram**: Connect now uses Instagram’s own OAuth (Instagram login page). Create an app in [Meta for Developers](https://developers.facebook.com/) and add the **Instagram Basic Display** or **Instagram Graph API** product. Use the app’s credentials in `.env` as `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and `INSTAGRAM_REDIRECT_URI` = `{APP_URL}/connect/instagram/callback`.
- For **YouTube**: use Google Cloud OAuth credentials; the callback is `/connect/youtube/callback`.

**Twitch**: Install `composer require socialiteproviders/twitch` and register in `AppServiceProvider`:
```php
Event::listen(function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
    $event->extendSocialite('twitch', \SocialiteProviders\Twitch\Provider::class);
});
```

**Twitter/X**: Add to `config/services.php` (already added). Use Twitter OAuth 2.0 credentials.

---

## Exact redirect URIs for connectar.online

If your app URL is `https://connectar.online`, add **exactly** these callback URLs in each provider’s developer console and in `.env`:

| Platform   | Callback URL (add to provider console and .env) |
|-----------|---------------------------------------------------|
| Facebook  | `https://connectar.online/connect/facebook/callback` → `.env`: `FACEBOOK_REDIRECT_URI=https://connectar.online/connect/facebook/callback` |
| Instagram | `https://connectar.online/connect/instagram/callback` → `.env`: `INSTAGRAM_REDIRECT_URI=https://connectar.online/connect/instagram/callback` |
| X (Twitter) | `https://connectar.online/connect/x/callback` → `.env`: `TWITTER_REDIRECT_URI=https://connectar.online/connect/x/callback` |
| LinkedIn  | `https://connectar.online/connect/linkedin/callback` → `.env`: `LINKEDIN_REDIRECT_URI=https://connectar.online/connect/linkedin/callback` |
| YouTube   | `https://connectar.online/connect/youtube/callback` → `.env`: `GOOGLE_REDIRECT_URI=https://connectar.online/connect/youtube/callback` |
| Twitch    | `https://connectar.online/connect/twitch/callback` → `.env`: `TWITCH_REDIRECT_URI=https://connectar.online/connect/twitch/callback` |
| Kick      | `https://connectar.online/connect/kick/callback` → `.env`: `KICK_REDIRECT_URI=https://connectar.online/connect/kick/callback` |

After changing `.env`, run: `php artisan config:clear`.

---

## Website URL – "No way to validate"

If you see a message that there is no way to validate the website:

1. **Add the website first** – In Settings → Website section, enter your full URL (e.g. `https://yoursite.com`) and submit. The app will create an entry and show a **meta tag**.
2. **Copy the meta tag** – It looks like: `<meta name="greenunimind-verification" content="guv-XXXXX" />`.
3. **Add it to your site’s `<head>`** – Edit the HTML of the live site you added (the same domain). Put the tag inside `<head>`, save, and publish.
4. **Click Verify** – Back in the app, use the **Verify** button next to that website. The server will fetch your site and check for the tag.

If you do not add the website first (step 1), there is nothing to verify. If the Verify button is missing, ensure you are on the correct Settings/Profile section where websites are listed.

---

## Troubleshooting social verification

| Issue | What to do |
|-------|------------|
| **Facebook: "URL Blocked" / "redirect URI is not whitelisted"** | In [Facebook for Developers](https://developers.facebook.com/) → your app → **Use cases** → **Customize** → **Facebook Login** → **Settings**: turn on **Client OAuth Login** and **Web OAuth Login**. Under **Valid OAuth Redirect URIs** add the **exact** callback URL (e.g. `https://connectar.online/connect/facebook/callback`). No trailing slash. Save. Set `FACEBOOK_REDIRECT_URI` in `.env` to the same URL and run `php artisan config:clear`. |
| **LinkedIn: "You need to pass the client_id parameter"** | Ensure `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` are set in `.env`. Run `php artisan config:clear`. |
| **LinkedIn: "The redirect_uri does not match the registered value"** | Set `LINKEDIN_REDIRECT_URI` in `.env` to the **exact** URL you added in [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → your app → Auth → Authorized redirect URLs. Use the same scheme (http/https), host (e.g. `127.0.0.1` or `localhost`), port (e.g. `:8000`), and path `/connect/linkedin/callback` with no trailing slash. Example: `http://127.0.0.1:8000/connect/linkedin/callback`. Then run `php artisan config:clear`. |
| **LinkedIn: Testing on localhost but redirect goes to production** | When testing locally, set `LINKEDIN_REDIRECT_URI` to your **local** callback URL in `.env`, e.g. `http://localhost:8000/connect/linkedin/callback` (use the same host and port as your local app). Add that exact URL in [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → your app → Auth → Authorized redirect URLs. Run `php artisan config:clear`. |
| **LinkedIn: "Scope r_emailaddress is not authorized for your application"** | The app now uses LinkedIn OpenID Connect scopes (`openid`, `profile`, `email`) instead of the legacy `r_emailaddress` / `r_liteprofile`. In [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → your app → **Products**, ensure **Sign In with LinkedIn using OpenID Connect** is added. Run `php artisan config:clear`. |
| **Twitch: "missing client id"** | Set `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI` in `.env`. Run `php artisan config:clear`. |
| **Kick: "Driver [kick] not supported"** | Run `php artisan config:clear` and `php artisan cache:clear`. Ensure `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI` are in `.env`. Ensure `byancode/socialite-kick` is installed. |
| **Kick: "This id.kick.com page can't be found" (HTTP 404)** | Kick’s OAuth is at `https://id.kick.com/oauth/authorize`; the base URL `https://id.kick.com/` has no page and returns 404. (1) Set `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, and `KICK_REDIRECT_URI` in `.env`. (2) Use **localhost** (not 127.0.0.1) for the redirect URI when testing locally, e.g. `http://localhost:8000/connect/kick/callback` ([Kick’s recommendation](https://docs.kick.com/getting-started/generating-tokens-oauth2-flow)). (3) In [Kick Apps](https://kick.com/) / [Kick Developer](https://docs.kick.com/) create an app and add that **exact** redirect URI. (4) Run `php artisan config:clear`. If you still get 404, the OAuth request may be invalid (wrong/missing client_id or redirect_uri) or Kick’s service may be temporarily down — check [docs.kick.com](https://docs.kick.com) or Kick’s developer Discord. |
| **Website: Does not work** | Verification fetches your site’s HTML; the URL must be publicly reachable (not localhost unless you test locally). Add the exact meta tag in `<head>`. |
| **Instagram: App not active** | In [Facebook for Developers](https://developers.facebook.com/), open your app → Instagram product → set app to **Live** and add the correct redirect URI. |
| **Twitter: "Something went wrong... give access to the App"** | In [Twitter Developer Portal](https://developer.twitter.com/), check App permissions and ensure the callback URL is exactly `{APP_URL}/connect/x/callback`. |
| **YouTube: 500 Server Error** | Usually a redirect URI mismatch or missing Google config. (1) Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env` (e.g. `GOOGLE_REDIRECT_URI=https://connectar.online/connect/youtube/callback`). (2) In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth 2.0 Client → add that **exact** URL under **Authorized redirect URIs**. (3) Run `php artisan config:clear`. Check `storage/logs/laravel.log` for the exact exception. |
| **YouTube: "Access blocked: This app's request is invalid"** | In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen: add test users if the app is in Testing, or publish the app. Ensure the redirect URI is exactly `{APP_URL}/connect/youtube/callback`. |
| **YouTube / Google: "Error 400: redirect_uri_mismatch"** | The redirect URL your app sends must **exactly** match a redirect URI in Google Cloud Console. (1) In `.env` set `GOOGLE_REDIRECT_URI` to that URL, e.g. `http://127.0.0.1:8000/connect/youtube/callback` (same scheme, host, and port as you use to open the site; no trailing slash). (2) In [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials** → open your **OAuth 2.0 Client ID** → under **Authorized redirect URIs** add the **exact** same URL (e.g. `http://127.0.0.1:8000/connect/youtube/callback`). (3) Run `php artisan config:clear`. If you see "Apollo.io", you may be using another app’s credentials; create your own OAuth client in your own Google Cloud project or add this redirect URI to the existing app. |

Use the same `APP_URL` in `.env` as your site (e.g. `https://yoursite.com` in production). All redirect URIs must match exactly what is configured in each provider’s developer console.

---

## 5. Admin Dashboard – Authorized Users

Company Admins see an **Authorized Users** section in their profile (sidebar) with:
- Pending representation requests (Approve/Deny buttons)
- List of authorized representatives (Remove button)

The section is populated via `/api/websites/authorized-users` when the frontend loads the profile.

---

## 6. Security

- Domain normalization before comparison
- One admin per verified website
- Verification timestamps stored
- Approvals/denials logged in `website_representatives`
- HTTPS used for fetching websites
- OAuth-only verification for social accounts

---

## 7. Migrations

Run migrations:
```bash
php artisan migrate
```

Migrations create:
- `websites` table
- `website_representatives` table
- `social_accounts` table
- `notifications` table (if not exists)
- Adds `website_id`, `relationship_type` to `user_websites`
- Migrates existing verified websites to new structure

---

## 8. Frontend Integration Notes

1. **Website Add Flow**: Call `POST /api/websites/store` with `{ "url": "example.com" }`. Response may include `already_verified: true` and `website_id` – show "Request Representation" button.

2. **Request Representation**: Call `POST /api/websites/request-representation` with `{ "website_id": 1, "message": "Optional message" }`.

3. **Authorized Users Tab**: Call `POST /api/websites/authorized-users` when user has owned websites. Render pending requests and representatives.

4. **Social Connect**: Link to `/connect/youtube`, `/connect/instagram`, etc. User must be session-authenticated.
