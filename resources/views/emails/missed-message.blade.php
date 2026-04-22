@component('mail::message')
# You Have a New Message on Connect

Hello {{ $firstName }},

You received a message from {{ $userName }} on Connect.

Log in to read the message and reply.

**View message:**

@component('mail::button', ['url' => $messageLink])
View message
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
