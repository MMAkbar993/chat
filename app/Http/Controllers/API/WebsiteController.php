<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Jobs\VerifyWebsiteMetaTag;
use App\Models\UserWebsite;
use App\Models\Website;
use App\Models\WebsiteRepresentative;
use App\Services\EncryptionService;
use App\Services\WebsiteVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WebsiteController extends Controller
{
    protected EncryptionService $encryptionService;

    protected WebsiteVerificationService $verificationService;

    private const MAX_WEBSITES = 5;

    private const META_TAG_NAME = 'greenunimind-verification';

    public function __construct(EncryptionService $encryptionService, WebsiteVerificationService $verificationService)
    {
        $this->encryptionService = $encryptionService;
        $this->verificationService = $verificationService;
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $websites = $user->websites->map(function ($w) use ($user) {
                $item = [
                    'id' => $w->id,
                    'url' => $w->getDisplayUrl(),
                    'domain' => $w->website?->domain ?? $this->verificationService->normalizeDomain($w->url),
                    'verified' => $w->isVerified(),
                    'verified_at' => $w->verified_at?->toIso8601String(),
                    'verification_token' => $w->verification_token,
                    'relationship_type' => $w->relationship_type ?? 'owner',
                    'is_company_admin' => $w->website && $w->website->admin_user_id === $user->id,
                    'sort_order' => $w->sort_order,
                ];
                if (!$w->isVerified()) {
                    $item['meta_tag'] = '<meta name="' . self::META_TAG_NAME . '" content="' . $w->verification_token . '" />';
                }
                return $item;
            });

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

            $domain = $this->verificationService->normalizeDomain($payload['url']);
            $url = $this->verificationService->normalizeUrl($payload['url']);

            if (empty($domain)) {
                return send_bad_request_response('Invalid website URL.');
            }

            $existingUserWebsite = $user->websites()
                ->where(function ($q) use ($url, $domain) {
                    $q->where('url', $url)->orWhereHas('website', fn ($w) => $w->where('domain', $domain));
                })
                ->first();

            if ($existingUserWebsite) {
                return send_bad_request_response('This website has already been added.');
            }

            $verifiedWebsite = $this->verificationService->getVerifiedWebsite($domain);

            if ($verifiedWebsite) {
                $result = json_encode([
                    'already_verified' => true,
                    'website_id' => $verifiedWebsite->id,
                    'domain' => $verifiedWebsite->domain,
                    'can_request_representation' => true,
                    'message' => 'This website has already been verified.',
                ]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response(['data' => $data], 'This website has already been verified.');
            }

            $token = $this->verificationService->generateVerificationToken();
            $nextOrder = ($user->websites()->max('sort_order') ?? -1) + 1;

            $website = $user->websites()->create([
                'url' => $url,
                'verification_token' => $token,
                'sort_order' => $nextOrder,
                'relationship_type' => UserWebsite::RELATIONSHIP_OWNER,
            ]);

            $result = json_encode([
                'website' => [
                    'id' => $website->id,
                    'url' => $website->url,
                    'verification_token' => $website->verification_token,
                    'verified' => false,
                    'sort_order' => $website->sort_order,
                    'meta_tag' => '<meta name="' . self::META_TAG_NAME . '" content="' . $website->verification_token . '" />',
                    'first_verified_becomes_admin' => true,
                    'message' => 'You are the first user to verify this website and will become the company administrator. You will manage representation requests.',
                ],
            ]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Website added. Add the meta tag to your site\'s <head> and click verify.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    /**
     * Add a website from the Settings form (plain request, no encryption). Redirects back with flash message.
     */
    public function storeFromWeb(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate(['url' => 'required|string|max:500']);

        $user = Auth::user();
        if (!$user) {
            return redirect()->route('settings')->with('error', __('You must be logged in.'));
        }

        if ($user->websites()->count() >= self::MAX_WEBSITES) {
            return redirect()->route('settings')->with('error', __('Maximum of :max websites allowed.', ['max' => self::MAX_WEBSITES]));
        }

        $domain = $this->verificationService->normalizeDomain($request->url);
        $url = $this->verificationService->normalizeUrl($request->url);

        if (empty($domain)) {
            return redirect()->route('settings')->with('error', __('Invalid website URL.'));
        }

        $existingUserWebsite = $user->websites()
            ->where(function ($q) use ($url, $domain) {
                $q->where('url', $url)->orWhereHas('website', fn ($w) => $w->where('domain', $domain));
            })
            ->first();

        if ($existingUserWebsite) {
            return redirect()->route('settings')->with('error', __('This website has already been added.'));
        }

        $verifiedWebsite = $this->verificationService->getVerifiedWebsite($domain);
        if ($verifiedWebsite) {
            return redirect()->route('settings')->with('error', __('This website has already been verified by another user. You can request representation.'));
        }

        $token = $this->verificationService->generateVerificationToken();
        $nextOrder = ($user->websites()->max('sort_order') ?? -1) + 1;

        $user->websites()->create([
            'url' => $url,
            'verification_token' => $token,
            'sort_order' => $nextOrder,
            'relationship_type' => UserWebsite::RELATIONSHIP_OWNER,
        ]);

        return redirect()->route('settings')->with('success', __('Website added. Add the meta tag to your site’s &lt;head&gt; section below and click Verify.'));
    }

    public function verify(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $userWebsite = $user->websites()->find($id);
            if (!$userWebsite) {
                return send_bad_request_response('Website not found.');
            }

            if ($userWebsite->isVerified()) {
                return send_success_response([], __('Website is already verified.'));
            }

            $domain = $this->verificationService->normalizeDomain($userWebsite->url);
            if ($this->verificationService->isDomainAlreadyVerified($domain)) {
                $result = json_encode([
                    'already_verified' => true,
                    'can_request_representation' => true,
                ]);
                $data = $this->encryptionService->encryptData($result);
                return send_success_response(['data' => $data], __('This website has already been verified by another user.'));
            }

            try {
                VerifyWebsiteMetaTag::dispatchSync($userWebsite->id);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Website verify job failed', ['id' => $id, 'message' => $e->getMessage()]);
                return send_success_response(
                    ['verified' => false],
                    __('Verification failed. Please check the meta tag and try again.')
                );
            }

            // Refresh the model to check if verification succeeded
            $userWebsite->refresh();
            $verified = $userWebsite->isVerified();

            $result = json_encode([
                'verified' => $verified,
                'message' => $verified
                    ? __('Website verified successfully!')
                    : __('Verification failed. Make sure the meta tag is in your site\'s <head> section and try again.'),
            ]);
            $data = $this->encryptionService->encryptData($result);
            $message = $verified ? __('Website verified successfully!') : __('Verification failed. Make sure the meta tag is in your site\'s <head> section and try again.');
            return send_success_response(['data' => $data], $message);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Website verify error', ['id' => $id, 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return send_success_response(
                ['verified' => false],
                __('Something went wrong. Please try again.')
            );
        }
    }

    public function destroy(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $userWebsite = $user->websites()->find($id);
            if (!$userWebsite) {
                return send_bad_request_response('Website not found.');
            }

            if ($userWebsite->isOwner() && $userWebsite->website) {
                $website = $userWebsite->website;
                if ($website->admin_user_id === $user->id) {
                    $representatives = $website->userWebsites()->where('user_id', '!=', $user->id)->get();
                    foreach ($representatives as $rep) {
                        $rep->update(['website_id' => null, 'verified_at' => null]);
                    }
                    $website->representatives()->delete();
                    $website->delete();
                }
            }

            $userWebsite->delete();

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

    public function requestRepresentation(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values ?? '');
            if ($data === false) {
                return send_exception_response('Decryption failed.');
            }
            $payload = json_decode($data, true) ?? $request->all();

            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $validator = Validator::make($payload, [
                'website_id' => 'required|integer|exists:websites,id',
                'message' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $website = Website::find($payload['website_id']);
            if (!$website) {
                return send_bad_request_response('Website not found.');
            }

            if ($website->admin_user_id === $user->id) {
                return send_bad_request_response('You are already the company administrator for this website.');
            }

            if ($user->websites()->whereHas('website', fn ($q) => $q->where('id', $website->id))->exists()) {
                return send_bad_request_response('You already represent this website.');
            }

            $existing = WebsiteRepresentative::where('website_id', $website->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                if ($existing->status === 'pending') {
                    return send_bad_request_response('You already have a pending representation request.');
                }
                if ($existing->status === 'approved') {
                    return send_bad_request_response('You already represent this website.');
                }
            }

            $rep = WebsiteRepresentative::create([
                'website_id' => $website->id,
                'user_id' => $user->id,
                'status' => WebsiteRepresentative::STATUS_PENDING,
                'message' => $payload['message'] ?? null,
                'requested_at' => now(),
            ]);

            $admin = $website->admin;
            if ($admin) {
                $admin->notify(new \App\Notifications\RepresentationRequestNotification($rep));
            }

            $result = json_encode([
                'request_id' => $rep->id,
                'message' => 'Representation request sent. The company administrator will review your request.',
            ]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Representation request sent.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function approveRepresentation(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return $this->decideRepresentation($request, $id, 'approved');
    }

    public function denyRepresentation(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return $this->decideRepresentation($request, $id, 'denied');
    }

    protected function decideRepresentation(Request $request, int $id, string $status): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $rep = WebsiteRepresentative::with('website')->find($id);
            if (!$rep) {
                return send_bad_request_response('Representation request not found.');
            }

            if ($rep->website->admin_user_id !== $user->id) {
                return send_bad_request_response('Only the company administrator can approve or deny this request.');
            }

            if ($rep->status !== WebsiteRepresentative::STATUS_PENDING) {
                return send_bad_request_response('This request has already been processed.');
            }

            DB::transaction(function () use ($rep, $user, $status) {
                $rep->update([
                    'status' => $status,
                    'decided_by' => $user->id,
                    'decided_at' => now(),
                ]);

                if ($status === 'approved') {
                    $nextOrder = $rep->user->websites()->max('sort_order') ?? -1;
                    $rep->user->websites()->create([
                        'website_id' => $rep->website_id,
                        'url' => 'https://' . $rep->website->domain,
                        'verification_token' => 'rep-' . $rep->id . '-' . bin2hex(random_bytes(8)),
                        'verified_at' => now(),
                        'relationship_type' => UserWebsite::RELATIONSHIP_REPRESENTATIVE,
                        'sort_order' => $nextOrder + 1,
                    ]);
                }
            });

            $message = $status === 'approved'
                ? 'Representation request approved. The user can now represent your company.'
                : 'Representation request denied.';

            return send_success_response([], $message);
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function removeRepresentative(Request $request, int $websiteId, int $userId): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $website = Website::find($websiteId);
            if (!$website || $website->admin_user_id !== $user->id) {
                return send_bad_request_response('Website not found or you are not the administrator.');
            }

            $userWebsite = UserWebsite::where('website_id', $websiteId)
                ->where('user_id', $userId)
                ->where('relationship_type', UserWebsite::RELATIONSHIP_REPRESENTATIVE)
                ->first();

            if (!$userWebsite) {
                return send_bad_request_response('Representative not found.');
            }

            $userWebsite->delete();

            return send_success_response([], 'Representative removed successfully.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function authorizedUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $ownedWebsites = $user->ownedWebsites()->with(['representatives.user', 'userWebsites.user'])->get();

            $result = [];
            foreach ($ownedWebsites as $website) {
                $pending = $website->pendingRepresentationRequests()->with('user')->get()->map(fn ($r) => [
                    'id' => $r->id,
                    'user_id' => $r->user_id,
                    'name' => $r->user->full_name ?? $r->user->first_name . ' ' . $r->user->last_name,
                    'email' => $r->user->email,
                    'message' => $r->message,
                    'requested_at' => $r->requested_at->toIso8601String(),
                ]);
                $approved = $website->userWebsites()
                    ->where('relationship_type', UserWebsite::RELATIONSHIP_REPRESENTATIVE)
                    ->with('user')
                    ->get()
                    ->map(fn ($uw) => [
                        'user_id' => $uw->user_id,
                        'name' => $uw->user->full_name ?? $uw->user->first_name . ' ' . $uw->user->last_name,
                        'email' => $uw->user->email,
                    ]);
                $result[] = [
                    'website_id' => $website->id,
                    'domain' => $website->domain,
                    'pending_requests' => $pending,
                    'authorized_representatives' => $approved,
                ];
            }

            $encrypted = $this->encryptionService->encryptData(json_encode(['websites' => $result]));
            return send_success_response(['data' => $encrypted], 'Authorized users fetched.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function checkDomain(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $data = $this->encryptionService->decryptData($request->values ?? '');
            if ($data === false) {
                return send_exception_response('Decryption failed.');
            }
            $payload = json_decode($data, true) ?? $request->all();

            $validator = Validator::make($payload, [
                'url' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return send_bad_request_response($validator->errors()->first());
            }

            $domain = $this->verificationService->normalizeDomain($payload['url']);
            $verifiedWebsite = $this->verificationService->getVerifiedWebsite($domain);

            $result = [
                'domain' => $domain,
                'already_verified' => (bool) $verifiedWebsite,
                'website_id' => $verifiedWebsite?->id,
                'can_request_representation' => (bool) $verifiedWebsite,
            ];
            $encrypted = $this->encryptionService->encryptData(json_encode($result));
            return send_success_response(['data' => $encrypted], 'Domain check completed.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }
}
