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
	  $scope.tokenObject = {};
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
			 console.log(data);
			  $scope.vendor = data.vendorDetails;
			  $scope.vendorLogo = data.profilePic;
			  $scope.services =  data.services;
			  $scope.userId = data._id;
			  $scope.contactsId = data.contactsId;
			  $scope.fullName = data.fullName;
			  
			  //init token objects
			  for(var i=0; i<$scope.vendor.userTokens.length; i++){
				  var token  = $scope.vendor.userTokens[i];
				  $scope.tokenObject[token] = token;
			  }
			  
			  $scope.searching  = false;
			  $scope.searchComplete = true;
		  }
	  );
  };
  
  $scope.addContact = function(){
	  $scope.tokenObject.url = $scope.vendor.url;
	  $scope.tokenObject.secret = $scope.vendor.secret;
	  
	  console.log($scope.vendor);
	  var query = {
		  "myId":user._id,
		  "hisId":$scope.userId,
		  "myCId":user.contactsId,
		  "hisCId": $scope.contactsId,
		  "tokenObject": $scope.tokenObject
	  };
	  
	  dataService.addContact(query).then(function(result){
		  alert(result);
		  authService.login();
	  });
  }  
});
   