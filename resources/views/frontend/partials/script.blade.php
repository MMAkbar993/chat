 <!-- jQuery -->
 <script src="{{ asset('assets/js/jquery-3.7.1.min.js') }}"></script>

 <!-- Bootstrap Core JS -->
 <script src="{{ asset('assets/js/bootstrap.bundle.min.js') }}"></script>

 <!-- Slimscroll JS -->
 <script src="{{ asset('assets/plugins/slimscroll/jquery.slimscroll.min.js') }}"></script>
 @if (!Route::is('login','signup','register.payment'))
 <!-- Swiper JS -->
 <script src="{{ asset('assets/plugins/swiper/swiper.min.js') }}"></script>

 <!-- FancyBox JS -->
 <script src="{{ asset('assets/plugins/fancybox/jquery.fancybox.min.js') }}"></script>
 <script src="{{ asset('assets/plugins/fancybox/jquery.fancybox.js') }}"></script>

 <!-- Select JS -->
 <script src="{{ asset('assets/plugins/select2/js/select2.min.js') }}"></script>

 <!-- Datetimepicker JS -->
 <script src="{{ asset('assets/js/moment.min.js') }}"></script>
 <script src="{{ asset('assets/js/bootstrap-datetimepicker.min.js') }}"></script>

 <script src="{{ asset('assets/js/crypto-js.min.js') }}"></script>

 <!-- Alert message -->
 <script src="{{ asset('assets/js/sweetalert.js') }}"></script>

 <!-- Recorder (loaded for SPA) -->
 <script src="{{ asset('assets/js/recorder.js') }}"></script>
 <script src="{{ asset('assets/js/MediaStreamRecorder.js') }}"></script>
 <!-- Moment -->
 <script src="{{ asset('assets/plugins/moment/moment.min.js') }}"></script>
 <script src="{{ asset('assets/js/jspdf.umd.min.js') }}"></script>

 <!-- Dropzone JS -->
 <script src="{{ asset('assets/plugins/dropzone/dropzone.min.js') }}"></script>

 @endif
 <!-- Include Axios library -->
 <script src="{{ asset('assets/js/axios.min.js') }}"></script>
 <!-- Custom JS -->
 <script src="{{ asset('assets/js/script.js') }}"></script>

 <script src="{{ asset('assets/js/toastify.js') }}"></script>
 @if (!Route::is('login','signup','register.payment'))
 <script src="{{ asset('assets/js/AgoraRTC_N.js') }}"></script>
 @endif
 <script>
    const APP_URL = "{{ env('APP_URL') }}";
    const APP_ID = "{{ env('AGORA_APP_ID') }}";
    const IS_KYC_VERIFIED = {{ (Auth::check() && Auth::user()->isKycVerified()) ? 'true' : 'false' }};
    const IS_EMAIL_VERIFIED = {{ (Auth::check() && Auth::user()->email_verified_at) ? 'true' : 'false' }};
    const PRIMARY_ROLES = @json(config('registration.primary_roles', []));
    function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
</script>
@if (!Route::is('login','signup','register.payment','signin'))
<!-- SPA Navigation -->
<script src="{{ asset('assets/js/spa-navigation.js') }}"></script>
@endif
