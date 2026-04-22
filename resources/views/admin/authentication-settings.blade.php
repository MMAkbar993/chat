@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Authentication</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">App Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Authentication</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <!-- App Settings -->
            <div class="card setting-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card d-inline-flex setting-header mb-3">
                                <div class="card-body d-flex align-items-center flex-wrap row-gap-2 p-0">
                                    <a href="{{ route('admin.profile-settings') }}"><i class="ti ti-settings-cog me-2"></i>General
                                        Settings</a>
                                    <a href="{{ route('admin.app-settings') }}" class="active ps-3"><i class="ti ti-apps me-2"></i>App
                                        Settings</a>
                                    <a href="{{ route('admin.localization-settings') }}"><i
                                            class="ti ti-device-ipad-horizontal-cog me-2"></i>System
                                        Settings</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3">
                        <div class="col-xl-3 col-md-4">
                            <div class="card mb-3 mb-md-0">
                                <div class="card-body setting-sidebar">
                                    <div class="d-flex">
                                        <a href="{{ route('admin.app-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-building me-2"></i>Company Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.authentication-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-forms me-2"></i>Authentication</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.social-auth') }}" class="rounded flex-fill"><i
                                                class="ti ti-social me-2"></i>Social Authentication </a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.chat-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-message-circle-cog me-2"></i>Chat Settings </a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.video-audio-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-settings-automation me-2"></i>Video/Audio Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.custom-fields') }}" class="rounded flex-fill"><i
                                                class="ti ti-text-plus me-2"></i>Custom Fields</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.integrations') }}" class="rounded flex-fill"><i
                                                class="ti ti-plug-connected me-2"></i>Integrations</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Autentication Settings -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Authentication</h4>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="row row-gap-2 mb-3 py-2">
                                                <div class="col-md-6">
                                                    <h6 class="fw-medium">Allow Registration</h6>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3 py-2">
                                                <div class="col-md-6">
                                                    <h6 class="fw-medium">Verification Required</h6>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3">
                                                <div class="col-md-6 d-flex">
                                                    <div class="d-flex align-items-center">
                                                        <h6 class="fw-medium">Verification Expired</h6>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <select class="select">
                                                        <option>60</option>
                                                        <option>30</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3 py-2">
                                                <div class="col-md-6">
                                                    <h6 class="fw-medium">Referral System</h6>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3">
                                                <div class="col-md-6 d-flex">
                                                    <div class="d-flex align-items-center">
                                                        <h6 class="fw-medium">Login Type</h6>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <select class="select">
                                                        <option>Mobile</option>
                                                        <option>Computer</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3 py-2">
                                                <div class="col-md-6">
                                                    <h6 class="fw-medium">Password</h6>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3 py-2">
                                                <div class="col-md-6">
                                                    <h6 class="fw-medium">OTP System</h6>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row row-gap-2 mb-3">
                                                <div class="col-md-6 d-flex">
                                                    <div class="d-flex align-items-center">
                                                        <h6 class="fw-medium">Verification Expired</h6>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <select class="select">
                                                        <option>60</option>
                                                        <option>30</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Autentication Settings -->
                    </div>

                </div>

            </div>
            <!-- /App Settings -->

        </div>
    </div>
    <!-- /Page Wrapper -->
@endsection
