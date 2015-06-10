'use strict';

var app = angular.module('pouchlet');

 app.directive('main' , function(){
	   return {
			restrict:'E',
			controller : 'mainCtrl',
			templateUrl: 'views/main.tpl.html',
			scope : true
		};
   });
   
   app.controller('mainCtrl' , function($scope , viewService , $timeout){
	   $scope.view = viewService.getView();
	   
	   $scope.$on('viewChanged' , function(e , a){
		  $timeout(function(){
			  $scope.view = viewService.getView();
			  
		  } , 300);
		  
	   });
	  
	  //called by contact ctrl
	  $scope.changeView = function(view){
		  viewService.setView(view);
	  };
	  
   });