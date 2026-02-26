<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;


class UserController extends Controller
{
    public function uploadStatus(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png|max:51200', // Validate file type and size
        ]);
    
        // Store file in Firebase or locally
        $file = $request->file('file');
        $filePath = $file->store('statuses'); // Store in the 'statuses' directory
    
        return response()->json(['message' => 'File uploaded successfully', 'path' => $filePath], 200);
    }
    
}
