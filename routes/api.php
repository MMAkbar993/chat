<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Passport\Http\Controllers\AccessTokenController;
use App\Http\Controllers\API\SocialLoginController;
use App\Http\Controllers\API\LanguageSettingsController;
use App\Http\Controllers\VideoCallController;
use App\Http\Controllers\API\NotificationController;

Route::post('/generate-token', [VideoCallController::class, 'generateToken']);
Route::post('/generate-joiner-token', [VideoCallController::class, 'generateJoinerToken']);

Route::post('oauth/token', [AccessTokenController::class, 'issueToken']);

    /* User Login and Register */
    Route::post('/register', [App\Http\Controllers\API\FrontendUserController::class, 'register'])->name('api.register');
    Route::post('/login', [App\Http\Controllers\API\FrontendUserController::class, 'login'])->name('api.login');
    Route::post('/logout', [App\Http\Controllers\API\FrontendUserController::class, 'logout'])->name('api.logout');

    /* Foorgot Password */
    Route::post('/forgot_password', [App\Http\Controllers\API\FrontendUserController::class, 'forgot_password'])->name('forgot_password');
    Route::post('/pwd_otp_check', [App\Http\Controllers\API\FrontendUserController::class, 'pwd_otp_check'])->name('pwd_otp_check');
    Route::post('/update_password', [App\Http\Controllers\API\FrontendUserController::class, 'update_password'])->name('update_password');

    Route::get('login/google', [SocialLoginController::class, 'redirectToGoogle']);
    Route::get('login/google/callback', [SocialLoginController::class, 'handleGoogleCallback']);

    Route::get('login/facebook', [SocialLoginController::class, 'redirectToFacebook']);
    Route::get('login/facebook/callback', [SocialLoginController::class, 'handleFacebookCallback']);


    /* With JWT token checking routes */
    Route::middleware('auth')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user(); // Returns the authenticated user
        });

        Route::post('/user_profile', [App\Http\Controllers\API\FrontendUserController::class, 'user_profile']);
        Route::post('/user_profile_update', [App\Http\Controllers\API\FrontendUserController::class, 'user_profile_update']);

        //language settings
        Route::post('/language-settings', [LanguageSettingsController::class, 'store']); // Create
        Route::get('/language-settings/{id}', [LanguageSettingsController::class, 'show']); // Read
        Route::put('/language-settings/{id}', [LanguageSettingsController::class, 'update']); // Update
        Route::delete('/language-settings/{id}', [LanguageSettingsController::class, 'destroy']); // Delete

        //language keyword
        Route::post('/language-keywords', [LanguageSettingsController::class, 'language_keyword_store']); // Create
        Route::get('/language-keywords/{id}', [LanguageSettingsController::class, 'language_keyword_show']); // Read
        Route::put('/language-keywords/{id}', [LanguageSettingsController::class, 'language_keyword_update']); // Update
        Route::delete('/language-keywords/{id}', [LanguageSettingsController::class, 'language_keyword_destroy']); // Delete


        /* Website settings */
        Route::post('/website_settings', [App\Http\Controllers\API\SettingsController::class, 'website_settings']);
        Route::post('/website_settings_update', [App\Http\Controllers\API\SettingsController::class, 'website_settings_update']);

        /* System & Email settings */
        Route::post('/system_settings', [App\Http\Controllers\API\SettingsController::class, 'system_settings']);
        Route::post('/system_settings_update', [App\Http\Controllers\API\SettingsController::class, 'system_settings_update']);

        // Add any other protected routes here

    });

Route::post('/send-notification', [NotificationController::class, 'send']);
Route::post('/send-call-notification', [NotificationController::class, 'sendCallNotification']);

