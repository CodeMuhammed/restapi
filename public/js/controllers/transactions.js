'use strict';

var app = angular.module('pouchlet');

  
  app.directive('withdraw' , function(){
	   return {
			restrict:'E',
			controller : 'tranCtrl',
			templateUrl: 'views/withdraw.tpl.html',
			scope : true
		};
   });
  
  app.directive('payIn' , function(){
	   return {
			restrict:'E',
			controller : 'tranCtrl',
			templateUrl: 'views/payIn.tpl.html',
			scope : true
		};
   });
  
  app.controller('tranCtrl' , function($scope){
	  $scope.items  = ['option a' , 'option a' , 'option a' , 'option a' , 'option a'];
  });