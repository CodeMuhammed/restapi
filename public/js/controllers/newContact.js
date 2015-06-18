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
  var temp =[]; 
  
  
  
  function reset (){
	  $scope.tokenObject = {};
	  $scope.vendor = {};
	  $scope.searching  = false;
	  $scope.searchComplete = false;
	  searchedContact = '';
	  temp =[];
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
			  
			  //init token objects 
			  for(var i=0; i<$scope.vendor.userTokens.length; i++){
				  var token  = $scope.vendor.userTokens[i];
				  $scope.tokenObject[token] = token;
			  }
			  
			  //get the services definition from the server
			  dataService.expandServices(data.services).then(
			     function(results){
					 console.log(results);
					 $scope.services =  results;
				 }, 
				 function(err){
					 alert('problem with exppanding services :::from newContactCtrl');
				 });
			  
			  $scope.searching  = false;
			  $scope.searchComplete = true;
		  }
	  );
  };
  
  //this adds the services id to the temp array
  $scope.mark = function(service){
	  temp.push(service._id);
  };
  
  //this removes the services id from the temp array
  $scope.unmark = function(service){
	  var index = temp.indexOf(service._id);
	  temp.splice(index , 1);
  };
  
  //
  $scope.isMarked = function(service){
	  var index = temp.indexOf(service._id);
	  return  index<0?false:true;
  }
  
  //This subscribes to the specific services selected
  $scope.subscribe = function(){
	  $scope.tokenObject.url = $scope.vendor.url;
	  $scope.tokenObject.secret = $scope.vendor.secret;
	  
	  console.log($scope.vendor);
	  var query = {
		  "myId":user._id,
		  "hisId":$scope.userId,
		  "myCId":user.contactsId,
		  "hisCId": $scope.contactsId,
		  "tokenObject": $scope.tokenObject,
		  "services": temp
	  };
	  
	  dataService.addContact(query).then(function(result){
		  alert(result);
		  authService.login();
	  });
  }  
});
   