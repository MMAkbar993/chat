@component('mail::message')
# You Have a New Connection Request

Hello {{ $firstName }},

{{ $userName }} has sent you a connection request on Connect.

Log in to view the request and start connecting.

**View request:**

@component('mail::button', ['url' => $friendRequestLink])
View request
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
