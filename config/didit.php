<?php

return [
    'api_key' => env('DIDIT_API_KEY'),
    'webhook_secret_key' => env('DIDIT_WEBHOOK_SECRET_KEY'),
    'base_url' => env('DIDIT_BASE_URL', 'https://api.didit.me'),
    'workflow_id' => env('DIDIT_WORKFLOW_ID'),
    'callback_url' => env('DIDIT_CALLBACK_URL', env('APP_URL') . '/webhooks/didit'),
];
