/*
 该脚本参照了官网simple cases中的page action例子。
 */

/*main function*/
(function(){

	/*use event bubbling to capture a mouse behaviour 
	on all dom elements of a page*/
	var body = document.getElementsByTagName("body")[0];
	body.onmouseup = function(){
		var text = window.getSelection().toString();
		if(text){
			/*send note content to the extension*/
			chrome.runtime.sendMessage({content:text}, function(response){
				alert(response.result);
			});
		}
	};
	
})();

