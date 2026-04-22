# Performance Hardening Runbook

## 1) Baseline and Verify

- Run request timing checks from response headers:
  - `Server-Timing`
  - `X-Response-Time-Ms`
- Frontend sends metrics to `POST /api/perf-metrics` (stored in Laravel logs).
- Capture before/after numbers for:
  - Chat list load
  - Chat message load
  - Contact detail open
  - Admin users list

## 2) Queue Worker (single VPS)

Run queue worker under a process manager (Supervisor or systemd). Example:

```bash
php artisan queue:work --sleep=1 --tries=3 --timeout=60
```

This is required for asynchronous website verification and other queued jobs.

## 3) Cache and Session Recommendation

For production traffic, prefer Redis:

- `CACHE_DRIVER=redis`
- `SESSION_DRIVER=redis`
- `QUEUE_CONNECTION=redis` (or `database` if Redis is unavailable)

If Redis is not available yet, keep file drivers but monitor disk IO and session growth.

## 4) Slow Request Monitoring

Configure threshold in `.env`:

```env
SLOW_REQUEST_LOG_MS=1200
```

Slow requests are logged with request path, method, status, and duration.

## 5) Operational Health Check

Run:

```bash
php artisan ops:health-check
```

This reports DB connectivity and warns when drivers are not production-friendly.

## 6) Load Validation Checklist

- Simulate user actions for:
  - open chat list
  - open conversation
  - send message
  - open contact profile
- Track:
  - P95 API latency
  - error rate
  - CPU and memory on VPS
- Verify message/call features still function correctly after optimization.
