'use strict';

var app = angular.module('pouchlet');
app.directive('homePage' , function(){
	  return {
		  restrict : 'E',
		  controller : 'homepageCtrl',
		  templateUrl: 'views/homepage.tpl.html',
		  scope: true
	  };
  });
  app.controller('homepageCtrl' , function($scope , $rootScope , authService , dataService){
	  //default countries to select from when doing signup
	  $scope.countries = ['Nigeria' , 'Ghana'];
	  
	  //default form view to display
	  $scope.formView = 'signin';
	  
	  //gets the schema for new user which will be filled by the user
	  dataService.getNewUserSchema().then(
	     function(result){
		     $scope.newUser = result;
	     } , 
		 function(err){
			 alert(err);
		 });
	  
	  $scope.login = function(loginDetails){
		  authService.login(loginDetails).then(null , function(err){
			  $scope.loginError =err;
		  });
	  };
	  
	  $scope.signup = function(newUser , sanity){
		  console.log(newUser);
		  console.log(sanity);
		  if(newUser.password===sanity.password && sanity.agree){
			  //@TODO sign new users up and log them in
			  authService.signup(newUser);
		  } else {
			  alert('problematic new user details');
		  }
	  };
	  
	  $rootScope.$on('homepageAction' , function(e , a){
		   $scope.formView = a.action;
	  });
	  
  });