@extends('installer::app')
@section('content')
    <div class="card">
        <div class="card-header d-flex justify-content-between">
            <p>Database Setup (MySQL)</p>
            <div>
                <a class="btn btn-outline-primary" href="{{ route('setup.requirements') }}">&laquo; Back</a>
            </div>
        </div>
        <div class="card-body">
            <p class="text-muted mb-4">Enter your MySQL credentials. The database must already exist (create it in phpMyAdmin or MySQL before continuing).</p>
            <form id="mysql_setup_form" autocomplete="off">
                @csrf
                <div class="mb-3">
                    <label class="form-label">Host <span class="text-danger">*</span></label>
                    <input type="text" name="db_host" id="db_host" class="form-control"
                        value="{{ old('db_host', '127.0.0.1') }}" placeholder="e.g. 127.0.0.1">
                </div>
                <div class="mb-3">
                    <label class="form-label">Port <span class="text-danger">*</span></label>
                    <input type="text" name="db_port" id="db_port" class="form-control"
                        value="{{ old('db_port', '3306') }}" placeholder="3306">
                </div>
                <div class="mb-3">
                    <label class="form-label">Database Name <span class="text-danger">*</span></label>
                    <input type="text" name="db_database" id="db_database" value="{{ old('db_database') }}" class="form-control"
                        placeholder="e.g. dreamschat">
                </div>
                <div class="mb-3">
                    <label class="form-label">Database User <span class="text-danger">*</span></label>
                    <input type="text" name="db_username" id="db_username" value="{{ old('db_username', 'root') }}"
                        class="form-control" placeholder="e.g. root">
                </div>
                <div class="mb-3">
                    <label class="form-label">Database Password</label>
                    <input type="password" name="db_password" id="db_password" value="{{ old('db_password') }}"
                        class="form-control" placeholder="Leave empty if none" autocomplete="new-password">
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <button type="submit" id="mysql_submit_btn" class="btn btn-lg btn-primary">Setup MySQL & Run Migrations</button>
                </div>
            </form>

            <hr class="my-4">
            <p class="mb-2"><strong>Skip database step?</strong> If .env is already configured and migrations are run, you can skip to admin account.</p>
            <a href="#" id="mysql_only_btn" class="btn btn-outline-secondary">Skip to Admin Account</a>
        </div>
        <div class="card-footer text-center">
            <p class="mb-0">For script support, contact us at <a href="https://dreamstechnologies.com/page/support"
                target="_blank" rel="noopener noreferrer">@dreamstechnologies</a>. We're here to help. Thank you!</p>
        </div>
    </div>
@endsection

@push('scripts')
    <script>
       $(document).ready(function () {
    $(document).on('submit', '#mysql_setup_form', async function (e) {
        e.preventDefault();
        var host = $('#db_host').val();
        var port = $('#db_port').val();
        var database = $('#db_database').val();
        var username = $('#db_username').val();
        var password = $('#db_password').val();
        var submit_btn = $('#mysql_submit_btn');

        if (!$.trim(host)) {
            toastr.warning("Host is required");
            return;
        }
        if (!$.trim(port)) {
            toastr.warning("Port is required");
            return;
        }
        if (!$.trim(database)) {
            toastr.warning("Database name is required");
            return;
        }
        if (!$.trim(username)) {
            toastr.warning("Database user is required");
            return;
        }

        submit_btn.prop('disabled', true).html(
            'Setting up... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
        );

        try {
            var data = {
                _token: $("meta[name='csrf-token']").attr("content"),
                db_host: host,
                db_port: port,
                db_database: database,
                db_username: username,
                db_password: password || ''
            };
            const res = await makeAjaxRequest(data, "{{ route('setup.database.submit') }}");
            if (res.success) {
                toastr.success(res.message);
                submit_btn.addClass('btn-success').html('Redirecting...');
                window.location.href = "{{ route('setup.account') }}";
            } else {
                toastr.error(res.message || "Setup failed");
                if (res.errors) {
                    $.each(res.errors, function (i, err) {
                        if (Array.isArray(err)) err.forEach(function(m) { toastr.error(m); });
                        else toastr.error(err);
                    });
                }
                submit_btn.prop('disabled', false).html('Setup MySQL & Run Migrations');
            }
        } catch (error) {
            submit_btn.prop('disabled', false).html('Setup MySQL & Run Migrations');
            if (error.errors) {
                $.each(error.errors, function (index, value) {
                    toastr.error(Array.isArray(value) ? value.join(' ') : value);
                });
            } else {
                toastr.error(error.message || "An unexpected error occurred");
            }
        }
    });

    $('#mysql_only_btn').on('click', async function(e) {
        e.preventDefault();
        var btn = $(this);
        btn.prop('disabled', true).text('Skipping...');
        try {
            const res = await makeAjaxRequest({
                mysql_only: 1,
                _token: $("meta[name='csrf-token']").attr("content")
            }, "{{ route('setup.database.submit') }}");
            if (res.success) {
                toastr.success(res.message);
                window.location.href = "{{ route('setup.account') }}";
            } else {
                toastr.error(res.message || "An error occurred");
            }
        } catch (err) {
            toastr.error(err.message || "An unexpected error occurred");
        }
        btn.prop('disabled', false).text('Skip to Admin Account');
    });
});
    </script>
@endpush
