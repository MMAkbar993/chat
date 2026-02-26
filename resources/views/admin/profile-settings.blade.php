@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Profile Settings</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">General Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Profile Settings</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <!-- General Settings -->
            <div class="card setting-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card d-inline-flex setting-header mb-3">
                                <div class="card-body d-flex align-items-center flex-wrap row-gap-2 p-0">
                                    <a href="{{ route('admin.profile-settings') }}" class="active ps-3"><i
                                            class="ti ti-settings-cog me-2"></i>General Settings</a>
                                    <a href="{{ route('admin.app-settings') }}"><i class="ti ti-apps me-2"></i>App
                                        Settings</a>
                                    <a href="{{ route('admin.system-settings') }}"><i
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
                                        <a href="{{ route('admin.profile-settings') }}" class="active rounded flex-fill"><i
                                                class="ti ti-user-circle me-2"></i>Profile Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.change-password') }}" class="rounded flex-fill"><i
                                                class="ti ti-lock-cog me-2"></i>Change Password</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Profile Settings -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Profile Settings</h4>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="col-lg-12" style="display: none;">
                                        <div class="input-icon mb-3 position-relative">
                                            <input type="text" value="" class="form-control" placeholder="UID"
                                                id="user-id">
                                            <span class="icon-addon">
                                                <i class="ti ti-user"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="avatar avatar-xxl me-3">
                                            <img id="profileImageProfile"
                                                src="{{ asset('assets/img/profiles/avatar-03.jpg') }}"
                                                class="rounded img-fluid" alt="user">
                                        </div>
                                        <div>
                                            <p class="text-dark fw-medium mb-0">Upload Profile Image</p>
                                            <div class="d-flex align-items-center">
                                                <div class="profile-uploader d-flex align-items-center">
                                                    <div class="drag-upload-btn btn mb-0">
                                                        Upload
                                                        <input type="file" id="imageUpload"
                                                            class="form-control image-sign" accept="image/*">
                                                    </div>
                                                    <a href="javascript:void(0);"
                                                        class="btn btn-md btn-outline-primary" id="removeImageBtn">Remove</a>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div id="user-id" style="display: none;"></div>
                                        <div class="col-md-6 col-sm-12">
                                            <div class="mb-3">
                                                <label class="form-label">First Name</label>
                                                <input type="text" class="form-control" id="profile-info-first-name">
                                            </div>
                                        </div>
                                        <div class="col-md-6 col-sm-12">
                                            <div class="mb-3">
                                                <label class="form-label">Last Name</label>
                                                <input type="text" class="form-control" id="profile-info-last-name">
                                            </div>
                                        </div>
                                        <div class="col-md-6 col-sm-12">
                                            <div class="mb-3">
                                                <label class="form-label">Email Address</label>
                                                <input type="text" class="form-control" id="profile-info-email" disabled>
                                            </div>
                                        </div>
                                        <div class="col-md-6 col-sm-12">
                                            <div class="mb-3">
                                                <label class="form-label">Phone Number</label>
                                                <input type="text" class="form-control" id="profile-info-phone" oninput="this.value=this.value.slice(0,15);" maxlength="15" disabled>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer mx-3 px-0">
                                    <div class="d-flex align-items-center justify-content-end m-0">
                                        <a href="#" class="btn btn-outline-primary me-2">Cancel</a>
                                        <a href="#" class="btn btn-primary" id="saveProfileBtn">Save</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- /Profile Settings -->
                    </div>

                </div>

            </div>
            <!-- /General Settings -->
        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseProfileSettings.js') }}" crossorigin="anonymous"></script>
@endsection
<script>
    defaultAvatar = "{{ asset('assets/img/profiles/avatar-03.jpg') }}";
</script>
