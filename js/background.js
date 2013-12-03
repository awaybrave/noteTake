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
	that.allItemsReady = false;
	that.allItems = [];

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

	that.getItem = function(func, number){ 
		var os = that.db.transaction("notes").objectStore("notes");
		var itemsCount = 0;
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;	
			if(cursor){
				if(itemsCount < number){
					func(cursor.key, cursor.value); 
					itemsCount++;
				}
				else{
					that.allItems.push([cursor.key, cursor.value]);	
				}
				cursor.continue();
			}
			else{
				that.allItemsReady = true;
			}
		};
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
							db.getItem(bv.addItemToView, 5);
							clearTimeout(timedDB);
						}	
					}, 200);
				}
				else
					db.getItem(bv.addItemToView, 5);
				var showEarlyButton = document.getElementById("view-continue");
				showEarlyButton.onclick = function(){
					var doneNum = 0;
					var nextItems = setInterval(function(){
						if(doneNum == 5){
							clearInterval(nextItems);	
							return;
						}
						if(db.allItemsReady){
							if(db.allItems.length == 0){
								// warning of no more earlier notes;
								alert("没有更多笔记了！");
								clearInterval(nextItems);	
								return;
							}
							while(doneNum < 5){
								if(db.allItems.length == 0){
									clearInterval(nextItems);	
									break;
								}
								var currentItem = db.allItems.shift();
								bv.addItemToView(currentItem[0], currentItem[1]);	
								doneNum++;
							}
						}
						else{
							while(doneNum < 5){ 
								if(db.allItems.length == 0)
									break;
								var currentItem = db.allItems.shift();
								bv.addItemToView(currentItem[0], currentItem[1]);	
								doneNum++;
							}
						}
					}, 50);
				};

				break;
		}
	}
} 
