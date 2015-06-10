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
	   //$scope.temp; //where user will be stored when editing
	   
	   $scope.edit = false;
	   
	   $scope.toggleEdit = function(){
		   if($scope.edit){
			   $scope.temp= angular.copy($scope.user);
		   }else {
			   $scope.edit = true;
			   $scope.temp= angular.copy($scope.user);
		   }
	   };
	   
	   $scope.save = function(){
		   if($scope.temp){
			   dataService.updateUser($scope.temp).then(
			   function(user){
				   $scope.user = angular.copy($scope.temp);
			   } , function(err){
				   
			   });
		   } 
	   }
	   
	   $scope.cancel = function(){
		   if($scope.temp){
			   $scope.user = angular.copy($scope.temp);
			   $scope.edit=false;
		   }
	   }
	   
	   $scope.addToken = function(token){
		   if(token){
			   if($scope.user.vendorDetails.userTokens.length>2){
				   alert('maximum number of tokens exceeded');
			   } else {
				    alert(token);
			        $scope.user.vendorDetails.userTokens.push(token);
			   }
			  $scope.isToken = undefined;
		   }
		   
	   }
	   
	   $scope.deleteToken = function(token){
		   var index = $scope.user.vendorDetails.userTokens.indexOf(token);
		   $scope.user.vendorDetails.userTokens.splice(index , 1);
	   }
	   
	   //listens for  when profile image is changed
	   $scope.$on('uploaded' , function(event , args){
		   $scope.user.profilePic = args.url;
		   alert($scope.user.profilePic);
	   });
   });
  