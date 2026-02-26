@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Change Password</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">General Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Change Password</li>
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
                                        <a href="{{ route('admin.profile-settings') }}" class=" rounded flex-fill"><i
                                                class="ti ti-user-circle me-2"></i>Profile Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.change-password') }}" class=" active rounded flex-fill"><i
                                                class="ti ti-lock-cog me-2"></i>Change Password</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Change Password -->
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Change Password</h4>
                                </div>
                                <form id="changePasswordForm">
                                    <div class="card-body pb-0">
                                        <div class="row">
                                            <div class="col-md-10 col-lg-10">
                                                <div class="row change-password d-flex align-items-center">
                                                    <div class="col-md-5">
                                                        <label class="form-label flex-fill">Current Password</label>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="input-icon input-icon-left mb-3">
                                                            <input type="password"
                                                                class="pass-input form-control validate-input"
                                                                placeholder="{{ __('Old Password')}}"
                                                                id="password">
                                                            <span
                                                                class="ti toggle-password ti-eye-off icon-left"></span>
                                                            <div class="invalid-feedback"
                                                                id="password-error">
                                                                @error('password')
                                                                    {{ $message }}
                                                                @enderror
                                                            </div>
                                                            <div class="valid-feedback"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-10 col-lg-10">
                                                <div class="row change-password d-flex align-items-center">
                                                    <div class="col-md-5">
                                                        <label class="form-label flex-fill">New Password</label>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="input-icon  input-icon-left mb-3">
                                                            <input type="password"
                                                                class="pass-inputs form-control validate-input"
                                                                placeholder="{{ __('New Password')}}"
                                                                id="new_password">
                                                            <span
                                                                class="ti toggle-passwords ti-eye-off icon-left"></span>
                                                            <div class="invalid-feedback"
                                                                id="new_password-error">
                                                                @error('new_password')
                                                                    {{ $message }}
                                                                @enderror
                                                            </div>
                                                                <div class="mb-3 invalid-feedback" id="newpasswordErrorCharacter">
                                                                    @error('new_password')
                                                                    {{ $message }}
                                                                    @enderror
                                                                </div>
                                                            <div class="valid-feedback"></div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                            <div class="col-md-10 col-lg-10">
                                                <div class="row change-password d-flex align-items-center mb-3">
                                                    <div class="col-md-5">
                                                        <label class="form-label flex-fill">Confirm Password</label>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="input-icon  input-icon-left mb-3">
                                                            <input type="password"
                                                                class="conform-pass-input form-control validate-input"
                                                                placeholder="{{ __('Confirmed Password')}}"
                                                                id="confirm_password">
                                                            <span
                                                                class="ti conform-toggle-password ti-eye-off icon-left"></span>
                                                            <div class="invalid-feedback"
                                                                id="confirm_password-error">
                                                                @error('confirm_password')
                                                                    {{ $message }}
                                                                @enderror
                                                            </div>
                                                            <div class="mb-3 invalid-feedback" id="confirmpasswordErrorCharacter">
                                                                @error('confirm_password')
                                                                {{ $message }}
                                                                @enderror
                                                            </div>
                                                            <div class="valid-feedback"></div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer mx-3 px-0">
                                        <div class="d-flex align-items-center justify-content-end m-0">
                                            <a href="#" class="btn btn-outline-primary me-2">Cancel</a>
                                            <button type="submit" class="btn btn-primary">Save</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <!-- /Change Password -->
                    </div>
                </div>

            </div>
            <!-- /General Settings -->

        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseChangePassword.js') }}" crossorigin="anonymous"></script>
@endsection
