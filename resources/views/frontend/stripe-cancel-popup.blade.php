<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Cancelled</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
        .card { text-align: center; padding: 48px 32px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 380px; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h2 { margin: 0 0 8px; color: #1a1a1a; }
        p { color: #6c757d; margin: 0; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">&#10007;</div>
        <h2>Payment Cancelled</h2>
        <p>This window will close automatically&hellip;</p>
    </div>
    <script>
        if (window.opener) {
            window.opener.postMessage({ type: 'stripe-cancelled' }, '*');
        }
        setTimeout(function () { window.close(); }, 1500);
    </script>
</body>
</html>
