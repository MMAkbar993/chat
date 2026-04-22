<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('Social connect') }} – {{ __('Error') }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; padding: 16px; box-sizing: border-box; }
        .card { text-align: center; padding: 32px 24px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 440px; }
        .icon { font-size: 40px; margin-bottom: 16px; color: #dc3545; }
        h2 { margin: 0 0 12px; color: #1a1a1a; font-size: 1.25rem; }
        p { color: #495057; margin: 0 0 20px; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .btn { display: inline-block; padding: 10px 20px; background: #0d6efd; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; text-decoration: none; }
        .btn:hover { background: #0b5ed7; color: #fff; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon" aria-hidden="true">&#9888;</div>
        <h2>{{ __('Social connect not configured') }}</h2>
        <p>{{ $message }}</p>
        <button type="button" class="btn" onclick="if (window.opener) window.close(); else window.history.back();">{{ __('Close') }}</button>
    </div>
</body>
</html>
