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
	   function refresh(){
		   $scope.currentUser = dataService.getUser();
		   $scope.contact = dataService.getActiveContact();
		   $scope.transLog = dataService.getTransHistory();
	   }
	   refresh();
	   
	   $scope.deleteContact = function(){
		   var query ={
			   "transHistoryId":$scope.contact.transHistoryId,
			   "hisId": $scope.contact.userId,
			   "hisCId":$scope.contact.contactsId,
			   "myId": $scope.currentUser._id,
			   "myCId": $scope.currentUser.contactsId
 		   };
		   
		   dataService.deleteContact(query).then(function(status){
			   refresh();
		   } , function(status){
			    alert(status);
		   });
	   }
   });
   