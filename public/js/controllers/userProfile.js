'use strict';

var app = angular.module('pouchlet');

 app.directive('userProfile' , function(){
	   return {
			restrict:'E',
			controller : 'userProfileCtrl',
			templateUrl: 'views/profile.tpl.html',
			scope : true
		};
   });
   
   app.controller('userProfileCtrl' , function($scope , dataService){
	   $scope.user = dataService.getUser();
	   $scope.temp = angular.copy($scope.user); //where user will be stored when editing
	   
	   $scope.edit = false;
	   
	   $scope.toggleEdit = function(){
		   if($scope.edit){
			   $scope.temp= $scope.user;
		   }else {
			   $scope.user = $scope.temp;
		   }
		   $scope.edit=!$scope.edit;
	   };
	   
	   $scope.save = function(user){
		   dataService.updateUser(user).then(
			   function(user){
				   $scope.user = user;
		           $scope.edit = false;
			   } , function(err){
				   
			   });
	   }
	   
	   //listens for  when profile image is changed
	   $scope.$on('uploaded' , function(event , args){
		   $scope.user.profilePic = args.url;
		   alert($scope.user.profilePic);
	   });
   });
  