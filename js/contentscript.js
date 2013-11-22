/*
 该脚本参照了官网simple cases中的page action例子。
 */ 
function enableSelection(){ 
	/*use event bubbling to capture a mouse behaviour 
	on all dom elements of a page*/
	var text = window.getSelection().toString();
	if(text){
		//alert(text);
		var note_msg = {};
		note_msg.sender = 'content';
		note_msg.receiver = 'background';
		note_msg.task = 'addContent';
		note_msg.content = text;
		chrome.runtime.sendMessage(note_msg, 
			function(){}
		);
	}
}

/*main function*/
(function(){ 
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse){
			if(request.receiver == 'content'){
				if(request.task == 'start'){
					var flag = confirm("是否开始摘抄？"); 
					if(flag){
						var body = document.getElementsByTagName("body")[0]; 
						body.addEventListener("mouseup", enableSelection);
					}
				}
			}
	});
})();

