@extends('admin.layout')

@section('content')
<!-- Page Wrapper -->
<div class="page-wrapper">
    <div class="content container-fluid">
        <!-- Page Header -->
        <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
            <div class="my-auto">
                <h4 class="page-title mb-1">System Settings</h4>
                <nav>
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item">
                            <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                        </li>
                        <li class="breadcrumb-item"><a href="javascript:void(0);">System Settings</a></li>
                        <li class="breadcrumb-item active" aria-current="page">System Settings</li>
                    </ol>
                </nav>
            </div>
        </div>
        <!-- Page Header -->

        <!-- Profile Settings -->
        <div class="card setting-card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="card d-inline-flex setting-header mb-3">
                            <div class="card-body d-flex align-items-center flex-wrap row-gap-2 p-0">
                                <a href="{{ route('admin.profile-settings') }}" class=" ps-3"><i
                                        class="ti ti-settings-cog me-2"></i>General Settings</a>
                                <a href="{{ route('admin.app-settings') }}"><i class="ti ti-apps me-2"></i>App Settings</a>
                                <a href="{{ route('admin.system-settings') }}" class="active"><i
                                        class="ti ti-device-ipad-horizontal-cog me-2"></i>System Settings</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row gx-3">
                    <div class="col-md-3">
                        <div class="card mb-3 mb-md-0">
                            <div class="card-body setting-sidebar">
                                <div class="d-flex">
                                    <a href="{{ route('admin.system-settings') }}" class="active rounded flex-fill"><i
                                            class="ti ti-mail-cog me-2"></i>System Settings</a>
                                </div>
                                <!-- <div class="d-flex">
                                    <a href="{{ route('admin.language') }}" class="rounded flex-fill"><i
                                            class="ti ti-language me-2"></i>Language</a>
                                </div> -->
                            </div>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <div class="card setting-content mb-0">
                            <div class="card-header px-0 mx-3">
                                <h4>System Settings</h4>
                            </div>
                            <div class="card-body pb-0">
                                <div class="row gx-3">
                                    <div class="col-md-6">
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <div class="d-flex align-items-center justify-content-between mb-3">
                                                    <h6>Agora</h6>
                                                    <span class="badge badge-success">Connected</span>
                                                </div>
                                                <p class="mb-3">Cloud-based email marketing tool that assists
                                                    marketers and developers .</p>
                                                <div
                                                    class="d-flex align-items-center justify-content-between border-top pt-3">
                                                    <a href="#"
                                                        class="btn btn-sm btn-outline-dark d-inline-flex align-items-center"
                                                        data-bs-toggle="modal" data-bs-target="#agora-cap">
                                                        <i class="ti ti-settings-cog me-2"></i>Add/Edit Credentials
                                                    </a>
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox"
                                                            role="switch" checked="">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /Profile Settings -->
    </div>
</div>
<!-- /Page Wrapper -->

<div class="modal fade" id="php_mail">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">PHP EMail</h4>
                <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                    aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <form method="POST">
                @csrf
                <input type="hidden" name="uid">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">From Email Address </label>
                        <input type="text" class="form-control" id="from_email_address" name="from_email_address"
                            value="{{ old('from_email_address') }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email Password </label>
                        <input type="text" class="form-control" id="email_password" name="email_password"
                            value="{{ old('email_password') }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">From Name </label>
                        <input type="text" class="form-control" id="from_name" name="from_name"
                            value="{{ old('from_name') }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Host</label>
                        <input type="text" class="form-control" id="host" name="host"
                            value="{{ old('host') }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Port</label>
                        <input type="text" class="form-control" id="port" name="port"
                            value="{{ old('port') }}">
                    </div>
                    <div class="row gx-3">
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-primary w-100"
                                data-bs-dismiss="modal">Cancel</button>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="savePhpMailButton">Submit</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="fire-cap">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Firebase Settings</h4>
                <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <form method="POST" id="firebaseSettingsForm">
                @csrf
                <input type="hidden" name="uid" value="1">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Application Key</label>
                        <input type="text" class="form-control" id="application_key" name="application_key">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Authenticated Domain</label>
                        <input type="text" class="form-control" id="authnticate_domain" name="authnticate_domain">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Database Url</label>
                        <input type="text" class="form-control" id="database_url" name="database_url">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Project Id</label>
                        <input type="text" class="form-control" id="project_id" name="project_id">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Storage Bucket</label>
                        <input type="text" class="form-control" id="storage_bucket" name="storage_bucket">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message Id</label>
                        <input type="text" class="form-control" id="message_id" name="message_id">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Application Id</label>
                        <input type="text" class="form-control" id="application_id" name="application_id">
                    </div>
                    <div class="row gx-3">
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-primary w-100" data-bs-dismiss="modal">Cancel</button>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="saveFirebaseButton">Submit</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>


<div class="modal fade" id="agora-cap">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Agora</h4>
                <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                    aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <form method="POST">
                @csrf
                <input type="hidden" name="uid">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Agora Application Id </label>
                        <input type="text" class="form-control" id="agora_application_id" name="agora_application_id">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Agora App Certificate </label>
                        <input type="text" class="form-control" id="agora_app_certification" name="agora_app_certification">
                    </div>
                    <div class="row gx-3">
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-primary w-100"
                                data-bs-dismiss="modal">Cancel</button>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="saveAgoraButton">Submit</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<script type="module" src="{{asset('assets/js/firebase/firebaseSystemSettings.js')}}" crossorigin="anonymous"></script>
@endsection