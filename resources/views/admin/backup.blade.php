@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Backup & Restore</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Other Settings</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Backup & Restore</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <!-- Other Settings -->
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
                                    <a href="{{ route('admin.app-settings') }}"><i class="ti ti-layers-subtract me-2"></i>Theme Settings</a>
                                    <a href="{{ route('admin.storage') }}" class="active pe-3"><i class="ti ti-settings-2 me-2"></i>Other
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
                                        <a href="{{ route('admin.storage') }}" class=" rounded flex-fill"><i
                                                class="ti ti-server-cog me-2"></i>Storage</a>
                                    </div>
                                    <div class="d-flex">
                                        <a href="{{ route('admin.backup') }}" class=" active rounded flex-fill"><i
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
                                    <h4>Backup & Restore</h4>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div class="card mb-0">
                                                <div class="card-header">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <h6 class="d-block">Backup List</h6>
                                                        <a href="#" class="btn btn-sm btn-primary">Generate Backup</a>
                                                    </div>
                                                </div>
                                                <div class="card-body p-0">
                                                    <div class="table-responsive">
                                                        <table class="table ">
                                                            <thead class="thead-light">
                                                                <tr>
                                                                    <th class="no-sort">
                                                                        <div class="form-check form-check-md">
                                                                            <input class="form-check-input" type="checkbox"
                                                                                id="select-all">
                                                                        </div>
                                                                    </th>
                                                                    <th>File Name</th>
                                                                    <th>Date</th>
                                                                    <th>Restore</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div class="form-check form-check-md">
                                                                            <input class="form-check-input" type="checkbox">
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <p class="fs-14 fw-medium text-dark">
                                                                            conversation_backup_group_12345_2024-09-19.txt
                                                                        </p>
                                                                    </td>
                                                                    <td>12 Sep 2024</td>
                                                                    <td><a href="#" data-bs-toggle="modal"
                                                                            data-bs-target="#report_reason"><span
                                                                                class="file-icon"><i
                                                                                    class="ti ti-restore"></i></span></a>
                                                                    </td>
                                                                    <td>
                                                                        <div class="d-flex align-items-center">
                                                                            <div class="dropdown">
                                                                                <a href="#"
                                                                                    class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                                                                    data-bs-toggle="dropdown"
                                                                                    aria-expanded="false">
                                                                                    <i
                                                                                        class="ti ti-dots-vertical fs-14"></i>
                                                                                </a>
                                                                                <ul
                                                                                    class="dropdown-menu dropdown-menu-right p-3">

                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#edit_user"><i
                                                                                                class="ti ti-download me-2"></i>Download</a>
                                                                                    </li>
                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#"><i
                                                                                                class="ti ti-trash me-2"></i>Delete</a>
                                                                                    </li>
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div class="form-check form-check-md">
                                                                            <input class="form-check-input"
                                                                                type="checkbox">
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <p class="fs-14 fw-medium text-dark">
                                                                            messages_backup_Sept_2024.txt</p>
                                                                    </td>
                                                                    <td>01 Oct 2024</td>
                                                                    <td><a href="#" data-bs-toggle="modal"
                                                                            data-bs-target="#report_reason"><span
                                                                                class="file-icon"><i
                                                                                    class="ti ti-restore"></i></span></a>
                                                                    </td>
                                                                    <td>
                                                                        <div class="d-flex align-items-center">
                                                                            <div class="dropdown">
                                                                                <a href="#"
                                                                                    class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                                                                    data-bs-toggle="dropdown"
                                                                                    aria-expanded="false">
                                                                                    <i
                                                                                        class="ti ti-dots-vertical fs-14"></i>
                                                                                </a>
                                                                                <ul
                                                                                    class="dropdown-menu dropdown-menu-right p-3">

                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#edit_user"><i
                                                                                                class="ti ti-download me-2"></i>Download</a>
                                                                                    </li>
                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#"><i
                                                                                                class="ti ti-trash me-2"></i>Delete</a>
                                                                                    </li>
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div class="form-check form-check-md">
                                                                            <input class="form-check-input"
                                                                                type="checkbox">
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <p class="fs-14 fw-medium text-dark">
                                                                            messages_backup_Aug_2024.txt</p>
                                                                    </td>
                                                                    <td>01 Sep 2024</td>
                                                                    <td><a href="#" data-bs-toggle="modal"
                                                                            data-bs-target="#report_reason"><span
                                                                                class="file-icon"><i
                                                                                    class="ti ti-restore"></i></span></a>
                                                                    </td>
                                                                    <td>
                                                                        <div class="d-flex align-items-center">
                                                                            <div class="dropdown">
                                                                                <a href="#"
                                                                                    class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                                                                    data-bs-toggle="dropdown"
                                                                                    aria-expanded="false">
                                                                                    <i
                                                                                        class="ti ti-dots-vertical fs-14"></i>
                                                                                </a>
                                                                                <ul
                                                                                    class="dropdown-menu dropdown-menu-right p-3">

                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#edit_user"><i
                                                                                                class="ti ti-download me-2"></i>Download</a>
                                                                                    </li>
                                                                                    <li>
                                                                                        <a class="dropdown-item rounded-1"
                                                                                            href="#"
                                                                                            data-bs-toggle="modal"
                                                                                            data-bs-target="#"><i
                                                                                                class="ti ti-trash me-2"></i>Delete</a>
                                                                                    </li>
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>


                                                            </tbody>
                                                        </table>
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
            <!-- /Other Settings -->

        </div>
    </div>
    <!-- /Page Wrapper -->
@endsection
