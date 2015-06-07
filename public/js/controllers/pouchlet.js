'use strict';

var app = angular.module('pouchlet' , ['fileUpload' , 'ngResource', 'btford.socket-io']);
  app.config(function($httpProvider){
	  $httpProvider.defaults.useXDomain = true;
	  delete $httpProvider.defaults.headers.common['X-Requested-With'];
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
	     } //
		 return data;
	  }
  });
  
  app.factory('mySocket' , function(socketFactory , $window){
	  return socketFactory({
		  ioSocket : $window.io.connect('http://localhost:3000')
	  });
  });
  
  app.service('authService' , function($http , $q ,$resource, dataService , viewService){
	  //This handles signUp in the following ways
	  //1. Passes the  data to the server which creates its entry in the
	  //   database and returns the  user data
	  //2. The returned data is then passed into the login service to login user automatically
	  var signup = function(signupDetails){
		  var signupPromise = $q.defer();
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
		  var loginPromise = $q.defer();
		  var loginStatus = false;
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
		  var logoutPromise = $q.defer();
		  $http({
		     method : 'GET',
			 url : '/auth/logout'
		  }).success(function(data){
			    dataService.reset();
			    logoutPromise.resolve(data);
		        viewService.setView('homepage');
			 }); 
		  
		  return logoutPromise.promise;
	  };
	 
	  return {
		  login : login,
		  logout: logout,
		  signup : signup
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
	  var User = {};
	  var newUserSchema;
	  var userPromise  = $q.defer();
	  var updateUserPromise = $q.defer();
	  var activeContactPromise = $q.defer();
	  var newUserSchemaPromise = $q.defer();
	  var searchPromise = $q.defer();
	  
	  var reset = function(){
		  contactsObj = {};
	      activeContact = {};
		  transHistory = {};
		  User = {};
		  newUserSchema;
	  };
	 
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
		  User = validUser;
		  setContacts(User.contactsId);
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
	  
	  var addContact = function(query){
		   $http({
			  method: 'POST',
			  url: 'api/addContact',
			  data : query
		  }).then(function(res){
			   alert(res.data);
		  });
		  
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
		  return User;
	  };
	  
	  var updateUser = function(user){
		  $http({
			  method : 'PUT',
			  url  : 'api/user',
			  data : user
		  })
		  .success(function(result){
			  alert(result);
			  User = user;
			  updateUserPromise.resolve(User);
		  })
		  .error(function(err){
			  alert(err);
			  updateUserPromise.reject(err);
		  });
		  return updateUserPromise.promise;
	  };
	  
	  var search = function(text){
		  var searchPromise = $q.defer();
		  $http({
			  method:'GET',
			  url : '/api/search',
			  params : {"searchText" : text}
		  })
		  .success(function(data){
			  console.log(data);
			  searchPromise.resolve(data);
		  })
		  .error(function(err){
			  alert('search error');
		  });
		  return searchPromise.promise;
	  };
	  
	  return {
		  reset : reset,
		  getContacts : getContacts,
		  setActiveContact : setActiveContact,
		  getActiveContact : getActiveContact,
		  addContact : addContact,
		  getTransHistory :  getTransHistory ,
		  getNewUserSchema : getNewUserSchema,
		  getUser : getUser,
		  setUser : setUser,
		  updateUser : updateUser,
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
		  console.log(contact);
		  dataService.setActiveContact(contact).then(
		  function(status){
			  
		  } , function(err){
			  alert(err);
			  authService.logout();
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
   
   app.controller('contactCtrl' , function($scope ,  dataService){
	   $scope.contact = dataService.getActiveContact();
	   $scope.transLog = dataService.getTransHistory();
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
  
  
   app.directive('newContact' , function(){
	   return {
			restrict:'E',
			controller : 'newContactCtrl',
			templateUrl: 'views/newContact.tpl.html',
			scope : true
		};
   });
   app.controller('newContactCtrl' , function($scope , dataService){
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
				  $scope.id = data._id;
				  $scope.searching  = false;
				  $scope.searchComplete = true;
			  }
		  );
	  };
	  
	  $scope.addContact = function(){
		  var query = {
			  "myId":user._id,
			  "hisId":$scope.id
		  };
		  
		  dataService.addContact(query);
	  }  
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
  
   