@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Custom Fields</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">App Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Custom Fields</li>
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
                                        <a href="{{ route('admin.authentication-settings') }}" class="rounded flex-fill"><i
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
                                        <a href="{{ route('admin.custom-fields') }}" class="active rounded flex-fill"><i
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
                                <div class="card-header">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h4>Custom Fields</h4>
                                        <a href="#" class="btn btn-primary" data-bs-toggle="modal"
                                            data-bs-target="#new-field"><i class="ti ti-circle-plus me-2"></i>Add New
                                            Fields</a>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table">
                                            <thead class="thead-light">
                                                <tr>
                                                    <th class="no-sort">
                                                        <div class="form-check form-check-md">
                                                            <input class="form-check-input" type="checkbox" id="select-all">
                                                        </div>
                                                    </th>
                                                    <th class="fw-semibold">Module</th>
                                                    <th class="fw-semibold">Label</th>
                                                    <th class="fw-semibold">Type</th>
                                                    <th class="fw-semibold">Default Value</th>
                                                    <th class="fw-semibold">Required</th>
                                                    <th class="fw-semibold">Status</th>
                                                    <th class="fw-semibold">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <th class="no-sort">
                                                        <div class="form-check form-check-md">
                                                            <input class="form-check-input" type="checkbox">
                                                        </div>
                                                    </th>
                                                    <th>User</th>
                                                    <th class="text-gray fw-normal">Middle Name</th>
                                                    <th class="text-gray fw-normal">Text</th>
                                                    <th class="text-gray fw-normal">-</th>
                                                    <th>
                                                        <div class="form-check form-switch">
                                                            <input class="form-check-input" type="checkbox" role="switch"
                                                                checked>
                                                        </div>
                                                    </th>
                                                    <th class="d-flex">
                                                        <span
                                                            class="badge badge-success badge-sm d-flex align-items-center"><i
                                                                class="ti ti-point-filled"></i>Active</span>
                                                    </th>
                                                    <th>
                                                        <div class="dropdown">
                                                            <a href="javascript:void(0);" class="text-gray"
                                                                data-bs-toggle="dropdown"><i
                                                                    class="ti ti-dots-vertical"></i></a>
                                                            <div class="dropdown-menu">
                                                                <a href="javascript:void(0);" class="dropdown-item"><i
                                                                        class="ti ti-edit me-2"></i>Edit</a>
                                                                <a href="javascript:void(0);" class="dropdown-item"><i
                                                                        class="ti ti-trash me-2"></i>Delete</a>
                                                            </div>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </tbody>
                                        </table>
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

    <!-- Add New Fields -->
    <div class="modal fade" id="new-field">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">
                        Add Custom Field
                    </h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('admin.custom-fields') }}">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Module</label>
                                    <select class="select">
                                        <option>Select</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Label</label>
                                    <input class="form-control" type="text">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Default Value</label>
                                    <input class="form-control" type="text">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Input Type</label>
                                    <select class="select">
                                        <option>Select</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="d-flex mb-3">
                                    <label class="form-label me-3">Required</label>
                                    <div class="form-check me-3">
                                        <input class="form-check-input" type="radio" name="required" id="required1"
                                            checked>
                                        <label class="form-check-label" for="required1">Yes</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" name="required" type="radio" id="required2">
                                        <label class="form-check-label" for="required2">No</label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <Select class="select">
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">Cancel</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100">Save Changes</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Add New Fields -->
@endsection
