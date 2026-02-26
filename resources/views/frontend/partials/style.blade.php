@if (!Route::is(['signup', 'success', 'reset-password', 'otp', 'forgot-password','login','signin','register.payment']))
    <!-- Theme Script Js -->
    <script src="{{ asset('assets/js/theme-script.js') }}"></script>
@endif
<!-- Bootstrap CSS -->
<link rel="stylesheet" href="{{ asset('assets/css/bootstrap.min.css') }}">

<!-- Feathericon CSS -->
<link rel="stylesheet" href="{{ asset('assets/css/feather.css') }}">

<!-- Fontawesome CSS -->
<link rel="stylesheet" href="{{ asset('assets/plugins/fontawesome/css/fontawesome.min.css') }}">
<link rel="stylesheet" href="{{ asset('assets/plugins/fontawesome/css/all.min.css') }}">

<!-- TablerIcon CSS -->
<link rel="stylesheet" href="{{ asset('assets/plugins/tabler-icons/tabler-icons.min.css') }}">

@if (!Route::is(['signup', 'reset-password', 'forgot-password','login','register.payment']))
<!-- Swiper CSS -->
<link rel="stylesheet" href="{{ asset('assets/plugins/swiper/swiper.min.css') }}">

<!-- FancyBox CSS -->
<link rel="stylesheet" href="{{ asset('assets/plugins/fancybox/jquery.fancybox.min.css') }}">


<!-- Select CSS -->
<link rel="stylesheet" href="{{ asset('assets/plugins/select2/css/select2.min.css') }}">

<!-- Datetimepicker CSS -->
<link rel="stylesheet" href="{{ asset('assets/css/bootstrap-datetimepicker.min.css') }}">
<link href="{{ asset('assets/css/boxicons.min.css') }}" rel="stylesheet">
<!-- Dropzone -->
<link rel="stylesheet" href="{{ asset('assets/plugins/dropzone/dropzone.min.css') }}">
@endif

<link rel="stylesheet" href="{{ asset('assets/css/toastify.min.css') }}">

<!-- Style CSS -->
<link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
