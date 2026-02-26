@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">

            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto mb-2 mb-md-0">
                    <h4 class="page-title mb-1">Users</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="javascript:void(0);">Users</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Users</li>
                        </ol>
                    </nav>
                </div>
                <div class="d-flex my-xl-auto right-content align-items-center flex-wrap">
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
                    <div class="mb-2">
                        <a href="#" class="btn btn-primary d-flex align-items-center" data-bs-toggle="modal"
                            data-bs-target="#add_user"><i class="ti ti-circle-plus me-2"></i>Add New User</a>
                    </div>
                </div>
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Users List</h6>
                    <div class="d-flex align-items-center flex-wrap">
                      
                    </div>
                </div>

                <!-- User List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table" id="usersTable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                        S.No
                                    </th>
                                    <th>Name</th>
                                    <th>Email Address</th>
                                    <th>Phone Number</th>
                                    <th>Reg Date</th>
                                    <th>Country </th>
                                    <th>Last Seen </th>
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
            <!-- /User List -->

        </div>
    </div>
    <!-- /Page Wrapper -->

    <!-- Add user -->
    <div class="modal fade" id="add_user" tabindex="-1" aria-labelledby="add_user_label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="add_user_label">Add New User</h4>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <form id="add_user_admin">
                    <div class="modal-body">
                        <div class="col-lg-12" style="display: none;">
                            <div class="input-icon mb-3 position-relative">
                                <input type="text" value="" class="form-control" placeholder="UID" id="user-id">
                                <span class="icon-addon">
                                    <i class="ti ti-user"></i>
                                </span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="first_name">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="last_name">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" class="form-control" id="email">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" id="mobile_number" oninput="this.value=this.value.slice(0,21);" maxlength="21" minlength="10">
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label class="form-label">Country</label>
                                    <input type="text" class="form-control" id="country">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer pt-0">
                        <div class="d-flex w-100 justify-content-between">
                            <button class="btn btn-outline-primary me-2 d-flex justify-content-center w-100"
                            data-bs-dismiss="modal" aria-label="Close">Cancel</button>
                            <button type="submit" id="adduserbtn" class="btn btn-primary d-flex justify-content-center w-100">Submit
                                </button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
    <!-- /Add user -->

    <!-- Edit User Modal -->
    <div class="modal fade" id="edit_user" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editUserModalLabel">Edit User</h5>
                    <button type="button" class="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <input type="hidden" id="uid" />

                        
                        <div class="mb-3">
                            <label for="editUserFirstName" class="form-label">First Name</label>
                            <input type="text" class="form-control" id="editUserFirstName">
                        </div>
                        <div class="mb-3">
                            <label for="editUserLastName" class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="editUserLastName">
                        </div>
                        <div class="mb-3">
                            <label for="editUserEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="editUserEmail">
                        </div>
                        <div class="mb-3">
                            <label for="editUserMobile" class="form-label">Mobile Number</label>
                            <input type="text" class="form-control" id="editUserMobile" maxlength="10">
                        </div>
                        <div class="mb-3">
                            <label for="editCountry" class="form-label">Country</label>
                            <input type="text" class="form-control" id="editCountry">
                        </div>
                        <button type="submit" id="saveEditBtn" class="btn btn-primary">Save changes</button>
                    </form>
                </div>
            </div>
        </div>
    </div>    

    <!-- Delete Confirmation Modal -->
<div class="modal fade" id="delete-user" tabindex="-1" aria-labelledby="delete-user-label" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="delete-user-label">{{ __('Delete User') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="deleteUserForm">
                    <input type="hidden" id="deleteUserId" name="user_id">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-trash text-danger"></i>
                        </span>
                        <p class="text-grya-9">{{ __('You want to delete this user, this action cannot be undone.') }}</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="confirmDeleteUserBtn">{{ __('Delete') }}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
  
<!-- Block User Modal -->
<div class="modal fade" id="block_user" tabindex="-1" aria-labelledby="block-user-label" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="block-user-label">Block User</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="blockUserForm">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-ban text-danger"></i>
                        </span>
                        <!-- Dynamic description here -->
                        <p class="text-grya-9 description">Blocked contacts will no longer be able to call you or send you messages.</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary me-2 d-flex justify-content-center w-100"
                            data-bs-dismiss="modal">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="confirmBlockUserBtn">Block</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Block -->

    <script type="module" src="{{ asset('assets/js/firebase/firebaseUsers.js') }}" crossorigin="anonymous"></script>
@endsection
