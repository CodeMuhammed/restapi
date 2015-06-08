'use strict';

var app = angular.module('pouchlet');

app.factory('mySocket' , function(socketFactory , $window){
	  return socketFactory({
		  ioSocket : $window.io.connect('http://localhost:3000')
	  });
  });
  
app.service('authService' , function($http , $rootScope , $q ,$resource, dataService , viewService){
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
	  
	  //This takes the user name and password entered by the user and tries to login
	  //when login is successful , the contacts view is shown
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
			 });
		  }).error(function(err){
			  loginStatus = false;
			  loginPromise.reject(err);
		  });
		  
		  return loginPromise.promise;
	  };
	  
	 //manages auto login for us when we do a complete page refresh
	 login().then(function(status){
		 console.log(status);
	 } , function(err){
		 console.log(err);
	 });
	  
     //This logs the user out from the server then resets the view to homepage
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
	 
	  var refresh = function(){
		  //@TODO does what refreshes the page automatically when a user logs out then in again
		   login();
	  };
	  
	  return {
		  login : login,
		  logout: logout,
		  signup : signup,
		  refresh :refresh
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
	  var user_image;
	  
	  var userPromise  = $q.defer();
	  var updateUserPromise = $q.defer();
	  var activeContactPromise = $q.defer();
	  var addContactPromise = $q.defer();
	  var updateContactPromise = $q.defer();
	  var newUserSchemaPromise = $q.defer();
	  var searchPromise = $q.defer();
	  
	  
	  var reset = function(){
		  contactsObj = {};
	      activeContact = {};
		  transHistory = {};
		  User = {};
		  newUserSchema;
	  };
	 
	  //This function gets the schema the user will fill when doing a
	  //sign up
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
	  
	  //This gets the user contacts list from the server and 
	  //extracts the contacts ids into an array to be referenced 
	  //by the contacts views for the image and user name
	  var setContacts = function(id){
		  $http({
			  method: 'GET',
			  url: 'api/contacts/'+id
		  })
		  .success(function(data){
			    var contactIds = [];
			    contactsObj=data;
				for(var i=0; i<data.contacts.length; i++){
					contactIds.push(data.contacts[i].userId);
				}
				
			    setUserImg(contactIds);
				
		  })
		  .error(function(err){
			  alert(err);
		  });
	  };
	  
	  //Since we are referencing our contacts by ids , the only way to get other
	  //volatile info efficiently to display for the user is to get an array con-
	  //taining  those info from the server by sending it an array of ids
	  var setUserImg = function(idArray){
		  //Get the user-image combination from the server
		  if(true){
			   //get the user img data from the server
			   $http({
				   method : 'POST',
				   url : 'api/user_image_array',
				   data : idArray
			   })
			   .success(function(data){
				   user_image = data;
				   userPromise.resolve();
			   })
			   .error(function(err){
				   alert(err);
				   userPromise.reject();
			   });
		  }
	  };
 
	  var setActiveContact = function(contact){
		  activeContact = contact;
		  setTransHistory(contact.transHistoryId);
		  return activeContactPromise.promise;
	  };
	  
	  var addContact = function(query){
		  var contacts = contactsObj.contacts;
		  
		  var exists = false;
		  for(var i=0; i<contacts.length; i++){
			  if(contacts[i].userId===query.hisId){
				  exists = true;
				  break;
			  }
		  }
		  if(query.hisId===query.myId){
			  alert('You cant add your self to your list');
		  }
		  else if(exists){
			  alert('contact already in your list');
		  } else {
			  $http({
				  method: 'POST',
				  url: 'api/contact',
				  data : query
			  }).success(function(result){
				   alert(result);
				   addContactPromise.resolve(true);
			  }).error(function(err){
				  addContactPromise.reject(err);
			  });
		  }
		  
		  return addContactPromise.promise;
	  };
	  
	  var updateContact = function(query){
		  $http ({
			  method : 'PUT',
			  url : 'api/contact',
			  data : query
		  })
		  .success(function(result){
			  console.log(result);
			  updateContactPromise.resolve(true);
		  })
		  .error(function(err){
			  updateContactPromise.reject(err);
		  });
		  return updateContactPromise.promise;
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
		  return contactsObj;
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
	  
	  var getUserImg = function(){
		 return user_image
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
		  updateContact : updateContact,
		  getUserImg : getUserImg,
		  getTransHistory :  getTransHistory ,
		  getNewUserSchema : getNewUserSchema,
		  getUser : getUser,
		  setUser : setUser,
		  updateUser : updateUser,
		  search : search
	  };
	  
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
  