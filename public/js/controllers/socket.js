'use strict';

var app = angular.module('pouchlet');
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