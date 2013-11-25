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

function enableSelection(){ 
	var text = window.getSelection().toString();
	if(text){ 
		/*set form data*/
		var popup = new $.Popup();
		popup.open("../html/form.html", "url");
		var time = getTime();

		var note_form_timer = setTimeout(function(){
			if($("#note-form").size() > 0){ 

				$("#note-form-date").text(time);
				$("#note-form-content").text(text);

				/*set confirm button clicking to send message 
				to background*/
				$("#note-item-confirm").click(function(){
					var note_msg = {};
					note_msg.sender = "content";
					note_msg.receiver = "background";
					note_msg.task = "addContent";
					note_msg.note = {};
					note_msg.note.content = text;
					note_msg.note.createTime = time;
					//未处理关键字
					chrome.runtime.sendMessage(note_msg, 
						function(){}
					); 
					popup.close();
				});
				$("#note-item-cancel").click(function(){
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
