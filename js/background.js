var helper = {
	"getId": function(time){
		time = time || new Date();
		var result = "";
		result += time.getFullYear();
		if(time.getMonth() < 9)
			result += '0';
		result += time.getMonth()+1; 
		if(time.getDate() <= 9)
			result += '0';
		result += time.getDate();
		if(time.getHours() <= 9)
			result += '0';
		result += time.getHours();
		if(time.getMinutes() <= 9)
			result += '0';
		result += time.getMinutes();
		if(time.getSeconds() <= 9)
			result += '0';
		result += time.getSeconds();
		return result;
	},

	"getTime": function(){
		var result = "";
		var time = new Date();
		result += time.getFullYear();
		result += '/';
		if(time.getMonth() < 9)
			result += '0';
		result += time.getMonth()+1; 
		result += '/';
		if(time.getDate() < 9)
			result += '0';
		result += time.getDate();
		result += '/';
		if(time.getHours() < 9)
			result += '0';
		result += time.getHours();
		result += '/';
		if(time.getMinutes() < 9)
			result += '0';
		result += time.getMinutes();
		result += '/';
		if(time.getSeconds() < 9)
			result += '0';
		result += time.getSeconds();
		return result; 
	},

	/*
	"IdToTime": function(id){
		var result = "";
		var postFix = ["年", "月", "日", "时", "分"];
		return result;	
	},
	*/

	"isSubNode": function(parentNode, node){
		while(node && node.parentNode != parentNode)
			node = node.parentNode;
		return node ? true : false;
	},

	"fillCalendar": function(selector, date){
		var grids = $(selector + " tbody tr td");
		var first = new Date(date);
		first.setDate(1);
		var start = first.getDay();
		var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		var month_day = months[first.getMonth()];
		var year, i;
		if(first.getMonth() == 1){
			year = first.getFullYear();	
			if(year % 400 == 0 || year / 4 == 0)	
				month_day++;
		}
		if(first.getMonth() < 9)
			$(selector + " caption span").text(date.getFullYear() 
					+ "/" + "0" + (date.getMonth() + 1));
		else
			$(selector + " caption span").text(date.getFullYear() 
					+ "/" + (date.getMonth() + 1));
		for(i = 0; i < month_day; i++){
			$(grids[start+i]).empty(); 
			$(grids[start+i]).append("<span class='date'>" + (i+1) + '</span>');
		}
	},
	"fixMonthsInfo": function(monthInfo){
		if(monthInfo.length > 12)
			return monthInfo.slice(-12);
		else{
			var result = [];
			var current = new Date();
			var cursor = monthInfo.length-1;
			for(var i = 0; i < 6 || cursor >= 0; i++){
				var id = current.getFullYear() + "/" + (current.getMonth()+1);
				if(cursor >= 0 && monthInfo[cursor].month == id){
					result.push(monthInfo[cursor]);
					cursor--; 
				}
				else{
					result.push({
						"month": id,
						"total": 0
					});
				}
				current.setMonth(current.getMonth()-1);
			}
		}
		result.reverse();
		return result;
	}
};

/*this module deals with message listening*/
var TemplateLoader = function(templatePath, func){
	/*init*/
	return function(){
		//get Template
		window.addEventListener("message", function(event){
			var iframe = document.getElementById("templateIframe");
			iframe.parentNode.removeChild(iframe);
			func(event.data);
		}); 
		var iframe = document.createElement("iframe");
		iframe.id = "templateIframe";
		iframe.src = templatePath;
		document.body.appendChild(iframe); 
	};
};

/*this module deals with indexDB*/
var dataBaseFunction = function(){
	var that = {}; 

	var dbName = "note1";
	var dbVersion = 4;
	var kwToNotes = [];
	var last = null;
	var db; 
	that.allItems = [];
	that.kwToNotesDone = false;

	function isFoundInKeyword(list, target){
		var head = 0, tail = list.length-1;
		var mid;
		while(head < tail){
			mid = parseInt((head+tail)/2);
			if(target <= list[mid])
				tail = mid;
			else
				head = mid + 1;
		}
		if(head == tail) return list[head] == target ? true : false;
		else
			return false; 
	};
	that.ready = function(callback){
		that.request = indexedDB.open(dbName, dbVersion);

		that.request.onerror = function(event){
			alert("error: " + event.target.errorCode);
		};

		that.request.onsuccess = function(event){
			db = that.request.result;
			callback();
		};

		that.request.onupgradeneeded = function(event){
			db = event.target.result;
			//create note objectStore;
			var obsNote = db.createObjectStore("notes", {keyPath: "notesId", autoIncrement: true});
			obsNote.createIndex("createTime", "createTime", {unique:true});	
			obsNote.createIndex("url", "url");

			var obsCreateTime = db.createObjectStore("monthTotal", {keyPath: "timeId"});
		};

		if(!localStorage.getItem("kwcount"))
			localStorage.setItem("kwcount", 0);
	};

	that.addItem = function(item){ 
		//Manipulate objectStore "notes" and "monthTotal".
		var transaction = db.transaction("notes", "readwrite");
		
		//Storing the note information including 
		//create time, url and corresponding key words.
		var os = transaction.objectStore("notes");
		/*set createTime and notesId*/
		var time = new Date();
		item.notesId = helper.getId(time);
		item.createTime = helper.getTime();
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
		// end of storing note information.

		// adding the value of objectStore "monthTotal"
		transaction = db.transaction("monthTotal", "readwrite");
		os = transaction.objectStore("monthTotal");
		var currentMonth = time.getFullYear() + "/" + (time.getMonth()+1);
		var request = os.get(currentMonth);
		request.onerror = function(){
			//alert("error");
		};
		request.onsuccess = function(){
			if(request.result){
				var data = request.result;
				data.value = data.value+1;
				os.put(data);
			}
			else
				os.add({"timeId": currentMonth, "value": 1}); 
		};
		// end of adding.
	};

	that.updateNote = function(noteId, noteContent){ 
		var os = db.transaction("notes", "readwrite").objectStore("notes");
		var request = os.get(noteId);
		request.onsuccess = function(event){
			var result = request.result;
			result.comment = noteContent["comment"];
			var requestUpdate = os.put(result);
		}
	};
	that.getKeyWords = function(){
		var kwc = localStorage.getItem("kwcount");
		var result = [];
		for(var i = 0; i < kwc; i++){
			result.push(localStorage.getItem("kw"+i));	
		}
		return result;
	}

	that.getNoteById = function(id, func){ 
		var os = db.transaction("notes").objectStore("notes");
		var request = os.get(id);
		request.onsuccess = function(event){
			func(request.result);
		}
	};

	that.getAllNotes = function(func, selector, template){ 
		var os = db.transaction("notes").objectStore("notes");
		var count = 0;
		var currentBound;
		if(!last) 
			currentBound = IDBKeyRange.upperBound(helper.getId(new Date())); 
		else
			currentBound = IDBKeyRange.upperBound(last.notesId, true);
		os.openCursor(currentBound, "prev").onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor && count < 5){
				func(selector, cursor.value, template);
				last = cursor.value;
				count++;
				cursor.continue();
			}
			if(!cursor)
				func("#sub-content-continue", null, null);
		};
	};

	that.getNetwork = function(func){ 
		func(that.getKeyWords()); // sending keywords

		var os = db.transaction("notes").objectStore("notes");
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

	that.getMonthTotal = function(func){
		var monthTotal = [];
		var os = db.transaction("monthTotal").objectStore("monthTotal");
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				monthTotal.push({"month": cursor.key, "total": cursor.value.value});
				cursor.continue();
			}
			else
				func(monthTotal);
		};
	};

	that.getNotesAndKeywords = function(){
		kwToNotes = [];
		var os = db.transaction("notes").objectStore("notes");
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				for(var i = 0; i < cursor.value.kw.length; i++){
					if(kwToNotes[cursor.value.kw[i]] == undefined)
						kwToNotes[cursor.value.kw[i]] = [];
					kwToNotes[cursor.value.kw[i]].push(cursor.key);
				}
				cursor.continue();
			}
			else
				that.kwToNotesDone = true;
		}; 
	};

	that.getKeywordsSearchResult = function(func, chosen, selector, template){
		var i, j;
		var flag;
		var request;
		var os = db.transaction("notes").objectStore("notes");
		if(chosen){
			for(i = 0; i < kwToNotes[chosen[0]].length; i++){
				flag = true;
				for(j = 1; j < chosen.length; j++){
					if(!isFoundInKeyword(kwToNotes[chosen[j]], kwToNotes[chosen[0]][i])){
						flag = false;
						break;
					}
				}
				if(flag){
					request = os.get(kwToNotes[chosen[0]][i])
							  .onsuccess = function(event){
								  func(selector, event.target.result, template);
					};
				}
			}
		}
	};

	that.getTimeSearchResult = function(func, start, end, selector, template){ 
		var os = db.transaction("notes").objectStore("notes");
		var boundKeyRange = IDBKeyRange.bound(start, end);
		os.openCursor(boundKeyRange).onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				func(selector, event.target.result.value, template);
				cursor.continue();
			}
		};
	};

	that.getContentSearchResult = function(func, contentArray, selector, template){
		var os = db.transaction("notes").objectStore("notes"); 
		os.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if(cursor){
				var flag = false;
				var targetContent = cursor.value.content;
				for(var j = 0; j < targetContent.length; j++){
					for(var i = 0; i < contentArray.length; i++){
						if(!contentArray[i])
							continue;
						var regTest = new RegExp("(" + contentArray[i] + ")", "g");
						if(regTest.test(targetContent[j])){
							targetContent[j] = targetContent[j].replace(regTest, "<span class='emph'>" + "$1" + "</span>");
							flag = true;
						}
					}
				}
				cursor.value = targetContent;
				if(flag){
					func(selector, cursor.value, template);
				}
				cursor.continue();
			} 
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
	
	function TemplateEngine(html, options){
		var re = /<%([^%>]+)?%>/g, 
			reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, 
			code = 'var r=[];\n', 
			cursor = 0;
		var add = function(line, js) {
			js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
			(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
			return add;
		};
		while(match = re.exec(html)) {
			add(html.slice(cursor, match.index))(match[1], true);
			cursor = match.index + match[0].length;
		}
		add(html.substr(cursor, html.length - cursor));
		code += 'return r.join("");';
		return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
	}

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

	that.addItemToView = function(selector, note, template){
		if(note){
			var result = TemplateEngine(template.note, note);
			$(selector).append(result);
		}
		else{
			$(selector).remove();
		}
	};
	
	that.pictureMonthTotal = function(months){
		var list = [];
		var max = 0;
		months = helper.fixMonthsInfo(months);
		for(var i = 0; i < months.length; i++){
			list.push(months[i].month);
			if(max < months[i].total)
				max = months[i].total;
		}

		var margin = {top: 20, right: 30, bottom: 30, left: 40},
			width = 600 - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom;

		var x = d3.scale.ordinal()
			.domain(list)
			.rangeRoundBands([0, width], 0.1);

		var y = d3.scale.linear()
			.domain([0, max])
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");
			//.ticks(10, "%");

		var chart = d3.select("#sub-content-month").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		chart.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("数量");

		chart.selectAll(".bar")
			.data(months)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d){return x(d.month);})
			.attr("y", function(d){return y(d.total);})
			.attr("height", function(d){return height - y(d.total);})
			.attr("width", x.rangeBand()); 
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

				var svg = d3.select("#sub-content-network").append("svg")
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
				var index_svg = d3.select("#sub-content-index").append("svg")
								.attr("width", width)
								.attr("height", height);
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

	that.listKeywords = function(container, keywords, template){
		var kw_index = [];
		for(var i = 0; i < keywords.length; i++)
			kw_index.push({"index": i, "word": keywords[i]});
		function sortkw(kw1, kw2){
			return kw1.word < kw2.word;
		}
		kw_index.sort(sortkw);
		var result = TemplateEngine(template.keywords, kw_index);
		$(container).append(result);
	};

	that.addChosenWords = function(container, chosen, template){
		var title = TemplateEngine(template.title, chosen);
		$(container).append(title);
	};

	that.openViewForm = function(data){
		$(".note-content").empty();
		$(".note-comment").empty();
		$("#note-kw-show").empty();
		var content = data.content;
		var comment = data.comment;
		var kw = data.kw;
		if(content){
			for(var i = 0; i < content.length; i++)
				$(".note-content").append("<p>" + content[i] + "</p>");
		}
		if(comment){
			for(var i = 0; i < comment.length; i++){
				$(".note-comment").append("<div class='commentBlock'>" + "<p class='del'>&times;</p>" + "<p class='each-comment'>" + comment[i] + "</p>" + "</div>");
			}
		}
		else{
			$(".note-comment").append("暂时没有评注");
		}
		if(kw){
			for(var i = 0; i < kw.length; i++){
				var kw_name = localStorage.getItem("kw"+kw[i]);
				$("#note-kw-show").append("<span>" + kw_name + "</span>");
			}
		}
		$("#edit-note-form").modal({"backdrop": "static"});
	};
	
	that.addComment = function(comment){
		if($(".note-comment").text() == "暂时没有评注"){
			$(".note-comment").empty();
		}
		$(".note-comment").append("<div class='commentBlock'>" + "<p class='del'>&times;</p>" + "<p class='each-comment'>" + comment + "</p>" + "</div>");
	};
	that.clearView = function(selector){
		$(selector).empty();
	};

	return that;
};

var EventManager = function(){
	var that = {}; 

	function addCommentHandler(){
		var new_com = $("#com-input").val();
		if(new_com){
			bv.addComment(new_com);
			$("#com-input").val("");
		} 
	}

	function noteSaveHandler(e){
		var comment = [];
		var commentBlocks = $(".each-comment");
		for(var i = 0; i < commentBlocks.length; i++){ 
			comment.push(commentBlocks[i].innerHTML);	
		}
		db.updateNote(e.data.noteId, {"comment": comment});
	}

	//Use event bubble to bind event for
	//future elements.
	that.bindEditNote = function(container){
		$(container).click(function(e){
			if(e.target.className == "view-text"){
				var id = e.target.getAttribute("noteId");
				db.getNoteById(id, bv.openViewForm);
				$(".add-com-btn").bind("click", addCommentHandler);
				$("#note-save").bind("click", {"noteId": id}, noteSaveHandler);
				$(".del").bind("click", function(event){
					event.target.parentNode.removeChild(event.target);
				});
			}
		});
		$("#edit-note-form").on("hidden.bs.modal", function(e){
			addComment = [];
			$(".add-com-btn").unbind("click", addCommentHandler);
			$("#note-save").unbind("click", noteSaveHandler); 
		});
	};

	return that;
};

var db = dataBaseFunction();
var bv = backgroundView(); 
var em = EventManager();

/*delete the database
indexedDB.deleteDatabase("note");
*/	
db.ready(function(){
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
		
		var base_url = window.location.href;
		base_url = base_url.substr(0, base_url.indexOf("?"));
		var navigation_link = $(".navigation a");
		for(var i = 0; i < navigation_link.size(); i++){
			var option = $(navigation_link[i]).attr("option");
			if(option)
				$(navigation_link[i]).attr("href", base_url+"?option="+option);
			if(option == regTest[1])
				$(navigation_link[i]).addClass("current-mode");
		}

		var mode = regTest[1];
		var modules = ["general", "searchtime", "searchwords", "searchcontent", "seeall"];
		for(var i = 0; i < modules.length; i++)
			$("#"+"main-content-"+modules[i]).addClass("fn-hide");
		$("#"+"main-content-"+mode).removeClass("fn-hide");	

		switch(mode){
			case "general":
				db.getMonthTotal(bv.pictureMonthTotal);
				db.getNetwork(bv.pictureNetwork);
				clearInterval(timedDB);
				break;

			case "seeall":
				var loadTemplate = TemplateLoader("../html/note.html", function(template){
					em.bindEditNote("#sub-content-items");
					db.getAllNotes(bv.addItemToView, "#sub-content-items", template);
					$("#sub-content-continue").click(function(){
						db.getAllNotes(bv.addItemToView, "#sub-content-items", template);	
					}); 
				})();
				break;

			case "searchwords":
				var loadTemplate = TemplateLoader("../html/searchwords.html", function(template){
					em.bindEditNote("#sub-content-wresult");
					var keywords = db.getKeyWords();
					bv.listKeywords("#sub-content-words", keywords, template); 
					db.getNotesAndKeywords();
					$(".keywords").click(function(){
						bv.clearView("#sub-content-wresult");
						//select keywords
						if($(this).hasClass("keywords-chosen")) 
							$(this).removeClass("keywords-chosen");
					else
							$(this).addClass("keywords-chosen");
					});
					$("#fn-searchwords").click(function(){
						bv.clearView("#sub-content-wresult");
						bv.clearView("#sub-content-cwords");

						var chosen = [];	
						var chosenContent = [];
						var index;
						var chosenItem = $(".keywords-chosen");	
						for(var i = 0; i < chosenItem.length; i++){
							index = parseInt($(chosenItem[i]).next().text(), 10);
							chosen.push(index);
							chosenContent.push(chosenItem[i].innerHTML);
							$(chosenItem[i]).removeClass("keywords-chosen");
						} 
						bv.addChosenWords("#sub-content-cwords", chosenContent, template);
						var timedkn = setInterval(function(){
							if(db.kwToNotesDone){
								db.getKeywordsSearchResult(bv.addItemToView, 
									chosen, "#sub-content-wresult", template
								);
								clearInterval(timedkn);
							}
						}, 10);
					}); 
				})(); 
				break;

			case "searchtime":
				var loadTemplate = TemplateLoader("../html/note.html", function(template){
					em.bindEditNote("#sub-content-result");
					$("#searchtime-method-options").click(function(){
						$("#precise-time").removeClass("fn-hide");
						$("#searchtime-options").removeClass("fn-hide");
						$($(".searchtime-method")[1]).removeClass("searchtime-method-select");
						$($(".searchtime-method")[0]).addClass("searchtime-method-select");
						$("#searchtime-precise").addClass("fn-hide");
					});
					$("#searchtime-method-precise").click(function(){
						$("#searchtime-options").addClass("fn-hide");
						$("#searchtime-precise").removeClass("fn-hide");
						$($(".searchtime-method")[0]).removeClass("searchtime-method-select");
						$($(".searchtime-method")[1]).addClass("searchtime-method-select");
					});
					$("body").click(function(event){
						var ct = event.target;
						var input1 = document.getElementById("start-input-input");
						var input2 = document.getElementById("end-input-input");
						var c1 = document.getElementById("start-calendar");
						var c2 = document.getElementById("end-calendar");
						if(ct != input1 && ct != input2
							&& !helper.isSubNode(c1, ct) 
							&& !helper.isSubNode(c2, ct)
						){
							$(c1).addClass("fn-hide");
							$(c2).addClass("fn-hide"); 
						}
						if(ct == input1){
							$(c1).removeClass("fn-hide");
							$(c2).addClass("fn-hide");
						}
						if(ct == input2){
							$(c2).removeClass("fn-hide");
							$(c1).addClass("fn-hide");
						}
						//if(helper.isSubNode(c1, ct))
					});
					
					//filling with and setting event of calendar
					var cal_time = new Date();
					var start_time = new Date(cal_time);
					var end_time = new Date(cal_time);
					var i;
					for(i = 0; i < 6; i++){
						$("#start-calendar tbody").append("<tr>");
						$("#end-calendar tbody").append("<tr>");
					}
					for(i = 0; i < 7; i++){ 
						$("#start-calendar tbody tr").append("<td>");
						$("#end-calendar tbody tr").append("<td>");
					}
					helper.fillCalendar("#start-calendar", cal_time);
					helper.fillCalendar("#end-calendar", cal_time);
					$("#start-pre-m").click(function(){
						helper.fillCalendar("#start-calendar", 
							new Date(start_time.setMonth(start_time.getMonth()-1))
						); 
					});
					$("#start-next-m").click(function(){
						helper.fillCalendar("#start-calendar", 
							new Date(start_time.setMonth(start_time.getMonth()+1))
						); 
					});
					$("#end-pre-m").click(function(){
						helper.fillCalendar("#end-calendar", 
							new Date(end_time.setMonth(end_time.getMonth()-1))
						); 
					});
					$("#end-next-m").click(function(){
						helper.fillCalendar("#end-calendar", 
							new Date(end_time.setMonth(end_time.getMonth()+1))
						); 
					});
					$("#start-calendar td").click(function(event){
						var temp = $(this).text();
						if(temp){
							if(temp.length == 1)
								temp = "0" + temp;
							var start_date = $("#start-month").text() + "/" + temp;
							$("#start-input-input").val(start_date);
						}
						$("#start-calendar").addClass("fn-hide");
					});
					$("#end-calendar td").click(function(event){
						var temp = $(this).text();
						if(temp){
							if(temp.length == 1)
								temp = "0" + temp;
							var end_date = $("#end-month").text() + "/" + temp;
							$("#end-input-input").val(end_date);
						}
						$("#end-calendar").addClass("fn-hide");
					});
					//end of setting calendar

					$("#searchtime-enter").click(function(){
						var start, end, temp;
						bv.clearView("#sub-content-result");
						if($("#searchtime-options").hasClass("fn-hide")){ 
							var period = $("#precise-time").find("input");
							start = (period[0].value).replace(/\//g, "") + "000000"; 
							end = (period[1].value).replace(/\//g, "") + "235959"; 
						}
						else{
							var options = $("#searchtime-options").find("input");
							var i;
							var current = new Date();

							//current = new Date(current.setHours(0)); // to test hour 0
							
							for(i = 0; i < options.length; i++){
								if(options[i].checked){
									switch (options[i].value){
										case "24":
											temp = current.getHours();
											end = helper.getId(current);
											start = helper.getId(new Date(current.setHours(temp-1)));
											break;
										case "1":
											temp = current.getDate();
											end = helper.getId(current);
											start = helper.getId(new Date(current.setHours(0)));
											break;
										case "7":
											temp = current.getDate();
											end = helper.getId(current);
											start = helper.getId(new Date(current.setDate(temp-7)));
											break;
										case "30":
											temp = current.getMonth();
											end = helper.getId(current);
											start = helper.getId(new Date(current.setMonth(temp-1)));
											break;
									}
									break;
								}
							}
						} 
						db.getTimeSearchResult(bv.addItemToView, start, end, "#sub-content-result", template);
					});
				})();
				break;

			case "searchcontent":
				var loadTemplate = TemplateLoader("../html/note.html", function(template){
					em.bindEditNote("#sub-content-cresult");
					$("#search-content-enter").click(function(){
						var content = $("#search-content-input").val();
						if(!content){
							alert("搜索内容不能为空！");
						}
						else{
							content = content.trim();
							var subcontent = content.split(" ");
							$("#sub-content-cresult").empty();
							db.getContentSearchResult(bv.addItemToView, subcontent, "#sub-content-cresult", template);
						}
					});
				})();
				break;	
		}
	}
	
});

