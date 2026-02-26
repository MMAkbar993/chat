<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use App\Models\ForgotPasswordOtp;
use App\Services\EncryptionService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendOtpMail;
use Illuminate\Support\Facades\Auth;

class FrontendUserController extends Controller
{
    protected EncryptionService $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function register(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $this->encryptionService->decryptData($request->values);
        if ($data == false) {
            return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
        }
        $payload = json_decode($data, true);
        $isAffiliateRoulette = !empty($payload['full_name']) || !empty($payload['company_name']);

        if ($isAffiliateRoulette) {
            $validator = Validator::make($payload, [
                'full_name' => 'required|string|max:255',
                'user_name' => 'required|string|max:255|unique:users,user_name',
                'email' => 'required|string|email|max:255|unique:users',
                'company_name' => 'required|string|max:255',
                'company_website' => 'required|string|max:255',
                'country' => 'required|string|max:100',
                'primary_role' => 'required|string|in:' . implode(',', config('registration.primary_role_keys', [])),
                'other_role_text' => 'nullable|string|max:255',
                'mobile_number' => 'nullable|string|max:21',
                'password' => 'required|string|min:8',
            ]);
        } else {
            $validator = Validator::make($payload, [
                'name' => 'required|string|max:255',
                'user_name' => 'required|string|max:255|unique:users,user_name',
                'email' => 'required|string|email|max:255|unique:users',
                'mobile_number' => 'required',
                'password' => 'required|string|min:8',
            ]);
        }

        if ($validator->fails()) {
            return send_bad_request_response($validator->errors()->first());
        }

        try {
            $encryptedPassword = $this->encryptionService->encryptData($payload['password']);

            if ($isAffiliateRoulette) {
                $companyDomain = $this->extractDomain($payload['company_website'] ?? '');
                $nameParts = $this->splitFullName($payload['full_name']);
                $user = User::create([
                    'first_name' => $nameParts[0],
                    'last_name' => $nameParts[1],
                    'full_name' => $payload['full_name'],
                    'email' => $payload['email'],
                    'user_name' => $payload['user_name'],
                    'user_type' => 2,
                    'mobile_number' => $payload['mobile_number'] ?? '',
                    'password' => $encryptedPassword,
                    'company_name' => $payload['company_name'],
                    'company_domain' => $companyDomain,
                    'country' => $payload['country'],
                    'primary_role' => $payload['primary_role'],
                    'other_role_text' => ($payload['primary_role'] ?? '') === 'other' ? ($payload['other_role_text'] ?? null) : null,
                    'terms_accepted_at' => now(),
                    'subscription_status' => 'pending_payment',
                    'created_by' => 1,
                ]);
            } else {
                $name = explode(' ', $payload['name']);
                $user = User::create([
                    'first_name' => $name[0],
                    'last_name' => $name[1] ?? ' ',
                    'email' => $payload['email'],
                    'user_name' => $payload['user_name'],
                    'user_type' => 2,
                    'mobile_number' => $payload['mobile_number'],
                    'created_by' => 1,
                    'password' => $encryptedPassword,
                ]);
            }

            $user->assignRole('user');

            $jwt_token = ['user_id' => $user->id];
            $myTTL = 60 * 720;
            JWTAuth::factory()->setTTL($myTTL);
            $valid_token = JWTAuth::claims($jwt_token)->fromUser($user);
            if (!$valid_token) {
                return send_bad_request_response('empty value');
            }

            $result = json_encode(['token' => $valid_token, 'user' => $user->id]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Registered Successfully!');
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    protected function extractDomain(string $url): ?string
    {
        if ($url === '') {
            return null;
        }
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $host = parse_url($url, PHP_URL_HOST);
        return is_string($host) ? strtolower($host) : null;
    }

    protected function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName), 2);
        return [$parts[0] ?? '', $parts[1] ?? ''];
    }

    public function login(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request = json_decode($data, true);

            if (isset($request['user_name'])) {
                $request_validate = [
                    'user_name' => 'required|exists:users,user_name',
                    'password' => 'required',
                ];
            } else {
                $request_validate = [
                    'email' => 'required|email|exists:users,email',
                    'password' => 'required',
                ];
            }

            $validator = Validator::make($request, $request_validate);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $request_feild = isset($request['user_name']) ? 'user_name' : 'email';
            $request_data = isset($request['user_name']) ? $request['user_name'] : $request['email'];

            $user = User::where($request_feild, $request_data)->first();

            $decryptedPassword = $this->encryptionService->decryptData($user->password);

            if ($decryptedPassword === $request['password']) {
                $jwt_token = [
                    'user_id' => $user->id,
                ];

                $myTTL = 60 * 720; // Set the token's time to live
                JWTAuth::factory()->setTTL($myTTL);
                $valid_token = JWTAuth::claims($jwt_token)->fromUser($user);

                if (!$valid_token) {
                    return send_bad_request_response('Empty value');
                }

                Auth::login($user);
                // Update the user's last login time
                $user->last_login_at = now();
                $user->save();

                $result = json_encode(['token' => $valid_token, 'user' => ['user_id' => $user->id, 'user_type' => $user->user_type]]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response(['data' => $data], 'Logged in successfully');
            } else {
                return send_bad_request_response('Invalid credentials provided');
            }
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Invalidate the JWT token
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }

            return send_success_response([], 'Successfully logged out');
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function forgot_password(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            DB::beginTransaction();
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request = new Request($request_data);
            $validator = Validator::make($request->all(), [
                'email' => 'required|exists:users,email',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $user = User::where('email', $request->email)
                            ->first();

            if ($user) {
                $otp = mt_rand(100000, 999999);

                Mail::to($user->email)->send(new SendOtpMail(['name' => $user->first_name . ' ' . $user->last_name, 'otp' => $otp]));

                $delete_otp = ForgotPasswordOtp::where('user_id', $user->id)->delete();

                $forgot_otp = new ForgotPasswordOtp();
                $forgot_otp->user_id = $user->id;
                $forgot_otp->otp = bcrypt((string)$otp);
                $forgot_otp->save();

                DB::commit();
                $result = json_encode(['otp_id' => $forgot_otp->id]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response(['data' => $data], 'OTP sent Successfully!');
            } else {
                DB::rollBack();
                return send_bad_request_response('Not a valid email id or user not found!');
            }
        } catch (\Exception $exception) {
            DB::rollBack();
            return send_exception_response($exception->getMessage());
        }
    }

    public function pwd_otp_check(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Start a transaction
            DB::beginTransaction();

            // Decrypt the request data
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request = new Request($request_data);

            // Validate the request
            $validator = Validator::make($request->all(), [
                'email' => 'required|exists:users,email',
                'otp' => 'required',
                'otp_id' => 'required'
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            // Find the OTP record based on the provided OTP ID
            $forgot_otp = ForgotPasswordOtp::find($request->otp_id);
            if (!$forgot_otp) {
                return send_bad_request_response('OTP not found!');
            }

            // Check if the OTP has expired
            $otp_created_at = Carbon::parse($forgot_otp->created_at);
            $otp_expiry_time = $otp_created_at->addMinutes(10); // OTP expires in 10 minutes
            $current_time = Carbon::now();
            if ($current_time->gt($otp_expiry_time)) {
                $forgot_otp->delete(); // Delete expired OTP
                DB::commit();
                return send_bad_request_response('OTP Expired!');
            }

            // Check if the provided OTP matches the stored OTP
            if (Hash::check($request->otp, $forgot_otp->otp)) {
                // OTP is valid, proceed with further logic
                DB::commit();
                return send_success_response([], 'OTP is valid!');
            } else {
                return send_bad_request_response('Invalid OTP!');
            }
        } catch (\Exception $exception) {
            // Rollback in case of an error
            DB::rollBack();
            return send_exception_response($exception->getMessage());
        }
    }

    /**
     * Invalidate the JWT token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function user_profile(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $user->load('get_user_details');

            $roleLabel = '';
            if ($user->primary_role) {
                $roles = config('registration.primary_roles', []);
                $roleLabel = $roles[$user->primary_role] ?? $user->primary_role;
                if ($user->primary_role === 'other' && $user->other_role_text) {
                    $roleLabel .= ' (' . $user->other_role_text . ')';
                }
            }

            $profile = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'user_name' => $user->user_name,
                'gender' => $user->gender,
                'dob' => $user->dob,
                'mobile_number' => $user->mobile_number,
                'country' => $user->country,
                'company_name' => $user->company_name,
                'primary_role' => $user->primary_role,
                'primary_role_label' => $roleLabel,
                'other_role_text' => $user->other_role_text,
                'profile_image' => $user->profile_image_link,
                'bio' => $user->get_user_details->user_about ?? '',
                'location' => $user->get_user_details->location ?? '',
                'kyc_verified' => $user->isKycVerified(),
                'email_verified' => $user->email_verified_at !== null,
                'name_locked' => $user->isKycVerified(),
                'email_locked' => $user->isKycVerified() || $user->email_verified_at !== null,
            ];

            $result = json_encode(['profile' => $profile]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Profile fetched successfully!');
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function user_profile_update(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $payload = json_decode($data, true);

            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $nameLocked = $user->isKycVerified();
            $emailLocked = $user->isKycVerified() || $user->email_verified_at !== null;

            if ($nameLocked && (
                (isset($payload['first_name']) && $payload['first_name'] !== $user->first_name) ||
                (isset($payload['last_name']) && $payload['last_name'] !== $user->last_name) ||
                (isset($payload['full_name']) && $payload['full_name'] !== $user->full_name)
            )) {
                return send_bad_request_response('Name cannot be changed after KYC verification.');
            }

            if ($emailLocked && isset($payload['email']) && $payload['email'] !== $user->email) {
                return send_bad_request_response('Email cannot be changed after verification.');
            }

            $validator = Validator::make($payload, [
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'mobile_number' => 'sometimes|string|max:21',
                'gender' => 'sometimes|string|max:20',
                'dob' => 'sometimes|nullable|string|max:20',
                'country' => 'sometimes|string|max:100',
                'primary_role' => 'sometimes|string|max:80',
                'other_role_text' => 'sometimes|nullable|string|max:255',
                'bio' => 'sometimes|nullable|string|max:1000',
                'location' => 'sometimes|nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $userFields = ['mobile_number', 'gender', 'dob', 'country', 'primary_role', 'other_role_text'];
            if (!$nameLocked) {
                $userFields = array_merge($userFields, ['first_name', 'last_name']);
                if (isset($payload['first_name']) || isset($payload['last_name'])) {
                    $payload['full_name'] = trim(($payload['first_name'] ?? $user->first_name) . ' ' . ($payload['last_name'] ?? $user->last_name));
                    $userFields[] = 'full_name';
                }
            }
            if (!$emailLocked) {
                $userFields[] = 'email';
            }

            foreach ($userFields as $field) {
                if (isset($payload[$field])) {
                    $user->$field = $payload[$field];
                }
            }

            if (isset($payload['primary_role']) && $payload['primary_role'] !== 'other') {
                $user->other_role_text = null;
            }

            $user->save();

            $details = $user->get_user_details;
            if ($details) {
                if (isset($payload['bio'])) {
                    $details->user_about = $payload['bio'];
                }
                if (isset($payload['location'])) {
                    $details->location = $payload['location'];
                }
                $details->save();
            }

            $result = json_encode(['user_id' => $user->id]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Profile updated successfully!');
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function invalidateToken(): \Illuminate\Http\JsonResponse
    {
        try {
            $token = JWTAuth::getToken();
            if ($token) {
                // Invalidate the JWT token forever
                JWTAuth::invalidate($token, true);
                return send_success_response([], 'Token invalidated successfully');
            } else {
                return send_bad_request_response('No token provided');
            }
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }
}
