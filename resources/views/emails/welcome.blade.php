@component('mail::message')
# Welcome to Connect

Hello {{ $firstName }},

Welcome to Connect, the communication platform built for the iGaming industry.

You can now connect with affiliates, casino operators, and partners in real time.

Start exploring and building your network today.

**Access your account:**

@component('mail::button', ['url' => $loginLink])
Log in to Connect
@endcomponent

If you have any questions, feel free to contact our team.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
