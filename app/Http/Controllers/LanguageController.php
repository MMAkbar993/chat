<?php

namespace App\Http\Controllers;

use Closure; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Kreait\Firebase\Factory; 
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class LanguageController extends Controller
{

    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated
        if (Auth::check()) {
            // Initialize Firebase SDK
            $firebase = (new Factory)->createDatabase(); // Initialize Firebase database

            // Retrieve the language setting from Firebase
            $firebaseUserId = Auth::user()->firebase_user_id;
            $language = $firebase->getReference('users/' . $firebaseUserId . '/language')
                ->getValue();

            // Default to 'en' if no language is set
            $language = $language ?? 'en';

            // Set the application's locale
            App::setLocale($language);

            // Optionally store the language in session if needed
            session(['language' => $language]);
        } else {
            // If the user is not logged in, default to 'en'
            App::setLocale('en');
        }

        return $next($request);
    }

    public function saveLanguage(Request $request)
{
    $language = $request->input('language');
    
    // Log the current session language before updating
    Log::info('Current Session Language:', [session('language')]);

    // Save language to session
    session(['language' => $language]);
    
    // Log the updated session language
    Log::info('Updated Session Language:', [session('language')]);

    // Optionally, change the app locale
    app()->setLocale($language);
    Log::info('App Locale Set To:', [$language]);

    return response()->json(['success' => true]);
}


    public function fireSession(Request $request)
    {
        Session::start();
        if ($request->has('user')) {
            $data = [
                'user' => $request->input('user'),
                'username' => $request->input('username'),
                'name' => $request->input('firstName'),
                'state' => $request->input('state'),
                'language' => $request->input('language')
            ];
            // Save data to session
            Session::put('username', $data);
            Log::info('Session data saved:', [session('username')]);


            return response()->json(['success' => true, 'message' => 'Session data saved successfully']);
        } else {
            // Unset session data
            Session::forget('username');
            return response()->json(['user' => '', 'state' => 'yes']);
        }
    }

    // Set new language and store it in JSON file
    public function setNewJsonLanguage(Request $request)
    {
        $postval = $request->all();
        
        $session = Session::get('username');
        
        // Path to language.json
        $filePath = base_path('language.json'); // Change to appropriate path
        
        try {
            // Check if the file exists, and create it if it doesn't
            if (!File::exists($filePath)) {
                File::put($filePath, json_encode(['language' => [], 'keywords' => []], JSON_PRETTY_PRINT));
            }
    
            // Get and update the language data
            $languageData = File::get($filePath);
            $data = json_decode($languageData, true);
            
            // Update the language metadata
            $data['language'][$postval['username']][$postval['language']] = $postval['keywords'];
        
            // Save updated data back to the file
            File::put($filePath, json_encode($data, JSON_PRETTY_PRINT));
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving data: ' . $e->getMessage()], 500);
        }
        
        // Update session if needed
        if ($postval['session'] == 'yes') {
            $sessionData = [
                'user' => $session['user'],
                'name' => $session['user'],
                'state' => $session['state'],
                'language' => $postval['language']
            ];
            Session::put('username', $sessionData);
            App::setLocale($postval['language']);
        }
    
        return response()->json(['message' => 'success']);
    }
    
    
    // Get session data
    public function getSession()
    {
        // Retrieve session data
        $session = Session::get('username');
        
        // Log session data
        Log::info('Retrieved session data:', [$session]);
    
        // Check if session data is present
        if ($session) {
            return response()->json($session);
        } else {
            return response()->json(['message' => 'Session data not found'], 404);
        }
    }
    

    // Create or update selected language in the JSON file
    public function createSelectedLanguage($username, $language, $languagedata)
    {
        $languageData = File::get('language.json');
        $data = json_decode($languageData, true);
        
        // Add or update language data
        $data['language'][$username][$language] = $languagedata;
        
        // Save back the updated language data to the file
        File::put('language.json', json_encode($data, JSON_PRETTY_PRINT));

        return response()->json(['message' => 'success']);
    }

    // Set language in the JSON file (not specifically needed if the above method works)
    public function setJsonLanguage(Request $request)
    {
        $postval = $request->all();
        
        $languageData = File::get('language.json');
        $data = json_decode($languageData, true);
        
        // Update the language data for the user
        $data['language'][$postval['username']][$postval['language']] = $postval['languagedata'];

        // Write the updated JSON back to the file
        File::put('language.json', json_encode($data, JSON_PRETTY_PRINT));

        return response()->json(['message' => 'success']);
    }

}
