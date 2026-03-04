# Firebase Storage CORS Setup

Profile photo uploads (and any direct browser uploads to Firebase Storage) can be blocked by CORS when your app runs on a different origin (e.g. `http://127.0.0.1:8000`) than Firebase Storage (`https://firebasestorage.googleapis.com`).

## Error you may see

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://127.0.0.1:8000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check.
```

## Fix: Configure CORS on your Firebase Storage bucket

1. **Install Google Cloud SDK** (includes `gsutil`) if you don't have it:
   - https://cloud.google.com/sdk/docs/install

2. **Authenticate** (if not already):
   ```bash
   gcloud auth login
   gcloud config set project dreamschat-14575
   ```

3. **Edit CORS file**  
   Use the file in this project: `config/firebase-storage-cors.json`  
   Replace `https://yourdomain.com` with your real production domain (e.g. `https://connectar.online`).

4. **Apply CORS to your Storage bucket**  
   Your bucket name is usually `dreamschat-14575.firebasestorage.app`. Run:
   ```bash
   gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.firebasestorage.app
   ```
   If your bucket name is different, find it in Firebase Console → Storage → bucket name at the top.

5. **Verify**
   ```bash
   gsutil cors get gs://dreamschat-14575.firebasestorage.app
   ```

After this, uploads from `http://127.0.0.1:8000` and your production origin will be allowed by CORS.

## CORS file contents (reference)

The `config/firebase-storage-cors.json` file allows:

- **Origins:** `http://127.0.0.1:8000`, `http://localhost:8000`, `http://localhost`, and your production domain.
- **Methods:** GET, HEAD, PUT, POST, DELETE.
- **Headers:** Content-Type, Authorization, etc.

Update the `origin` array with your real production URL before running `gsutil cors set`.
