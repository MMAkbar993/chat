@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Chat Settings</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">App Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Chat Settings</li>
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
                                    <a href="{{ route('admin.app-settings') }}" class="active ps-3"><i class="ti ti-apps me-2"></i>App
                                        Settings</a>
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
                                        <a href="{{ route('admin.app-settings') }}" class=" rounded flex-fill"><i
                                                class="ti ti-building me-2"></i>Company Settings</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.authentication-settings') }}" class="rounded flex-fill"><i
                                                class="ti ti-forms me-2"></i>Authentication</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.social-auth') }}" class="  rounded flex-fill"><i
                                                class="ti ti-social me-2"></i>Social Authentication </a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.chat-settings') }}" class=" active rounded flex-fill"><i
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
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <h4>Chat Settings</h4>
                                </div>
                                <div class="card-body  pb-0 ">
                                    <div class="row">
                                        <div class="col-md-8 col-sm-12">
                                            <div class="row align-items-center mb-3">
                                                <div class="col-lg-6">
                                                    <div class="chat-settings">
                                                        <h6 class="fw-medium">Message Length</h6>
                                                    </div>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="chat-options">
                                                        <input type="text" class="form-control" value="1000">
                                                    </div>
                                                </div>

                                            </div>
                                            <div class="row align-items-center chat-settings-lists mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Gif</h6>
                                                </div>
                                                <div class="col-lg-6">
                                                    <div class="d-flex align-items-center ">
                                                        <div class="form-check form-switch me-3 mb-0">
                                                            <input class="form-check-input" type="checkbox" role="switch"
                                                                checked>
                                                        </div>
                                                        <a href="#" data-bs-toggle="modal"
                                                            data-bs-target="#add_gif"><span class="chat-setting-icons"><i
                                                                    class="ti ti-settings"></i></span></a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Stickers</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Images</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row  align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Videos</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row  align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Audio Messages</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row  align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Codes</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row  align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">Enable Files</h6>
                                                </div>
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch"
                                                            checked>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row  align-items-center mb-3 py-2">
                                                <div class="col-lg-6">
                                                    <h6 class="fw-medium">File Extension List</h6>
                                                </div>
                                                <div class="col-lg-6">
                                                    <textarea class="form-control">.doc, .docs, .xls, .xlsx, .ppt, .pptx, .txt, .pdf, .jpeg, .png</textarea>
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

    <!-- Gif -->
    <div class="modal fade" id="add_gif">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Gif Settings</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                        aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form action="{{ route('admin.chat-settings') }}">
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Tenor API Key</label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div>
                                    <label class="form-label">GIF Limit</label>
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
    <!-- /Gif -->
@endsection
