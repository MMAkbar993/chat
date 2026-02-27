<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0">

    <meta name="description" content="DreamsChat">
    <meta name="keywords" content="DreamsChat">
    <meta name="author" content="Dreamguys - DreamsChat">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>DreamsChat</title>

    <!-- Favicon -->
    <link id="logo-fav" rel="shortcut icon" type="image/x-icon" href="{{ asset('assets/img/favicon.png') }}">
    @includeIf('frontend.partials.style')
</head>

<body>

    @if (!Route::is(['signup', 'signin', 'success', 'reset-password', 'otp', 'forgot-password','login','register.payment']))
        <div class="main-wrapper">
    @endif
    @if (Route::is(['signup', 'signin', 'success', 'reset-password', 'otp', 'forgot-password','login','register.payment']))
        <div class="main-wrapper d-block">
    @endif
    @yield('content')
    </div>
    @includeIf('frontend.partials.popups')
    @includeIf('frontend.partials.script')
</body>
</html>
