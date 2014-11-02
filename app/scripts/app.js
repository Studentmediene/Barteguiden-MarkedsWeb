'use strict';

/**
 * @ngdoc overview
 * @name barteguidenMarkedsWebApp
 * @description
 * # barteguidenMarkedsWebApp
 *
 * Main module of the application.
 */
angular
  .module('barteguidenMarkedsWebApp', [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ui.bootstrap'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/edit', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });