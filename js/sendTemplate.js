String.prototype.trim = function () {
	var reExtraSpace = /^\s+(.*?)\s+$/;
	return this.replace(reExtraSpace, "$1");
};
var script = document.getElementsByTagName("script");
var template = {};
for(var i = 0; i < script.length; i++){
	if(script[i].getAttribute("type") == "template"
		&& script[i].id)
	{
		template[script[i].id] = script[i].innerHTML;			
		template[script[i].id].trim();			
	}
}
parent.postMessage(template, "*");
