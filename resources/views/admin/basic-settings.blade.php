@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Basic Settings</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">App Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Basic Settings</li>
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
                                    <a href="{{ route('admin.system-settings') }}"><i
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
                                        <a href="{{ route('admin.basic-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-mail-cog me-2"></i>Basic Settings</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Company Settings -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Basic Settings</h4>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="border-bottom">
                                        <div class="company-title mb-3">
                                            <h6>Basic Information</h6>
                                        </div>
                                        <div class="col-lg-12" style="display: none;">
                                            <div class="input-icon mb-3 position-relative">
                                                <input type="text" value=""
                                                    class="form-control" placeholder="UID"
                                                    id="uid">
                                                <span class="icon-addon">
                                                    <i class="ti ti-user"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Privacy Policy</label>
                                                    <input type="text" class="form-control" id="privacy_policy">
                                                </div>
                                            </div>
                                            <div class="col-md-12 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Terms & Conditions</label>
                                                    <input type="text" class="form-control" id="terms_conditions">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer mx-3 px-0">
                                    <div class="d-flex align-items-center justify-content-end m-0">
                                        <a href="#" class="btn btn-outline-primary me-2">Cancel</a>
                                        <a href="#" class="btn btn-primary" id="SaveButton">Save</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- /Company Settings -->
                    </div>

                </div>

            </div>
            <!-- /App Settings -->

        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{asset('assets/js/firebase/firebaseBasicSettings.js')}}" crossorigin="anonymous"></script>
@endsection