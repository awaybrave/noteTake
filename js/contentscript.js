function getTime(){
	var result = "";
	var time = new Date();
	result += time.getFullYear()+"/";
	result += (time.getMonth()+1)+"/";
	result += time.getDate()+"/";
	result += time.getHours()+"/";
	result += time.getMinutes()+"/"
	result += time.getSeconds();
	return result;
}

function currentNoteStorage(){
	var that = {};
	var info = {};
	info.texts = [];

	that.dealInfo = function(obj){
		if(obj.text)
			info.texts.push(obj.text); 
		if(!info.createTime && obj.createTime)
			info.createTime = obj.createTime;
		if(obj.url)
			info.url = obj.url;
	};

	that.clear = function(){
		info.texts = [];	
		info.createTime = undefined;
	};

	that.getText = function(){
		return info.texts;
	};

	that.getTime = function(){
		return info.createTime;
	};

	that.getUrl = function(){
		return info.url;
	}

	return that;
}

function keyWordsGet(){
	var info = {};
	info.done = false;
	info.start = false;
	info.dataKW = [];
	info.undataKW = [];

	var that = {};
	that.isDone = function(){
		return info.done;
	};

	that.isStart = function(){
		return info.start;
	};

	that.requestKeyWords = function(){
		info.start = true;
		var msg = {};
		msg.sender = "content";
		msg.receiver = "background";
		msg.task = "getKeyWords";
		chrome.runtime.sendMessage(msg, 
			function(response){ 
				info.dataKW = response;	
				info.done = true;
			}
		); 

	};

	that.getKeyWords = function(){
		return info.dataKW;
	};

	that.addKeyWords = function(newkw){
		for(var i in newkw){
			info.undataKW.push(newkw[i]);
		}
	};

	return that;
}

var textCapture = currentNoteStorage();
var keyWordsAbout = keyWordsGet();

function enableSelection(event){ 

	var note_edit_form = document.getElementById("note-form");
	var father = event.target.parentNode;
	while(father){
		if(father == note_edit_form)
			return;
		father = father.parentNode;
	}

	var text = window.getSelection().toString();
	if(text){ 
		/*set form data*/
		var popup = new $.Popup();
		//popup.open("../html/form.html", "url");
		var form_html = "<form id='note-form'><p>摘抄：</p>" 
			+ "<ul><li><span>摘抄时间：</span>" 
			+ "<span id='note-form-date'></span></li>"
			+ "<li><p class='note-item-titile'>摘抄内容</p>"
			+ "<div id='note-form-content'></div></li>" 
			+ "<li><a id='note-form-add'>继续添加</a></li>" 
			+ "</ul>"
			+ "<div id='note-form-kw'>"
			+ "<p><label>关键字:<input type='text'/></label></p>"
			+ "</div>"
			+ "<div><a id='note-item-confirm'>确认</a>"
			+ "<a id='note-item-cancel'>取消</a></div>"; 
		popup.open(form_html, "html");
		/*end of setting form data*/

		/*deal with text infomation*/
		var newTextInfo = {};
		newTextInfo.text = text;
		newTextInfo.url = window.location.href;
		if(textCapture.getTime() == undefined)
			newTextInfo.createTime = getTime();
		textCapture.dealInfo(newTextInfo);
		/*end*/

		var note_form_timer = setInterval(function(){
			if($("#note-form").size() > 0){ 
				/*diplay the createTime and all texts that 
				  are already captured and stored.
				*/
				$("#note-form-date").text(textCapture.getTime());
				var storedTexts = textCapture.getText();
				for(var i = 0; i < storedTexts.length; i++){
					$("#note-form-content").append(
						"<div class='note-paragraph'>" + storedTexts[i]+ "</div>"); 
				}
				/*end*/
				/*set the keywords from the background.
				If the keywords are not ready, show the waiting state, 
				otherwise, display all the keywords*/
					
				var waitKeyWords = setInterval(function(){
					if(keyWordsAbout.isDone()){
						var allKeyWords = keyWordsAbout.getKeyWords();
						for(var i = 0; i < allKeyWords.length; i++)
							$("#note-form-kw").append("<span>"+allKeyWords[i]+"</span>");
						clearInterval(waitKeyWords);
					}
				}, 20);

				/*set confirm button clicking to send message 
				to background*/
				$("#note-item-confirm").click(function(){
					var note_msg = {};
					note_msg.sender = "content";
					note_msg.receiver = "background";
					note_msg.task = "addContent";
					note_msg.note = {};
					note_msg.note.content = storedTexts;
					note_msg.note.createTime = textCapture.getTime();
					note_msg.note.url = textCapture.getUrl();
					//未处理关键字
					chrome.runtime.sendMessage(note_msg, 
						function(){ 
							//Clear the textCapture object;
							textCapture.clear();
						}
					); 
					popup.close(); 
					var body = document.getElementsByTagName("body")[0]; 
					body.removeEventListener("mouseup", enableSelection); 
				});
				/*end*/

				/*set the cancel button clicking to close the form
				 and detach the handler of capturing text*/
				$("#note-item-cancel").click(function(){
					textCapture.clear();
					var body = document.getElementsByTagName("body")[0]; 
					body.removeEventListener("mouseup", enableSelection);
					popup.close();	
				});
				/*end*/

				$("#note-form-add").click(function(){
					popup.close();	
				});

				clearInterval(note_form_timer);
			}
		}, 100); 
	}
}

/*main function*/
(function(){ 
	/*add popup Library css and js*/
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse){
			if(request.receiver == 'content'){
				if(request.task == 'start'){
					var flag = confirm("是否开始摘抄？"); 
					if(flag){
						var body = document.getElementsByTagName("body")[0]; 
						/*use event bubbling to capture a mouse behaviour 
						on all dom elements of a page*/
						body.addEventListener("mouseup", enableSelection);
						if(!keyWordsAbout.isStart())
							keyWordsAbout.requestKeyWords();
					}
				}
			}
	}); 
})(); 
