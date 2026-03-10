<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\UserDetails;
use App\Models\SocialAccount;
use Carbon\Carbon;
use Intervention\Image\Facades\Image;

class ProfileSettingsController extends Controller
{
    /**
     * Save profile and social settings (web form with optional profile image).
     * Updates users + user_details so profile and settings stay in sync.
     */
    public function save(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Unauthenticated.'], 401);
                }
                return redirect()->route('login');
            }

            // Normalize frontend field names (camelCase) to snake_case so validation/update work
            if ($request->has('firstName')) {
                $request->merge(['first_name' => $request->input('firstName')]);
            }
            if ($request->has('lastName')) {
                $request->merge(['last_name' => $request->input('lastName')]);
            }

            $nameLocked = $user->isKycVerified();
            $emailLocked = false;

            // Reject any name change after KYC verification (even if client sends different values)
            if ($nameLocked) {
                $firstNameSent = $request->has('first_name') && trim((string) $request->input('first_name')) !== trim((string) $user->first_name);
                $lastNameSent = $request->has('last_name') && trim((string) $request->input('last_name')) !== trim((string) $user->last_name);
                if ($firstNameSent || $lastNameSent) {
                    $msg = __('Name cannot be changed after KYC verification.');
                    if ($request->wantsJson()) {
                        return response()->json(['message' => $msg], 422);
                    }
                    return back()->withErrors(['first_name' => $msg])->withInput();
                }
            }

            if ($emailLocked && $request->has('email') && trim((string) $request->input('email')) !== trim((string) $user->email)) {
                $msg = __('Email cannot be changed after verification.');
                if ($request->wantsJson()) {
                    return response()->json(['message' => $msg], 422);
                }
                return back()->withErrors(['email' => $msg])->withInput();
            }

            $rules = [
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'user_name' => 'sometimes|nullable|string|max:255',
                'mobile_number' => 'sometimes|string|max:21',
                'gender' => 'sometimes|nullable|string|max:20',
                'dob' => 'sometimes|nullable|string|max:20',
                'country' => 'sometimes|nullable|string|max:100',
                'about' => 'sometimes|nullable|string|max:1000',
                'primary_role' => 'sometimes|nullable|string|max:80',
                'other_role_text' => 'sometimes|nullable|string|max:255',
                'profile_image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => $validator->errors()->first()], 422);
                }
                return back()->withErrors($validator)->withInput();
            }

            $userFields = ['mobile_number', 'gender', 'dob', 'country', 'primary_role', 'other_role_text', 'user_name'];
            if (!$nameLocked) {
                $userFields = array_merge($userFields, ['first_name', 'last_name']);
            }
            if (!$emailLocked) {
                $userFields[] = 'email';
            }

            foreach ($userFields as $field) {
                if ($request->has($field)) {
                    $value = $request->input($field);
                    if ($field === 'primary_role' && $value !== 'other') {
                        $user->other_role_text = null;
                    }
                    if (($field === 'dob' || $field === 'user_name') && ($value === '' || $value === null)) {
                        $value = null;
                    }
                    if ($field === 'dob' && $value !== null) {
                        $value = $this->normalizeDob($value);
                    }
                    $user->$field = $value;
                }
            }

            if (!$nameLocked && ($request->has('first_name') || $request->has('last_name'))) {
                $user->full_name = trim(($request->input('first_name', $user->first_name) ?? '') . ' ' . ($request->input('last_name', $user->last_name) ?? ''));
            }

            $profilePath = config('image_settings.backEnd.profile.path', 'public/image/profile/');
            $profilePath = rtrim($profilePath, '/') . '/';
            $storageDisk = 'public';
            $storagePath = 'image/profile';
            if ($request->hasFile('profile_image')) {
                $file = $request->file('profile_image');
                if ($user->profile_image) {
                    Storage::disk($storageDisk)->delete($storagePath . '/' . $user->profile_image);
                }
                $filename = Carbon::now()->timestamp . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                if (class_exists(\Intervention\Image\Facades\Image::class)) {
                    try {
                        $img = Image::make($file->getRealPath())->resize(300, 300);
                        Storage::disk($storageDisk)->put($storagePath . '/' . $filename, $img->stream()->__toString());
                    } catch (\Throwable $e) {
                        $file->storeAs($storagePath, $filename, $storageDisk);
                    }
                } else {
                    $file->storeAs($storagePath, $filename, $storageDisk);
                }
                $user->profile_image = $filename;
            }

            $user->save();

            $details = $user->get_user_details;
            if (!$details) {
                $details = new UserDetails(['user_id' => $user->id]);
            }
            if ($request->has('about')) {
                $details->user_about = $request->input('about');
            }
            $details->save();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => __('Profile updated successfully.'),
                    'profile_image' => $user->fresh()->profile_image_link,
                ]);
            }
            return back()->with('success', __('Profile updated successfully.'));
        } catch (\Throwable $e) {
            Log::error('ProfileSettingsController@save: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
            if ($request->wantsJson()) {
                $message = config('app.debug') ? $e->getMessage() : 'Server error. Check storage/logs/laravel.log';
                return response()->json(['message' => $message], 500);
            }
            throw $e;
        }
    }

    /**
     * Normalize date of birth from frontend (e.g. dd-mm-yyyy or d/m/y) to MySQL date (Y-m-d).
     */
    private function normalizeDob(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        $value = trim($value);
        // Already Y-m-d
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }
        // d-m-Y or dd-mm-yyyy
        if (preg_match('/^(\d{1,2})-(\d{1,2})-(\d{4})$/', $value, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }
        // d/m/Y
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $value, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }
        try {
            $date = new \DateTime($value);
            return $date->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
