# Meta App Review – Answers for connectar.online

Use the text below in the Meta (Facebook) App Review form for **https://connectar.online/**.

---

## 1. Provide your website for review

**Site URL:**  
`https://connectar.online/`

**Edit your website login URL (if asked):**  
`https://connectar.online/login`

---

## 2. Instructions for accessing the app (instructions-web-2)

**Provide instructions for accessing the app so we may complete our review. Explain how to navigate to the app, and provide instructions for testing.**

**How to access and test the app:**

1. **Open the site**  
   Go to: **https://connectar.online/**

2. **Create an account or log in**  
   - **Sign up:** Click “Sign up” (or go to https://connectar.online/signup), fill in the registration form (name, email, etc.), accept the terms, and submit.  
   - **Log in:** Click “Login” (or go to **https://connectar.online/login**). Enter your email and password and submit.  
   - **Facebook Login (optional):** On the login/signup flow you can use “Login with Facebook,” which redirects to Facebook and then back to **https://connectar.online/facebook/callback** after authorization.

3. **Onboarding (new users only)**  
   After registration, users are guided through:  
   - **Payment step:** Save a payment method (Stripe; no charge until after verification).  
   - **Identity verification (KYC):** Complete the verification step.  
   After KYC approval, the subscription is activated and full app access is granted.

4. **Reach the main app**  
   Once logged in (and onboarding completed if applicable), you are redirected to the main chat interface. From there you can:  
   - Use the chat and contact list,  
   - Open profile/settings from the menu,  
   - Test video calls and other in-app features as needed for review.

**Summary for reviewers:**  
- **Login URL:** https://connectar.online/login  
- **Facebook Login:** Available on the same login/signup screens; uses Facebook for sign-in only (see Meta APIs section below).

---

## 3. Meta APIs / Facebook Login (required)

**Confirmation of use of Meta APIs / Facebook Login:**

**We use Facebook Login on this app.**  
We use the **Facebook Login** product so users can sign in with their Facebook account (optional; email/password and Google sign-in are also available).

**Meta APIs / permissions we use:**  
- **Facebook Login** for authentication only.  
- We request only the **default/basic** permissions needed to create or match an account:  
  - **Public profile** (e.g. name, profile ID)  
  - **Email** (to identify the user in our system)  
- We do **not** request or use advanced/sensitive permissions such as `user_friends`, `user_gender`, `user_birthday`, or other optional user permissions. We use only what is necessary for sign-in and account creation (public profile and email).

**Technical details for reviewers:**  
- **Web:** Login entry is **https://connectar.online/login**.  
- **Facebook Login (web):**  
  - Start: **https://connectar.online/facebook** (or the “Login with Facebook” button on the login page).  
  - Callback: **https://connectar.online/facebook/callback**.  
- After successful Facebook sign-in, the user is logged in and can use the app like any other user (chat, profile, settings, etc.).

**If we were no longer using Facebook Login:**  
We are currently using Facebook Login. If we remove it in the future, we would state that here and provide updated instructions (e.g. “Use email/password or Google sign-in at https://connectar.online/login”) so reviewers can still access and test the app.

---

## 4. Access codes / test credentials (accesscode-web-1) — optional

**If payment or membership is required to access the full functionality of this app, provide access codes or test credentials.**

Full access to the app (after signup) requires completing the payment step (saving a payment method) and identity verification (KYC). To allow review of all features without payment:

- **Option A – Test account:**  
  We can create a **test user account** that has already completed onboarding (payment method saved and KYC approved). We will provide the **login URL**, **email**, and **password** for this test account in the submission or in a separate secure channel if requested.  
  *(Replace with actual details when you create the account, e.g.: Login URL: https://connectar.online/login | Email: reviewer@example.com | Password: [secure one-time password].)*

- **Option B – Facebook test user:**  
  If your review process supports it, we can create a **Facebook test user**, register it in our app, complete onboarding for that user, and provide instructions so reviewers can sign in with that Facebook test user and access all features.

Please specify in the submission notes if you will use Option A, Option B, or both, and add the actual test credentials before submitting.

---

## 5. Gift codes for app store (accesscode-web-2) — optional

**If payment is required to download this app, provide 8–10 gift codes.**

This app is a **website** (https://connectar.online/). It is **not** distributed via app stores and does not require download or in-app purchase from an app store.  
**Not applicable** — leave blank or state: “N/A – web app only, no app store download.”

---

## 6. Geographic restrictions (geo-web-5) — optional

**If access is limited by location or geo-blocking, explain and list locations.**

We do **not** restrict access by geographic location. The app can be accessed from **any country**; there is no geo-blocking or geo-fencing.  
*(If you later add restrictions, replace with: “Access is limited to: [list of countries or regions].”)*

---

## 7. Supporting documentation (documents-web-1) — optional

**Include supporting documentation (e.g. screen recording or images showing access, login, and use of Meta APIs).**

You can upload one or more of the following (max 2 GB per file; formats such as .pdf, .mp4, .mov, .png, .jpg, etc.):

- **Short screen recording:**  
  - Open https://connectar.online/ → go to Login → click “Login with Facebook” → complete Facebook authorization → show redirect back to the app and the main chat screen.  
- **Screenshots:**  
  - Login page with “Login with Facebook” visible.  
  - Post-login main app (e.g. chat) to show successful access.

*(Upload the files in the form’s “Drag and drop files” / “Choose files” area.)*

---

## Quick reference

| Field                     | Value / action |
|---------------------------|----------------|
| Site URL                  | https://connectar.online/ |
| Login URL                 | https://connectar.online/login |
| Facebook Login            | Yes – public profile + email only |
| Test credentials          | Provide a test account or Facebook test user (see section 4) |
| App store codes           | N/A – web app only |
| Geo restrictions          | None |
| Supporting docs           | Optional: screen recording + screenshots (see section 7) |

---

*Update the optional sections (test account details, geo, or docs) as needed before submitting. Keep test credentials secure and valid for at least one year if you provide them.*
