'use strict';

var app = angular.module('pouchlet' , ['fileUpload' , 'ngResource', 'btford.socket-io']);

  app.config(function($httpProvider){
	  $httpProvider.defaults.useXDomain = true;
	  delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });   