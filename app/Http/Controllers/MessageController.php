<?php

namespace App\Http\Controllers;

use App\Services\EncryptionService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    // Handle the POST request with encrypted message
    public function sendEncryptedMessage(Request $request)
    {
        $encryptedMessage = $request->input('encryptedMessage');

        // Decrypt the message using the EncryptionService
        $decryptedMessage = $this->encryptionService->decryptData($encryptedMessage);

        // Do something with the decrypted message (e.g., save it to the database or display it)
        return response()->json([
            'success' => true,
            'decryptedMessage' => $decryptedMessage,
        ]);
    }
}
