<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Jobs\VerifyWebsiteMetaTag;
use App\Models\UserWebsite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Services\EncryptionService;

class WebsiteController extends Controller
{
    protected EncryptionService $encryptionService;

    private const MAX_WEBSITES = 5;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $websites = $user->websites->map(fn ($w) => [
                'id' => $w->id,
                'url' => $w->url,
                'verified' => $w->isVerified(),
                'verified_at' => $w->verified_at?->toIso8601String(),
                'verification_token' => $w->verification_token,
                'sort_order' => $w->sort_order,
            ]);

            $result = json_encode(['websites' => $websites]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Websites fetched successfully!');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values);
            if ($data === false) {
                return send_exception_response('Decryption failed.');
            }
            $payload = json_decode($data, true);

            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            if ($user->websites()->count() >= self::MAX_WEBSITES) {
                return send_bad_request_response('Maximum of ' . self::MAX_WEBSITES . ' websites allowed.');
            }

            $validator = Validator::make($payload, [
                'url' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $url = $this->normalizeUrl($payload['url']);

            $existing = $user->websites()->where('url', $url)->first();
            if ($existing) {
                return send_bad_request_response('This website has already been added.');
            }

            $token = Str::random(48);
            $nextOrder = ($user->websites()->max('sort_order') ?? -1) + 1;

            $website = $user->websites()->create([
                'url' => $url,
                'verification_token' => $token,
                'sort_order' => $nextOrder,
            ]);

            $result = json_encode([
                'website' => [
                    'id' => $website->id,
                    'url' => $website->url,
                    'verification_token' => $website->verification_token,
                    'verified' => false,
                    'sort_order' => $website->sort_order,
                    'meta_tag' => '<meta name="affiliate-roulette-verification" content="' . $token . '" />',
                ],
            ]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Website added. Add the meta tag to your site\'s <head> and click verify.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function verify(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $website = $user->websites()->find($id);
            if (!$website) {
                return send_bad_request_response('Website not found.');
            }

            if ($website->isVerified()) {
                return send_success_response([], 'Website is already verified.');
            }

            VerifyWebsiteMetaTag::dispatch($website->id);

            $result = json_encode(['message' => 'Verification started. This may take a moment.']);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Verification job dispatched.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function destroy(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $website = $user->websites()->find($id);
            if (!$website) {
                return send_bad_request_response('Website not found.');
            }

            $website->delete();

            return send_success_response([], 'Website removed successfully.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function reorder(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values);
            if ($data === false) {
                return send_exception_response('Decryption failed.');
            }
            $payload = json_decode($data, true);

            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $validator = Validator::make($payload, [
                'order' => 'required|array',
                'order.*' => 'integer|exists:user_websites,id',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            foreach ($payload['order'] as $index => $websiteId) {
                $user->websites()->where('id', $websiteId)->update(['sort_order' => $index]);
            }

            return send_success_response([], 'Order updated.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    protected function normalizeUrl(string $url): string
    {
        $url = trim($url);
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? '');
        return 'https://' . $host;
    }
}
