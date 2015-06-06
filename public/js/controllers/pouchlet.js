'use strict';

var app = angular.module('pouchlet' , ['fileUpload' , 'ngResource', 'btford.socket-io']);
  app.config(function($httpProvider){
	  $httpProvider.defaults.useXDomain = true;
	  delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });
  
  app.filter('aggregateTrans' , function(/*Dependency injections*/ dataService , $filter){
	  return function(/*worker arguments*/data){
		  if(angular.isObject(data)){
			  var keys = Object.keys(data);
			  var user = dataService.getUser();
			  if(keys.length!==2){
				  return data;
			  }
			  else{
				  if(angular.isArray(data[keys[0]]) && angular.isArray(data[keys[1]])){
					  
					  if(angular.isDefined(data[user.username])){
						  /*@TODO*/
						  console.log('valid trans data');
						  var newData = data[user.username];
						  var otherUser = (keys[0]!==user.username ? keys[0] : keys[1]);
						  for(var i=0; i<data[otherUser].length; i++){
							  data[otherUser][i].left = true; //this makes it clear which data are pulled to the left of the view
							  if(data[otherUser][i].status==='success'){
								  newData.push(data[otherUser][i]);
							  }
						  }
						  return $filter('orderBy')(newData , 'date');
					  } else {
						  console.log('invalid data passed into the aggregateTrans filter');
						  return [];
					  }
				     
				  } 
				  else{
					  return data;
				  }
			  }
		  } 
		  else {
			  return data;
		  }
	  }
  });
  
  app.filter('countFilter' , function(){
	  return function(data){
	     if(angular.isString(data) || angular.isNumber(data)){
			  var kmValue = data/1000;
			  if(kmValue < 1){
				  return data;
			  }
			  if(kmValue < 1000){
				  return kmValue+'K';
			  }
			  if(kmValue >= 1000){
				  return kmValue+'M';
			  }
	     }
		 return data;
	  }
  });
  
  app.factory('mySocket' , function(socketFactory , $window){
	  return socketFactory({
		  ioSocket : $window.io.connect('http://localhost:3000')
	  });
  });
  
  app.service('authService' , function($http , $q ,$resource, dataService , viewService){
	  var signupPromise = $q.defer();
	  var loginPromise = $q.defer();
	  var logoutPromise = $q.defer();
	  var loginStatus = false;
	  
	  //This handles signUp in the following ways
	  //1. Passes the  data to the server which creates its entry in the
	  //   database and returns the  user data
	  //2. The returned data is then passed into the login service to login user automatically
	  var signup = function(signupDetails){
		  $http({
		     method : 'POST',
			 url : '/auth/signup',
			 data : signupDetails
		  })
		  .success(function(data){
			 login(data).then(function(status){
				 alert('signup done');
			 });
		 })
		 .error(function(err){
			 alert(angular.toJson(err));
			 signupPromise.reject(err);
		  });
		  
		  return signupPromise.promise;
	  };
	  
	  var login = function(loginDetails){
		  $http({
		     method : 'POST',
			 url : '/auth/login',
			 data : loginDetails
		  }).success(function(data){
			     dataService.setUser(data).then(function(){
				 loginStatus = true;
				 viewService.setView('contacts');
				 //alert('login done');
			 }); 
		  }).error(function(err){
			  loginStatus = false;
			  loginPromise.reject(err);
		  });
		  
		  return loginPromise.promise;
	  };
	  
	  //manages auto login for us when we do a complete page refesh
	 login().then(function(status){
		 console.log(status);
	 } , function(err){
		 console.log(err);
	 });
	  
  
	  var logout  = function(){
		  $http({
		     method : 'GET',
			 url : '/auth/logout'
		  }).success(function(data){
			    logoutPromise.resolve(data);
		        viewService.setView('homepage');
			 }); 
		  
		  return logoutPromise.promise;
	  };
	  
	  var isLoggedIn = function(){
		  return loginStatus;
	  };
	  
	  return {
		  login : login,
		  logout: logout,
		  signup : signup,
		  isLoggedIn : isLoggedIn
	  };
  });
  
  app.factory ('viewService' , function($rootScope){
	  var view = {
		  view : 'homepage'
	  };
	  
	  var setView = function(newView){
		  
		  if(angular.isString(newView)){
			  view.view=newView;
		  }
		  $rootScope.$broadcast('viewChanged' , {});
		  
	  };
	  
	  var getView = function(){
		  return view.view;
	  };
	  return {
		  setView : setView,
		  getView : getView
	  };
  });
  
  app.factory('dataService' , function($http , $q , viewService){
	  
	  var contactsObj = {};
	  var activeContact = {};
	  var transHistory = {};
	  var user = {};
	  var newUserSchema;
	  var userPromise  = $q.defer();
	  var activeContactPromise = $q.defer();
	  var newUserSchemaPromise = $q.defer();
	  var searchPromise = $q.defer();
	  
	  var getNewUserSchema = function(){
		  if(!newUserSchema){
			  $http({
				  method: 'GET',
				  url: '/json/user.json'
			  }).success(function(data){
					newUserSchema=data;
					newUserSchemaPromise.resolve(newUserSchema);
			  }).error(function(err){
				  newUserSchemaPromise.reject(err);
			  });
		  } else {
			  newUserSchemaPromise.resolve(newUserSchema);
		  }
		  
		  return newUserSchemaPromise.promise;
	  };
	  
	  var setUser = function(validUser){
		  user = validUser;
		  setContacts(user.contactsId);
		  return  userPromise.promise;
	  };
	  
	  var setContacts = function(id){
		  $http({
			  method: 'GET',
			  url: 'api/contacts/'+id
		  }).then(function(res){
			    contactsObj=res.data;
				userPromise.resolve();
		  });
	  };
 
	  var setActiveContact = function(contact){
		  activeContact = contact;
		  setTransHistory(contact.transHistoryId);
		  return activeContactPromise.promise;
	  };
	  
	  var setTransHistory = function(id){
		  $http({
			  method: 'GET',
			  url: 'api/transactions/'+id
		  }).success(function(data){
			    transHistory=data;
				viewService.setView('contact');
				activeContactPromise.resolve(true);
		  })
		  .error(function(err){
			  activeContactPromise.reject(err);
		  });
	  };
	  
	  
	  var getContacts = function(){
		  return contactsObj.contacts;
	  };
	  
	  var getActiveContact = function(){
		return   activeContact;
	  };
	  
	  var getTransHistory = function(){
		 return transHistory;
	  };
	  
	  var getUser = function(){
		  return user;
	  };
	  
	  var search = function(searchText){
		  $http({
			  method:'GET',
			  url : '/api/search',
			  params : {"searchText" : searchText}
		  })
		  .success(function(data){
			  searchPromise.resolve(data);
		  })
		  .error(function(err){
			  searchPromise.reject(err);
		  });
		  return searchPromise.promise;
	  };
	  
	  return {
		  getContacts : getContacts,
		  setActiveContact : setActiveContact,
		  getActiveContact : getActiveContact,
		  getTransHistory :  getTransHistory ,
		  getNewUserSchema : getNewUserSchema,
		  getUser : getUser,
		  setUser : setUser,
		  search : search
	  };
	  
  });
  
  
  app.directive('main' , function(){
	   return {
			restrict:'E',
			controller : 'mainCtrl',
			templateUrl: 'views/main.tpl.html',
			scope : true
		};
   });
   
   app.controller('mainCtrl' , function($scope , viewService){
	   $scope.view = viewService.getView();
	   
	   $scope.$on('viewChanged' , function(e , a){
		  $scope.view = viewService.getView();
	   });
	  
	  $scope.changeView = function(view){
		  viewService.setView(view);
	  };
	  
   });
   
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
	  $scope.sanity = {"password":"0000","agree":true};
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
  
  app.directive('contacts' , function(){
	   return {
			restrict:'E',
			controller : 'contactsCtrl',
			templateUrl: 'views/contacts.tpl.html',
			scope : true
		};
  });
  app.controller('contactsCtrl' , function($scope , dataService , authService){
	  
	  $scope.colors = [ 'gray', 'blue', 'green' , 'yellow' ,'red'];
	  $scope.contacts=dataService.getContacts();
	  
	  
	  $scope.displayTransFor = function(contact){
		  dataService.setActiveContact(contact).then(
		  function(status){
			  
		  } , function(err){
			  alert(err);
			  authService.logout().then(function(status){
				  alert(status);
			  });
		  });  
	  };
	  
	  $scope.changeColor = function(contact , color){
		  var index= $scope.contacts.indexOf(contact);
		  $scope.contacts[index].color = color;
		   $scope.displayTransFor($scope.contacts);
	  };
	  
  });
  
  app.directive('contact' , function(){
	   return {
			restrict:'E',
			controller : 'contactCtrl',
			templateUrl: 'views/contact.tpl.html',
			scope : true
		};
   });
   
   app.controller('contactCtrl' , function($scope , $filter ,  dataService){
	   $scope.contact = dataService.getActiveContact();
	   $scope.transLog = $filter('aggregateTrans')(dataService.getTransHistory().transLog);
   });
   
    app.directive('userProfile' , function(){
	   return {
			restrict:'E',
			controller : 'profileCtrl',
			templateUrl: 'views/profile.tpl.html',
			scope : true
		};
   });
   
   app.controller('profileCtrl' , function($scope , dataService){
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
		   $scope.user = user;
		   $scope.edit = false;
	   }
   });
  
  
   app.directive('newContact' , function(){
	   return {
			restrict:'E',
			controller : 'newContactCtrl',
			templateUrl: 'views/newContact.tpl.html',
			scope : true
		};
   });
   app.controller('newContactCtrl' , function($scope , dataService){
	  function reset (){
		  $scope.vendor = {};
	      $scope.searching  = false;
		  $scope.searchComplete = false;
	  }
	  
	  $scope.search = function(){
		  reset();
		  $scope.searching  = true;
		  
		  dataService.search($scope.searchText).then(
		  function(result){
			  console.log(result);
			  $scope.vendor = result.vendorDetails;
			  $scope.vendorLogo = result.profilePic;
			  $scope.searching  = false;
			  $scope.searchComplete = true;
			  alert($scope.vendorLogo);
		  }
		  , function(err){
			  alert(err);
		  });
	  };
	  
  });
  
  
  app.directive('withdraw' , function(){
	   return {
			restrict:'E',
			controller : 'tranCtrl',
			templateUrl: 'views/withdraw.tpl.html',
			scope : true
		};
   });
  
  app.directive('payIn' , function(){
	   return {
			restrict:'E',
			controller : 'tranCtrl',
			templateUrl: 'views/payIn.tpl.html',
			scope : true
		};
   });
  
  app.controller('tranCtrl' , function($scope){
	  $scope.items  = ['option a' , 'option a' , 'option a' , 'option a' , 'option a'];
  });
   
   
    app.directive('fonts' , function(){
	   return {
			restrict:'E',
			controller : 'fontsCtrl',
			templateUrl: 'views/fonts.tpl.html',
			scope : true
		};
   });
   
   app.controller('fontsCtrl' , function($scope , $http){
	  $scope.hello = 'hello';
	  $http({
		  method: 'GET',
		  url: '/fontNames'
	  }).then(function(res){
		  $scope.hello=res.data;
	  });

  });
  
  
  app.directive('socket' , function(){
	   return {
			restrict:'E',
			controller : 'socketCtrl',
			templateUrl: 'views/socket.tpl.html', 
			scope : true
		};
   });
   
   app.controller('socketCtrl' , function($scope , mySocket){
	   
		mySocket.on('hey' , function(msg){
			alert(msg.msg);
		});
		
		$scope.send = function(){
			mySocket.emit('messageChange' , {message:$scope.data});
		};
		
		$scope.$on('viewChanged' , function(e , a){
			alert('view changed');
			$scope.view = viewService.getView();
		});
   });
  
   