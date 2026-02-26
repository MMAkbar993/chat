(() => {
    'use strict'
  
    const storedTheme = localStorage.getItem('theme')
  
    const getPreferredTheme = () => {
      if (storedTheme) {
        return storedTheme
      }
  
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  
    const setTheme = function (theme) {
      if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
      } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
      }
    }
  
    setTheme(getPreferredTheme())
  
    const showActiveTheme = theme => {
      const activeThemeIcon = document.querySelector('.theme-icon-active')
      const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
      const iconOfActiveBtn = btnToActive.querySelector('i').dataset.themeIcon
  
      document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
        element.classList.remove('active')
      })
  
      btnToActive.classList.add('active')
    }
  
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (storedTheme !== 'light' || storedTheme !== 'dark') {
        setTheme(getPreferredTheme())
      }
    })
  
    window.addEventListener('DOMContentLoaded', () => {
      showActiveTheme(getPreferredTheme())
  
      document.querySelectorAll('[data-bs-theme-value]')
        .forEach(toggle => {
          toggle.addEventListener('click', () => {
            const theme = toggle.getAttribute('data-bs-theme-value')
            localStorage.setItem('theme', theme)
            setTheme(theme)
            showActiveTheme(theme, true)
          })
        })
    })
  })()

  
		// Dark Mode
		// if($('#dark-mode-toggle').length > 0) {
		// 	document.getElementById('dark-mode-toggle').onclick=function() {
		// 		document.body.classList.add('darkmode');
		// 		this.classList.add('active');
		// 		document.getElementById('light-mode-toggle').classList.remove('active');
		// 		localStorage.setItem('darkMode', 'enabled');
		// 	}
		// }
		// if($('#light-mode-toggle').length > 0) {
		// 	document.getElementById('light-mode-toggle').onclick=function() {
		// 		document.body.classList.remove('darkmode');
		// 		this.classList.add('active');
		// 		document.getElementById('dark-mode-toggle').classList.remove('active');
		// 		localStorage.setItem('darkMode', null);
		// 	}
		// }
		// if($('.dark-option').length > 0) {
		// 	document.addEventListener("DOMContentLoaded", function(event) {
		// 		let darkMode = localStorage.getItem('darkMode'); 
		// 		if (darkMode == 'enabled') {
		// 			document.body.classList.add('darkmode');
		// 			document.getElementById('dark-mode-toggle').classList.add('active');
		// 			document.getElementById('light-mode-toggle').classList.remove('active');
		// 			localStorage.setItem('darkMode', 'enabled');
		// 		} else {  
		// 			document.body.classList.remove('darkmode');
		// 			document.getElementById('light-mode-toggle').classList.add('active');
		// 			document.getElementById('dark-mode-toggle').classList.remove('active');
		// 			localStorage.setItem('darkMode', null);
		// 		}
		// 	});
		// }


    