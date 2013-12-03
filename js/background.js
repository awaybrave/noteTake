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

var getId = function(time){
	var result = "";
	//var time = new Date();
	result += time.getFullYear();
	if(time.getMonth() < 9)
		result += '0';
	result += time.getMonth()+1; 
	if(time.getDate() < 9)
		result += '0';
	result += time.getDate();
	if(time.getHours() < 9)
		result += '0';
	result += time.getHours();
	if(time.getMinutes() < 9)
		result += '0';
	result += time.getMinutes();
	if(time.getSeconds() < 9)
		result += '0';
	result += time.getSeconds();
	return result;
};

/*this module deals with indexDB*/
var dataBaseFunction = function(){
	var that = {}; 

	that.dbName = "note";
	that.dbVersion = 1;

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
			that.objectStore = that.db.createObjectStore("notes", {keyPath: "notesId"});
			that.objectStore.createIndex("content", "content", {unique:false});	
			that.objectStore.createIndex("createTime", "createTime", {unique:true});	
			that.objectStore.createIndex("url", "url");
		};
	}

	that.addItem = function(item){ 
		var transaction = that.db.transaction("notes", "readwrite");
		var os = transaction.objectStore("notes");
		/*set createTime and notesId*/
		var time = new Date();
		item.notesId = getId(time);
		os.add(item);	
	};

	that.getItem = function(number, func){ 
		var itemset = [];
		var getComplete = false; 
		var startItem = undefined;
		that.upperTime = undefined;

		//get the first note to be the mark of 
		//the finish of digging all notes.
		var waitForStartItem = setInterval(function(){
			var objectStore = that.db.transaction("notes").objectStore("notes"); 
			objectStore.openCursor().onsuccess = function(event){ 
				var cursor = event.target.result;	
				if(cursor){
					startItem = cursor.value;
				}
				else{
					startItem = null;
				}
				clearTimeout(waitForStartItem);
			}
		}, 20);

		var waitForItems = setInterval(function(){
			if(startItem === undefined)
				return;
			if(startItem === null || getComplete){ 
				var isize = itemset.length;
				if(isize == 0)
					alert("no notes!");
				//arrange the items by their id
				for(var i = 0; i < number && i < itemset.length; i++)
					func(itemset[isize-i-1][0], itemset[isize-i-1][1]); 
				clearInterval(waitForItems);
				//deal with the remaining items and reset the time bound
			}
			else{ 
				if(that.upperTime == undefined){
					var currentTime = new Date(); 
					that.upperTime = new Date();
					that.lastTime = new Date(
						currentTime.setDate(currentTime.getDate()-1)
					); 
				}
				else{
					var tempTime = new Date(that.upperTime);
					that.lastTime = new Date(
						tempTime.setDate(tempTime.getDate()-1)
					);	
				}
				var lowerId = getId(that.lastTime); // get current id used as timestamp line
				var upperId = getId(that.upperTime);
				var boundRange = IDBKeyRange.bound(lowerId, upperId);
				var objectStore = that.db.transaction("notes").objectStore("notes"); 
				objectStore.openCursor(boundRange).onsuccess = function(event){ 
					var cursor = event.target.result;	
					if(cursor){
						itemset.push([cursor.key, cursor.value]);
						if(itemset.length >= number || 
							startItem && startItem.notesId == cursor.value.notesId
						  ){
							getComplete = true;
							that.upperTime = that.lastTime;
							return;
						}
						cursor.continue();
					}
					else{
						if(itemset.length >= number)
							getComplete = true; 
						that.upperTime = that.lastTime;
					}
				};
			}
		}, 50); 
	};

	return that;
};

var backgroundView = function(){
	var that = {};

	that.addItemToView = function(key, note){
		var itemBlock = document.getElementsByClassName("item")[0];
		var cloneBlock = itemBlock.cloneNode(true);
		itemBlock.parentNode.appendChild(cloneBlock);
		var ctBlock = cloneBlock.getElementsByClassName("createtime")[0];
		ctBlock.innerHTML = note.createTime;//setting create time
		var idBlock = cloneBlock.getElementsByClassName("id")[0];
		idBlock.innerHTML = key; // setting id
		var contentAllBlock = cloneBlock.getElementsByClassName("content-paras")[0];
		//filling paragraphs from content
		for(var i in note.content){
			var contentBlock = document.createElement("div");
			contentBlock.className = "view-content";
			contentBlock.innerHTML = note.content[i];
			contentAllBlock.appendChild(contentBlock);
		}
		var urlBlock = cloneBlock.getElementsByClassName("url")[0];
		urlBlock.innerHTML = "来自:" + note.url; // setting source url
	}

	return that;
}

window.onload = function(){

	/*delete the database
	indexedDB.deleteDatabase("note");
	*/	

	var db = dataBaseFunction();
	db.open();
	var bv = backgroundView(); 

	/*determine working mode*/
	var url = window.location.href;
	var reg = /\?\w+=(\w+)/;
	var regTest = reg.exec(url);
	if(!regTest){ 
		/*no explicit mode: do the database stuff and listen to the messages*/
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
			if(request.receiver == 'background'){
				if(request.sender == 'content'){
					if(request.task == 'addContent'){
						/*add an item into the notes database*/
						db.addItem(request.note);
						sendResponse({result: true});		
					}
				}
				if(request.sender == 'extension'){
					if(request.task == 'seeall'){
						chrome.tabs.create({url: window.location.href+"?option=seeall"});
					}
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

		switch(mode){
			case "seeall":
				if(!db.db){
					/*waiting for db to be ready.*/
					var timedDB = setTimeout(function(){
						if(db.db){
							// get the first 5 items
							db.getItem(15, bv.addItemToView);
							clearTimeout(timedDB);
						}	
					}, 200);
				}
				else
					db.getItem(bv.addItemToView)
				break;
		}
	}
} 
