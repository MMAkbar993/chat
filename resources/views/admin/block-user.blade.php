@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto mb-2 mb-md-0">
                    <h4 class="page-title mb-1">Block Users</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Users</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Block Users</li>
                        </ol>
                    </nav>
                </div>
             
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Block Users List </h6>
                    <div class="d-flex align-items-center flex-wrap">
                        
                    </div>
                </div>

                <!-- Block-user List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table" id="blockusersTable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                        S.No
                                    </th>
                                    <th>Name</th>
                                    <th>Email Address</th>
                                    <th>Phone Number</th>
                                    <th>Country </th>
                                    <th>Status </th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                    <!-- /Cities List -->
                </div>
            </div>
            <!-- /Block-user List -->

        </div>
    </div>
    <!-- /Page Wrapper -->
    <div class="modal fade" id="unblock-user">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Unblock User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="unblockUserForm">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                                <i class="ti ti-trash text-danger"></i>
                            </span>
                            <p class="text-grya-9">{{ __('Are you sure to unblock the selected user.') }}</p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" id="cancelBlockUserBtn" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100" id="unBlockUserBtn">{{ __('Unblock') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <script type="module" src="{{ asset('assets/js/firebase/firebaseBlockUsers.js') }}" crossorigin="anonymous"></script>
@endsection