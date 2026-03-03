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
    | Set to "meet" for launch; switch to "agora" when ready to re-enable
    | in-app video/voice calls.
    |
    */
    'provider' => env('CALL_PROVIDER', 'meet'),
];
