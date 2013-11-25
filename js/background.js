/*该产生id的办法在浏览器关闭后，background脚本就会
停止执行，因此，每次都会从0开始计算。因此下次会有些
笔记没法保存到数据库。*/
/*
var counter = function(){
	var count = 0;
	return function(){
		return count++;
	}
}();
*/

var getId = function(){
	var result = "";
	var time = new Date();
	result += time.getFullYear();
	result += (time.getMonth()+1);
	result += time.getDate();
	result += time.getHours();
	result += time.getMinutes();
	result += time.getSeconds();
	return result;
};

/*this module deals with indexDB*/
var dataBaseFunction = function(){
	var that = {}; 

	that.dbName = "note";
	that.dbVersion = 3;

	that.open = function(){
		that.request = indexedDB.open(that.dbName, that.dbVersion);
		that.request.onerror = function(event){
			alert("error: " + event.target.errorCode);
		};

		that.request.onsuccess = function(event){
			that.db = that.request.result;
		};

		that.request.onupgradeneeded = function(event){
			that.db = event.target.result;
			that.objectStore = that.db.createObjectStore("notes1", {keyPath: "notesId"});
			that.objectStore.createIndex("content", "content", {unique:false});	
			that.objectStore.createIndex("createTime", "createTime", {unique:true});	

		};
	}

	that.addItem = function(item){ 
		var transaction = that.db.transaction("notes", "readwrite");
		var os = transaction.objectStore("notes");
		/*set createTime and notesId*/
		item.notesId = getId();
		os.add(item);	
	};
	that.getItem = function(){
		var result = [];
		var objectStore = that.db.transaction("notes", "read").objectStore("notes");
		objectStore.openCursor();
		return result;
	};

	return that;
};

/*receive the note message*/
window.onload = function(){
	/*determine working mode*/
	var url = window.location.href;
	var reg = /\?\w+=(\w+)/;
	var regTest = reg.exec(url);
	if(!regTest){ 
		/*no explicit mode: do the database stuff and listen to the messages*/
		var db = dataBaseFunction();
		db.open();

		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
			if(request.sender == 'content'){
				if(request.task == 'addContent'){
					/*add an item into the notes database*/
					db.addItem(request.note);
				}
			}
			if(request.sender == 'extension'){
				if(request.task == 'seeall'){
					chrome.tabs.create({url: window.location.href+"?option=seeall"});
				}
			}
		});
	}
	else{
		var mode = regTest[1];
		var modules = ["view"];
		for(var i = 0; i < modules.length; i++)
			$("#"+"main-content"+modules[i]).addClass("fn-hide");
		$("#"+"main-content"+mode).removeClass("fn-hide");	
	}
} 
