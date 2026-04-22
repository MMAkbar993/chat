@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Appearance</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Theme Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Appearance</li>
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
                                    <a href="{{ route('admin.app-settings') }}"><i class="ti ti-apps me-2"></i>App Settings</a>
                                    <a href="{{ route('admin.localization-settings') }}"><i
                                            class="ti ti-device-ipad-horizontal-cog me-2"></i>System
                                        Settings</a>
                                    <a href="{{ route('admin.appearance-settings') }}" class="active"><i
                                            class="ti ti-layers-subtract me-2"></i>Theme Settings</a>
                                    <a href="{{ route('admin.storage') }}" class="pe-3"><i class="ti ti-settings-2 me-2"></i>Other
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
                                        <a href="{{ route('admin.authentication-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-globe me-2"></i>Appearance</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Autentication Settings -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Appearance</h4>
                                </div>
                                <div class="card-body pb-0 ">
                                    <div class="row align-items-center">
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <div class="setting-info mb-4">
                                                <h6 class="fs-14 fw-medium">Select Theme</h6>
                                            </div>
                                        </div>
                                        <div class="col-xl-9 col-lg-12 col-md-9">
                                            <div class="d-flex align-items-center">
                                                <div class="me-3">
                                                    <div class="card shadow-none">
                                                        <div class="card-body">
                                                            <a href="#">
                                                                <div class="border rounded border-gray mb-2">
                                                                    <img src="{{ asset('assets/img/theme/light.svg') }}"
                                                                        class="img-fluid rounded" alt="theme">
                                                                </div>
                                                                <p class="text-dark text-center">Light</p>
                                                            </a>
                                                        </div>

                                                    </div>
                                                </div>
                                                <div class="me-3">
                                                    <div class="card shadow-none">
                                                        <div class="card-body">
                                                            <a href="#">
                                                                <div class="border rounded border-gray mb-2">
                                                                    <img src="{{ asset('assets/img/theme/dark.svg') }}"
                                                                        class="img-fluid rounded" alt="theme">
                                                                </div>
                                                                <p class="text-dark text-center">Dark</p>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="card shadow-none">
                                                        <div class="card-body">
                                                            <a href="#">
                                                                <div class="border rounded border-gray mb-2">
                                                                    <img src="{{ asset('assets/img/theme/automatic.svg') }}"
                                                                        class="img-fluid rounded" alt="theme">
                                                                </div>
                                                                <p class="text-dark text-center">Automatic</p>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row align-items-center">
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <div class="setting-info mb-4">
                                                <h6 class="fs-14 fw-medium">Accent Color</h6>
                                            </div>
                                        </div>
                                        <div class="col-xl-4 col-lg-12 col-md-4">
                                            <div class="theme-colors mb-4">
                                                <ul class="d-flex align-items-center">
                                                    <li>
                                                        <span class="themecolorset active">
                                                            <span class="primecolor bg-primary">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>

                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-secondary">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-info">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-purple">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-pink">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-warning">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span class="themecolorset">
                                                            <span class="primecolor bg-danger">
                                                                <span class="colorcheck text-white"><i
                                                                        class="ti ti-check"></i></span>
                                                            </span>
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row align-items-center mb-4">
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <div class="">
                                                <h6 class="fs-14 fw-medium">Sidebar Size</h6>
                                            </div>
                                        </div>
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <select class="select">
                                                <option>Select</option>
                                                <option>Small - 85px</option>
                                                <option>Large - 250px</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row align-items-center mb-3">
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <div class="">
                                                <h6 class="fs-14 fw-medium">Font Family</h6>
                                            </div>
                                        </div>
                                        <div class="col-xl-3 col-lg-12 col-md-3">
                                            <select class="select">
                                                <option>Select</option>
                                                <option>Nunito</option>
                                                <option>Poppins</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer mx-3 px-0">
                                    <div class="d-flex align-items-center justify-content-end m-0">
                                        <a href="#" class="btn btn-outline-primary me-2">Cancel</a>
                                        <a href="#" class="btn btn-primary">Save</a>
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
