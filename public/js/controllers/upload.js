'use strict';


var app = angular.module('fileUpload', [ 'ngFileUpload' ]);
var version = '4.1.2';

app.controller('MyCtrl', [ '$scope', '$http', '$timeout', '$compile', 'Upload', function($scope, $http, $timeout, $compile, Upload) {
	$scope.usingFlash = FileAPI && FileAPI.upload != null;
	$scope.fileReaderSupported = window.FileReader != null && (window.FileAPI == null || FileAPI.html5 != false);

	$scope.angularVersion = window.location.hash.length > 1 ? (window.location.hash.indexOf('/') === 1 ? 
			window.location.hash.substring(2): window.location.hash.substring(1)) : '1.2.20';

	$scope.uploadFiles= function(files) {
		if (files != null) {
			for (var i = 0; i < files.length; i++) {
				(function(file) {
					generateThumbAndUpload(file);
				})(files[i]);
			}
		}
	};
	
	function generateThumbAndUpload(file) {
		$scope.generateThumb(file);
		upload(file);
		//uploadUsing$http(file);
		//uploadS3(file);
	}
	
	$scope.generateThumb = function(file) {
		if (file != null) {
			if ($scope.fileReaderSupported && file.type.indexOf('image') > -1) {
				$timeout(function() {
					var fileReader = new FileReader();
					fileReader.readAsDataURL(file);
					fileReader.onload = function(e) {
						$timeout(function() {
							file.dataUrl = e.target.result;
						});
					}
				});
			}
		}
	};
	
	function upload(file) {
		file.upload = Upload.upload({
			method: 'POST',
			url:'http://localhost:3000/upload',
			headers: {
				'Content-Type': file.type
			},
			params: {_csrf: $scope.csrf},
			file: file,
			fileFormDataName: 'myFile'
		});

		file.upload.then(function(res) {
			$timeout(function() {
				file.result = res.data;
				alert(res);
			});
		}, function(response) {
		});

		file.upload.progress(function(evt) {
			// Math.min is to fix IE which reports 200% sometimes
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});

		file.upload.xhr(function(xhr) {
			// xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
		});
	}
	
	function uploadS3(file) {
		file.upload = Upload.upload({
			url : $scope.s3url,
			method : 'POST',
			fields : {
				key : file.name,
				AWSAccessKeyId : $scope.AWSAccessKeyId,
				acl : $scope.acl,
				policy : $scope.policy,
				signature : $scope.signature,
				'Content-Type' : file.type === null || file.type === '' ? 'application/octet-stream' : file.type,
				filename : file.name
			},
			file : file
		});

		file.upload.then(function(response) {
			$timeout(function() {
				file.result = response.data;
			});
		}, function(response) {
		});
		
		file.upload.progress(function(evt) {
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});
		storeS3UploadConfigInLocalStore();
	}
	
	$scope.generateSignature = function() {
		$http.post('/s3sign?aws-secret-key=' + encodeURIComponent($scope.AWSSecretKey), $scope.jsonPolicy).
			success(function(data) {
				$scope.policy = data.policy;
				$scope.signature = data.signature;
			});
	};
	
	if (localStorage) {
		$scope.s3url = localStorage.getItem('s3url');
		$scope.AWSAccessKeyId = localStorage.getItem('AWSAccessKeyId');
		$scope.acl = localStorage.getItem('acl');
		$scope.success_action_redirect = localStorage.getItem('success_action_redirect');
		$scope.policy = localStorage.getItem('policy');
		$scope.signature = localStorage.getItem('signature');
	}
	
	$scope.success_action_redirect = $scope.success_action_redirect || window.location.protocol + '//' + window.location.host;
	$scope.jsonPolicy = $scope.jsonPolicy || '{\n  "expiration": "2020-01-01T00:00:00Z",\n  "conditions": [\n    {"bucket": "angular-file-upload"},\n    ["starts-with", "$key", ""],\n    {"acl": "private"},\n    ["starts-with", "$Content-Type", ""],\n    ["starts-with", "$filename", ""],\n    ["content-length-range", 0, 524288000]\n  ]\n}';
	$scope.acl = $scope.acl || 'private';
	
	function storeS3UploadConfigInLocalStore() {
		if (localStorage) {
			localStorage.setItem('s3url', $scope.s3url);
			localStorage.setItem('AWSAccessKeyId', $scope.AWSAccessKeyId);
			localStorage.setItem('acl', $scope.acl);
			localStorage.setItem('success_action_redirect', $scope.success_action_redirect);
			localStorage.setItem('policy', $scope.policy);
			localStorage.setItem('signature', $scope.signature);
		}
	}
	

	angular.element(window).bind('dragover', function(e) {
		e.preventDefault();
	});
	angular.element(window).bind('drop', function(e) {
		e.preventDefault();
	});

	$timeout(function(){
		$scope.capture = localStorage.getItem('capture'+ version) || 'camera';
		$scope.accept = localStorage.getItem('accept'+ version) || 'image/*,audio/*,video/*';
		$scope.acceptSelect = localStorage.getItem('acceptSelect'+ version) || 'image/*,audio/*,video/*';
		$scope.disabled = localStorage.getItem('disabled'+ version) == 'true' || false;
		$scope.multiple = localStorage.getItem('multiple'+ version) == 'true' || false;
		$scope.allowDir = localStorage.getItem('allowDir'+ version) == 'true' || true;
		$scope.$watch('capture+accept+acceptSelect+disabled+capture+multiple+allowDir', function() {
			localStorage.setItem('capture'+ version, $scope.capture);
			localStorage.setItem('accept'+ version, $scope.accept);
			localStorage.setItem('acceptSelect'+ version, $scope.acceptSelect);
			localStorage.setItem('disabled'+ version, $scope.disabled);
			localStorage.setItem('multiple'+ version, $scope.multiple);
			localStorage.setItem('allowDir'+ version, $scope.allowDir);
		});
	});

} ]);

app.directive('uploader' , function(){
	return {
		restrict:'E',
		controller : 'MyCtrl',
		templateUrl: 'views/uploader.tpl.html'
	};
});
