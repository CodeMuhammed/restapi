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
		  }).success(function(status){
			    alert(status);
			    logoutPromise.resolve(status);
		        viewService.setView('homepage');
			 })
			 .error(function(err){
				 alert(err);
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
	  var user_image;
	  
	  var userPromise  = $q.defer();
	  var activeContactPromise = $q.defer();
	  
	  
	  var reset = function(){
		  contactsObj = {};
	      activeContact = {};
		  transHistory = {};
		  User = {};
		  newUserSchema =undefined;
		  user_image=undefined;
	  };
	 
	  //This function gets the schema the user will fill when doing a
	  //sign up
	  var getNewUserSchema = function(){
		  var newUserSchemaPromise = $q.defer();
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
	  
	  //METHOD: SET USER
	  var setUser = function(validUser){
		  User = validUser;
		  setContacts(User.contactsId);
		  return  userPromise.promise;
	  };
	  
	  //METHOD: UPDATE  USER
	  var updateUser = function(user){
		  var updateUserPromise = $q.defer();
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
      //METHOD: SET ACTIVE CONTACT
	  var setActiveContact = function(contact){
		  activeContact = contact;
		  setTransHistory(contact.transHistoryId);
		  return activeContactPromise.promise;
	  };
	  
	  //METHOD ADD CONTACT
	  var addContact = function(query){
		  var promise = $q.defer();
		  var contacts = contactsObj.contacts;
		  var contact = {};
		  
		  var exists = false;
		  for(var i=0; i<contacts.length; i++){
			  if(contacts[i].userId===query.hisId){
				  exists = true;
				  contact = contacts[i];
				  break;
			  }
		  }
		  if(query.hisId===query.myId){
			  alert('You cant add your self to your list');
			  promise.reject();
		  }
		  else if(exists){
			  console.log(contact);
			  var oldContact = angular.copy(contact);
			  contact.type='both';
			  updateContact(oldContact , contact).then(function(){
				  promise.resolve('contact already in your list but updated to both');
			  });
		  } 
		  else {
			  $http({
				  method: 'POST',
				  url: 'api/contact',
				  data : query
			  }).success(function(result){
				   promise.resolve(result);
			  }).error(function(err){
				   alert(err);
				   promise.reject();
			  });
		  }
		  
		  return promise.promise;
	  };
	  
	  //METHOD DELETE CONTACT
	  var deleteContact = function(query){
		  var promise = $q.defer();
		  //alert(angular.toJson(query));
		  
		  $http({
			  method : 'DELETE',
			  url : 'api/contact',
			  params: query
		  })
		  .success(function(data){
			  //after deleting from the server lets delete from the contacts list and change the view
			  for (var i=0; i<contactsObj.contacts.length; i++){
				  var temp = contactsObj.contacts[i];
				  if(temp.userId===query.hisId){
					  contactsObj.contacts.splice(i , 1);
					  break;
				  }
			  }
			  
			  alert(data);
			  viewService.setView('contacts');
			  
			  
		  })
		  .error(function(err){
			  alert(err);
		  });
		  
		  return promise.promise;
	  }
	  
	  //METHOD: UPDATE CONTACT
	  var updateContact = function(oldContact , newContact){
		  var updateContactPromise = $q.defer();
		 //delete patches
		  delete(oldContact.profilePic);
		  delete(oldContact.username);
		  delete(oldContact.contactsId);
		  
		  delete(newContact.profilePic);
		  delete(newContact.username);
		  delete(newContact.contactsId);
	  
		   //construct the query object to be sent to the server
		  var query = {
			  contactsId : contactsObj._id,
			  newData : newContact,
			  oldData : oldContact
		  };
		  
		  console.log(query);
			  
		  var updateContactPromise = $q.defer();
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
	  
	  //METHOD: SET TRANSACTION HISTORY
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
	  
	  //GET METHODS DEFINITION
	  
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
	  
	  //SEARCH: FOR THINGS
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
		  deleteContact : deleteContact,
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
  
  app.filter('categorize' , function(){
	  return function(data , type){
		  if(angular.isArray(data) && angular.isString(type)){
			  //alert('valid data set '+type);
			  var temp = [];
			  for(var i=0; i<data.length; i++){
				  if(data[i].type===type || data[i].type==='both'){
					  temp.push(data[i]);
				  }
			  }
			  return temp;
		  } else {
			  return data;
		  }
	  }
  });