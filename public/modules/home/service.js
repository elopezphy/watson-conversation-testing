'use strict';
 
angular.module('Home')

.factory('socket', ['$rootScope', function($rootScope) {
  var socket = io.connect();

  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };

}])

.config(function ($httpProvider) {
	$httpProvider.defaults.headers.common = {};
	$httpProvider.defaults.headers.post = {};
	$httpProvider.defaults.headers.put = {};
	$httpProvider.defaults.headers.patch = {};
})

.factory('ProjectService',
    ['$http', '$rootScope', 
    function ($http, $rootScope) {
        var service = {};

        var socket = io.connect("/");

        service.handleCSV = function(credentials, data, options, callback) {
            socket.emit("sendCSV", credentials, data, options);
            socket.on("sendCSVResult", function(err, result){
                callback(err, result);
                socket.off("sendCSVResult");
            });
        }; 
		
		service.listWorkspaces = function(credentials, callback){
			socket.emit("listWorkspaces", credentials);
			socket.on("listWorkspacesResult", function(err, result){
                callback(err, result);
                socket.off("listWorkspacesResult");
            });
		};
		
		service.getDialogNodes = function(credentials, callback){
			socket.emit("getDialogNodes", credentials);
			socket.on("getDialogNodesResult", function(err, result){
                callback(err, result);
                socket.off("getDialogNodesResult");
            });
		};
	
        return service;

}]);