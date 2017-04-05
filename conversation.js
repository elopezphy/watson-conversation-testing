//Dependencies
const fs = require('fs');
const WatsonConversation = require( 'watson-developer-cloud/conversation/v1' );
const csv = require('csv');

function conversationInstance(credentials){
	return new WatsonConversation({
	  'username': credentials.username,
	  'password': credentials.password,
	  'version': 'v1',
	  'version_date': '2017-02-03',
	  'headers' : {"X-Watson-Learning-Opt-Out": "1"}
	});
}

exports.listWorkspaces = function(credentials, callback){
	var conversation = conversationInstance(credentials);
	conversation.listWorkspaces({}, function(err, data){
		callback(err, data);
	});
}

exports.getDialogNodes = function(credentials, callback){
	var conversation = conversationInstance(credentials);
	conversation.getWorkspace({'workspace_id' : credentials.workspace_id, 'export' : true}, function(err, data){
		if (err){
			callback(err, null);
		}
		else{
			data.dialog_nodes.unshift({dialog_node : 'root'})
			callback(err, data.dialog_nodes);
		}
	});
}

exports.processCSV = function(credentials, inputdata, options, callback){

	var conversation = conversationInstance(credentials);
	var workspace = credentials.workspace_id;
	var promises = [];
	
	csv.parse(inputdata, {}, function(err, rows) {
		if(err){
			return callback(err, null);
		}
		else if(rows.length <= 0){
			return callback("fallo", null);
		}
		else{
			for (var i in rows){
				if (rows[i].length <= 0) continue;
				const question = rows[i][0];
				var promise = new Promise(function(resolve, reject) {
					let payload = {
						workspace_id : workspace,
						input : { text : question },
						context : JSON.parse(options.initialcontext)
					}
					payload.context.system = { dialog_stack: [ { dialog_node: options.initialnode } ] }
					
					let answer = {
						sentence : question
					}
					
					conversation.message(payload, function(err, data) {
						console.log(JSON.stringify(data.output))
						if (err){
							console.log("err: " + JSON.stringify(err))
							resolve(answer);
						}
						else{
							if ("intents" in data && data.intents.length > 0){
								if (options.showIntent) answer.intent = data.intents[0].intent;
								if (options.showConfidence) answer.confidence = data.intents[0].confidence;
							}
							if (options.showOutput && "output" in data && "text" in data.output){
								if (data.output.text.length <= 0) answer.output = "";
								else answer.output = data.output.text.join(" ");
							}
							if (options.showContext && "context" in data){
								for (let i in options.context){
									if (options.context[i] != "" && options.context[i] in data.context){
										answer[options.context[i]] = data.context[options.context[i]]
									}
								}
							}
							resolve(answer);
						}
					});
				})
				promises.push(promise);
			}
			Promise.all(promises).then(function(data){
				return callback(null, data);
			});
		}
    });
	
};