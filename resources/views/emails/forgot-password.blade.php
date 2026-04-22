@component('mail::message')
# Reset Your Connect Password

Hello {{ $firstName }},

We received a request to reset your Connect password.

Click the link below to create a new password:

@component('mail::button', ['url' => $resetPasswordLink])
Reset password
@endcomponent

If you did not request this change, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
