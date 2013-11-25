function taskAssign(){
	/*Task 1: works as a trigger to start taking notes.*/
	$("#start").bind('click', function(){
		chrome.tabs.query({active: true, currentWindow: true},
			function(tabs){
				var msg = {};
				msg.receiver = 'content';
				msg.task = 'start';
				chrome.tabs.sendMessage(tabs[0].id, msg, null);				
		});

	});

	/*Task 2: Open a tabs to see all of the notes.*/
	$("#link-home").bind('click', function(){
		var msg = {};
		msg.sender = 'extension';
		msg.receiver = 'background';
		msg.task = 'seeall';
		chrome.runtime.sendMessage(msg,
			function(){}
		);
	});
}

$(document).ready(function(){
	taskAssign();
});
