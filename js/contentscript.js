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
	};

	that.getText = function(){
		return info.texts;
	};

	that.getTime = function(){
		return info.createTime;
	};

	return that;
}

var textCapture = currentNoteStorage();

function enableSelection(event){ 
	var text = window.getSelection().toString();
	if(text){ 
		/*set form data*/
		var popup = new $.Popup();
		popup.open("../html/form.html", "url");

		/*deal with text infomation*/
		var newTextInfo = {};
		newTextInfo.text = text;
		if(textCapture.getTime() == undefined)
			newTextInfo.createTime = getTime();
		textCapture.dealInfo(newTextInfo);
		/*end*/

		var note_form_timer = setTimeout(function(){
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

				/*set confirm button clicking to send message 
				to background*/
				$("#note-item-confirm").click(function(){
					var note_msg = {};
					note_msg.sender = "content";
					note_msg.receiver = "background";
					note_msg.task = "addContent";
					note_msg.note = {};
					note_msg.note.content = storedTexts;
					note_msg.note.createTime = textCapture.createTime;
					//未处理关键字
					chrome.runtime.sendMessage(note_msg, 
						function(){ 
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
					var body = document.getElementsByTagName("body")[0]; 
					body.removeEventListener("mouseup", enableSelection);
					popup.close();	
				});
				/*end*/

				$("#note-form-add").click(function(){
					popup.close();	
				});

				clearTimeout(note_form_timer);
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
					}
				}
			}
	}); 
})(); 
