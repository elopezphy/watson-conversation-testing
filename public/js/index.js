'use strict';

angular.module('Home', []);

var app = angular.module('MyApp', [
    'ngMaterial',
	'ngMessages',
    'ngRoute',
	'ngAnimate',
	'ngAria',
	'ngSanitize',
	'ngCsv',
	'ui.grid',
	'Home'
]);

app.config(function ($routeProvider, $locationProvider, $mdThemingProvider) {
	$locationProvider.hashPrefix('');
    $routeProvider
        .when('/', {
            controller: 'HomeController',
            templateUrl: 'modules/home/views/home.html'
        })
		.otherwise({ redirectTo: '/' });
		
	//$mdThemingProvider.theme('default').dark();
});