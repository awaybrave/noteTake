var counter = function(){
	var count = 0;
	return function(){
		return count++;
	}
}();

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
		item.notesId = counter();
		os.add(item);	
	};

	return that;
};

/*receive the note message*/
window.onload = function(){
	var db = dataBaseFunction();
	db.open();

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
		if(request.sender == 'content'){
			if(request.task == 'addContent'){
				/*add an item into the notes database*/
				alert(request.content);
				db.addItem({content: request.content});
			}
		}
	});
}
