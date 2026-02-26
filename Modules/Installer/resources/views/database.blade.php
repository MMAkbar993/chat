@extends('installer::app')
@section('content')
    <div class="card">
        <div class="card-header d-flex justify-content-between">
            <p>Enter Firebae Details</p>
            <div>
                <a class="btn btn-outline-primary" href="{{ route('setup.requirements') }}">&laquo; Back</a>
            </div>
        </div>
        <!-- <form id="database_migrate_form" autocomplete="off">
            <div class="card-body">
                <div class="mb-3">
                    <label>Host <span class="text-danger">*</span></label>
                    <input type="text" name="host" id="host" class="form-control"
                        value="{{ old('host') ?: '127.0.0.1' }}" placeholder="Enter Database Host">
                </div>
                <div class="mb-3">
                    <label>Port <span class="text-danger">*</span></label>
                    <input type="text" name="port" id="port" class="form-control"
                        value="{{ old('port') ?: '3306' }}" placeholder="Enter Database Port. Default Is 3306">
                </div>
                <div class="mb-3">
                    <label>Database Name <span class="text-danger">*</span></label>
                    <input type="text" name="database" id="database" value="{{ old('database') }}" class="form-control"
                        placeholder="Enter Database Name Here">
                    <div class="my-3 d-none" id="reset_database_switcher">
                        <input class="form-check-input" type="checkbox" role="switch" id="reset_database"
                            name="reset_database" {{ old('reset_database') ? 'checked' : '' }}>
                        <label for="reset_database" class="text-danger"><b><small>Database not empty. Are you sure
                                    want to clean this
                                    database?</small></b> </label>
                    </div>
                </div>
                <div class="mb-3">
                    <label>Database User <span class="text-danger">*</span></label>
                    <input autocomplete="off" type="text" name="user" id="user" value="{{ old('user') }}"
                        class="form-control" placeholder="Enter Database User Here">
                </div>
                <div class="mb-3">
                    <label>Database User Password @if (isset($isLocalHost) && !$isLocalHost)
                            <span class="text-danger">*</span>
                        @endif
                    </label>
                    <input autocomplete="new-password" type="password" name="password" id="password"
                        value="{{ old('password') }}" class="form-control" placeholder="Enter Database Password Here">
                </div>
                <div class="mb-3">
                    <b class="text-success">If you prefer a fresh installation without any dummy data, simply toggle the
                        "Fresh Install" switch.</b>
                </div>
            </div>
            <div class="card-footer d-flex justify-content-between ">
                <input class="form-check-input" type="checkbox" role="switch" id="fresh_install" name="fresh_install"
                    {{ old('fresh_install') ? 'checked' : '' }}>
                <button type="submit" id="submit_btn" class="btn btn-lg btn-primary">Setup Database</button>
            </div>
        </form> -->

        <form id="database_migrate_form">
    <input type="hidden" name="uid" value="1">
    <div class="modal-body p-4">
        <div class="mb-3">
            <label class="form-label">Application Key <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="application_key" name="application_key" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Authenticated Domain <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="authnticate_domain" name="authnticate_domain" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Database URL <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="database_url" name="database_url" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Project ID <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="project_id" name="project_id" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Storage Bucket <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="storage_bucket" name="storage_bucket" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Message ID <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="message_id" name="message_id" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Application ID <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="application_id" name="application_id" required>
        </div>
        <div class="card-footer d-flex justify-content-end">
                <button type="submit" id="saveFirebaseButton" class="btn btn-lg btn-primary">Setup Firebase</button>
            </div>
    </div>
</form>

        <div class="card-footer text-center">
            <p>For script support, contact us at <a href="https://dreamstechnologies.com/page/support"
                target="_blank" rel="noopener noreferrer">@dreamstechnologies</a>. We're here to help. Thank you!</p>
        </div>
    </div>
@endsection

@push('styles')
    <link href="{{ asset('frontend/css/bootstrap-toggle.min.css') }}" rel="stylesheet">
    <style>
        .form-switch {
            padding-left: 0px !important;
        }

        .form-check {
            padding-left: 0px !important;
        }

        .toggle.btn.btn-lg {
            width: 212px;
        }
    </style>
@endpush

@push('scripts')
    <script src="{{ asset('frontend/js/bootstrap-toggle.jquery.min.js') }}"></script>
    <script>
        "use strict";
        $('#reset_database').bootstrapToggle({
            onlabel: 'Yes',
            offlabel: 'No',
            onstyle: 'danger',
            offstyle: 'secondary',
            size: 'sm'
        });
        $('#fresh_install').bootstrapToggle({
            onlabel: 'Fresh Install',
            offlabel: 'With Dummy Data',
            onstyle: 'success',
            offstyle: 'warning',
            size: 'lg'
        });
    </script>
    <script>
       $(document).ready(function () {
    $(document).on('submit', '#database_migrate_form', async function (e) {
        e.preventDefault();

        // Getting form values
        let application_key = $('#application_key').val();
        let authnticate_domain = $('#authnticate_domain').val();
        let database_url = $('#database_url').val();
        let project_id = $('#project_id').val();
        let storage_bucket = $('#storage_bucket').val();
        let message_id = $('#message_id').val();
        let application_id = $('#application_id').val();
        let submit_btn = $('#saveFirebaseButton');

        // Validate fields
        if ($.trim(application_key) === '') {
            toastr.warning("Application Key is required");
        } else if ($.trim(authnticate_domain) === '') {
            toastr.warning("Authenticated Domain is required");
        } else if ($.trim(database_url) === '') {
            toastr.warning("Database URL is required");
        } else if ($.trim(project_id) === '') {
            toastr.warning("Project ID is required");
        } else if ($.trim(storage_bucket) === '') {
            toastr.warning("Storage Bucket is required");
        } else if ($.trim(message_id) === '') {
            toastr.warning("Message ID is required");
        } else if ($.trim(application_id) === '') {
            toastr.warning("Application ID is required");
        } else {
            // Disable the button and show loading spinner
            submit_btn.html(
                'Saving... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
            ).prop('disabled', true);

            try {
                // Prepare the data
                let data = {
                    application_key,
                    authnticate_domain,
                    database_url,
                    project_id,
                    storage_bucket,
                    message_id,
                    application_id
                };

                // Make an AJAX request
                const res = await makeAjaxRequest(data, "{{ route('setup.database.submit') }}");

                if (res.success) {
                    toastr.success(res.message);
                    submit_btn.addClass('btn-success').html('Redirecting...');
                    window.location.href = "{{ route('setup.account') }}";
                } else {
                    toastr.error(res.message || "An error occurred");
                    submit_btn.html('Submit').prop('disabled', false);
                }
            } catch (error) {
                submit_btn.html('Submit').prop('disabled', false);
                if (error.errors) {
                    $.each(error.errors, function (index, value) {
                        toastr.error(value);
                    });
                } else {
                    toastr.error("An unexpected error occurred");
                }
            }
        }
    });
});
    </script>
@endpush
