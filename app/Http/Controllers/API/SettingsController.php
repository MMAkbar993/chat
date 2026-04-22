<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Intervention\Image\Facades\Image;
use App\Models\User;
use App\Models\Addresses;
use App\Models\UserDetails;
use App\Models\WebsiteSettings;
use App\Models\SystemSettings;
use App\Models\EmailSettings;
use App\Services\EncryptionService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use DB;

class SettingsController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function website_settings(Request $request) {
        try {
            DB::beginTransaction();
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request = new Request($request_data);
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:website_settings,user_id',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $website_settings = WebsiteSettings::where('user_id', $request->user_id)->first();

            DB::commit();
            if ($website_settings) {
                $result = json_encode(['website_settings' => $website_settings]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response([
                    'website_settings' => $data
                ], 'Data fetched successfully!');
            } else {
                DB::rollBack();
                return send_bad_request_response('The selected id is invalid.');
            }
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function website_settings_update(Request $request) {
        try {
            DB::beginTransaction();
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request_data['company_logo'] = $request->company_logo;
            $request_data['company_icon'] = $request->company_icon;
            $request_data['company_favicon'] = $request->company_favicon;
            $request_data['company_dark_logo'] = $request->company_dark_logo;

            $request = new Request($request_data);
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
                'company_name' => 'nullable|string',
                'company_email' => 'nullable|string|email|max:255',
                'company_phone_number' => 'nullable|string',
                'company_fax' => 'nullable|string',
                'company_website' => 'nullable|string',
                'company_logo' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg',
                'company_icon' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg',
                'company_favicon' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg',
                'company_dark_logo' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg',
                'company_address' => 'nullable|string',
                'company_city' => 'nullable|string',
                'company_state' => 'nullable|string',
                'company_country' => 'nullable|string',
                'company_postal_code' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $website_settings = WebsiteSettings::where('user_id', $request->user_id)->first();
            if(!$website_settings) {
                $website_settings = new WebsiteSettings();
            }

            $image_file_name_1 = '';
            $request_img_name = 'company_logo';
            $logo_original_path = config('image_settings.backEnd.admin.website_settings.logo.path');
            if($request->hasFile($request_img_name)) {
                if ($request->$request_img_name != '') {
                    $image = $request->file('company_logo');

                    if (Storage::exists($logo_original_path . $website_settings->company_logo)) {
                        Storage::delete($logo_original_path . $website_settings->company_logo);
                    }

                    $image_file_name_1 = Carbon::now()->timestamp . '_' . $image->getClientOriginalName();
                    $path = $logo_original_path . $image_file_name_1;
                    $makeImage = Image::make($image->getRealPath())->resize(150, 150);
                    Storage::put($path, $makeImage->stream()->__toString());
                    $website_settings->company_logo = $image_file_name_1;
                }
            }

            $image_file_name_2 = '';
            $request_img_name = 'company_icon';
            $icon_original_path = config('image_settings.backEnd.admin.website_settings.icon.path');
            if($request->hasFile($request_img_name)) {
                if ($request->$request_img_name != '') {
                    $image = $request->file('company_icon');

                    if (Storage::exists($icon_original_path . $website_settings->company_icon)) {
                        Storage::delete($icon_original_path . $website_settings->company_icon);
                    }

                    $image_file_name_2 = Carbon::now()->timestamp . '_' . $image->getClientOriginalName();
                    $path = $icon_original_path . $image_file_name_2;
                    $makeImage = Image::make($image->getRealPath())->resize(150, 150);
                    Storage::put($path, $makeImage->stream()->__toString());
                    $website_settings->company_icon = $image_file_name_2;
                }
            }

            $image_file_name_3 = '';
            $request_img_name = 'company_favicon';
            $favicon_original_path = config('image_settings.backEnd.admin.website_settings.favicon.path');
            if($request->hasFile($request_img_name)) {
                if ($request->$request_img_name != '') {
                    $image = $request->file('company_favicon');

                    if (Storage::exists($favicon_original_path . $website_settings->company_favicon)) {
                        Storage::delete($favicon_original_path . $website_settings->company_favicon);
                    }

                    $image_file_name_3 = Carbon::now()->timestamp . '_' . $image->getClientOriginalName();
                    $path = $favicon_original_path . $image_file_name_3;
                    $makeImage = Image::make($image->getRealPath())->resize(150, 150);
                    Storage::put($path, $makeImage->stream()->__toString());
                    $website_settings->company_favicon = $image_file_name_3;
                }
            }

            $image_file_name_4 = '';
            $request_img_name = 'company_dark_logo';
            $dark_logo_original_path = config('image_settings.backEnd.admin.website_settings.dark_logo.path');
            if($request->hasFile($request_img_name)) {
                if ($request->$request_img_name != '') {
                    $image = $request->file('company_dark_logo');

                    if (Storage::exists($dark_logo_original_path . $website_settings->company_dark_logo)) {
                        Storage::delete($dark_logo_original_path . $website_settings->company_dark_logo);
                    }

                    $image_file_name_4 = Carbon::now()->timestamp . '_' . $image->getClientOriginalName();
                    $path = $dark_logo_original_path . $image_file_name_4;
                    $makeImage = Image::make($image->getRealPath())->resize(150, 150);
                    Storage::put($path, $makeImage->stream()->__toString());
                    $website_settings->company_dark_logo = $image_file_name_4;
                }
            }

            $website_settings->company_name = $request->company_name;
            $website_settings->company_email = $request->company_email;
            $website_settings->company_phone_number = $request->company_phone_number;
            $website_settings->company_fax = $request->company_fax;
            $website_settings->company_website = $request->company_website;
            $website_settings->company_address = $request->company_address;
            $website_settings->company_city = $request->company_city;
            $website_settings->company_state = $request->company_state;
            $website_settings->company_country = $request->company_country;
            $website_settings->company_postal_code = $request->company_postal_code;
            $website_settings->save();

            DB::commit();
            if (isset($website_settings)) {
                $result = json_encode(['website_settings' => $website_settings]);
                $data = $this->encryptionService->encryptData($website_settings);
                return send_success_response([
                    'data' => $data
                ], 'Data updated successfully!');
            } else {
                DB::rollBack();
                return send_bad_request_response('The selected user id is invalid.');
            }            
        } catch (\Exception $exception) {
            return send_exception_response($exception->getMessage());
        }
    }

    public function system_settings(Request $request) {
        try {
            DB::beginTransaction();
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request = new Request($request_data);
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $system_settings = SystemSettings::where('user_id', $request->user_id)->first();

            $email_settings = EmailSettings::where('user_id', $request->user_id)->first();

            DB::commit();
            $result = json_encode(['system_settings' => $system_settings, 'email_settings' => $email_settings]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response([
                'data' => $data
            ], 'Data fetched successfully!');
        } catch (\Exception $exception) {
            DB::rollBack();
            return send_exception_response($exception->getMessage());
        }
    }

    public function system_settings_update(Request $request) {
        try {
            DB::beginTransaction();
            $data = $this->encryptionService->decryptData($request->values);
            if ($data == false) {
                return send_exception_response('Decryption failed. Invalid ciphertext or nonce.');
            }
            $request_data = json_decode($data, true);
            $request = new Request($request_data);
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
                'system_id' => 'nullable|string',
                'email_id' => 'nullable|string',
                'system_settings_name' => 'nullable|string',
                'application_key' => 'nullable|string',
                'authnticate_domain' => 'nullable|string',
                'database_url' => 'nullable|string',
                'project_id' => 'nullable|string',
                'storage_bucket' => 'nullable|string',
                'message_id' => 'nullable|string',
                'application_id' => 'nullable|string',
                'system_active_status' => 'nullable|in:on,off',
                'email_settings_name' => 'nullable|string',
                'from_name' => 'nullable|string',
                'from_email_address' => 'nullable|string',
                'email_password' => 'nullable|string',
                'host' => 'nullable|string',
                'port' => 'nullable|string',
                'email_active_status' => 'nullable|in:on,off',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $system_settings = SystemSettings::where('id', $request->system_id)->where('user_id', $request->user_id)->first();
            // $system_settings = new SystemSettings();
            // $system_settings->user_id = $request->user_id;
            $system_settings->system_settings_name = $request->system_settings_name;
            $system_settings->application_key = $request->application_key;
            $system_settings->authnticate_domain = $request->authnticate_domain;
            $system_settings->database_url = $request->database_url;
            $system_settings->project_id = $request->project_id;
            $system_settings->storage_bucket = $request->storage_bucket;
            $system_settings->message_id = $request->message_id;
            $system_settings->application_id = $request->application_id;
            $system_settings->active_status = ($request->system_active_status == "on")? 1 : 0;
            $system_settings->save();

            $email_settings = EmailSettings::where('id', $request->email_id)->where('user_id', $request->user_id)->first();
            // $email_settings = new EmailSettings();
            // $email_settings->user_id = $request->user_id;
            $email_settings->email_settings_name = $request->email_settings_name;
            $email_settings->from_name = $request->from_name;
            $email_settings->from_email_address = $request->from_email_address;
            $email_settings->email_password = $request->email_password;
            $email_settings->host = $request->host;
            $email_settings->port = $request->port;
            $email_settings->active_status = ($request->email_active_status == "on")? 1 : 0;
            $email_settings->save();

             DB::commit();
            if ($email_settings || $system_settings) {
                $result = json_encode(['system_settings' => $system_settings, 'email_settings' => $email_settings]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response(['data' => $data], 'Data updated successfully!');
            } else {
                DB::rollBack();
                return send_bad_request_response('The selected user id is invalid.');
            }
        } catch (\Exception $exception) {
            DB::rollBack();
            return send_exception_response($exception->getMessage());
        }
    }

}
