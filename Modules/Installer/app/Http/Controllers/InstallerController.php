<?php

namespace Modules\Installer\app\Http\Controllers;

use App\Models\Administrator;
use Closure;
use Exception;
use App\Enums\UserStatus;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Modules\GlobalSetting\app\Models\GeneralSetting;
use Modules\Installer\app\Enums\InstallerInfo;
use Modules\Installer\app\Models\Configuration;
use Modules\Installer\app\Traits\InstallerMethods;

class InstallerController extends Controller
{
    use InstallerMethods;

    public function __construct()
    {
        set_time_limit(8000000);
        // $this->middleware(function (Request $request, Closure $next) {
        //     $data = purchaseVerificationHashed(InstallerInfo::getLicenseFilePath());
        //     if (isset($data) && isset($data['success']) && $data['success']) {
        //         return $next($request);
        //     } else {
        //         if (strtolower(config('app.app_mode')) == 'demo') {
        //             return $next($request);
        //         }
        //     }

        //     return redirect()->route('setup.verify')->withInput()->withErrors(['errors' => isset($data) && isset($data['success']) && $data['message'] ? $data['message'] : 'License key not found']);
        // });
    }

    public function requirements()
    {
        [$checks, $success, $failedChecks] = $this->checkMinimumRequirements();
        if ($step = Configuration::stepExists() && $success) {
            // if ($step == 5) {
            //     return redirect()->route('setup.complete');
            // }
            // return redirect()->route('setup.account');
        }
        session()->put('step-2-complete', true);
        return view('installer::requirements', compact('checks', 'success', 'failedChecks'));
    }

    public function database()
    {
        if ($this->requirementsCompleteStatus()) {
            session()->put('requirements-complete', true);

            // if (Configuration::stepExists()) {
            //     return redirect()->route('setup.account');
            // }

            

            return view('installer::database', ['isLocalHost' => InstallerInfo::isRemoteLocal()]);
        }

        return redirect()->route('setup.requirements')->withInput()->withErrors(['errors' => 'Your server does not meet the minimum requirements.']);
    }

    

    public function databaseSubmit(Request $request)
    {
        try {
            $request->validate([
                'application_key' => 'required|string',
                'authnticate_domain' => 'required|string',
                'database_url' => 'required',
                'project_id' => 'required|string',
                'storage_bucket' => 'required|string',
                'message_id' => 'required|string',
                'application_id' => 'required|string',
            ]);

            
            // Update .env
            $this->updateEnv([
                'FIREBASE_API_KEY' => $request->application_key,
                'FIREBASE_AUTH_DOMAIN' => $request->authnticate_domain,
                'FIREBASE_DATABASE_URL' => $request->database_url,
                'FIREBASE_PROJECT_ID' => $request->project_id,
                'FIREBASE_STORAGE_BUCKET' => $request->storage_bucket,
                'FIREBASE_MESSAGING_SENDER_ID' => $request->message_id,
                'FIREBASE_APP_ID' => $request->application_id,
            ]);
            return response()->json(['success' => true, 'message' => 'Successfully saved Firebase settings']);

            session()->put('step-3-complete', true);
            Configuration::updateStep(1);
        } catch (\Exception $e) {
            dd(($e->getMessage()));
            return response()->json(['success' => false, 'message' => 'Failed to save settings'], 500);
        }
    }

    // Helper function to update .env
    protected function updateEnv(array $data)
    {
        foreach ($data as $key => $value) {
            file_put_contents(app()->environmentFilePath(), preg_replace(
                "/^{$key}=.*/m",
                "{$key}={$value}",
                file_get_contents(app()->environmentFilePath())
            ));
        }
    }


    public function account()
    {
        $step = Configuration::stepExists();
        $step = '1';
        if ($step >= 1 && $step < 5 && $this->requirementsCompleteStatus()) {
            $admin = $step >= 2 ? Administrator::select('name', 'email')->first() : null;
            return view('installer::account', compact('admin'));
        }
        if ($step == 5 || !$this->requirementsCompleteStatus()) {
            return redirect()->route('setup.requirements');
        }
        return redirect()->route('setup.database');
    }

    public function accountSubmit(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string',
                'email' => 'required|email',
                'password' => 'required|min:6',
            ]);
    
            // Initialize Firebase Admin SDK
            $firebase = (new \Kreait\Firebase\Factory())
            ->withServiceAccount(storage_path('firebase/firebase_credentials.json'))
            ->withDatabaseUri(env('FIREBASE_DATABASE_URL'));
    
        $auth = $firebase->createAuth();
    
        $userProperties = [
            'email' => $request->email,
            'password' => $request->password,
            'displayName' => $request->name,
        ];
    
        $user = $auth->createUser($userProperties);
    
        $database = $firebase->createDatabase();
        $database->getReference('data/users/' . $user->uid)->set([
            'firstName' => $request->name,
            'email' => $request->email,
            'role' => "admin",
            'created_at' => now()->toDateTimeString(),
        ]);
    
        return response()->json(['success' => true, 'message' => 'Admin Account Successfully Created'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to Create Admin Account',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function configuration()
    {
        $step = Configuration::stepExists();
        $step = '2';
        if ($step == 5 || !$this->requirementsCompleteStatus()) {
            return redirect()->route('setup.requirements');
        }
        if ($step < 2) {
            return redirect()->route('setup.account');
        }
        $app_name = "";
       // $app_name = $step >= 3 ? GeneralSetting::where('key', 'app_name')->first()->value : null;
        return view('installer::config', compact('app_name'));
    }

    public function configurationSubmit(Request $request)
    {
        try {
            

            Configuration::updateStep(3);

          
            session()->put('step-5-complete', true);

            return response()->json(['success' => true, 'message' => 'Configuration Successfully Saved'], 200);
        } catch (Exception $e) {
            Log::error($e);

            return response()->json(['success' => false, 'message' => 'Configuration Failed'], 200);
        }
    }
    public function smtp()
    {
        $step = Configuration::stepExists();
        // $step = '3';

        // if ($step == 5 || !$this->requirementsCompleteStatus()) {
        //     return redirect()->route('setup.requirements');
        // }
        // if ($step < 3) {
        //     return redirect()->route('setup.configuration');
        // }
        $email = null;
        $setting_info = Cache::get('setting');
        if ($step >= 4 && ($setting_info->mail_username != 'mail_username' &&             $setting_info->mail_password != 'mail_password')) {
            $email = [];
            $email['mail_host'] = $setting_info->mail_host;
            $email['email'] = $setting_info->mail_sender_email;
            $email['smtp_username'] = $setting_info->mail_username;
            $email['smtp_password'] = $setting_info->mail_password;
            $email['mail_port'] = $setting_info->mail_port;
            $email['mail_encryption'] = $setting_info->mail_encryption;
            $email['mail_sender_name'] = $setting_info->mail_sender_name;

            $email = (object) $email;
        }
        return view('installer::smtp', compact('email'));
    }
    public function smtpSetup(Request $request)
    {
        try {
            $rules = [
                'mail_host'       => 'required',
                'email'           => 'required',
                'smtp_username'   => 'required',
                'smtp_password'   => 'required',
                'mail_port'       => 'required',
                'mail_encryption' => 'required',
                'mail_sender_name' => 'required',
            ];
            $customMessages = [
                'mail_host.required'       => 'Mail host is required',
                'email.required'           => 'Email is required',
                'smtp_username.required'   => 'Smtp username is required',
                'smtp_password.unique'     => 'Smtp password is required',
                'mail_port.required'       => 'Mail port is required',
                'mail_encryption.required' => 'Mail encryption is required',
                'mail_sender_name.required' => 'Mail Sender Name is required',
            ];
            $this->validate($request, $rules, $customMessages);

            Setting::where('key', 'mail_host')->update(['value' => $request->mail_host]);
            Setting::where('key', 'mail_sender_email')->update(['value' => $request->email]);
            Setting::where('key', 'mail_username')->update(['value' => $request->smtp_username]);
            Setting::where('key', 'mail_password')->update(['value' => $request->smtp_password]);
            Setting::where('key', 'mail_port')->update(['value' => $request->mail_port]);
            Setting::where('key', 'mail_encryption')->update(['value' => $request->mail_encryption]);
            Setting::where('key', 'mail_sender_name')->update(['value' => $request->mail_sender_name]);

            Configuration::updateStep(4);

            session()->put('step-6-complete', true);

            Cache::forget('setting');

            return response()->json(['success' => true, 'message' => 'Successfully setup mail SMTP'], 200);
        } catch (Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to Setup SMTP'], 200);
        }
    }

    public function smtpSkip()
    {
        Configuration::updateStep(4);
        session()->put('step-6-complete', true);
        return redirect()->route('setup.complete');
    }

    public function setupComplete()
    {
        session()->put('step-7-complete', true);
        // dd("test");
         //if (Configuration::setupStepCheck(4)  && $this->requirementsCompleteStatus()) {
            $envContent = File::get(base_path('.env'));
            $envContent = preg_replace(['/APP_ENV=(.*)\s/', '/APP_DEBUG=(.*)\s/',], ['APP_ENV=' . 'production' . "\n", 'APP_DEBUG=' . 'false' . "\n",], $envContent);
            if ($envContent !== null) {
                File::put(base_path('.env'), $envContent);
            }

            return view('installer::complete');
    //    }
        // if (Configuration::setupStepCheck(5) && $this->requirementsCompleteStatus()) {
        //     return $this->completedSetup('home');
        // }

        // if (Configuration::stepExists() < 4) {
        //     return redirect()->route('setup.smtp');
        // }

        return redirect()->back()->withInput()->withErrors(['errors' => 'Setup Is Incomplete hh']);
    }

    // public function launchWebsite($type)
    // {
    //     session()->put('step-7-complete', true);
    //     return $this->completedSetup($type);
    // }

    public function launchWebsite($type)
    {
         // Call the setup completion logic
    $result = $this->completedSetup($type);

    // Path to the modules_statuses.json file
   $filePath = base_path('modules_statuses.json');

  // Check if the file exists
   if (file_exists($filePath)) {
       // Read the file content
       $fileContent = file_get_contents($filePath);

       // Decode the JSON content
       $statuses = json_decode($fileContent, true);

       if (json_last_error() === JSON_ERROR_NONE) {
           // Update the "Installer" status to false
           $statuses['Installer'] = false;

           // Encode the JSON back to a string
           $updatedContent = json_encode($statuses, JSON_PRETTY_PRINT);

           // Write the updated content back to the file
           file_put_contents($filePath, $updatedContent);
       }
   }


    return $result;
    }
}
