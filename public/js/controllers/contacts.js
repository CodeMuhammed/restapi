'use strict';

var app = angular.module('pouchlet');

app.directive('contacts' , function(){
	   return {
			restrict:'E',
			controller : 'contactsCtrl',
			templateUrl: 'views/contacts.tpl.html',
			scope : true
		};
});

//NOTE: Objects are references so changing a data service gotten object on a scope object is the same copy
app.controller('contactsCtrl' , function($scope , dataService , authService){
  
  function refresh() {
	 $scope.colors = [ 'gray', 'blue', 'green' , 'yellow' ,'red'];
	 $scope.contacts=dataService.getContacts().contacts;
	 $scope.user_img_array = dataService.getUserImg();//array
	 $scope.activeType = 'bill to';
	 
	  
	  //This next procedure patches the contacts with the user_img_array
	  for(var i=0; i<$scope.contacts.length; i++){
		  var temp = $scope.contacts[i];
		  for(var j=0; j<$scope.user_img_array.length; j++){
			  var temp2 = $scope.user_img_array[j];
			  if(temp.userId === temp2._id){
				 // console.log('this was true '+i+' '+j);
				  temp.profilePic = temp2.profilePic;
				  temp.username = temp2.username;
				  temp.contactsId = temp2.contactsId;
			  }
		  }
	  }
  }
  refresh();
 
  
  //This method send the particular data to the service so that the contact view can use it
  $scope.displayTransFor = function(contact){
	  dataService.setActiveContact(contact).then(
	  function(status){
		  
	  } , function(err){
		  alert(err);
		  authService.logout();
	  });  
  };
  
  //When changing the color grouping code for a contact ,  since we are patching
  //we have to delete the data we added so as for the server to recognise it for 
  //update .
  $scope.changeColor = function(contact , color){
	  // record and update contact
	  var oldContact = angular.copy(contact);
	  contact.color = color;
	  
	  //do the update
	 dataService.updateContact(oldContact , contact).then(function(){
		 refresh();
	 });
  };
  
  //
  $scope.changeType = function(type){
	  $scope.activeType = type;
  }
  
});
