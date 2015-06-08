'use strict';

var app = angular.module('pouchlet');

 app.directive('mainHeader' , function(){
	   return {
			restrict:'E',
			controller : 'mainHeaderCtrl',
			templateUrl: 'views/mainHeader.tpl.html',
			scope : false
		};
  });
  
  app.controller('mainHeaderCtrl' , function($scope , $rootScope , authService){
       $scope.logout = function(){
		   authService.logout().then(function(status){
		   });
	   };
	   
	   $scope.homepageAction = function(action){
		   $rootScope.$broadcast('homepageAction' , {action:action});
	   };
  });