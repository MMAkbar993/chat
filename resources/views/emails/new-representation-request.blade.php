@component('mail::message')
# New Representation Request for Your Website

Hello {{ $firstName }},

A user has requested to represent your website on Connect.

**User:** {{ $userName }}

**Website:** {{ $websiteName }}

Please review this request and approve or decline access on your dashboard.

@component('mail::button', ['url' => $approvalLink])
Review request
@endcomponent

If you do not recognize this request, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
