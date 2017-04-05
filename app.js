var express = require('express');
var cfenv = require('cfenv');
var app = express();
var conversation_util = require('./conversation.js')

// Serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// Get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, '0.0.0.0', function() {
	console.log("server starting on port: " + appEnv.url);
});

var io = require('socket.io');
io = io.listen(server);

io.sockets.on("connection", function (socket) {
    /*Associating the callback function to be executed when client visits the page and
      websocket connection is made */

    socket.send("Connection with the server established"); //envia mensaje de connection with the server
    /*sending data to the client , this triggers a message event at the client side */
    //console.log('Socket.io Connection with the client established');

    socket.on("sendCSV", function (credentials, data, options) {
		conversation_util.processCSV(credentials, data, options, function(err, result){
			socket.emit("sendCSVResult", err, result);
		});
    });
	
	socket.on("listWorkspaces", function(credentials) {
		conversation_util.listWorkspaces(credentials, function(err, data){
			socket.emit("listWorkspacesResult", err, data);
		});
	});
	
	socket.on("getDialogNodes", function(credentials) {
		conversation_util.getDialogNodes(credentials, function(err, data){
			socket.emit("getDialogNodesResult", err, data);
		});
	});
}); 