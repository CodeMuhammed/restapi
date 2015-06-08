'use strict';

var app = angular.module('pouchlet');
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