# Firebase Storage CORS Setup

Profile photo uploads (and any direct browser uploads to Firebase Storage) can be blocked by CORS when your app runs on a different origin (e.g. `http://127.0.0.1:8000`) than Firebase Storage (`https://firebasestorage.googleapis.com`).

## Error you may see

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://127.0.0.1:8000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check.
```

## Fix: Configure CORS on your Firebase Storage bucket

**You must run the `gsutil cors set` command below.** The CORS config file in this project is only applied when you run that command; Firebase does not read it automatically.

1. **Install Google Cloud SDK** (includes `gsutil`) if you don't have it:
   - https://cloud.google.com/sdk/docs/install

2. **Authenticate and set project**:
   ```bash
   gcloud auth login
   gcloud config set project dreamschat-14575
   ```

3. **Apply CORS to your Storage bucket**  
   From your **project root** (where `config/firebase-storage-cors.json` exists), run **one** of these (bucket name depends on your Firebase project):

   **If your bucket is the default Firebase Storage bucket**, try the name shown in Firebase Console → Storage (top of the page). It is usually one of:
   ```bash
   gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.firebasestorage.app
   ```
   or (older projects):
   ```bash
   gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.appspot.com
   ```

4. **Verify**:
   ```bash
   gsutil cors get gs://dreamschat-14575.firebasestorage.app
   ```
   (or use `.appspot.com` if that’s your bucket). You should see the same origins and methods as in `config/firebase-storage-cors.json`.

5. **Retry** the profile image upload from `http://127.0.0.1:8000`. If it still fails, confirm the bucket name in Firebase Console → Storage and use that exact name in the `gsutil` commands.

## CORS file contents (reference)

The `config/firebase-storage-cors.json` file allows:

- **Origins:** `http://127.0.0.1:8000`, `http://localhost:8000`, `http://localhost`, and your production domain.
- **Methods:** GET, HEAD, PUT, POST, DELETE, OPTIONS (OPTIONS is required for CORS preflight).
- **Response headers:** Content-Type, Authorization, etc.

To add another origin (e.g. production), edit the `origin` array in `config/firebase-storage-cors.json`, then run `gsutil cors set ...` again.
