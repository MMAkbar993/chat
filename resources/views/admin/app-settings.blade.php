@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Company Settings</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">App Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Company Settings</li>
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
                                        <a href="{{ route('admin.app-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-building me-2"></i>Company Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.basic-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-mail-cog me-2"></i>Basic Settings</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Company Settings -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Company Settings</h4>
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
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Site Name</label>
                                                    <input type="text" class="form-control" id="site_name">
                                                    <div id="site_name_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Email Address</label>
                                                    <input type="text" class="form-control" id="site_email">
                                                    <div id="site_email_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Phone</label>
                                                    <input type="text" class="form-control" id="site_number" minlength="10" maxlength="21">
                                                    <div id="site_number_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Fax</label>
                                                    <input type="text" class="form-control" id="site_fax">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="company-img">
                                        <div class="mb-3">
                                            <h6>Company Images</h6>
                                        </div>
                                        <div class="row gx-3">
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Logo</h6>
                                                            <p>Upload Logo of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content">
                                                                    <img id="companyLogo" src="{{ asset('assets/img/full-logo.png') }}" alt=""
                                                                        class="img-fluid company-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Change Photo
                                                                            <input type="file" id="companyLogoUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 250 px*100 px</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Dark Logo</h6>
                                                            <p>Upload Dark Logo of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content img-dark ">
                                                                    <img id="DarkLogo" src="{{ asset('assets/img/dark-logo.svg') }}" alt=""
                                                                        class="img-fluid dark-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Change Photo
                                                                            <input type="file" id="darkLogoUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 250 px*100 px</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Mini Icon</h6>
                                                            <p>Upload Mini Icon of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content mini-icon">
                                                                    <img id="MiniLogo" src="{{ asset('assets/img/dark-logo.svg') }}" alt=""
                                                                        class="img-fluid mini-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Upload Photo
                                                                            <input type="file" id="miniIconUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 30 px*30 px</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Dark Mini Icon</h6>
                                                            <p>Upload Mini Icon of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content dark-mini-icon">
                                                                    <img id="darkminilogo" src="{{ asset('assets/img/dark-mini-logo.svg') }}"
                                                                        alt="image" class="img-fluid dark-mini-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Change Photo
                                                                            <input type="file" id="darkminiIconUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 30 px*30 px</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Favicon</h6>
                                                            <p>Upload Favicon of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content favicon-logo">
                                                                    <img id="faviIcon" src="{{ asset('assets/img/logo-small.svg') }}" alt="image"
                                                                        class="img-fluid favi-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Change Photo
                                                                            <input type="file" id="faviconUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 128 px*128 px</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xl-6 col-sm-12">
                                                <div class="card mb-3">
                                                    <div class="card-body">
                                                        <div class="company-img-title">
                                                            <h6>Apple Icon</h6>
                                                            <p>Upload App Icon of your Company to display in website</p>
                                                        </div>
                                                        <div class="row align-items-center row-gap-3">
                                                            <div class="col-sm-6">
                                                                <div class="company-img-content favicon-logo">
                                                                    <img id="appleIcon" src="{{ asset('assets/img/logo-small.svg') }}" alt="image"
                                                                        class="img-fluid apple-image">
                                                                    
                                                                </div>
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <div
                                                                    class="d-flex align-items-end justify-content-end flex-column flex-wrap">
                                                                    <div
                                                                        class="profile-uploader d-flex align-items-center mb-2">
                                                                        <div class="drag-upload-btn btn-sm btn mb-0">
                                                                            Change Photo
                                                                            <input type="file" id="appleIconUpload"
                                                                                class="form-control image-sign"
                                                                                accept="image/*">
                                                                        </div>
                                                                    </div>
                                                                    <p class="fs-10">Recommended size is 180 px*180 px</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="address-info">
                                        <div class="company-title mb-3">
                                            <h6>Address Information</h6>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Address</label>
                                                    <input type="text" class="form-control" id="site_address">
                                                    <div id="site_address_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">City</label>
                                                    <input type="text" class="form-control" id="site_city">
                                                    <div id="site_city_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">State</label>
                                                    <input type="text" class="form-control" id="site_state">
                                                    <div id="site_state_error" class="error-message text-danger"></div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label" for="site_country">Country:</label>
                                                    <input type="text" class="form-control" id="site_country">
                                                    <div id="site_country_error" class="error-message text-danger"></div>
                                                    {{-- <select class="select" id="site_country">
                                                        <option value="">Select Country</option>
                                                        <!-- Countries will be populated here -->
                                                    </select> --}}
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Postal Code</label>
                                                    <input type="text" class="form-control" id="site_code" oninput="this.value=this.value.slice(0,6);" maxlength="6">
                                                    <div id="site_code_error" class="error-message text-danger"></div>
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
    <script type="module" src="{{asset('assets/js/firebase/firebaseAppSettings.js')}}" crossorigin="anonymous"></script>
@endsection