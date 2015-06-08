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
  app.controller('contactsCtrl' , function($scope , dataService , authService){
	  
	  $scope.colors = [ 'gray', 'blue', 'green' , 'yellow' ,'red'];
	  $scope.contactsId = dataService.getContacts()._id;
	  $scope.contacts=dataService.getContacts().contacts;
	  
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
		  var oldData = angular.copy(contact);
		  
		  $scope.contacts[index].color = color;
		  
		  var query = {
			  contactsId : $scope.contactsId ,
			  newData : contact,
			  oldData : oldData
		  };
		 dataService.updateContact(query).then(function(){
			 authService.refresh();
		 });
	  };
	  
  });
  