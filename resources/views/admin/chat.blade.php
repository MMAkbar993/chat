@extends('admin.layout')

@section('content')
    <!-- Page Wrapper -->
    <div class="page-wrapper">
        <div class="content container-fluid">

            <!-- Page Header -->
            <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
                <div class="my-auto mb-2 mb-md-0">
                    <h4 class="page-title mb-1">Chat</h4>
                    <nav>
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">Chat</li>
                        </ol>
                    </nav>
                </div>
             
            </div>
            <!-- Page Header -->

            <!-- User List -->
            <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h6 class="mb-3">Chat List </h6>
                    <div class="d-flex align-items-center flex-wrap">
                    
                    </div>
                </div>

                <!-- Chat List -->
                <div class="card-body p-0">
                    <div class="custom-datatable-filter table-responsive">
                        <table class="table" id="chatusersTable">
                            <thead class="thead-light">
                                <tr>
                                    <th class="no-sort">
                                       
                                    </th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Total Chat Count</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>                        
                    </div>
                    <!-- /Cities List -->
                </div>
            </div>
            <!-- /Chat List -->

        </div>
    </div>
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseChatList.js') }}" crossorigin="anonymous"></script>
    @endsection
