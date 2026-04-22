<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="keywords" content="">
	<meta name="description" content="DreamsChat">
	<meta name="author" content="dreamstechnologies">

	<title>DreamsChat - Online Documentation.</title>

	<!-- App favicon -->
	<link rel="shortcut icon" href="assets-new/img/logo/favicon.png">

	<!-- Vendor -->
	<link href="assets-new/css/bootstrap.min.css" rel="stylesheet">
	<link href="assets-new/css/prism.css" rel="stylesheet">

	<!-- Fontawesome CSS -->
	<link rel="stylesheet" href="assets-new/plugins/fontawesome/css/fontawesome.min.css">
	<link rel="stylesheet" href="assets-new/plugins/fontawesome/css/all.min.css">

	<link rel="stylesheet" href="assets-new/css/magnific-popup.css">

	<!-- Main CSS -->
	<link id="mainCss" href="assets-new/css/style.css" rel="stylesheet">
</head>

<body>
	<main class="wrapper sb-default">
		<!-- Loader -->
		<div id="loader-wrapper">
			<div class="loader-ellipsis">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		</div>

		<!-- Header -->
		<header class="header">
			<div class="container-fluid">
				<div class="header-left">
					<div class="left-header me-2">
						<a href="javascript:void(0)" class="sidebar-toggle">
							<span class="outer-ring">
								<span class="inner-ring"></span>
							</span>
						</a>
					</div>
					<ul class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
						<li><a href="mailto:support@dreamstechnologies.com" class="nav-link px-2 link-body-emphasis"><i class="fa-solid fa-headset me-2"></i>Support</a></li>
						<li><a href="https://calendly.com/dreamstechnologies" class="nav-link px-2 link-body-emphasis" target="_blank"><i class="fa-brands fa-hire-a-helper me-2"></i>Hire Us</a></li>
						<li><a href="https://themeforest.net/user/dreamstechnologies" target="_blank" class="nav-link px-2 link-body-emphasis"><i class="fa-brands fa-hire-a-helper me-2"></i>Our Envato</a></li>
					</ul>

					<div class="right-header">
						<div class="me-2 header-item theme-light">
							<button type="button" class="btn-topbar tools-item mode" data-bs-theme-tool="light">
								<span class="feather-icon"><i data-feather="moon"></i></span>
							</button>
						</div>
						<div class="me-2 header-item theme-dark">
							<button type="button" class="btn-topbar tools-item mode active" data-bs-theme-tool="dark">
								<span class="feather-icon"><i data-feather="sun"></i></span>
							</button>
						</div>
					</div>
					<div class="text-end">
						<a href="https://chat.dreamstechnologies.com/" target="_blank" class="btn btn-white btn-sm me-2"><i class="fa-solid fa-link me-2"></i>Live Demo</a>
						<a href="https://codecanyon.net/item/dreamschat-web-online-chat-scipt/29531580" class="btn btn-primary btn-sm" target="_blank"><i class="fa-solid fa-cart-plus me-2"></i>Buy Now</a>
					</div>
				</div>
			</div>
		</header>


		<div class="doc-progress">
			<div class="doc-progress-inner" id="scrollProgress">

			</div>
		</div>

		<div class="sidebar-overlay"></div>
		<div class="sidebar" data-mode="light">
			<div class="sidebar-logo">
				<a href="#" class="sb-full"><img src="assets-new/img/logo/full-logo.png" alt="logo"><span class="badge badge-soft-danger fs-14 ms-1">Laravel</span></a>
				<a href="#" class="sb-collapse"><img src="assets-new/img/logo/favicon.png" alt="logo"></a>
			</div>
			<div class="sidebar-inner">
				<div class="sidebar-menu">
					<ul id="menu-main-menu" class="sidebar-nav">
						<li class="menu-item submenu">
							<a href="#instructions" class="active menu-link">
								<span class="feather-icon"><i data-feather="box"></i></span>
								<span class="condense">Getting Started</span>
							</a>
							<ul class="sidebar-dropdown condense active">
								<li>
									<a href="#instructions" class="page-link drop">
										<span class="menu-dash"><span></span></span>Introduction
									</a>
								</li>
								<li><a href="#requirement" class="page-link drop"><span class="menu-dash"><span></span></span>Requirement</a></li>
							</ul>
						</li>
						<li class="menu-item-separator"></li>
						<li class="menu-title condense">Configuration</li>
						<li class="menu-item submenu">
							<a href="#html_config" class=" menu-link">
								<span class="feather-icon"><i data-feather="pie-chart"></i></span>
								<span class="condense">Installation</span>
							</a>
							<ul class="sidebar-dropdown condense">
								<li><a href="#html_config" class="page-link drop"><span class="menu-dash"><span></span></span>Installation Guide</a></li>
								<li><a href="#access_admin_panel" class="page-link drop"><span class="menu-dash"><span></span></span>Access Admin Panel</a></li>
							</ul>
						</li>
						<li class="menu-item submenu">
							<a href="#user_register" class=" menu-link">
								<span class="feather-icon"><i data-feather="user"></i></span>
								<span class="condense">User</span>
							</a>
							<ul class="sidebar-dropdown condense">
								<li><a href="#user_register" class="page-link drop"><span class="menu-dash"><span></span></span>User Register</a></li>
								<li><a href="#user_invaite" class="page-link drop"><span class="menu-dash"><span></span></span>User Invaite</a></li>
								<li><a href="#user_chat" class="page-link drop"><span class="menu-dash"><span></span></span>User Chat</a></li>
								<li><a href="#user_group" class="page-link drop"><span class="menu-dash"><span></span></span>User Group</a></li>
							</ul>
						</li>
						<li class="menu-item submenu">
							<a href="#general" class=" menu-link">
								<span class="feather-icon"><i data-feather="settings"></i></span>
								<span class="condense">Settings</span>
							</a>
							<ul class="sidebar-dropdown condense">
								<li><a href="#general" class="page-link drop"><span class="menu-dash"><span></span></span>General</a></li>
								<li><a href="#agora" class="page-link drop"><span class="menu-dash"><span></span></span>Agora</a></li>
							</ul>
						</li>
						<li class="menu-item submenu">
							<a href="#firebase_config" class=" menu-link">
								<span class="feather-icon"><i data-feather="tool"></i></span>
								<span class="condense">Configuration</span>
							</a>
							<ul class="sidebar-dropdown condense">
								<li><a href="#firebase_config" class="page-link drop"><span class="menu-dash"><span></span></span>Firebase</a></li>
								<li><a href="#agora_config" class="page-link drop"><span class="menu-dash"><span></span></span>Agora</a></li>

							</ul>
						</li>
						<li class="menu-item">
							<a href="#faq" class="page-link">
								<span class="feather-icon"><i data-feather="help-circle"></i></span><span class="condense"><span class="hover-title">Faq</span> </span>
							</a>
						</li>
						<li class="menu-item">
							<a href="#changeLog" class="page-link">
								<span class="feather-icon"><i data-feather="box"></i></span><span class="condense"><span class="hover-title">Change Log</span> </span>
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<!-- main content -->
		<div class="main-content">
			<div class="container-fluid">
				<!-- Page title & breadcrumb -->
				<div class="page-title">
					<div class="breadcrumb">
						<h1>Getting Started</h1>
						<ul>
							<li><a href="index.html">DreamsChat</a></li>
							<li>Getting Started</li>
						</ul>
					</div>
				</div>
				<div class="row sections">
					<div class="col-xl-12 col-md-12">
						<!-- Introduction -->
						<section class="section-block hentry" id="instructions">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Introduction<a class="anchor-link ms-2" href="#instructions"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><i data-feather="maximize"></i></span>
										</a>
									</div>
								</div>
								<div class="card-body">
									<div class="intro">
										<div class="item-details mb-3">
											<div class="row">
												<div class="col-md-6">
													<ul class="auth-detail">
														<li><strong>Item Name : </strong>DreamsChat - Chat and Messenger</li>
														<li><strong>Published: </strong>19/09/2025</li>
														<li><strong>Item Version : </strong><span class="badge badge-changelog badge-soft-danger fw-semibold fs-8 px-2 ms-2">v2.0.3</span></li>
														<li><strong>Author : </strong><a target="_blank" href="https://dreamstechnologies.com">Dreams Technologies</a></li>
														<li>Support via email: <a href="mailto:support@dreamstechnologies.com">support@dreamstechnologies.com</a></li>

													</ul>
												</div>
												<div class="col-md-6">
													<a class="gallery-thumb" href="assets-new/img/images/intro.png">
														<img src="assets-new/img/images/intro.png" class="img-fluid" alt="Intro">
													</a>
												</div>
											</div>
										</div>
										<h5>
											<a href="#" class="pro-thumbnail me-2" target="_blank">
												<img src="assets-new/img/logo/favicon.png" class="img-fluid" alt="Thumbnail">
											</a>DreamsChat - Chat and Messenger Documentation
										</h5>
										<p>DreamsChat application allow to have a Chat with friends. You can send and share (images or videos or audio or pdf) ...etc. there is a database local to save your messages , so when user lost the internet connection he can write a message ,the message will be saved on database local and once the other user come online the app will send your message directly. Also you can delete conversation or messages.</p>
										<ul class="intro-list">
											<li>Login with Email & Password</li>
											<li>One to one chat</li>
											<li>Group chat</li>
											<li>Status</li>
											<li>Video call and Audio Call</li>
											<li>Block User</li>
											<li>Profile</li>
											<li>Dreams chat organizing content to follow natural eyes, striking balance between beautiful and visual hierarchy</li>
											<li>Email authentication</li>
											<li>Chat message encryption and decryption</li>
										</ul>

									</div>
									<a href="mailto:support@dreamstechnologies.com" class="btn btn-primary rounded-pill me-2" target="_blank">Contact Support</a>
									<a href="https://dreamguystechnologies.atlassian.net/servicedesk/customer/portals" class="btn btn-soft-primary rounded-pill" target="_blank" rel="noreferrer">Create Support ticket</a>
								</div>
							</div>
						</section>
						<!-- /Introduction -->

						<!-- Requirments -->
						<section class="section-block hentry" id="requirement">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Requirement<a class="anchor-link ms-2" href="#requirement"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><i data-feather="maximize"></i></span></a>
									</div>
								</div>
								<div class="card-body">
									<div>
										<h5 class="mb-3">To install the application, a Firebase database instance are required.</h5>

										<h6>WebServer</h6>
										<ul class="requirement-lists">
											<li>XAMPP server</li>
											<li>PHP 5.4+ (8.2.4)</li>
											<li>composer (v2.8.2)</li>
										</ul>
										<h6 class="mb-3">Database</h6>
										<ul class="requirement-lists">
											<li>Firebase</li>
										</ul>
										
									</div>
								</div>
							</div>
						</section>
						<!-- /Requirments -->

						<!-- Installation -->
						<section class="section-block hentry" id="html_config">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Installation Guide<a class="anchor-link ms-2" href="#html_config"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><i data-feather="maximize"></i></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="server">
										<div class="custom-list mb-4">
											<h5 class="mb-3">Step 1:</h5>
											<p>Install & Start Xampp Server</p>
											<div class="mb-2">
												<img src="assets-new/img/images/1.png" alt="image" class="img-fluid">
											</div>
											<p>Apache and MySQL started successfully</p>
											<div class="mb-3">
												<img src="assets-new/img/images/2.png" alt="image" class="img-fluid">
											</div>

											<h5 class="mb-3">Step 2:</h5>
											<p>Unzip laravel package.Downloaded laravel will be in zip format. Copy it and place it in your htdocs folder. Unzip and rename it. We are naming it as Laravel.</p>
											<p>Create new file as name ".env" in your folder. Copy paste the content from the .env.example file.</p>
											<h5 class="mb-3">Step 3:</h5>
											<p>run - "php artisan key:generate" in this folder command prompt</p>
											<p> run - "composer install " in this folder command prompt</p>
											<h5 class="mb-3">Step 4:</h5>
											<p> to run project - "php artisan serve " in this folder command prompt</p>
											<p>After running the project need to complete Installer Process shown in below image</p>
											<p>Enter Your Purchase Code and click <strong>Next</strong></p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-01.png" alt="image" class="img-fluid">
											</div>
											<p>If all minimum requirements meets click <strong>Next</strong></p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-02.png" alt="image" class="img-fluid">
											</div>
											<p>Fill the Firebase setup database details</p>
											<p>To get firebase database details refer the settings <a href="#firebase">firebase</a>.</p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-03.png" alt="image" class="img-fluid">
											</div>
											<p>Fill the admin account details</p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-04.png" alt="image" class="img-fluid">
											</div>
											<p>Give Your App Name</p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-05.png" alt="image" class="img-fluid">
											</div>
											<p>After filling the necessary details you will able to visit the site</p>
											<div class="custom-image">
												<img src="assets-new/img/images/installer-06.png" alt="image" class="img-fluid">
											</div>


										</div>

									</div>
								</div>
						</section>
						<!-- /Installation -->

						<!-- Acces Admin Panel -->
						<section class="section-block hentry" id="access_admin_panel">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Access Admin Panel<a class="anchor-link ms-2" href="#scss_install"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><i data-feather="maximize"></i></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="server">
										<div class="custom-list mb-4">
											<h6>In Firebase, Authentication add the user as shown in image.</h6>
											<p class="mb-2">Example Email : <span class="text-dark">admin@dreamschat.com</span></p>
											<p>Example password : <span class="text-dark">admin@dreamschat.com</span></p>
											<img src="assets-new/img/images/admin2.png" alt="image" class="img-fluid mb-3">
											<h6>And also add in Realtime Database</h6>
											<img src="assets-new/img/images/admin2.png" alt="image" class="img-fluid mb-3">
											<p>After the installation process completed, you can log in to the admin panel by adding “/admin/login” to the end of your website URL.</p>
											<p>Example : <span class="text-dark">yourwebsiteurl.com/admin/login</span></p>
											<p>Example email : <span class="text-dark">admin@dreamschat.com</span></p>
											<p>Example password : <span class="text-dark">Admin@123</span></p>
											<img src="assets-new/img/images/admin-login.png" alt="image" class="img-fluid mb-3">

										</div>
									</div>
								</div>
						</section>
						<!-- /Scss Installation -->

						<!-- User Register -->
						<section class="section-block hentry" id="user_register">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">User Register<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>Signup form</p>
										<div class="custom-image">
											<img src="assets-new/img/images/r1.png" alt="image" class="img-fluid">
										</div>
										<p>In settings - edit your profile deatils</h6>
										<div class="custom-image">
											<img src="assets-new/img/images/r2.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /User Register -->

						<!-- User Invaite -->
						<section class="section-block hentry" id="user_invaite">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">User Invite<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>After registering, you will see the screen below. Click the three dots to invite other contacts.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/i1.png" alt="image" class="img-fluid">
										</div>
										<p>In the contacts section, there is also an option to create and invite other users.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/i3.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /User Invaite -->

						<!-- User Chat -->
						<section class="section-block hentry" id="user_chat">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">User Chat<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>After inviting or adding a contact, you will be able to see the user's list and start chatting with them.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/i2.png" alt="image" class="img-fluid">
										</div>
										<p>By clicking on the info button, you can view the user's details.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/c1.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /User Chat -->

						<!-- User Group -->
						<section class="section-block hentry" id="user_group">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">User Groups<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>In the sidebar, navigate to the group menu and click the "+" icon, as shown in the image below. </p>
										<div class="custom-image">
											<img src="assets-new/img/images/g1.png" alt="image" class="img-fluid">
										</div>
										<p>Create a group</p>
										<div class="custom-image">
											<img src="assets-new/img/images/g2.png" alt="image" class="img-fluid">
										</div>
										<div class="custom-image">
											<img src="assets-new/img/images/g4.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /User Group -->

						<!-- General Settings -->
						<section class="section-block hentry" id="general">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">General Settings<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>You can change the platform logo from the “Admin/ App-settings”.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/general-logo.png" alt="image" class="img-fluid">
										</div>
										<p>You can change the Admin profile from the “Admin/ Profile-settings”.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/general-profile.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /General Settings -->



						<!-- Agora Settings -->
						<section class="section-block hentry" id="agora">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Agora Settings<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<h6>To add the Agora key to the application:</h6>
										<p>In the admin panel sidebar, click on Settings -> System Settings -> and then add the Agora details. </p>
										<div class="custom-image">
											<img src="assets-new/img/images/a4.png" alt="image" class="img-fluid">
										</div>

									</div>
								</div>
							</div>
						</section>
						<!-- /Agora Settings -->

						<!-- Firebase Configuration -->
						<section class="section-block hentry" id="firebase_config">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">FireBase<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>Go to firebase console <a href="https://console.firebase.google.com/" target="_blank">“https://console.firebase.google.com/”</a></p>
										<div class="custom-image">
											<img src="assets-new/img/images/f1.png" alt="image" class="img-fluid">
										</div>
										<p>To create a project, follow these steps:</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f2.png" alt="image" class="img-fluid">
										</div>
										<p>Provide a resource and a domain.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f3.png" alt="image" class="img-fluid">
										</div>
										<p>The Web application is now ready .</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f4.png" alt="image" class="img-fluid">
										</div>
										<p>To create a database, follow these steps:</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f5.png" alt="image" class="img-fluid">
										</div>
										<div class="custom-image">
											<img src="assets-new/img/images/f6.png" alt="image" class="img-fluid">
										</div>
										<p>You can find the URL for the database here:</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f7.png" alt="image" class="img-fluid">
										</div>
										<h6>To create storage for image and video uploads, follow these steps:</h6>
										<p> <strong> Note:</strong> If the storage is not created or configured properly, image and video uploads will not work as expected.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f8.png" alt="image" class="img-fluid">
										</div>
										<p>Select the region closest to where the app will be used to ensure faster performance.</p>
										<p>Select the region closest to where the app will be used to ensure faster performance.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f9.png" alt="image" class="img-fluid">
										</div>
										<h6>Enable Authentication</h6>
										<p>Go to Build ->Authentication</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f10.png" alt="image" class="img-fluid">
										</div>
										<p>Hostname Configure In Firebase</p>
										<p>Add your domain to the list.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f11.png" alt="image" class="img-fluid">
										</div>
										<p>Under General settings you can see the configuration</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f12.png" alt="image" class="img-fluid">
										</div>
										<p>For download json file, follow below steps</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f17.png" alt="image" class="img-fluid">
										</div>
										<div class="custom-image">
											<img src="assets-new/img/images/f18.png" alt="image" class="img-fluid">
										</div>
										<p>Once Json file downloaded, Add inside the storage->firbase in your project with this name "firebase_credentials.json".<br> Note: Delete old file(firebase_credentials.json)</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f19.png" alt="image" class="img-fluid">
										</div>
										<p>Email configuration - In below page click edit icon</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f14.png" alt="image" class="img-fluid">
										</div>
										<p>click the customize action url</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f15.png" alt="image" class="img-fluid">
										</div>
										<p>Here give your domain url and save</p>
										<div class="custom-image">
											<img src="assets-new/img/images/f16.png" alt="image" class="img-fluid">
										</div>
									</div>
								</div>
							</div>
						</section>
						<!-- /Firebase Configuration -->

						<!-- Agora Configuration -->
						<section class="section-block hentry" id="agora_config">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Agora Settings<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>First, create your Agora account by clicking this link: <a href="https://www.agora.io/en" target="_blank">“https://www.agora.io/en”</a></p>
										<p>Then, follow the steps to complete the account creation process.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/a1.png" alt="image" class="img-fluid">
										</div>
										<p>Create a new project by providing the project name and clicking Create.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/a2.png" alt="image" class="img-fluid">
										</div>
										<p>Click Next and close the next steps.</p>
										<p>Click Next and close the next steps.</p>
										<p>Change the app to Live, save the project, and ensure that the app's primary certificate is disabled.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/a3.png" alt="image" class="img-fluid">
										</div>

									</div>
								</div>
							</div>
						</section>
						<!-- /Agora Configuration -->

						<!-- Faq -->
						<section class="section-block hentry" id="faq">
							<div class="custom-card">
								<div class="card-header">
									<h4 class="card-title">Frequently Asked Questions<a class="anchor-link ms-2" href="#change_logo"><i class="fa-solid fa-hashtag"></i></a></h4>
									<div class="header-tools">
										<a href="#" class="card-maximize">
											<span class="feather-icon" title="Full Screen"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
													<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
												</svg></span></a>
									</div>
								</div>
								<div class="card-body">
									<div class="file-structure">
										<p>FAQ 1 – Admin Panel settings</p>
										<h6>Admin Dashboard</h6>
										<p>Default page after successful login by admin. Following details are visible to admin.</p>
										<ul class="requirement-lists">
											<li>Total number of users</li>
											<li>Total number of Groups count</li>
											<li>Total number of Stories</li>
											<li>Recent User List</li>
											<li>Recent Group List</li>
										</ul>
										<div class="custom-image">
											<img src="assets-new/img/images/fa1.png" alt="image" class="img-fluid">
										</div>
										<h6>Users</h6>
										<p>Admin has the option to view all active and inactive users. Also, has an option to ‘Delete’, ‘Edit’, ‘Block’</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa2.png" alt="image" class="img-fluid">
										</div>
										<h6>Blocked Users</h6>
										<p>Admin can view all blocked users details.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa3.png" alt="image" class="img-fluid">
										</div>
										<h6>Chat List</h6>
										<p>Here admin can view From chat and To chat details and chat counts.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa4.png" alt="image" class="img-fluid">
										</div>
										<h6>Call History</h6>
										<p>In call history tab admin can view total cal history like Total Incoming Call,Total Outgoing Call,Total Missed Call.And also has an option to ‘Delete’. </p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa5.png" alt="image" class="img-fluid">
										</div>
										<h6>Groups List</h6>
										<p>Admin can view all Groups details. Also has an option to ‘Delete’</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa7.png" alt="image" class="img-fluid">
										</div>
										<h6>Stories List</h6>
										<p>Admin can view all Stories details. Also has an option to ‘Delete’</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa6.png" alt="image" class="img-fluid">
										</div>
										<h6>Admin Settings</h6>
										<p>Admin can have the settings previlages</p>
										<div class="custom-image">
											<img src="assets-new/img/images/general-profile.png" alt="image" class="img-fluid">
										</div>
										<h5>FAQ 2 - Web App Features</h5>
										<h6>User Signup</h6>
										<p>Once you have entered the mobile number, Username, Password and Email, Authentication user also created in firebase databse.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/r1.png" alt="image" class="img-fluid">
										</div>
										<h6>User Login</h6>
										<p>Once you regegistered your mobile number, username and password you have login to using Email & Password.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/l1.png" alt="image" class="img-fluid">
										</div>
										<h6>Chat</h6>
										<p>In home page user can chat their Dreams chat registered members and user can view and search profile picture and about.And also has an option to ‘Block User’, ‘Delete Chat’, Reply Chat’.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/i2.png" alt="image" class="img-fluid">
										</div>
										<p>Logged in user can add friends by Add a contact through contact after you click the pluse icon to create a new chat.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/i1.png" alt="image" class="img-fluid">
										</div>
										<div class="custom-image">
											<img src="assets-new/img/images/i3.png" alt="image" class="img-fluid">
										</div>
										<div class="custom-image">
											<img src="assets-new/img/images/i4.png" alt="image" class="img-fluid">
										</div>
										<p>User can upload photos, videos, documents to particular friends and users can chat with smileys.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/fa8.png" alt="image" class="img-fluid">
										</div>
										<h6>Group Chat</h6>
										<p>User can view their group members conversations,And also user can view group Profile picture,Group info and group members.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/g5.png" alt="image" class="img-fluid">
										</div>
										<p>User can create their group name and descriptions for their friends or family members,etc...</p>
										<div class="custom-image">
											<img src="assets-new/img/images/g2.png" alt="image" class="img-fluid">
										</div>
										<p>User can add dreams chat members into created group.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/g3.png" alt="image" class="img-fluid">
										</div>
										<h6>Status</h6>
										<p>If users post a status then all dreamchat members can see that user status in status tab.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/s1.png" alt="image" class="img-fluid">
										</div>
										<P>Logged in users can add their status(Image) through add status(+) button.</P>
										<div class="custom-image">
											<img src="assets-new/img/images/s2.png" alt="image" class="img-fluid">
										</div>
										<h6>Call</h6>
										<p>In call tab user can view all their call activities like missed calls, Other calls and call logs.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/c3.png" alt="image" class="img-fluid">
										</div>
										<p>Dreams chat users can single audio or video call and group audio or video call to their drams chat contact members and groups.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/c2.png" alt="image" class="img-fluid">
										</div>
										<h6>Settings</h6>
										<p>Dreams chat users edit thier profile details like Display name,Display picture,Status.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/st1.png" alt="image" class="img-fluid">
										</div>
										<p>Dreams chat users have able to change the password in settings module.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/st2.png" alt="image" class="img-fluid">
										</div>
										<p>Dreams chat users have able to change the chats background through settings module.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/st3.png" alt="image" class="img-fluid">
										</div>
										<p>Dreams chat users have able to delete his own account in settings module.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/st4.png" alt="image" class="img-fluid">
										</div>
										<p>Dreams chat users have able to change the language in settings module.</p>
										<div class="custom-image">
											<img src="assets-new/img/images/st5.png" alt="image" class="img-fluid">
										</div>
										<h6>Support</h6>
										<p>If you have any queries please contact us through email: <strong> support@dreamstechnologies.com</strong>.</p>
									</div>
								</div>
							</div>
						</section>
						<!-- /Faq -->

						<!-- changeLog -->
						<section class="section-block hentry" id="changeLog">
							<div class="section-block">
								<div class="custom-card page-block">
									<div class="card-header">
										<h4 class="card-title">Version 2.0.3<a class="anchor-link ms-2"
												href="#changelog"><i class="fa-solid fa-hashtag"></i></a></h4>
										<small>19 Sep 2025</small>
									</div>
									<div class="card-body">
										<span class="badge btn-soft-info">Laravel</span>
										<ul class="mb-3">
											<li class="mt-0"><span
													class="badge text-bg-warning rounded-pill me-2">Fixed</span>
												Message delivery status
											</li>
											<li class="mt-0"><span
													class="badge text-bg-warning rounded-pill me-2">Fixed</span>
												Improved performance and the issues
											</li>
										</ul>

									</div>

								</div>
								<div class="custom-card page-block">
									<div class="card-header">
										<h4 class="card-title">Version 2.0.2<a class="anchor-link ms-2"
												href="#changelog"><i class="fa-solid fa-hashtag"></i></a></h4>
										<small>30 Jan 2025</small>
									</div>
									<div class="card-body">
										<span class="badge btn-soft-info">Laravel</span>
										<ul class="mb-3">
											<li class="mt-0"><span
													class="badge text-bg-warning rounded-pill me-2">Updated</span>
												Migrated to Laravel
											</li>

										</ul>

									</div>

								</div>
							</div>
						</section>
						<!-- /changeLog -->

					</div>
				</div>
			</div>
			<footer class="content-footer footer">
				<div class="container-fluid d-flex flex-wrap justify-content-between align-items-center text-center py-3">
					<div>
						&copy; 2020- <script>
							document.write(new Date().getFullYear())
						</script>

						<a href="https://dreamstechnologies.com/" class="footer-text fw-medium text-primary" target="_blank">Dreams Technologies</a>

					</div>
					<div class="social-icons">
						<a href="https://www.facebook.com/dreamstechnologieslimited/" class="footer-link me-2"
							target="_blank"><i class="fa-brands fa-facebook"></i></a>
						<a href="https://twitter.com/dreamstechltd" class="footer-link me-2" target="_blank"><i
								class="fa-brands fa-twitter"></i></a>
						<a href="https://www.behance.net/dreamstechnologies" class="footer-link me-2" target="_blank"><i
								class="fa-brands fa-behance"></i></a>
						<a href="https://dribbble.com/dreamstechnologies" class="footer-link me-2" target="_blank"><i
								class="fa-brands fa-dribbble"></i></a>
						<a href="https://www.instagram.com/dreamstechnologieslimited/" class="footer-link"
							target="_blank"><i class="fa-brands fa-instagram"></i></a>
					</div>
				</div>
			</footer>
		</div>

	</main>

	<script src="assets-new/js/jquery-3.7.1.min.js"></script>
	<script src="assets-new/js/bootstrap.bundle.min.js"></script>
	<script src="assets-new/js/prism.js"></script>
	<script src="assets-new/js/feather.min.js"></script>
	<script src="assets-new/js/jquery.zoom.min.js"></script>

	<script src="assets-new/js/jquery.magnific-popup.min.js"></script>
	<script src="assets-new/js/isotope.pkgd.min.js"></script>
	<script src="assets-new/js/main.js"></script>
</body>


</html>
