'use strict';

var app = angular.module('pouchlet');
app.directive('newContact' , function(){
	   return {
			restrict:'E',
			controller : 'newContactCtrl',
			templateUrl: 'views/newContact.tpl.html',
			scope : true
		};
   });
   app.controller('newContactCtrl' , function($scope ,$rootScope, dataService , authService){
	  var searchedContact = '';
	  var user = dataService.getUser();
	  function reset (){
		  $scope.vendor = {};
	      $scope.searching  = false;
		  $scope.searchComplete = false;
		  searchedContact = '';
	  }
	  
	  $scope.search = function(searchText){
		  reset();
		  searchedContact = searchText;
		  $scope.searching  = true;
		  dataService.search(searchText).then(
		     function(data){
				  $scope.vendor = data.vendorDetails;
				  $scope.vendorLogo = data.profilePic;
				  $scope.userId = data._id;
				  $scope.contactsId = data.contactsId;
				  $scope.fullName = data.fullName;
				  
				  $scope.searching  = false;
				  $scope.searchComplete = true;
			  }
		  );
	  };
	  
	  $scope.addContact = function(){
		  var query = {
			  "myId":user._id,
			  "hisId":$scope.userId,
			  "myCId":user.contactsId,
			  "hisCId": $scope.contactsId
		  };
		  
		  dataService.addContact(query).then(function(status){
			  alert(status);
			  authService.login();
		  });
	  }  
  });
   