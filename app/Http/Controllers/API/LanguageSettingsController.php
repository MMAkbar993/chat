<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use App\Models\LanguageSettings;
use App\Services\EncryptionService;
use App\Models\LanguageKeywords;

class LanguageSettingsController extends Controller
{

    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    // Create new language setting
    public function store(Request $request)
    {
        $data = $this->encryptionService->decryptData($request->values);
        $request = json_decode($data, true);

        $validator = Validator::make($request, [
            'user_id' => 'required|integer',
            'language_name' => 'required|string|max:255',
            'code' => 'required|string|max:10',
            'active_status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $languageSetting = LanguageSettings::create($request);

        return response()->json(['message' => 'Language setting created successfully', 'data' => $languageSetting], 200);
    }

    // Get a specific language setting by ID
    public function show($id)
    {
        $languageSetting = LanguageSettings::find($id);

        if (!$languageSetting) {
            return response()->json(['error' => 'Language setting data not found'], 404);
        }

        $encryptedlanguageSetting = $this->encryptionService->encryptData($languageSetting);

        return response()->json($encryptedlanguageSetting);
    }

    // Update a language setting
    public function update(Request $request, $id)
    {
        $languageSetting = LanguageSettings::find($id);

        if (!$languageSetting) {
            return response()->json(['error' => 'Language setting not found'], 404);
        }

        $data = $this->encryptionService->decryptData($request->values);
        $request = json_decode($data, true);

        $validator = Validator::make($request, [
            'user_id' => 'sometimes|required|integer',
            'language_name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:10',
            'active_status' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $languageSetting->update($request);

        return response()->json(['message' => 'Language setting updated successfully', 'data' => $languageSetting]);
    }

    // Delete a language setting
    public function destroy($id)
    {
        $languageSetting = LanguageSettings::find($id);

        if (!$languageSetting) {
            return response()->json(['error' => 'Language setting data not found'], 404);
        }

        $languageSetting->delete();

        return response()->json(['message' => 'Language setting deleted successfully']);
    }

    public function language_keyword_store(Request $request)
    {
        $data = $this->encryptionService->decryptData($request->values);
        $request = json_decode($data, true);
        $validator = Validator::make($request, [
            'language_id' => 'required|integer',
            'page' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'value' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $languageKeyword = LanguageKeywords::create($request);

        return response()->json(['message' => 'Language keyword created successfully', 'data' => $languageKeyword], 201);
    }

    // Get a specific language keyword by ID
    public function language_keyword_show($id)
    {
        $languageKeyword = LanguageKeywords::find($id);

        if (!$languageKeyword) {
            return response()->json(['error' => 'Language keyword data not found'], 404);
        }

        $encryptedlanguageKeyword = $this->encryptionService->encryptData($languageKeyword);
        return response()->json($encryptedlanguageKeyword);
    }

    // Update a language keyword
    public function language_keyword_update(Request $request, $id)
    {
        $languageKeyword = LanguageKeywords::find($id);

        if (!$languageKeyword) {
            return response()->json(['error' => 'Language keyword data not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'language_id' => 'sometimes|required|integer',
            'page' => 'sometimes|required|string|max:255',
            'label' => 'sometimes|required|string|max:255',
            'value' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $languageKeyword->update($request->all());

        return response()->json(['message' => 'Language keyword updated successfully', 'data' => $languageKeyword]);
    }

    // Delete a language keyword
    public function language_keyword_destroy($id)
    {
        $languageKeyword = LanguageKeywords::find($id);

        if (!$languageKeyword) {
            return response()->json(['error' => 'Language keyword not found'], 404);
        }

        $languageKeyword->delete();

        return response()->json(['message' => 'Language keyword deleted successfully']);
    }
}
