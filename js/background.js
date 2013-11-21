/*receive the note message*/
window.onload = function(){
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log(sender.tab ?
			  "from a content script:" + sender.tab.url :
			  "from the extension");
			sendResponse({result: "from background goodbye"});
			chrome.tabs.create({url: window.location.href+"?option=collection"});
	});
}
