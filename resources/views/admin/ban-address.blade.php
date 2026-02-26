@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Ban IP Address</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Other Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Ban IP Address</li>
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
                                        <a href="{{ route('admin.storage') }}" class=" rounded flex-fill"><i
                                                class="ti ti-server-cog me-2"></i>Storage</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.backup') }}" class="  rounded flex-fill"><i
                                                class="ti ti-arrow-back-up me-2"></i>Backup & Restore</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.clear-cache') }}" class="  rounded flex-fill"><i
                                                class="ti ti-clear-all me-2"></i>Clear Cache</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.ban-address') }}" class=" active rounded flex-fill"><i
                                                class="ti ti-ban me-2"></i>Ban IP Address</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-9 col-md-8">
                            <div class="card setting-content mb-0">
                                <div class="card-header px-0 mx-3">
                                    <div class="d-flex align-items-center justify-content-between">
                                        <h4>Ban IP Address</h4>
                                        <a href="#" class="btn btn-primary btn-sm d-flex align-items-center"
                                            data-bs-toggle="modal" data-bs-target="#add_ban"><i
                                                class="ti ti-circle-plus me-2"></i>Add New IP Address</a>
                                    </div>
                                </div>
                                <div class="card-body pb-0 ">
                                    <div class="row bx-3">
                                        <div class="col-lg-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div
                                                        class="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                        <div class="d-flex align-items-center">
                                                            <span class="d-inline-flex me-2"><i
                                                                    class="ti ti-ban"></i></span>
                                                            <p class="fs-14 fw-medium text-dark">198.120.16.01</p>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="me-2" data-bs-toggle="modal"
                                                                data-bs-target="#edit_ban"><span class="text-gray"><i
                                                                        class="ti ti-edit"></i></span></a>
                                                            <a href="#"><span class="text-gray"><i
                                                                        class="ti ti-trash"></i></span></a>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p><span class="me-2"><i
                                                                    class="ti ti-info-circle"></i></span>Temporarily block
                                                            to protect user accounts from internet fraudsters</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div
                                                        class="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                        <div class="d-flex align-items-center">
                                                            <span class="d-inline-flex me-2"><i
                                                                    class="ti ti-ban"></i></span>
                                                            <p class="fs-14 fw-medium text-dark">198.160.11.20</p>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="me-2" data-bs-toggle="modal"
                                                                data-bs-target="#edit_ban"><span class="text-gray"><i
                                                                        class="ti ti-edit"></i></span></a>
                                                            <a href="#"><span class="text-gray"><i
                                                                        class="ti ti-trash"></i></span></a>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p><span class="me-2"><i
                                                                    class="ti ti-info-circle"></i></span>Unauthorized
                                                            access attempts, or other signs of a potential security</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div
                                                        class="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                        <div class="d-flex align-items-center">
                                                            <span class="d-inline-flex me-2"><i
                                                                    class="ti ti-ban"></i></span>
                                                            <p class="fs-14 fw-medium text-dark">198.123.10.2</p>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="me-2" data-bs-toggle="modal"
                                                                data-bs-target="#edit_ban"><span class="text-gray"><i
                                                                        class="ti ti-edit"></i></span></a>
                                                            <a href="#"><span class="text-gray"><i
                                                                        class="ti ti-trash"></i></span></a>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p><span class="me-2"><i
                                                                    class="ti ti-info-circle"></i></span>Attempts to scrape
                                                            large amounts of HR data from the system without authorization.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <div
                                                        class="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                        <div class="d-flex align-items-center">
                                                            <span class="d-inline-flex me-2"><i
                                                                    class="ti ti-ban"></i></span>
                                                            <p class="fs-14 fw-medium text-dark">198.110.01.05</p>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <a href="#" class="me-2" data-bs-toggle="modal"
                                                                data-bs-target="#edit_ban"><span class="text-gray"><i
                                                                        class="ti ti-edit"></i></span></a>
                                                            <a href="#"><span class="text-gray"><i
                                                                        class="ti ti-trash"></i></span></a>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p><span class="me-2"><i
                                                                    class="ti ti-info-circle"></i></span>Found downloading
                                                            or uploading inappropriate content</p>
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

    <!-- Add Ban Address -->
    <div class="modal fade" id="add_ban">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Add New IP Address</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                        aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form action="{{ route('admin.ban-address') }}">
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">IP Address</label>
                                    <input type="text" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div>
                                    <label class="form-label">Reason</label>
                                    <textarea class="form-control"></textarea>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="modal-footer pt-0">
                        <div class="d-flex w-100 justify-content-between">
                            <a href="#" class="btn btn-outline-primary me-2 d-flex justify-content-center w-100"
                                data-bs-dismiss="modal">Cancel</a>
                            <button type="submit" class="btn btn-primary d-flex justify-content-center w-100">Add IP
                                Addresss</button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
    <!-- / Add Ban Address -->

    <!-- Edit Ban Address -->
    <div class="modal fade" id="edit_ban">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Edit Ban IP Address</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal"
                        aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form action="{{ route('admin.ban-address') }}">
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">IP Address</label>
                                    <input type="text" class="form-control" value="198.120.16.01">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div>
                                    <label class="form-label">Reason</label>
                                    <textarea class="form-control">Temporarily block to protect user accounts from internet fraudsters</textarea>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="modal-footer pt-0">
                        <div class="d-flex w-100 justify-content-between">
                            <a href="#" class="btn btn-outline-primary me-2 d-flex justify-content-center w-100"
                                data-bs-dismiss="modal">Cancel</a>
                            <button type="submit" class="btn btn-primary d-flex justify-content-center w-100">Add IP
                                Addresss</button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
    <!-- /Edit Ban Address -->
@endsection
