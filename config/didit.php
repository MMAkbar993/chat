<?php

return [
    'api_key' => env('DIDIT_API_KEY'),
    'webhook_secret_key' => env('DIDIT_WEBHOOK_SECRET_KEY'),
    // Session API base URL – use https://verification.didit.me per Didit docs
    'base_url' => env('DIDIT_BASE_URL', 'https://verification.didit.me'),
    'workflow_id' => env('DIDIT_WORKFLOW_ID'),
    'callback_url' => env('DIDIT_CALLBACK_URL', env('APP_URL') . '/webhooks/didit'),
];
