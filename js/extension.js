$(document).ready(function(){
	/*determine the open module*/
	var href = window.location.href;
	var reg = /\?option\=(\w+)/;
	var exResult = reg.exec(href);
	var openOption = "popup";
	if(exResult && exResult.length == 2){
		openOption = exResult[1];
	}
	/*end of determination*/
	

	/*hide all the module*/
		$(".module").addClass("fn-hide");
		$("#"+openOption).removeClass("fn-hide");
	/*end of hidden*/


	/*add corresponding event handlers*/
	switch(openOption){
		case "popup":
			$("#link-home").bind("click", function(){
				chrome.tabs.create({url: window.location.href+"?option=collection"});
			}); 
			break;
		case "collection":
		
			break;
	}
	/*end of adding handlers*/
});
