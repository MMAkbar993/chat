@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Storage</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Other Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Storage</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <!-- Social-Authentication Settings -->
            <div class="card setting-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card d-inline-flex setting-header mb-3">
                                <div class="card-body d-flex align-items-center flex-wrap row-gap-2 p-0">
                                    <a href="{{ route('admin.profile-settings') }}"><i class="ti ti-settings-cog me-2"></i>General
                                        Settings</a>
                                    <a href="{{ route('admin.app-settings') }}"><i class="ti ti-apps me-2"></i>App Settings</a>
                                    <a href="{{ route('admin.localization-settings') }}"><i
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
                                        <a href="{{ route('admin.storage') }}" class="active rounded flex-fill"><i
                                                class="ti ti-server-cog me-2"></i>Storage</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.backup') }}" class="rounded flex-fill"><i
                                                class="ti ti-arrow-back-up me-2"></i>Backup & Restore</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.clear-cache') }}" class="  rounded flex-fill"><i
                                                class="ti ti-clear-all me-2"></i>Clear Cache</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.ban-address') }}" class="rounded flex-fill"><i
                                                class="ti ti-ban me-2"></i>Ban IP Address</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Storage</h4>
                                </div>
                                <div class="card-body pb-0 ">
                                    <div class="row gx-3">
                                        <div class="col-md-6 col-sm-12 d-flex">
                                            <div class="card flex-fill mb-3">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <div class="d-flex align-items-center">
                                                            <span class="avatar avatar-lg bg-light me-2"><img
                                                                    src="{{ asset('assets/img/Settings/local-storage-icons.svg') }}"
                                                                    alt="icons" class="w-auto h-auto"></span>
                                                            <h6 class="fs-14 fw-medium">Local Storage</h6>
                                                        </div>
                                                        <div class="d-flex align-items-center ">
                                                            <a href="#"><span class="me-2"><i
                                                                        class="ti ti-settings"></i></span></a>
                                                            <div class="form-check form-switch">
                                                                <input class="form-check-input" type="checkbox"
                                                                    role="switch">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 col-sm-12 d-flex">
                                            <div class="card flex-fill mb-3">
                                                <div class="card-body">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <div class="d-flex align-items-center">
                                                            <span class="avatar avatar-lg bg-light me-2"><img
                                                                    src="{{ asset('assets/img/Settings/aws-icon.svg') }}" alt="icons"
                                                                    class="w-auto h-auto"></span>
                                                            <h6 class="fs-14 fw-medium">AWS</h6>
                                                        </div>
                                                        <div class="d-flex align-items-center ">
                                                            <a href="#" data-bs-toggle="modal"
                                                                data-bs-target="#add_aws"><span class="me-2"><i
                                                                        class="ti ti-settings"></i></span></a>
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
            <!-- /Social-Authentication Settings -->

        </div>
    </div>
    <!-- /Page Wrapper -->

    <!-- AWS -->
    <div class="modal fade" id="add_aws">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">AWS Settings</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form action="{{ route('admin.storage') }}">
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">AWS Access Key </label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Secret Key </label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Bucket Name </label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Region </label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div>
                                    <label class="form-label">Base URL </label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer pt-0">
                        <div class="d-flex w-100 justify-content-between">
                            <a href="#" class="btn btn-outline-primary me-2 d-flex justify-content-center w-100"
                                data-bs-dismiss="modal">Cancel</a>
                            <button type="submit"
                                class="btn btn-primary d-flex justify-content-center w-100">Submit</button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
    <!-- /AWS -->
@endsection
