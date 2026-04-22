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
            'country' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'primary_role' => ['required', 'string', Rule::in($roleKeys)],
            'other_role_text' => ['nullable', 'required_if:primary_role,other', 'string', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:21'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'terms' => ['accepted'],
        ];
    }


    public function attributes(): array
    {
        return [
            'full_name' => __('Full Name (Legal)'),
            'user_name' => __('Username'),
            'country' => __('Country'),
            'email' => __('Email Address'),
            'primary_role' => __('Primary Role'),
            'other_role_text' => __('Other role description'),
            'terms' => __('Terms & Conditions'),
        ];
    }
}
