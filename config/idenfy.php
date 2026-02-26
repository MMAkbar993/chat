<?php

return [
    'api_key' => env('IDENFY_API_KEY'),
    'api_secret' => env('IDENFY_API_SECRET'),
    'base_url' => env('IDENFY_BASE_URL', 'https://ivs.idenfy.com'),
    'callback_url' => env('IDENFY_CALLBACK_URL'),
];
