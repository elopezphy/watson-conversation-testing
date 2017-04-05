'use strict';

var app = angular.module('Home');

app.controller('HomeController', ['$scope', '$mdDialog', 'ProjectService', 'socket', function($scope, $mdDialog, ProjectService, socket){
	
	/* TAB Functionality for TextArea Elements */
	var textareas = document.getElementsByTagName('textarea');
	if (textareas) {
		for (let i = 0; i < textareas.length; i++) {
			textareas[i].addEventListener('keydown', function(e){
				if (e.keyCode != 9 || e.which != 9) return; //If TAB key isn't pressed, return. 
				var oldSelectionStart = this.selectionStart;
				var oldSelectionEnd = this.selectionEnd;
				var selection = "";
				if (oldSelectionEnd > oldSelectionStart){ //If selection, select full lines
					let lines_before = this.value.slice(0, oldSelectionStart).split('\n').length - 1;
					let lines_selection = this.value.slice(oldSelectionStart, oldSelectionEnd).split('\n').length;
					oldSelectionStart = this.value.split('\n').slice(0, lines_before).join('\n').length
					oldSelectionEnd = this.value.split('\n').slice(0, lines_before + lines_selection).join('\n').length
					selection = this.value.slice(oldSelectionStart, oldSelectionEnd);
				}
				var newSelectionEnd = oldSelectionEnd;
				selection = selection.split('\n');
				if (e.shiftKey){ //If shiftKey, delete TABS.
					for (let item in selection){
						if (selection[item][0] == '\t'){
							selection[item] = selection[item].substr(1);
							newSelectionEnd--;
						}
					}
				}
				else{ //IF not shiftKey, add TABS.
					for (let item in selection){
						selection[item] = '\t' + selection[item];
						newSelectionEnd++;
					}
				}
				selection = selection.join('\n');
				//Update value and selections
				this.value = this.value.slice(0, oldSelectionStart) + selection + this.value.slice(oldSelectionEnd);
				this.selectionStart = oldSelectionStart != oldSelectionEnd ? oldSelectionStart : newSelectionEnd;
				this.selectionEnd = newSelectionEnd;
				//Prevent default TAB behavior.
				e.preventDefault();
			});
		}
	}
	
	$scope.credentials = {
		
	};
	
	$scope.inputfile;
	$scope.data;
	$scope.filename;
	
	$scope.showAdvancedOptions = false;
	$scope.correctInitialContext = true;
	
	$scope.options = {
		initialnode : 'root',
		initialcontext : "{}",
		showIntent : true,
		showConfidence : true,
		showOutput : false,
		showContext : false,
		context : [""]
	};
	
	$scope.progress = null;
	
	$scope.startProgress = function(str){
		$scope.error = null;
		$scope.progress = str;
	};
	$scope.stopProgress = function(){
		$scope.progress = null;
	}
	
	$scope.progress = false;
	$scope.searchWorkspaceProgress = false;
	$scope.submitProgress = false;
	
	$scope.error = null;
	$scope.contextError = null;
	
	$scope.gridOptions = { data : 'result' };
	$scope.result;
	
	function errorHandler(err){
		var newerr = "An unknown error has ocurred. Please try again later.";
		if ("error" in err){
			if (err.error == "URL workspaceid parameter is not a valid GUID."){
				newerr = "Wrong Workspace ID";
			}
			else if (err.error == "Not Authorized"){
				newerr = "Invalid Credentials";
			}
			else if (err.error == "CSV file is empty"){
				newerr = err.error;
			}
		}
		$scope.$apply(function(){
			$scope.error = newerr;
		});
	};
	
	$scope.checkContext = function(){
		try {
			if (!$scope.options.initialcontext == ""){
				var good_json = JSON.parse($scope.options.initialcontext);
			}
			$scope.contextError = null;
		} catch (err) {
			$scope.contextError = err.message;
		}
	};
	
	$scope.onContextOutputChange = function(){
		if ($scope.options.context.length > 0 && $scope.options.context[$scope.options.context.length - 1] != ""){
			$scope.options.context.push("");
		}
		if ($scope.options.context.length > 1 && $scope.options.context[$scope.options.context.length - 2] == "" && $scope.options.context[$scope.options.context.length - 1] == ""){
			$scope.options.context.pop();
		}
	};
	
	$scope.clearContextItem = function(index){
		$scope.options.context.splice(index, 1);
	};
	
	$scope.uploadFile = function(callback){
		var f = document.getElementById('file').files[0],
			r = new FileReader();
		r.onloadend = function(e){
			$scope.data = e.target.result;
			callback();
		}
		r.readAsBinaryString(f);
	};
	
	$scope.searchWorkspaces = function(ev){
		$scope.startProgress('search workspace');
		ProjectService.listWorkspaces($scope.credentials, function(err, result){
			$scope.$apply(function(){
				$scope.stopProgress();
			});
			if (err){
				errorHandler(err);
			}
			else{
				$mdDialog.show({
					controller : WorkspacesController,
					templateUrl : "./modules/home/views/workspaces.tmpl.html",
					targetEvent : ev,
					clickOutsideToClose : true,
					locals : {
						workspaces : result.workspaces
					}
				})
				.then(function(answer) {
					if (answer.workspace_id){
						$scope.credentials.workspace_id = answer.workspace_id;
					}
				}, function() {
							  
				});
			}
		});
	};
	
	$scope.getDialogNodes = function(ev){
		$scope.startProgress('get dialog nodes');
		ProjectService.getDialogNodes($scope.credentials, function(err, result){
			$scope.$apply(function(){
				$scope.stopProgress();
			});
			if (err){
				errorHandler(err);
			}
			else{
				$mdDialog.show({
					controller : DialogNodesController,
					templateUrl : "./modules/home/views/dialognodes.tmpl.html",
					targetEvent : ev,
					clickOutsideToClose : true,
					locals : {
						dialog_nodes : result
					}
				})
				.then(function(answer) {
					if (answer.dialog_node){
						$scope.options.initialnode = answer.dialog_node;
					}
				}, function() {
							  
				});
			}
		});
	}
	
	$scope.updateGridColumns = function(){
		$scope.gridOptions.columnDefs = [
			{
				field : 'sentence', displayName : 'Sentence'
			}
		];
		if ($scope.options.showIntent){
			$scope.gridOptions.columnDefs.push(
				{
					field : 'intent', displayName : 'Intent'
				}
			);
		}
		if ($scope.options.showConfidence){
			$scope.gridOptions.columnDefs.push(
				{
					field : 'confidence', displayName : 'Confidence'
				}
			);
		}
		if ($scope.options.showOutput){
			$scope.gridOptions.columnDefs.push(
				{
					field : 'output', displayName : 'Output'
				}
			);
		}
		if ($scope.options.showContext){
			for (let i in $scope.options.context){
				if ($scope.options.context[i] != ""){
					$scope.gridOptions.columnDefs.push(
						{
							field : $scope.options.context[i], displayName : $scope.options.context[i]
						}
					);
				}
			}
		}
	}
	
	$scope.process = function(){
		if (document.getElementById('file').files.length == 0) return;
		if ($scope.options.initialcontext == "") $scope.options.initialcontext = "{}";
		$scope.startProgress('submit');
		$scope.result = null;
		$scope.updateGridColumns();
		$scope.uploadFile(function(){
			ProjectService.handleCSV($scope.credentials, $scope.data, $scope.options, function(err, result){
				if (err){
					errorHandler(err);
				}
				$scope.$apply(function(){
					$scope.result = result;
					$scope.stopProgress();
				});
			});
		});
	}
	
	$scope.showContent = function($fileContent){
        $scope.content = $fileContent;
    };
	
}]);

function WorkspacesController($scope, $rootScope, $mdDialog, $mdToast, ProjectService, workspaces) {

	$scope.workspaces = workspaces;

	$scope.showSimpleToast = function(text) {
		$mdToast.show(
		  $mdToast.simple().content(text).position('top').hideDelay(1000)
		);
    };
	
	$scope.selectWorkspace = function(item){
		$scope.showSimpleToast('Workspace updated')
		$mdDialog.hide(item);
	};
  
    $scope.close = function() {
		$mdDialog.hide( {} );
	};
};

function DialogNodesController($scope, $rootScope, $mdDialog, $mdToast, ProjectService, dialog_nodes) {

	$scope.dialog_nodes = dialog_nodes;

	$scope.showSimpleToast = function(text) {
		$mdToast.show(
		  $mdToast.simple().content(text).position('top').hideDelay(1000)
		);
    };
	
	$scope.selectDialogNode = function(item){
		$scope.showSimpleToast('Initial dialog node updated')
		$mdDialog.hide(item);
	};
  
    $scope.close = function() {
		$mdDialog.hide( {} );
	};
};