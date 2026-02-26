<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * Affiliate Roulette: Full name, username, company name, country, work email (match company domain), primary role, terms.
     */
    public function rules(): array
    {
        $roleKeys = config('registration.primary_role_keys', []);

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'user_name' => ['required', 'string', 'max:255', 'unique:users,user_name'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_website' => ['required', 'string', 'max:255', 'url'], // e.g. https://gamblizard.com
            'country' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $domain = $this->getCompanyDomain();
                    if ($domain === null || $domain === '') {
                        return;
                    }
                    $emailDomain = strpos($value, '@') !== false
                        ? strtolower(substr(strrchr($value, '@'), 1))
                        : '';
                    if ($emailDomain !== $domain) {
                        $fail("Work email domain must match company website domain ({$domain}).");
                    }
                },
            ],
            'primary_role' => ['required', 'string', Rule::in($roleKeys)],
            'other_role_text' => ['nullable', 'required_if:primary_role,other', 'string', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:21'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'terms' => ['accepted'],
        ];
    }

    /**
     * Extract normalized domain from company_website (e.g. https://gamblizard.com -> gamblizard.com)
     */
    protected function getCompanyDomain(): ?string
    {
        $url = $this->input('company_website');
        if (! is_string($url) || $url === '') {
            return null;
        }
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $host = parse_url($url, PHP_URL_HOST);
        if (! is_string($host)) {
            return null;
        }
        return strtolower($host);
    }

    public function attributes(): array
    {
        return [
            'full_name' => __('Full Name (Legal)'),
            'user_name' => __('Username'),
            'company_name' => __('Company Name'),
            'company_website' => __('Company Website'),
            'country' => __('Country'),
            'email' => __('Work Email'),
            'primary_role' => __('Primary Role'),
            'other_role_text' => __('Other role description'),
            'terms' => __('Terms & Conditions'),
        ];
    }
}
