# Affiliate Roulette Connect – Implementation Plan

**Project:** connect.affiliateroulette.com (DreamChat Laravel v2.0.3)  
**Date:** February 2025  
**Goals:** Custom registration (KYC, payment, roles), profile/settings rules, website verification, Google Meet for calls, performance for 1000–5000 users, future mobile apps.

---

## 1. Registration Flow

### 1.1 Current State
- **Web:** `RegisteredUserController::signup()` / `register()` – fields: first_name, last_name, email, mobile_number, user_name, password, terms.
- **API:** `FrontendUserController::register()` – name, user_name, email, mobile_number, password; role `user`; JWT.
- **Views:** `resources/views/frontend/signup.blade.php`.

### 1.2 Required Changes

| Requirement | Implementation |
|-------------|----------------|
| **Personal Information** | |
| Full Name (legal only, required) | Replace first_name/last_name with single `full_name` or keep both but label as “Legal name”; validate required. |
| Username (required) | Keep `user_name`; ensure unique + required in web + API. |
| Company Name (required) | Add `company_name` to users (or new `user_registration` table). Migration + validation. |
| Country (required) | Add `country` (e.g. string or country_code). Migration + dropdown in form. |
| Work Email (match company domain) | Add validation: extract domain from company website (or separate “company domain” field) and ensure email domain matches. Optional: store `company_domain` for verification. |
| **Primary Role** | Add `primary_role` (enum or string). Values: Affiliate (Publisher), Casino/Operator, Affiliate Manager, Game Provider, Payment Provider, Platform Provider, Media/SEO Agency, Event Organizer, Influencer/Streamer, Investor/Advisor, Compliance/Legal, KYC/AML Provider, Other. If “Other”, require free-text. |
| **2FA required** | Enforce TOTP (authenticator) after first login or before completing registration. User can set up in Settings if “done under setting once logged in” – so: require 2FA to be set within X days or block sensitive actions until set. Implement 2FA with a package (e.g. pragmarx/google2fa-laravel or laravel/fortify 2FA). |
| **Terms & Conditions** | Keep terms checkbox; store acceptance (e.g. `terms_accepted_at` on users). |

### 1.3 Registration Steps (Flow)
1. **Step 1 – Personal info + Role + 2FA + T&C**  
   Form: Full Name, Username, Company Name, Country, Work Email (domain check), Primary Role (+ Other text), T&C checkbox.  
   After submit: create user (status e.g. `pending_payment`), optionally prompt to set up 2FA or defer to Settings with a reminder.
2. **Step 2 – Payment**  
   €4.99/month, automatic renewal. Integrate Stripe (or chosen provider) subscriptions; after successful payment set status e.g. `pending_kyc`.
3. **Step 3 – KYC (iDenfy)**  
   Redirect to iDenfy flow; on webhook/callback set user to `kyc_verified` and grant full access; show “ID Verified” badge on profile.

### 1.4 Database (Registration)
- **Users table:** Add: `full_name` (or keep first_name/last_name), `company_name`, `country`, `primary_role`, `other_role_text` (nullable), `terms_accepted_at`, `kyc_verified_at` (nullable), `kyc_provider_id` (e.g. iDenfy id), `subscription_status`, `email_verified_at` (for “cannot change once verified” logic).
- **New table (optional):** `user_subscriptions` for payment history and plan (e.g. monthly, next_billing_at).

---

## 2. Payment (€6.99/month or €70/year, Auto-Renewal)

### 2.1 Current State
- No payment or subscription logic in app (only installer purchase verification in `Modules/Installer`).

### 2.2 Implementation
- Integrate **Stripe Billing** (or Paddle/PayPal Subscriptions):
  - Product: “Connect Monthly” €4.99/month.
  - Checkout Session or Customer Portal for subscription; webhook for `invoice.paid`, `customer.subscription.updated/deleted`.
- Store in DB: `subscription_id`, `plan`, `current_period_ends_at`, `status` (active/canceled/past_due).
- Middleware or policy: allow access to app only if `subscription_status === 'active'` (and optionally KYC verified).
- **Do not** block registration step 1; block after registration until payment step is done, then until KYC is done.

---

## 3. KYC (iDenfy)

### 3.1 References
- Admin: https://admin.idenfy.com/auth/login  
- API: https://documentation.idenfy.com/KYC/KYCLanding/#quick-start  

### 3.2 Implementation
- **iDenfy API integration:** Server-side create session (per their Quick Start), get redirect URL, send user to iDenfy for verification.
- **Webhook:** On verification result (e.g. “approved”), set `kyc_verified_at`, `kyc_provider_id` (or similar) on user; grant access; trigger “ID Verified” badge.
- **Profile:** Show “ID Verified” badge (and optionally a badge asset) on profile and anywhere user is displayed.
- **Access control:** Middleware or gate: “verified” users can use main app; optionally restrict certain features to verified-only.

---

## 4. Profile Fields (All Users)

### 4.1 Required Fields & Rules
- **Name** – Cannot change once verified (KYC). In DB: lock updates to `full_name` / first_name+last_name when `kyc_verified_at` is not null; same in API and Settings.
- **Role** – Display `primary_role` (and “Other” text if any). Editable unless you decide to lock it after verification.
- **Phone** – Use existing `mobile_number`; editable.
- **Email** – Cannot change once verified. Lock when `email_verified_at` or `kyc_verified_at` is set (business rule to confirm).
- **Bio** – Map to existing `user_details.user_about`; editable.
- **Location** – Add if not present (e.g. `user_details.location` or reuse country + optional city).

### 4.2 Current State
- `User`: first_name, last_name, email, user_name, gender, dob, mobile_number, profile_image, etc.
- `UserDetails`: user_about, active_status, friends_status, deactivate_account, facebook, google, twitter, linkedin, youtube.

### 4.3 Changes
- Add migration for any missing fields (e.g. `location`, `company_name`, `country`, `primary_role`).
- Profile and Settings APIs/controllers: enforce “cannot change once verified” for name and email (return 422 or hide inputs when locked).

---

## 5. Status Fields

- **Requirement:** Keep all the same as theme.
- **Action:** No change to status feature (e.g. `UserController::uploadStatus()`, `my-status`, `status`, `user-status` routes and views). Only ensure new fields/roles don’t break status display.

---

## 6. Social Media & Website Verification

### 6.1 Website (Optional, Up to 5, Verify via Meta Tag)

| Step | Implementation |
|------|----------------|
| 1 | User enters URL (e.g. gamblizard.com). Normalize (add https if missing, strip path or allow domain only). |
| 2 | Generate unique token per user per website, e.g. `affiliate-roulette-verification=<token>`. Store in DB: `user_websites` (user_id, url, verification_token, verified_at, sort_order). Max 5 per user. |
| 3 | Instruction: add `<meta name="affiliate-roulette-verification" content="<token>" />` in `<head>`. |
| 4 | **Verification job/endpoint:** HTTP GET to user’s URL (or https), parse HTML, look for `<meta name="affiliate-roulette-verification" content="<token>">`; if match, set `verified_at` and mark “Verified Website Owner”. |
| 5 | Show green check on profile (own + public view) for verified websites. |

**Technical:** Queue job (e.g. `VerifyWebsiteMetaTag`) or cron to re-check periodically; cache result for N hours to avoid hammering; respect robots.txt if needed.

### 6.2 Social Links (Optional)
- **Current:** user_details: facebook, google, twitter, linkedin, youtube.
- **Required:** Website (above), Facebook, LinkedIn, Instagram, Kick, Twitch, YouTube.
- **DB:** Add columns or JSON: `instagram`, `kick`, `twitch`; rename or map `google` if not used for “website”. Keep `facebook`, `linkedin`, `youtube`.
- **Verification of social channels:** No universal API for “this user owns this Instagram/Kick/Twitch/YouTube”. Options: (1) Manual “I confirm this is my channel” + optional admin review; (2) OAuth link (e.g. “Connect Instagram”) where platform supports it; (3) Link-only, no verification, with note in UI. Document as “Optional verification where possible (e.g. OAuth); otherwise display only.”

---

## 7. Deactivate & Logout

- **Requirement:** Keep all the same as theme.
- **Action:** No change to deactivate (e.g. `#deactivate-account`, `#deactivate-account-modal`) and logout (e.g. `#logout-button`, `GET /logout`). Ensure new middleware (payment/KYC) still allows logout and deactivate.

---

## 8. Settings Page

### 8.1 Required Fields & Rules
- **First Name / Last Name** – Cannot change (same as profile “Name” once verified). Read-only in Settings when KYC verified.
- **Role** – Display/editable (primary_role).
- **Gender** – Optional (existing).
- **Date of Birth** – Optional (existing).
- **Country** – Optional in Settings (may already be set at registration).
- **About** – Optional (user_about).
- **All other setting fields** – Keep as theme (password change, notifications, theme, etc.).

### 8.2 2FA (Authenticator)
- Add 2FA setup in Settings: “Authenticator” (TOTP). User scans QR with app (Google Authenticator, etc.); backend verifies code and stores secret. On login, after password, require TOTP if 2FA is enabled. “2FA can be done under setting once logged in” → allow enabling in Settings and enforce from next login.

---

## 9. Video & Audio Calls → Google Meet (Initial Launch)

### 9.1 Requirement
- Push users to Google Meet first; later consider in-app video/audio. Keep existing Agora/video/voice modules for future use.

### 9.2 Options
1. **“Schedule / Join with Google Meet” button**  
   - Link to Google Meet (e.g. create meeting via Google Calendar API or static “start meeting” link).  
   - No calendar connection: simple “Start Google Meet” that opens meet.google.com/new or a generated link.  
2. **Google Calendar integration**  
   - User connects Google (OAuth), we create calendar events with Meet links and send invite to the other user (email or in-app).  
   - Button: “Send Google Meet invite” → create event + Meet link, add attendee, send.  
3. **Hybrid**  
   - “Start meeting” opens Meet; optional “Connect Google Calendar” to create events and send invites from the app.

**Recommendation:** Start with a “Start Google Meet” / “Send Meet link” button that opens or copies a Meet link (or creates one via a simple server-side call to Calendar API if you add OAuth). Add “Connect Google Calendar” in a second phase for scheduled invites. Keep Agora/VideoCallController code and routes; hide or replace UI with “Meet” CTA until you re-enable in-app calls.

---

## 10. Mobile Apps (Future)

- **Requirement:** Eventually Mac/iOS and Android; consider theme options:
  - Android: https://1.envato.market/q5PDL?client_id=82593460.1710833525&session_id=1771782339  
  - iOS: https://1.envato.market/RzAdR?client_id=82593460.1710833525&session_id=1771782339  
- **Action:** Keep API-first design (existing JWT/Passport); avoid web-only assumptions. Use responsive layout and same API for future native apps. When you buy the Envato themes, align API responses and auth with what those themes expect (REST + JWT). Do not remove or tightly couple to web-only routes for core features (profile, chat, contacts).

---

## 11. Performance & Scale (1000–5000 Users)

### 11.1 Requirements
- Fast and optimized; load within screen without full page reloads; support 1000–5000 users.

### 11.2 Recommendations
- **SPA-like behavior:** Use Laravel + Inertia.js or Laravel + Vue/React with client-side routing so chat/settings/profile don’t do full reloads; keep existing Blade where it’s simpler (e.g. signup, login).
- **Caching:** Redis for sessions and cache; cache user list, profile snippets, and “online” state where appropriate.
- **DB:** Indexes on user_name, email, subscription_status, kyc_verified_at; avoid N+1 on profile (eager load user_details).
- **Assets:** Vite; lazy-load heavy components (e.g. call UI); optimize images (profile images, shared files).
- **Subdomain:** connect.affiliateroulette.com – run on same Laravel app with `APP_URL` and `SESSION_DOMAIN=.affiliateroulette.com` so cookies work on subdomain. Use a separate DB or same DB; if same server, ensure queues and cache are sufficient. Subdomain alone does not slow main site if traffic is split (different subdomain = same or separate app instance).

---

## 12. Other Features

### 12.1 Chats: File & Image/Video Sharing
- **Current:** ChatController sends text to Firebase; no backend file upload for chat.
- **Implementation:** Add file/image/video upload (Laravel storage + link or Firebase Storage); store message type (text/file/image/video) and URL in Firebase or DB; UI to attach and display. Limit file size and types; virus scan optional for production.

### 12.2 Group Chats
- **Current:** Views exist (`group-chat.blade.php`); group API/backend not fully mapped.
- **Implementation:** Define group model (owner, members, name); store group membership and group messages (Firebase or DB); wire UI to create/invite/list groups and send messages.

### 12.3 Find Members by Username / Profile Link
- **Current:** Contact UI and “Add Contact” modal; no clear “search by username” or public profile link.
- **Implementation:**  
  - Search: API `GET /api/users/search?username=xxx` (and optionally by name); return non-sensitive list; add as contact.  
  - Profile link: e.g. `connect.affiliateroulette.com/profile/{username}` (or `/u/{username}`). Public profile page (with optional “Add contact” when logged in).

### 12.4 Subdomain (connect.affiliateroulette.com)
- **Requirement:** Must not slow main site.
- **Implementation:** Same Laravel codebase; `APP_URL=https://connect.affiliateroulette.com`; `SESSION_DOMAIN=.affiliateroulette.com`; deploy on same or separate server; if same, use queue workers and sufficient PHP/DB resources. Main site (affiliateroulette.com) can be a different app or same app with route/domain checks; recommend separate app for main marketing site so connect is isolated.

### 12.5 Video/Voice Calls (Later)
- **Requirement:** Do not remove modules; add later.
- **Action:** Keep `VideoCallController`, Agora config, and views; in UI show “Google Meet” instead of in-app call until you re-enable. Feature-flag or config to switch between “Meet” and “Agora” when ready.

---

## 13. Logo & Branding

- **Logo:** Use provided logo asset (you mentioned “Logo will be” but no file attached – place file in `public/assets/img/` or similar and reference in layout/signup).
- **Placements:** Use same logo in signup, login, sidebar, emails, and any public pages. Replace existing `assets/img/full-logo.png` (or equivalent) with Affiliate Roulette logo.

---

## 14. Implementation Order (Suggested)

| Phase | Items |
|-------|--------|
| **1 – Foundation** | DB migrations (users: full_name/company_name/country/primary_role/terms_accepted_at/kyc_verified_at/subscription_status; user_details: location, instagram, kick, twitch; user_websites); lock name/email when verified in profile/settings. |
| **2 – Registration** | New registration steps (personal info + role + T&C); validation (email domain, unique username); 2FA package + enforce in Settings + reminder. |
| **3 – Payment** | Stripe (or other) subscription €4.99/month; webhook; subscription_status; gate for “active” before KYC step. |
| **4 – KYC** | iDenfy integration (create session, redirect, webhook); set kyc_verified_at; “ID Verified” badge on profile. |
| **5 – Profile & Settings** | Profile fields and rules (name/email lock); Settings page fields and 2FA; social links (website + 5 max, Instagram/Kick/Twitch/YouTube). |
| **6 – Website verification** | user_websites table; token generation; meta-tag check (job/endpoint); green check in UI. |
| **7 – Chats & discovery** | File/image/video in chat; group chat backend + UI; search by username; public profile URL. |
| **8 – Calls & polish** | “Google Meet” button (and optional Calendar); keep Agora code; logo/branding; performance (caching, SPA where useful). |

---

## 15. File / Area Summary

| Area | Key paths (existing) | New / to add |
|------|----------------------|--------------|
| Registration | `RegisteredUserController`, `FrontendUserController`, `signup.blade.php` | Multi-step signup view; role + company + country validation; 2FA |
| Payment | — | Stripe (or other) service + webhooks; subscriptions table |
| KYC | — | iDenfy service + webhook controller; badge in profile |
| Profile/Settings | `User`, `UserDetails`, `profile.blade.php`, `settings.blade.php`, `user_profile_update` | Lock name/email; new fields; 2FA in Settings |
| Website verification | — | `user_websites` migration; verification job; profile display |
| Social | `UserDetails` (facebook, linkedin, youtube) | instagram, kick, twitch; optional verification note |
| Chat | `ChatController`, Firebase | File/image/video upload; group model + API |
| Discovery | — | Search API; public profile route |
| Calls | `VideoCallController`, Agora | Google Meet button; keep Agora for later |
| Performance | Layout, Vite | Caching; indexes; optional Inertia/SPA |

---

This plan is ready to be broken into tickets and implemented phase by phase. If you share the logo file and preferred payment provider (Stripe vs others), those can be wired in next.
