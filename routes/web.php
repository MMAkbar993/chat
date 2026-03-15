<?php

use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\AdminController;
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
use App\Http\Controllers\ContactController;
use App\Http\Controllers\InviteController;
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
       'apiKey' => env('FIREBASE_API_KEY'),
       'authDomain' => env('FIREBASE_AUTH_DOMAIN'),
       'databaseURL' => env('FIREBASE_DATABASE_URL'),
       'projectId' => env('FIREBASE_PROJECT_ID'),
       'storageBucket' => env('FIREBASE_STORAGE_BUCKET'),
       'messagingSenderId' => env('FIREBASE_MESSAGING_SENDER_ID'),
       'appId' => env('FIREBASE_APP_ID'),
       'measurementId' => env('FIREBASE_MEASUREMENT_ID'),
   ]);
});
Route::post('/update-firebase-config', function (\Illuminate\Http\Request $request) {
   // Update .env Firebase values (admin only)
   return response()->json(['message' => 'Firebase config updated.']);
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

Route::get('api/public-profile-by-email', [UserSearchController::class, 'publicProfileByEmail'])->name('public-profile.by-email');

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

// Terms and Conditions (public page)
Route::get('/terms-conditions', function () {
   return view('frontend.terms-conditions');
})->name('terms');

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
   Route::put('linkedin-profile-url', [App\Http\Controllers\API\SocialAccountController::class, 'saveLinkedInProfileUrl'])->name('linkedin.profile-url.save');
   Route::get('/{platform}', [App\Http\Controllers\API\SocialAccountController::class, 'redirect'])->name('social.connect');
   Route::get('/{platform}/callback', [App\Http\Controllers\API\SocialAccountController::class, 'callback'])->name('social.callback');
});

// Firebase user management routes
Route::post('/create-user', [App\Http\Controllers\FirebaseUserController::class, 'createUser']);
Route::post('/create-admin-user', [App\Http\Controllers\FirebaseAdminController::class, 'createAdminUser']);
Route::post('/save-firebase-settings', [App\Http\Controllers\FirebaseAdminController::class, 'saveSettings']);
Route::get('/firebase-settings', function () { return response()->json(config('firebase.frontend')); });

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
   return view('frontend/video_call');
})->name('video-call');

Route::get('/audio-call', function () {
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
      return redirect()->route('chat');
   })->name('my-status');
   Route::get('/status', function () {
      return redirect()->route('chat');
   })->name('status');
   Route::post('/upload-status', [UserController::class, 'uploadStatus'])->name('user.status.upload');
   Route::get('/user-status', function () {
      return redirect()->route('chat');
   })->name('user-status');
   Route::get('/profile', function () {
      return view('frontend.profile');
   })->name('profile');
   Route::get('/settings', function () {
      return view('frontend.settings');
   })->name('settings');

   Route::post('/profile-settings/save', [ProfileSettingsController::class, 'save'])->name('profile-settings.save');
   Route::post('/settings/websites/add', [ApiWebsiteController::class, 'storeFromWeb'])->name('settings.websites.add');
   Route::post('/settings/websites/{id}/verify', [ApiWebsiteController::class, 'verify'])->name('settings.websites.verify');
   Route::delete('/settings/websites/{id}', [ApiWebsiteController::class, 'destroy'])->name('settings.websites.destroy');
   Route::post('/settings/websites/request-representation', [ApiWebsiteController::class, 'requestRepresentationFromWeb'])->name('settings.websites.request-representation');
   Route::get('/settings/websites/authorized-users', [ApiWebsiteController::class, 'authorizedUsersFromWeb'])->name('settings.websites.authorized-users');
   Route::post('/settings/websites/representation/{id}/approve', [ApiWebsiteController::class, 'approveRepresentation'])->name('settings.websites.representation.approve');
   Route::post('/settings/websites/representation/{id}/deny', [ApiWebsiteController::class, 'denyRepresentation'])->name('settings.websites.representation.deny');
   Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
   Route::post('/invite/send', [InviteController::class, 'send'])->name('invite.send');
   Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
   Route::get('/api/chat-list', [ChatController::class, 'chatList'])->name('chat.list');
   Route::get('/api/chat-messages/{userId}', [ChatController::class, 'getMessages'])->name('chat.messages');
   Route::post('/api/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send');
   Route::delete('/api/chat-list', [ChatController::class, 'deleteAllChats'])->name('chat.delete-all');

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



Route::get('/admin', function () {
   return redirect()->route('admin.login');
})->name('admin.dashboard.redirect');
Route::get('/admin/login', function () {
   return view('admin/login');
})->name('admin.login');
Route::post('/admin/login', [RegisteredUserController::class, 'adminLoginSubmit'])->name('admin.login.submit');
Route::get('/admin/forgot-password', function () {
   return view('admin/forgot-password');
})->name('admin.forgot-password');

// Admin panel (auth + admin only)
Route::middleware(['auth', 'ensureAdmin'])->prefix('admin')->group(function () {
   Route::get('/index', [AdminController::class, 'index'])->name('admin.index');
   Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
   Route::get('/group', [AdminController::class, 'groups'])->name('admin.group');
   // Admin API for users (used by admin users page)
   Route::get('/api/users', [AdminController::class, 'usersData'])->name('admin.api.users');
   Route::post('/api/users', [AdminController::class, 'storeUser'])->name('admin.api.users.store');
   Route::get('/api/users/{id}', [AdminController::class, 'getUser'])->name('admin.api.users.show');
   Route::put('/api/users/{id}', [AdminController::class, 'updateUser'])->name('admin.api.users.update');
   Route::delete('/api/users/{id}', [AdminController::class, 'destroyUser'])->name('admin.api.users.destroy');
   Route::post('/api/users/{id}/block', [AdminController::class, 'blockUser'])->name('admin.api.users.block');

   Route::get('/abuse-message', function () {
      return view('admin/abuse-message');
   })->name('admin.abuse-message');
   Route::get('/add-language', function () {
      return view('admin/add-language');
   })->name('admin.add-language');
   Route::get('/app-settings', function () {
      return view('admin/app-settings');
   })->name('admin.app-settings');
   Route::get('/appearance-settings', function () {
      return view('admin/appearance-settings');
   })->name('admin.appearance-settings');
   Route::get('/authentication-settings', function () {
      return view('admin/authentication-settings');
   })->name('admin.authentication-settings');
   Route::get('/backup', function () {
      return view('admin/backup');
   })->name('admin.backup');
   Route::get('/ban-address', function () {
      return view('admin/ban-address');
   })->name('admin.ban-address');
   Route::get('/blank-page', function () {
      return view('admin/blank-page');
   })->name('admin.blank-page');
   Route::get('/block-user', function () {
      return view('admin/block-user');
   })->name('admin.block-user');
   Route::get('/call', function () {
      return view('admin/call');
   })->name('admin.call');
   Route::get('/change-password', function () {
      return view('admin/change-password');
   })->name('admin.change-password');
   Route::get('/chat-settings', function () {
      return view('admin/chat-settings');
   })->name('admin.chat-settings');
   Route::get('/chat', function () {
      return view('admin/chat');
   })->name('admin.chat');
   Route::get('/clear-cache', function () {
      return view('admin/clear-cache');
   })->name('admin.clear-cache');
   Route::get('/custom-fields', function () {
      return view('admin/custom-fields');
   })->name('admin.custom-fields');
   Route::get('/system-settings', function () {
      return view('admin/email-settings');
   })->name('admin.system-settings');
   Route::get('/basic-settings', function () {
      return view('admin/basic-settings');
   })->name('admin.basic-settings');
   Route::get('/gdpr', function () {
      return view('admin/gdpr');
   })->name('admin.gdpr');
   Route::get('/language', function () {
      return view('admin/language');
   })->name('admin.language');
   Route::get('/language-web', function () {
      return view('admin/language-web');
   })->name('admin.language-web');
   Route::get('/language-admin', function () {
      return view('admin/language-admin');
   })->name('admin.language-admin');
   Route::get('/integrations', function () {
      return view('admin/integrations');
   })->name('admin.integrations');
   Route::get('/localization-settings', function () {
      return view('admin/localization-settings');
   })->name('admin.localization-settings');
   Route::get('/notification-settings', function () {
      return view('admin/notification-settings');
   })->name('admin.notification-settings');
   Route::get('/otp', function () {
      return view('admin/otp');
   })->name('admin.otp');
   Route::get('/profile-settings', function () {
      return view('admin/profile-settings');
   })->name('admin.profile-settings');
   Route::get('/report-user', function () {
      return view('admin/report-user');
   })->name('admin.report-user');
   Route::get('/reset-password', function () {
      return view('admin/reset-password');
   })->name('admin.reset-password');
   Route::get('/reset-password-success', function () {
      return view('admin/reset-password-success');
   })->name('admin.reset-password-success');
   Route::get('/sms-settings', function () {
      return view('admin/sms-settings');
   })->name('admin.sms-settings');
   Route::get('/social-auth', function () {
      return view('admin/social-auth');
   })->name('admin.social-auth');
   Route::get('/storage', function () {
      return view('admin/storage');
   })->name('admin.storage');
   Route::get('/status', function () {
      return view('admin/stories');
   })->name('admin.status');
   Route::get('/video-audio-settings', function () {
      return view('admin/video-audio-settings');
   })->name('admin.video-audio-settings');
});
