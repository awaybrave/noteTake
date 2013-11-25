function sendMsg(receiver, message, func){
	if(receiver == 'content'){
		chrome.tabs.query({active: true, currentWindow: true},
			function(tabs){
				chrome.tabs.sendMessage(tabs[0].id, message, func);
		});
	}
	if(receiver == 'background' || receiver == 'extension'){
		chrome.runtime.sendMessage(message,func);
	}
}

function setReceiveMsg(func){
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse){
			var result = func(request, sender);
	});
}
