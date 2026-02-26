<!-- jQuery -->
<script src="{{ asset('assets/js/jquery-3.7.1.min.js') }}"></script>

<!-- Bootstrap Core JS -->
<script src="{{ asset('assets/js/bootstrap.bundle.min.js') }}"></script>

<!-- Slimscroll JS -->
<script src="{{ asset('assets/plugins/slimscroll/jquery.slimscroll.min.js') }}"></script>

 @if (!Route::is(['admin.forgot-password', 'admin.login']))
<!-- Select JS -->
<script src="{{ asset('assets/plugins/select2/js/select2.min.js') }}"></script>
@if (Route::is(['admin.users', 'admin.group']))
<script src="{{ asset('assets/js/jspdf.min.js') }}"></script>
<script src="{{ asset('assets/js/jspdf-autotable.min.js') }} "></script>
@endif
<!-- Datatable JS -->
<script src="{{ asset('assets/plugins/datatables/datatables.min.js') }}"></script>

  <!-- Alret message -->
  <script src="{{ asset('assets/js/sweetalert.js') }}"></script>

@endif
<script type="module" src="{{ asset('assets/js/firebase/firebase.js') }}" crossorigin="anonymous"></script>
<!-- Custom JS -->
<script src="{{ asset('assets/js/admin-main.js') }}"></script>

<script src="{{ asset('assets/js/toastify.js') }} "></script>
<script>
    const defaultAvatar = "{{ asset('assets/img/profiles/avatar-03.jpg') }}";
    const defaultLogoAvatar = "{{ asset('assets/img/full-logo.png') }}"
</script>