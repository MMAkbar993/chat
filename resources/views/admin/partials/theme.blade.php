		<!-- Theme-Settings -->
		<div class="settings-icon"> 
			<span data-bs-toggle="offcanvas" data-bs-target="#theme-settings-offcanvas" aria-controls="theme-settings-offcanvas"><i class="ti ti-settings"></i> Customize</span> 
		</div> 
		<div class="offcanvas offcanvas-end border-0 " tabindex="-1" id="theme-settings-offcanvas"> 
			<div class="sidebar-headerset">
				<div class="sidebar-headersets">
					<h2>Theme Customizer</h2>
					<h3>Customize your overview page layout</h3>
				</div>
				<div class="sidebar-headerclose">
					<a data-bs-dismiss="offcanvas" aria-label="Close"><i class="bx bx-x"></i></a>
				</div>
			</div>
			<div class="offcanvas-body p-0"> 
				<div data-simplebar class="h-100"> 
					<div class="settings-mains"> 
						<div class="layout-head">
							<h5>Sidebar Size</h5>
						</div>
						<div class="screen-slide-bar">
							<div class="row"> 
								<div class="col-6"> 
									<div class="form-check card-radio p-0"> 
										<input id="customizer-layout01" name="data-layout-style" type="radio" value="default" class="form-check-input" checked> 
										<label class="form-check-label avatar-md w-100" for="customizer-layout01" > 
											<img src="{{ asset('assets/img/default.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Default</h5> 
								</div> 
								<div class="col-6"> 
									<div class="form-check card-radio p-0"> 
									<input id="customizer-layout02" name="data-layout-style" type="radio" value="small" class="form-check-input"> 
										<label class="form-check-label  avatar-md w-100" for="customizer-layout02" > 
											<img src="{{ asset('assets/img/small-view.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Small Hover View</h5> 
								</div> 
							</div>
						</div>
						 
							<div class="layout-head pt-3">
								<h5>Sidebar Color</h5>
							</div>
							<div class="colorscheme-cardradio screen-slide-bar"> 
								<div class="row"> 
									<div class="col-6"> 
										<div class="form-check card-radio  p-0"> 
											<input class="form-check-input" type="radio" name="data-layout-mode" id="layout-mode-light" value="light"> 
											<label class="form-check-label  avatar-md w-100 " for="layout-mode-light"> 
												<img src="{{ asset('assets/img/side-light.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Default</h5> 
								</div> 
								<div class="col-6"> 
									<div class="form-check card-radio p-0"> 
										<input class="form-check-input" type="radio" name="data-layout-mode" id="layout-mode-gray" value="gray"> 
										<label class="form-check-label  avatar-md w-100" for="layout-mode-gray"> 
											<img src="{{ asset('assets/img/side-gray.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Gray</h5> 
								</div> 
								<div class="col-6"> 
									<div class="form-check card-radio blue  p-0 "> 
										<input class="form-check-input" type="radio" name="data-layout-mode" id="layout-mode-blue" value="blue"> 
										<label class="form-check-label avatar-md w-100 " for="layout-mode-blue"> 
											<img src="{{ asset('assets/img/side-color.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Color</h5> 
								</div> 
								<div class="col-6"> 
									<div class="form-check card-radio dark  p-0 "> 
										<input class="form-check-input" type="radio" name="data-layout-mode" id="layout-mode-dark" value="dark"> 
										<label class="form-check-label  avatar-md w-100" for="layout-mode-dark"> 
											<img src="{{ asset('assets/img/side-black.png')}}" alt="Layout Image">
										</label> 
									</div> 
									<h5 class="fs-13 text-center mt-2 head-layout">Dark</h5> 
								</div> 
							</div> 
						</div> 
						<div class="layout-head pt-3">
							<h5>Navbar Type</h5>
						</div>
						<div class="form-navbar">
							<div class="d-flex align-items-center">
								<label class="custom-radio form-check me-3">Sticky
									<input type="radio" class="form-check-input" name="data-topbar" id="layout-mode-sticky" value="sticky" >
									<span class="checkmark"></span>
								</label>
								<label class="custom-radio me-3">Static
								  <input type="radio" name="data-topbar" id="layout-mode-static" value="static">
								  <span class="checkmark"></span>
								</label>
								<label class="custom-radio">Hidden
									<input type="radio" name="data-topbar" id="layout-mode-hidden" value="hidden">
									<span class="checkmark"></span>
								</label>
							</div>
						</div>
					</div> 
				</div> 

			</div> 
			<div class="offcanvas-footer text-center"> 
				<div class="row"> 
					<div class="col-6"> 
						<a href="javascript:;"  class="btn btn-primary w-100 bor-rad-50"><i class="bx bx-play-circle me-1"></i>Preview</a> 
					</div> 
					<div class="col-6"> 
						<button type="button" class="btn btn-light w-100 bor-rad-50" id="reset-layout"><i class="bx bx-reset me-1"></i>Reset</button> 
					</div>
				</div> 
			</div> 
		</div>
		<!-- /Theme-Settings -->