<?php
try {
    $driver = Laravel\Socialite\Facades\Socialite::driver('kick');
    echo "Kick Driver OK\n";
} catch (\Exception $e) {
    echo "Kick Error: " . $e->getMessage() . "\n";
}

try {
    $driver = Laravel\Socialite\Facades\Socialite::driver('twitch');
    echo "Twitch Driver OK\n";
} catch (\Exception $e) {
    echo "Twitch Error: " . $e->getMessage() . "\n";
}
try {
    $driver = Laravel\Socialite\Facades\Socialite::driver('linkedin');
    echo "LinkedIn Driver OK\n";
} catch (\Exception $e) {
    echo "LinkedIn Error: " . $e->getMessage() . "\n";
}
