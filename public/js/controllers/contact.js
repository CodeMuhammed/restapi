'use strict';

var app = angular.module('pouchlet');

 app.directive('contact' , function(){
	   return {
			restrict:'E',
			controller : 'contactCtrl',
			templateUrl: 'views/contact.tpl.html',
			scope : true
		};
   });
   
   app.controller('contactCtrl' , function($scope ,  dataService){
	   $scope.contact = dataService.getActiveContact();
	   $scope.transLog = dataService.getTransHistory();
   });
   