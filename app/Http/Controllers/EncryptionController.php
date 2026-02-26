<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EncryptionService;

class EncryptionController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function encryptData(Request $request)
    {
        $data = $request->input('data');
        $result =  $this->encryptionService->encryptData($data); // Adjusted function name for clarity
        return response()->json(['encryptedData' => $result]); 
    }

    public function decryptData(Request $request)
    {
        $encryptedData = $request->input('encryptedData');
        
        try {
            $decryptedData = $this->encryptionService->decryptData($encryptedData);
            return response()->json(['decryptedData' => $decryptedData]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } 
    }

    public function processEncryption(Request $request)
    {
        $action = $request->input('action');
        $result = '';

        if ($action === 'encode') {
            // If encoding, take the name and email, then encrypt
            // $first_name = $request->input('name');
            $email = $request->input('email');
            $password = $request->input('password');
            // $mobile_number = $request->input('mobile_number');
            // $user_name = $request->input('user_name');
           // $data = json_encode(['name' => $first_name, 'email' => $email,'password' => $password, 'mobile_number' => $mobile_number, 'user_name' => $user_name]);
            $data = json_encode(['email' => $email,'password' => $password]);

            // Encrypt the data
            $result = $this->encryptionService->encryptData($data);
        } elseif ($action === 'decode') {
            // If decoding, take the encrypted value and decrypt it
            $encryptedData = $request->input('encrypted');

            try {
                $result = $this->encryptionService->decryptData($encryptedData);
            } catch (\Exception $e) {
                $result = 'Decryption failed: ' . $e->getMessage();
            }
        }

        // Return the view with the result
        return view('encrypt-decrypt', compact('result'));
    }
}
