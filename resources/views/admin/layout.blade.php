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
    <link id="fav-logo" rel="shortcut icon" type="image/x-icon" href="{{ asset('assets/img/favicon.png') }}">

        @includeIf('admin.partials.style')
</head>
@if (!Route::is(['admin.login', 'admin.success', 'admin.reset-password','admin.reset-password-success', 'admin.forgot-password','admin.send-otp.submit']))

    <body>
@endif
@if (Route::is(['admin.login', 'admin.success', 'admin.reset-password','admin.reset-password-success', 'admin.forgot-password','admin.send-otp.submit']))

    <body class="login-form">
@endif
<div id="global-loader">
<div class="loader">
  <p class="heading">Loading</p>
  <div class="loading">
    <div class="load"></div>
    <div class="load"></div>
    <div class="load"></div>
    <div class="load"></div>
  </div>
</div>
</div>
@if (!Route::is(['admin.login', 'admin.success', 'admin.reset-password','admin.reset-password-success', 'admin.forgot-password','admin.send-otp.submit']))
    <div class="main-wrapper">
@endif
@if (Route::is(['admin.login', 'admin.success', 'admin.reset-password','admin.reset-password-success', 'admin.forgot-password','admin.send-otp.submit']))
    <div class="main-wrapper register-surv">
@endif
@if (!Route::is(['admin.login', 'admin.success', 'admin.reset-password','admin.reset-password-success', 'admin.forgot-password','admin.send-otp.submit']))
@includeIf('admin.partials.header')
@includeIf('admin.partials.sidebar')
@endif
@yield('content')
</div>
@includeIf('admin.partials.script')
</body>

</html>
