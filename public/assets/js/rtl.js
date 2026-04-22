// RTL 
const toggleSwitch = document.querySelector('.offcanvas .active-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('direction');
var app = document.getElementsByTagName("html")[0];

if (currentTheme) {
    app.setAttribute('data-direction', currentTheme);
    
    if (currentTheme === 'rtl') {
        toggleSwitch.checked = true;
    }
}

function switchTheme(e) {
    if (e.target.checked) {
        app.setAttribute('data-direction', 'rtl');
        localStorage.setItem('direction', 'rtl');
    }
    else {       
        app.setAttribute('data-direction', 'ltr');
        localStorage.setItem('direction', 'ltr');
    }    
}

toggleSwitch.addEventListener('change', switchTheme, false);	

if(window.location.hash == "#ltrMode"){
    localStorage.setItem('direction', 'rtl');
}
else {
    if(window.location.hash == "#rtlMode"){
        localStorage.setItem('direction', 'ltr');
    }
}


