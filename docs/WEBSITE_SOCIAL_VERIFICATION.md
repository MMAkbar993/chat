# Website & Social Ownership Verification System

This document describes the implementation of the Website and Social Ownership Verification System for fraud prevention.

## Overview

The system verifies that users actually own the websites or social profiles they claim, preventing scammers from pretending to represent companies they do not own.

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
| Instagram | `facebook` | Same as Facebook (Facebook App with Instagram Basic) | `{APP_URL}/connect/instagram/callback` |
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
- For **Instagram**: use a Facebook App and enable “Instagram Basic Display” or the product your app uses; the callback is `/connect/instagram/callback`.
- For **YouTube**: use Google Cloud OAuth credentials; the callback is `/connect/youtube/callback`.

**Twitch**: Install `composer require socialiteproviders/twitch` and register in `AppServiceProvider`:
```php
Event::listen(function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
    $event->extendSocialite('twitch', \SocialiteProviders\Twitch\Provider::class);
});
```

**Twitter/X**: Add to `config/services.php` (already added). Use Twitter OAuth 2.0 credentials.

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
