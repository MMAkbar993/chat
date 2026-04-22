@component('mail::message')
# OTP Verification

Hello, {{ $data['name'] }}!

Here is your one-time password (OTP) for verification:

@component('mail::panel')
**{{ $data['otp'] }}**
@endcomponent

{{-- @component('mail::button', ['url' => 'https://your-app.com/verify?otp=' . $data['otp']])
Verify OTP
@endcomponent --}}

If you didn’t request this, please ignore this email.

Thanks
@endcomponent
