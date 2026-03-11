<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Call Provider
    |--------------------------------------------------------------------------
    |
    | Controls which call system is active in the UI.
    | Options: "meet" (Google Meet links), "agora" (in-app Agora calls)
    |
    | Set to "agora" to use in-app audio/video calls with Agora. Ensure
    | AGORA_APP_ID and AGORA_APP_CERTIFICATE are set in .env.
    |
    */
    'provider' => env('CALL_PROVIDER', 'meet'),

    /*
    |--------------------------------------------------------------------------
    | Agora credentials (used when provider is "agora")
    |--------------------------------------------------------------------------
    */
    'agora' => [
        'app_id' => env('AGORA_APP_ID'),
        'app_certificate' => env('AGORA_APP_CERTIFICATE'),
    ],
];
