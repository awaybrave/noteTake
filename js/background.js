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

	that.dbName = "note1";
	that.dbVersion = 3;
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
			//create note objectStore;
			var obsNote = that.db.createObjectStore("notes", {keyPath: "notesId", autoIncrement: true});
			obsNote.createIndex("createTime", "createTime", {unique:true});	
			obsNote.createIndex("url", "url");
		};
		if(!localStorage.getItem("kwcount"))
			localStorage.setItem("kwcount", 0);
	}

	that.addItem = function(item){ 
		var transaction = that.db.transaction("notes", "readwrite");
		var os = transaction.objectStore("notes");
		/*set createTime and notesId*/
		var time = new Date();
		item.notesId = getId(time);
		//deal with the key words;
		item.kw = [];
		var i, j;
		var kwcount = parseInt(localStorage.getItem("kwcount"));
		for(i = 0; i < item.canKW.length; i++){
			for(j = 0; j < kwcount; j++){
				var curkw = localStorage.getItem("kw"+j);
				if(item.canKW[i] == curkw){
					item.kw.push(j);
					break;
				}
			}
		}
		for(i = 0; i < item.newKW.length; i++){
			item.kw.push(i+kwcount);		
			localStorage.setItem("kw" + (i+kwcount), item.newKW[i]);
		}
		localStorage.setItem("kwcount", kwcount+i);
		item.kw.sort();
		delete(item.canKW);
		delete(item.newKW);
		os.add(item);	
	};

	
	that.getKeyWords = function(){
		var kwc = localStorage.getItem("kwcount");
		var result = [];
		for(var i = 0; i < kwc; i++){
			result.push(localStorage.getItem("kw"+i));	
		}
		return result;
	}

	that.getAllNotes = function(func){ 
		var os = that.db.transaction("notes").objectStore("notes");
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				func(cursor.key, cursor.value);
				cursor.continue();
			}
		};
	};

	that.getNetwork = function(func){ 
		func(that.getKeyWords()); // sending keywords

		var os = that.db.transaction("notes").objectStore("notes");
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				func(cursor); // sending notes
				cursor.continue();
			}
			else
				func(false);
		};
	};

	return that;
};

var backgroundView = function(){
	var _nwjson = {
		"nodes"	:[],
		"links" :[]
	};
	var _link;
	var _node;
	var index_link_node = {};
	var color  = d3.scale.category20();

	function showAjacentNodes(d, i){
		if(d.type != 0)
			return;
		if(_link){
			_link.style("stroke", function(l){
				if(l.target === d)
					return "#555";
				else
					return "#ddd";
			})
			.style("stroke-opacity", function(l){
				if(l.target === d)
					return 1;
				else
					return 0.6; 
			});
		}
		if(_node){
			_node.style("stroke", function(d, j){
				if(j == i)
					return "#000000";
				if(index_link_node[i + "," + j])
					return "#000000";
				else
					return "#896d67";
			})
		}
	}

	function hideAjacentNodes(d, i){
		if(d.type != 0)
			return;
		if(_link){
			_link.style("stroke", function(l){
				return "#ddd";
			})
			.style("stroke-opacity", function(l){
				return 0.6; 
			});
		} 
		if(_node){
			_node.style("stroke", function(d, j){
				return "#896d67";
			})
		}
	}

	var that = {};

	that.addItemToView = function(key, note){
		var itemBlockString = "<div class='item'><p class='time-id'>"
								+ "<span class='createtime'>"
								+ note.createTime 
								+ "</span>"
								+ "<span class='id fn-hide'>"
								+ key
								+ "</span>"
								+ "</p>"
								+ "<div class='content-paras'>"
		for(var i = 0; i < note.content.length; i++)
			itemBlockString += "<p>" + note.content[i] + "</p>";
		itemBlockString += "</div><p class='url'>来自："
							+ note.url
							+ "</p>"
							+ "</div>";
		$("#main-content-view").append(itemBlockString);
	};
	
	that.pictureNetwork = function(value){
		if(value.constructor == Array){ 
			for(var i = 0; i < value.length; i++){
				var newnode = {
					"name": value[i],
					"type": 0, 
					group: i+1 
				};
				_nwjson.nodes.push(newnode);
			}
		}
		else{
			if(value){
				// if value is an object, then it is a note.
				var newnode = {
					"id": value.key,
					"type": 1,
					"group"	: 0
				}; 
				_nwjson.nodes.push(newnode);
				if(value.value.kw){
					for(var i = 0; i < value.value.kw.length; i++){
						var kwid = value.value.kw[i];
						var newlink = {
							"source": _nwjson.nodes.length-1, // the last node 
							"target": kwid,
							"value": 1
						};
						_nwjson.links.push(newlink);
						index_link_node[newlink.target + "," + newlink.source] = true;
					}
				}
			}
			else{
				//receive an empty object, then start to paint;
				var width = 600,
					height = 400;

				var force = d3.layout.force()
								.charge(-120)
								.linkDistance(30)
								.size([width, height])
								.nodes(_nwjson.nodes)
								.links(_nwjson.links)
								.start();

				var svg = d3.select("#main-content-network").append("svg")
							.attr("width", width)
							.attr("height", height);
				_link = svg.selectAll(".link")
								.data(_nwjson.links)
								.enter().append("line")
								.attr("class", "link");
								//.style("stroke-width", function(d){return Math.sqrt(d.value);});
				_node = svg.selectAll(".node")
								.data(_nwjson.nodes)
								.enter().append("circle")
								.attr("class", "node")
								.attr("r", function(d){return d.type == 0 ? 10 : 5;})
								.style("fill", function(d) {return color(d.group);})
								.call(force.drag);
				_node.append("title")			
					.text(function(d){if(d.name) return d.name; else return d.id});

				
				_node.on("mouseover", showAjacentNodes).on("mouseout", hideAjacentNodes);

				//drawing the keywords index.
				var kw = [];
				for(var i = 0; i < _nwjson.nodes.length; i++){
					if(_nwjson.nodes[i].type != 0)
						break;
					kw.push(_nwjson.nodes[i].name);
				}
				var index_svg = d3.select("#main-content-index").append("svg");
				var kw_index = index_svg.selectAll(".index")
										.data(kw)
										.enter().append("rect")
										.attr("class", "index")
										.attr("width", 20)
										.attr("height", 10)
										.attr("x", function(d, i){return 100*(i%5);})
										.attr("y", function(d, i){return 40*parseInt(i/5);})
										.style("fill", function(d, i){return color(i+1)})
				
				var kw_index_text = index_svg.selectAll(".index_text")
											.data(kw)
											.enter().append("text")
											.attr("width", 20)
											.attr("height", 10)
											.attr("x", function(d, i){return 100*(i%5)+20;})
											.attr("y", function(d, i){return 40*parseInt(i/5)+11;})
											.text(function(d) {return d;});
				
				force.on("tick", function(){
					_link.attr("x1", function(d){return d.source.x;})		
						.attr("y1", function(d){return d.source.y;})	
						.attr("x2", function(d){return d.target.x;})	
						.attr("y2", function(d){return d.target.y;})	
					_node.attr("cx", function(d){return d.x;})
						.attr("cy", function(d){return d.y;});
				});
					}
				}
			};

	return that;
};

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
					if(request.task == 'getKeyWords'){ 
						sendResponse(db.getKeyWords());
					}
				}
				if(request.sender == 'extension'){
					if(request.task == 'general'){
						chrome.tabs.create({url: window.location.href+"?option=general"});
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
			case "general":
				if(!db.db){
					/*waiting for db to be ready.*/
					var timedDB = setInterval(function(){
						if(db.db){
							db.getNetwork(bv.pictureNetwork);
							clearInterval(timedDB);
						}	
					}, 10);
				}
				else
					db.getNetwork(bv.pictureNetwork);
				break;
			case "seeall":
				if(!db.db){
					/*waiting for db to be ready.*/
					var timedDB = setInterval(function(){
						if(db.db){
							db.getAllNotes(bv.addItemToView);
							clearInterval(timedDB);
						}	
					}, 10);
				}
				else
					db.getAllNotes(bv.addItemToView);
				break;
		}
	}
}; 
