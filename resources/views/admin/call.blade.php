@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto mb-2 mb-md-0">
                    <h4 class="page-title mb-1">Calls</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Calls</li>
                        </ol>
                    </nav>
                </div>
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Calls List </h6>
                    <div class="d-flex align-items-center flex-wrap">
                       
                    </div>
                </div>

                <!-- Call List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table" id="callusersTable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                        S.No
                                    </th>
                                    <th>Name</th>
                                    <th>Total Incoming Call</th>
                                    <th>Total Outgoing Call</th>
                                    <th>Total Missed Call</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
                            </tbody>
                        </table>
                    </div>
                    <!-- /Cities List -->
                </div>
            </div>
            <!-- /Call List -->

        </div>
    </div>
    <div class="modal fade" id="delete-call">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Delete Call') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="deleteCallForm">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                                <i class="ti ti-trash text-danger"></i>
                            </span>
                            <p class="text-grya-9">{{ __('You want to delete all the marked items, this cant be undone once you delete.') }}</p>
                            <div id="loadingIndicator" style="display: none; text-align: center;">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                                <p id="progressIndicator"></p>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" id="cancelDeleteCallBtn" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100" id="deleteAllCallBtn">{{ __('Delete') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firabaseCallList.js') }}" crossorigin="anonymous"></script>
    @endsection
    <script>
    defaultAvatar = "{{ asset('assets/img/profiles/avatar-03.jpg') }}";
    </script>

