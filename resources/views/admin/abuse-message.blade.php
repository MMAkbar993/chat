@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto mb-2 mb-md-0">
                    <h4 class="page-title mb-1">Abuse Messages</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Abuse Messages</li>
                        </ol>
                    </nav>
                </div>
                <div class="d-flex my-xl-auto right-content align-items-center flex-wrap">
                    <div class="dropdown  me-2 mb-2">
                        <a href="javascript:void(0);" class="dropdown-toggle btn fw-medium d-inline-flex align-items-center"
                            data-bs-toggle="dropdown">
                            <i class="ti ti-file-export me-2"></i>Export
                        </a>
                        <ul class="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                                <a href="javascript:void(0);" class="dropdown-item rounded-1"><i
                                        class="ti ti-file-type-pdf me-1"></i>Export as PDF</a>
                            </li>
                            <li>
                                <a href="javascript:void(0);" class="dropdown-item rounded-1"><i
                                        class="ti ti-file-type-xls me-1"></i>Export as Excel </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Abuse Messages List<span>200</span> </h6>
                    <div class="d-flex align-items-center flex-wrap">
                        <div class="input-icon-start mb-3 me-2 position-relative">
                            <span class="icon-addon">
                                <i class="ti ti-calendar"></i>
                            </span>
                            <input type="text" class="form-control date-range bookingrange" placeholder="Select"
                                value="dd/mm/yyyy - dd/mm/yyyy ">
                        </div>

                        <div class="dropdown mb-3 me-2">
                            <div>
                                <select class="select">
                                    <option>Select User</option>
                                    <option>Aaryian Jose</option>
                                    <option>Sarika Jain</option>
                                    <option>Clyde Smith</option>
                                    <option>Carla Jenkins</option>
                                </select>
                            </div>
                        </div>
                        <div class="dropdown mb-3">
                            <a href="javascript:void(0);" class="btn btn-white border  dropdown-toggle"
                                data-bs-toggle="dropdown"><i class="ti ti-sort-ascending-2 me-2"></i>Sort By : Last 7 Days
                            </a>
                            <ul class="dropdown-menu p-3">
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1 active">
                                        Ascending
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                        Descending
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                        Recently Viewed
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                        Recently Added
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Abuse-Message List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table datatable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox" id="select-all">
                                        </div>
                                    </th>
                                    <th>Reported By</th>
                                    <th>Reported User</th>
                                    <th>Total Message Count</th>
                                    <th>Date</th>
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
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-01.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Alexander Manuel</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-01.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Aaryian Jose</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        100
                                    </td>
                                    <td>02 Sep 2024, 10:00 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-02.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Elizabeth Sosa</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-02.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Sarika Jain</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        120
                                    </td>
                                    <td>14 Sep 2024, 11:30 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-03.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Mark Villiams</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-03.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Clyde Smith</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        200
                                    </td>
                                    <td>28 Sep 2024, 08:15 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-04.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Michael Howard</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-04.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Clyde Smith</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        250
                                    </td>
                                    <td>12 Oct 2024, 06:40 PM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-05.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Horace Keene</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-05.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Federico Wells</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        300
                                    </td>
                                    <td>12 Oct 2024, 06:40 PM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-06.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Hollis Tran</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-06.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Edward Lietz</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        180
                                    </td>
                                    <td>30 Oct 2024, 07:25 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-07.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">James Albert</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-07.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Sharon Ford</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        200
                                    </td>
                                    <td>01 Nov 2024, 08:50 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-08.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Debra Jones</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-08.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Thomas Rethman</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        320
                                    </td>
                                    <td>10 Nov 2024, 11:20 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-09.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Pearl Dewitt</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-09.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Wilbur Martinez</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        400
                                    </td>
                                    <td>17 Nov 2024, 04:50 PM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <div class="form-check form-check-md">
                                            <input class="form-check-input" type="checkbox">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/profiles/profile-10.jpg') }}"
                                                    class="img-fluid rounded-circle" alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Richard Ohare</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <a href="#" class="avatar avatar-md"><img
                                                    src="{{ asset('assets/img/users/user-10.jpg') }}" class="img-fluid rounded-circle"
                                                    alt="img"></a>
                                            <div class="ms-2 profile-name">
                                                <p class="text-dark mb-0"><a href="#">Danielle Baker</a></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        210
                                    </td>
                                    <td>12 Dec 2024, 09:30 AM</td>
                                    <td>
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#report_reason"><span
                                                class="file-icon"><i class="ti ti-trash"></i></span></a>
                                    </td>

                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- /Cities List -->
                </div>
            </div>
            <!-- /Abuse-Message List -->

        </div>
    </div>
    <!-- /Page Wrapper -->
@endsection
