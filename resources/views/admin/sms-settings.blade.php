@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">SMS Settings</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item"><a href="javascript:void(0);">System Settings</a></li>
                            <li class="breadcrumb-item active" aria-current="page">SMS Settings</li>
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
                                    <a href="{{ route('admin.localization-settings') }}" class="active"><i
                                            class="ti ti-device-ipad-horizontal-cog me-2"></i>System Settings</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3">
                        <div class="col-xl-3 col-md-4">
                            <div class="card mb-3 mb-md-0">
                                <div class="card-body setting-sidebar">
                                    <div class="d-flex">
                                        <a href="{{ route('admin.localization-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-globe me-2"></i>Localization</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.email-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-mail-cog me-2"></i>Email Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.sms-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-message-cog me-2"></i>SMS Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.otp') }}" class="rounded flex-fill"><i class="ti ti-password me-2"></i>OTP
                                            Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.language') }}" class="rounded flex-fill"><i
                                                class="ti ti-language me-2"></i>Language</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.gdpr') }}" class="rounded flex-fill"><i class="ti ti-cookie me-2"></i>GDPR
                                            Cookies</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>SMS Settings</h4>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="row gx-3">
                                        <div class="col-lg-4 col-md-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <span><img src="{{ asset('assets/img/icon/sms-settings-01.svg') }}"
                                                                alt=""></span>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="d-inline-flex me-2"
                                                                data-bs-toggle="modal" data-bs-target="#sms_mail">
                                                                <i class="ti ti-settings"></i>
                                                            </a>
                                                            <div class="form-check form-switch">
                                                                <input class="form-check-input" type="checkbox"
                                                                    role="switch">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-4 col-md-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <span><img src="{{ asset('assets/img/icon/sms-settings-02.svg') }}"
                                                                alt=""></span>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="d-inline-flex me-2"
                                                                data-bs-toggle="modal" data-bs-target="#sms_mail">
                                                                <i class="ti ti-settings"></i>
                                                            </a>
                                                            <div class="form-check form-switch">
                                                                <input class="form-check-input" type="checkbox"
                                                                    role="switch">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-4 col-md-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <span><img src="{{ asset('assets/img/icon/sms-settings-03.svg') }}"
                                                                alt=""></span>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="d-inline-flex me-2"
                                                                data-bs-toggle="modal" data-bs-target="#sms_mail">
                                                                <i class="ti ti-settings"></i>
                                                            </a>
                                                            <div class="form-check form-switch">
                                                                <input class="form-check-input" type="checkbox"
                                                                    role="switch">
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
            </div>
            <!-- /Profile Settings -->
        </div>
    </div>
    <!-- /Page Wrapper -->

    <!-- Php Mail -->
    <div class="modal fade" id="sms_mail">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Nexmo</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                        aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form action="{{ route('admin.sms-settings') }}">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">API Key </label>
                            <input type="text" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">API Secret Key </label>
                            <input type="text" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Sender ID </label>
                            <input type="text" class="form-control">
                        </div>
                        <div class="row gx-3">
                            <div class="col-6">
                                <button type="button" class="btn btn-outline-primary w-100"
                                    data-bs-dismiss="modal">Cancel</button>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100">Submit</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- /Php Mail -->
@endsection
