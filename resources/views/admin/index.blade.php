@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Dashboard</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Dashboard</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <div class="row justify-content-center">
                <div class="col-md-6 col-xl-3 d-flex">
                    <div class="card total-users flex-fill">
                        <div class="card-body">
                            <div class="total-counts">
                                <div class="d-flex align-items-center">
                                    <span class="total-count-icons"><i class="ti ti-user-share"></i></span>
                                    <div>
                                        <p>Total Users </p>
                                        <h5 id="total-users-count">0</h5>
                                    </div>
                                </div>
                                <div class="percentage">
                                    <span class="bg-success">+5.63%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-xl-3 d-flex">
                    <div class="card total-users flex-fill">
                        <div class="card-body">
                            <div class="total-counts">
                                <div class="d-flex align-items-center">
                                    <span class="bg-dark total-count-icons"><i class="ti ti-users-group"></i></span>
                                    <div>
                                        <p>Total Groups</p>
                                        <h5 id="total-groups-count">0</h5>
                                    </div>
                                </div>
                                <div class="percentage">
                                    <span class="bg-danger">-42.05%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-xl-3 d-flex">
                    <div class="card total-users flex-fill">
                        <div class="card-body">
                            <div class="total-counts">
                                <div class="d-flex align-items-center">
                                    <span class="bg-purple total-count-icons"><i class="ti ti-brand-hipchat"></i></span>
                                    <div>
                                        <p>Total Chats</p>
                                        <h5 id="total-chats-count">0</h5>
                                    </div>
                                </div>
                                <div class="percentage">
                                    <span class="bg-success">+5.63%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-xl-3 d-flex">
                    <div class="card total-users flex-fill">
                        <div class="card-body">
                            <div class="total-counts">
                                <div class="d-flex align-items-center">
                                    <span class="bg-info total-count-icons"><i class="ti ti-circle-dot"></i></span>
                                    <div>
                                        <p>Total Status</p>
                                        <h5 id="total-status-count">0</h5>
                                    </div>
                                </div>
                                <div class="percentage">
                                    <span class=" bg-success ">+5.63%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-6 d-flex">
                    <div class="card user-details flex-fill">
                        <div class="card-header d-flex align-items-center justify-content-between ">
                            <h5>Recent Joined Members</h5>
                            <a href="{{ route('admin.users') }}" class="btn btn-sm btn-primary">View All Users</a>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead class="thead-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Reg Date</th>
                                            <th>Login Time</th>
                                            <th>Country</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-6 d-flex">
                    <div class="card user-details flex-fill">
                        <div class="card-header d-flex align-items-center justify-content-between">
                            <h5>Recent Created Groups</h5>
                            <a href="{{ route('admin.group') }}" class="btn btn-sm btn-primary">View All Groups</a>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead class="thead-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Reg Date</th>
                                            <th>Login Time</th>
                                            <th>Members</th>
                                        </tr>
                                    </thead>
                                    <tbody id="groupsTableBody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- <div class="row justify-content-center">
                <div class="col-md-8 col-lg-8 d-flex">
                    <div class="card user-details flex-fill">
                        <div class="card-header d-flex align-items-center justify-content-between">
                            <h5 class="card-title">Attendance</h5>
                            <div class="dropdown dashboard-chart">
                                <a href="javascript:void(0);" class="bg-white dropdown-toggle"
                                    data-bs-toggle="dropdown"><i class="ti ti-calendar-due me-1"></i>This Year
                                </a>
                                <ul class="dropdown-menu mt-2 p-3">
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                            This Week
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                            Last Week
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item rounded-1">
                                            Last Week
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="school-area"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-4 d-flex">
                    <div class="card user-details flex-fill">
                        <div class="card-header">
                            <h5>Invited User</h5>
                        </div>
                        <div class="card-body">
                            <div class="user-list">
                                <div class="d-flex align-items-center">
                                    <a href="{{ route('admin.invite-user')}}" class="avatar avatar-md"><img
                                            src="{{ asset('assets/img/users/user-05.jpg') }}" class="img-fluid rounded-circle"
                                            alt="img"></a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="{{ route('admin.invite-user')}}">Federico Wells</a></p>
                                    </div>
                                </div>
                                <div class="check-list">
                                    <a href="#"><span><i class="ti ti-check"></i></span></a>
                                    <a href="#" class="close-btn"><span><i class="ti ti-x"></i></span></a>
                                </div>
                            </div>
                            <div class="user-list">
                                <div class="d-flex align-items-center">
                                    <a href="{{ route('admin.invite-user')}}" class="avatar avatar-md"><img
                                            src="{{ asset('assets/img/users/user-06.jpg') }}" class="img-fluid rounded-circle"
                                            alt="img"></a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="{{ route('admin.invite-user')}}">Federico Wells</a></p>
                                    </div>
                                </div>
                                <div class="check-list">
                                    <a href="#"><span><i class="ti ti-check"></i></span></a>
                                    <a href="#" class="close-btn"><span><i class="ti ti-x"></i></span></a>
                                </div>
                            </div>
                            <div class="user-list">
                                <div class="d-flex align-items-center">
                                    <a href="{{ route('admin.invite-user')}}" class="avatar avatar-md"><img
                                            src="{{ asset('assets/img/users/user-07.jpg') }}" class="img-fluid rounded-circle"
                                            alt="img"></a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="{{ route('admin.invite-user')}}">Sharon Ford</a></p>
                                    </div>
                                </div>
                                <div class="check-list">
                                    <a href="#"><span><i class="ti ti-check"></i></span></a>
                                    <a href="#" class="close-btn"><span><i class="ti ti-x"></i></span></a>
                                </div>
                            </div>
                            <div class="user-list">
                                <div class="d-flex align-items-center">
                                    <a href="{{ route('admin.invite-user')}}" class="avatar avatar-md"><img
                                            src="{{ asset('assets/img/users/user-08.jpg') }}" class="img-fluid rounded-circle"
                                            alt="img"></a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="{{ route('admin.invite-user')}}">Thomas Rethman</a></p>
                                    </div>
                                </div>
                                <div class="check-list">
                                    <a href="#"><span><i class="ti ti-check"></i></span></a>
                                    <a href="#" class="close-btn"><span><i class="ti ti-x"></i></span></a>
                                </div>
                            </div>
                            <div class="user-list pb-0">
                                <div class="d-flex align-items-center">
                                    <a href="{{ route('admin.invite-user')}}" class="avatar avatar-md"><img
                                            src="{{ asset('assets/img/users/user-09.jpg') }}" class="img-fluid rounded-circle"
                                            alt="img"></a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="{{ route('admin.invite-user')}}">Wilbur Martinez</a></p>
                                    </div>
                                </div>
                                <div class="check-list">
                                    <a href="#"><span><i class="ti ti-check"></i></span></a>
                                    <a href="#" class="close-btn"><span><i class="ti ti-x"></i></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> --}}

        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseIndex.js') }}" crossorigin="anonymous"></script>
    @endsection
