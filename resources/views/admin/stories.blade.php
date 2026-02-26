@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">
            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto">
                    <h4 class="page-title mb-1">Status</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Status</li>
                        </ol>
                    </nav>
                </div>
                {{-- <div class="d-flex my-xl-auto right-content align-items-center flex-wrap">
                    <div class="dropdown me-2 mb-2">
                        <a href="javascript:void(0);" class="dropdown-toggle btn fw-medium d-inline-flex align-items-center"
                            data-bs-toggle="dropdown">
                            <i class="ti ti-file-export me-2"></i>Export
                        </a>
                        <ul class="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                                <a href="javascript:void(0);" class="dropdown-item rounded-1" id="exportPdfBtn"><i
                                        class="ti ti-file-type-pdf me-1"></i>Export as PDF</a>
                            </li>
                        </ul>
                    </div>    
                </div> --}}
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Status List </h6>
                    <div class="d-flex align-items-center flex-wrap">
                     
                    </div>
                </div>

                <!-- Stories List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table" id="storiesusersTable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                        S.No
                                    </th>
                                    <th>Name</th>
                                    <th>Phone Number</th>
                                    <th>Email Address</th>
                                    <th>Status Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                    <!-- /Cities List -->
                </div>
            </div>
            <!-- /Stories List -->

        </div>
    </div>
    <div class="modal fade" id="delete-chat">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Delete Status') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="deleteChatForm">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                                <i class="ti ti-trash text-danger"></i>
                            </span>
                            <p class="text-grya-9">{{ __('You want to delete all the marked items, this cant be undone once you delete.') }}</p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" id="cancelDeleteChatBtn" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100" id="deleteAllChatBtn">{{ __('Delete') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseStatusList.js') }}" crossorigin="anonymous"></script>
    @endsection

