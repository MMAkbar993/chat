'use strict';

$(document).ready(function() {
	
	// Area chart
	
	if ($('#school-area').length > 0) {
	var options = {
		chart: {
			height: 250,
			type: "area",
			toolbar: {
				show: false
			},
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			curve: "smooth"
		},
		series: [{
			color: '#680A83',
			data: [20, 60, 40, 51, 42, 42, 30, 25, 20, 40, 30, 40]
		}],
		xaxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		}
	}
	var chart = new ApexCharts(
		document.querySelector("#school-area"),
		options
	);
	chart.render();
	}
  
});