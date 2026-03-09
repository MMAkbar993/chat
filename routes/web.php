<?php

use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EncryptionController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\VideoCallController;
use App\Http\Controllers\AgoraController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\KycController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\Webhooks\StripeWebhookController;
use App\Http\Controllers\Webhooks\DiditWebhookController;
use App\Http\Controllers\GroupChatController;
use App\Http\Controllers\UserSearchController;
use App\Http\Controllers\ProfileSettingsController;
use App\Http\Controllers\API\WebsiteController as ApiWebsiteController;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

Route::get('lang/{locale}.json', function ($locale) {
    $path = resource_path("lang/{$locale}.json");

    if (File::exists($path)) {
        return Response::json(json_decode(File::get($path)));
    }

    return response()->json(['error' => 'Language file not found'], 404);
});

Route::get('/firebase-config', function () {
   return response()->json([
       'apiKey' => null,
       'authDomain' => null,
       'databaseURL' => null,
       'projectId' => null,
       'storageBucket' => null,
       'messagingSenderId' => null,
       'appId' => null,
       'measurementId' => null,
       'firebaseDisabled' => true,
   ]);
});
Route::post('/update-firebase-config', function () {
   return response()->json(['message' => 'Firebase has been removed. This app uses MySQL only.'], 410);
});
Route::post('/update-agora-config', [AgoraController::class, 'updateAgoraConfig']);
Route::get('/verify-session', function() {
   // Directly check the session data
   $sessionData = Session::get('username');
   Log::info('Session on verify-session route:', $sessionData);
   return response()->json($sessionData);
});

Route::post('/save-language', [LanguageController::class, 'saveLanguage']);
Route::post('/fire-session', [LanguageController::class, 'fireSession']);
Route::post('set-new-json-language', [LanguageController::class, 'setNewJsonLanguage']);
Route::get('get-session', [LanguageController::class, 'getSession']);
Route::post('create-selected-language/{username}/{language}/{languagedata}', [LanguageController::class, 'createSelectedLanguage']);
Route::post('set-json-language', [LanguageController::class, 'setJsonLanguage']);
//login & register
Route::get('signup', [RegisteredUserController::class, 'signup'])->name('signup');
Route::post('register', [RegisteredUserController::class, 'register'])->name('register');
Route::get('register/payment', [RegisteredUserController::class, 'registerPaymentStep'])->name('register.payment');
Route::get('login', [RegisteredUserController::class, 'login'])->name('login');
Route::post('login', [RegisteredUserController::class, 'loginSubmit'])->name('login.submit');
Route::post('login/laravel', [RegisteredUserController::class, 'loginWithLaravel'])->name('login.laravel');
Route::get('logout', [RegisteredUserController::class, 'logoutSubmit'])->name('logout')->middleware('auth');
    Route::post('logout', [RegisteredUserController::class, 'logoutSubmit'])->name('logout.post')->middleware('auth');

// Stripe payment
Route::post('stripe/checkout', [StripeController::class, 'checkout'])->name('stripe.checkout');
Route::get('stripe/success', [StripeController::class, 'success'])->name('stripe.success');
Route::get('stripe/cancel', [StripeController::class, 'cancel'])->name('stripe.cancel');

Route::get('register/kyc', [KycController::class, 'showKycStep'])->name('register.kyc');
Route::post('didit/create-session', [KycController::class, 'createSession'])->name('didit.create-session');

// 2FA
Route::middleware('auth')->group(function () {
    Route::get('2fa/setup', [TwoFactorController::class, 'setup'])->name('2fa.setup');
    Route::post('2fa/verify-setup', [TwoFactorController::class, 'verifySetup'])->name('2fa.verify-setup');
    Route::post('2fa/disable', [TwoFactorController::class, 'disable'])->name('2fa.disable');
    Route::get('2fa/challenge', [TwoFactorController::class, 'challenge'])->name('2fa.challenge');
    Route::post('2fa/challenge', [TwoFactorController::class, 'verifyChallenge'])->name('2fa.verify-challenge');
});

// KYC badge check
Route::get('api/kyc-status', function (\Illuminate\Http\Request $request) {
    $email = $request->query('email');
    if (!$email) {
        return response()->json(['verified' => false]);
    }
    $user = \App\Models\User::where('email', $email)->first();
    return response()->json(['verified' => $user && $user->isKycVerified()]);
})->name('kyc.status');

// Registration flow status polling (used by the signup page AJAX flow)
Route::get('api/registration-status', function (\Illuminate\Http\Request $request) {
    $user = \Illuminate\Support\Facades\Auth::user()
        ?? \App\Models\User::find($request->session()->get('registered_user_id'));
    if (!$user) {
        return response()->json(['error' => 'No user found'], 404);
    }
    return response()->json([
        'kyc_verified' => $user->isKycVerified(),
        'subscription_status' => $user->subscription_status,
    ]);
})->name('registration.status');

// Webhooks (CSRF excluded in VerifyCsrfToken)
Route::post('webhooks/stripe', [StripeWebhookController::class, 'handle'])->name('webhooks.stripe');
Route::post('webhooks/didit', [DiditWebhookController::class, 'handle'])->name('webhooks.didit');

 /* Foorgot Password */
Route::get('/reset-password', function () {
   return view('frontend/reset-password');
})->name('reset-password');
Route::get('/otp', function () {
   return view('frontend/otp');
})->name('otp');
Route::get('/forgot-password', function () {
   return view('frontend/forgot-password');
})->name('forgot-password');

// Privacy Policy (public page for Meta/Facebook app verification and users)
Route::get('/privacy', function () {
   return view('frontend.privacy-policy');
})->name('privacy');

//social login
Route::prefix('/facebook')->group(function () {
   Route::get('', [RegisteredUserController::class, 'redirectToFacebook'])->name('user.login.facebook');
   Route::get('/callback', [RegisteredUserController::class, 'handleFacebookCallback']);
});
Route::prefix('/google')->group(function () {
   Route::get('', [RegisteredUserController::class, 'redirectToGoogle'])->name('user.login.google');
   Route::get('/callback', [RegisteredUserController::class, 'handleGoogleCallback']);
});

// Social account verification (OAuth connect - requires auth)
Route::middleware(['auth'])->prefix('connect')->group(function () {
   Route::get('error', function () {
       $message = session('social_connect_error', request()->query('message', 'OAuth is not configured for this platform.'));
       return view('frontend.social-connect-error', ['message' => $message]);
   })->name('social.connect.error');
   Route::delete('social-accounts/{id}', [App\Http\Controllers\API\SocialAccountController::class, 'disconnect'])->name('social.disconnect');
   Route::post('social-accounts/{id}/disconnect', [App\Http\Controllers\API\SocialAccountController::class, 'disconnect'])->name('social.disconnect.post');
   Route::put('social-accounts/{id}/profile-url', [App\Http\Controllers\API\SocialAccountController::class, 'updateProfileUrl'])->name('social.profile-url.update');
   Route::get('/{platform}', [App\Http\Controllers\API\SocialAccountController::class, 'redirect'])->name('social.connect');
   Route::get('/{platform}/callback', [App\Http\Controllers\API\SocialAccountController::class, 'callback'])->name('social.callback');
});

Route::post('/create-user', function () { return response()->json(['message' => 'Firebase removed. Use registration page.'], 410); });
Route::post('/create-admin-user', function () { return response()->json(['message' => 'Firebase removed. Use admin user management.'], 410); });
Route::post('/save-firebase-settings', function () { return response()->json(['message' => 'Firebase has been removed.'], 410); });
Route::get('/firebase-settings', function () { return response()->json(['message' => 'Firebase has been removed. App uses MySQL only.'], 410); });

//Libsodium test
Route::get('/encrypt-decrypt', function () {
   return view('encrypt-decrypt');
})->name('encrypt-decrypt');
Route::post('/process-encryption', [EncryptionController::class, 'processEncryption'])->name('process.encryption');
Route::post('/process-encryption-data', [EncryptionController::class, 'encryptData']);
Route::post('/decrypt', [EncryptionController::class, 'decryptData']);

//Installer check
Route::middleware(['checkInstaller'])->group(function () {
   Route::get('/', function () {
      return view('frontend/signin');
   })->name('signin');
});

Route::get('/', function () {
   return view('frontend/signin');
})->name('signin');

// Route::post('/send-message', [ChatController::class, 'sendMessage']);

// Route::middleware('firebase_auth')->group(function () {
   Route::post('/chat/send-message', [ChatController::class, 'sendMessage']);
   Route::post('/chat/upload-file', [ChatController::class, 'uploadFile'])->name('chat.upload-file');
   Route::get('/chat/{id}', [ChatController::class, 'showChat'])->name('chat.show');

   Route::post('/send-encrypted-message', [MessageController::class, 'sendEncryptedMessage']);

  Route::get('/video-call', function () {
   if (config('calls.provider') === 'meet') {
       return redirect('https://meet.google.com/new');
   }
   return view('frontend/video-call');
})->name('video-call');

Route::get('/audio-call', function () {
   if (config('calls.provider') === 'meet') {
       return redirect('https://meet.google.com/new');
   }
   return view('frontend/audio-call');
})->name('audio-call');

Route::post('/generate-token', [VideoCallController::class, 'generateToken']);
Route::post('/generate-joiner-token', [VideoCallController::class, 'generateJoinerToken']);
Route::post('/start-call', [VideoCallController::class, 'startCall']);
Route::post('/check-incoming-call', [VideoCallController::class, 'checkIncomingCall']);

//session
Route::post('/firesession', [SessionController::class, 'firesession']);

// Public profile (no auth required)
Route::get('/u/{username}', [UserSearchController::class, 'publicProfile'])->name('public-profile');

Route::middleware(['auth', 'ensure2fa'])->group(function () {
   Route::get('/index', function () {
      return view('frontend/index');
   })->name('index');
   Route::get('/documentation', function () {
      return view('documentation');
   })->name('documentation');
   Route::get('/landing', function () {
      return view('landing');
   })->name('landing');
   Route::get('/all-calls', function () {
      return view('frontend/all-calls');
   })->name('all-calls');
   Route::get('/calls', function () {
      return view('frontend/calls');
   })->name('calls');
   Route::get('/chat', function () {
      return view('frontend.chat');
   })->name('chat');
   Route::get('/contact', function () {
      return view('frontend.contact');
   })->name('contact');
   Route::get('/group-chat', function () {
      return view('frontend/group-chat');
   })->name('group-chat');
   Route::get('/my-status', function () {
      return view('frontend/my-status');
   })->name('my-status');
   Route::get('/status', function () {
      return view('frontend/status');
   })->name('status');
   Route::post('/upload-status', [UserController::class, 'uploadStatus'])->name('user.status.upload');
   Route::get('/user-status', function () {
      return view('frontend/user-status');
   })->name('user-status');
   Route::get('/profile', function () {
      return view('frontend.profile');
   })->name('profile');
   Route::get('/settings', function () {
      return view('frontend.settings');
   })->name('settings');

   Route::post('/profile-settings/save', [ProfileSettingsController::class, 'save'])->name('profile-settings.save');
   Route::post('/settings/websites/add', [ApiWebsiteController::class, 'storeFromWeb'])->name('settings.websites.add');

   // Group Chat API (JSON)
   Route::prefix('api/groups')->group(function () {
      Route::get('/', [GroupChatController::class, 'index'])->name('groups.index');
      Route::post('/', [GroupChatController::class, 'store'])->name('groups.store');
      Route::get('/{group}', [GroupChatController::class, 'show'])->name('groups.show');
      Route::put('/{group}', [GroupChatController::class, 'update'])->name('groups.update');
      Route::delete('/{group}', [GroupChatController::class, 'destroy'])->name('groups.destroy');
      Route::post('/{group}/members', [GroupChatController::class, 'addMembers'])->name('groups.add-members');
      Route::delete('/{group}/members', [GroupChatController::class, 'removeMember'])->name('groups.remove-member');
      Route::post('/{group}/promote', [GroupChatController::class, 'promoteAdmin'])->name('groups.promote');
   });
});



Route::get('/admin/index', function () {
   return view('admin/index');
})->name('admin.index');
Route::get('/admin/abuse-message', function () {
   return view('admin/abuse-message');
})->name('admin.abuse-message');
Route::get('/admin/add-language', function () {
   return view('admin/add-language');
})->name('admin.add-language');
Route::get('/admin/app-settings', function () {
   return view('admin/app-settings');
})->name('admin.app-settings');
Route::get('/admin/appearance-settings', function () {
   return view('admin/appearance-settings');
})->name('admin.appearance-settings');
Route::get('/admin/authentication-settings', function () {
   return view('admin/authentication-settings');
})->name('admin.authentication-settings');
Route::get('/admin/backup', function () {
   return view('admin/backup');
})->name('admin.backup');
Route::get('/admin/ban-address', function () {
   return view('admin/ban-address');
})->name('admin.ban-address');
Route::get('/admin/blank-page', function () {
   return view('admin/blank-page');
})->name('admin.blank-page');
Route::get('/admin/block-user', function () {
   return view('admin/block-user');
})->name('admin.block-user');
Route::get('/admin/call', function () {
   return view('admin/call');
})->name('admin.call');
Route::get('/admin/change-password', function () {
   return view('admin/change-password');
})->name('admin.change-password');
Route::get('/admin/chat-settings', function () {
   return view('admin/chat-settings');
})->name('admin.chat-settings');
Route::get('/admin/chat', function () {
   return view('admin/chat');
})->name('admin.chat');
Route::get('/admin/clear-cache', function () {
   return view('admin/clear-cache');
})->name('admin.clear-cache');
Route::get('/admin/custom-fields', function () {
   return view('admin/custom-fields');
})->name('admin.custom-fields');
Route::get('/admin/system-settings', function () {
   return view('admin/email-settings');
})->name('admin.system-settings');
Route::get('/admin/basic-settings', function () {
   return view('admin/basic-settings');
})->name('admin.basic-settings');
Route::get('/admin/forgot-password', function () {
   return view('admin/forgot-password');
})->name('admin.forgot-password');

Route::get('/admin/gdpr', function () {
   return view('admin/gdpr');
})->name('admin.gdpr');
Route::get('/admin/group', function () {
   return view('admin/group');
})->name('admin.group');
Route::get('/admin/language', function () {
   return view('admin/language');
})->name('admin.language');
Route::get('/admin/language-web', function () {
   return view('admin/language-web');
})->name('admin.language-web');
Route::get('/admin/language-admin', function () {
   return view('admin/language-admin');
})->name('admin.language-admin');
Route::get('/admin/integrations', function () {
   return view('admin/integrations');
})->name('admin.integrations');
Route::get('/admin/localization-settings', function () {
   return view('admin/localization-settings');
})->name('admin.localization-settings');
Route::get('/admin', function () {
   return redirect()->route('admin.login');
})->name('admin.dashboard.redirect');
Route::get('/admin/login', function () {
   return view('admin/login');
})->name('admin.login');
Route::get('/admin/notification-settings', function () {
   return view('admin/notification-settings');
})->name('admin.notification-settings');
Route::get('/admin/otp', function () {
   return view('admin/otp');
})->name('admin.otp');
Route::get('/admin/profile-settings', function () {
   return view('admin/profile-settings');
})->name('admin.profile-settings');
Route::get('/admin/report-user', function () {
   return view('admin/report-user');
})->name('admin.report-user');
Route::get('/admin/reset-password', function () {
   return view('admin/reset-password');
})->name('admin.reset-password');
Route::get('/admin/reset-password-success', function () {
   return view('admin/reset-password-success');
})->name('admin.reset-password-success');
Route::get('/admin/sms-settings', function () {
   return view('admin/sms-settings');
})->name('admin.sms-settings');
Route::get('/admin/social-auth', function () {
   return view('admin/social-auth');
})->name('admin.social-auth');
Route::get('/admin/storage', function () {
   return view('admin/storage');
})->name('admin.storage');
Route::get('/admin/status', function () {
   return view('admin/stories');
})->name('admin.status');


Route::get('/admin/users', function () {
   return view('admin/users');
})->name('admin.users');

Route::get('/admin/video-audio-settings', function () {
   return view('/admin/video-audio-settings');
})->name('admin.video-audio-settings');
