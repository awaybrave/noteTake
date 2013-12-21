function gbclear(){
	for(var i = 0; i < arguments.length; i++){
		arguments[i].clear();
	}
};

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

	that.deleteText = function(num){
		if(num < info.texts.length){
			info.texts[num] = undefined; 
		}
	};

	that.getText = function(){
		var count = 0;
		for(var i = 0; i < info.texts.length; i++){
			if(info.texts[i] != undefined)
				info.texts[count++] = info.texts[i];
		}
		info.texts.splice(count);//delete the undefine elements;
		return info.texts;
	};

	that.getTime = function(){
		return info.createTime;
	};

	that.getUrl = function(){
		return info.url;
	};

	that.clear = function(){
		info.texts = [];	
		info.createTime = undefined;
	};

	return that;
}

function keyWordsGet(){
	var info = {};
	info.done = false;
	info.start = false;
	info.dataKW = [];  // store all the keywords from bg;
	info.undataKW = []; // store the new adding keywords
	info.cankw = []; // store all the chosen kw from bg;

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

	that.getSimilarKW = function(word){
		var result = [];
		for(var i = 0; i < info.dataKW.length; i++){
			if(info.dataKW[i].substr(0, word.length) == word)
				result.push(info.dataKW[i]);
		}
		return result;
	};

	that.getCanKeyWords = function(){
		return info.cankw;
	};

	that.getNewKeyWords = function(){
		return info.undataKW;
	};

	that.addKeyWords = function(newkw){
		var i, j;
		for(i = 0; i < info.dataKW.length; i++){
			if(info.dataKW[i] == newkw){
				for(j = 0; j < info.cankw.length; j++){
					if(info.cankw[j] == newkw)
						return false;
				}
				info.cankw.push(newkw);
				return true;
			}
		}
		for(i = 0; i < info.undataKW.length; i++){
			if(info.undataKW[i] == newkw)
				return false;
		}
		info.undataKW.push(newkw);
		return true;
	};

	that.addNewToData = function(){
		for(var i = 0; i < info.undataKW.length; i++)
			info.dataKW.push(info.undataKW[i]);
	};

	that.deleteKW = function(kw){
		var i;
		for(i = 0; i < info.undataKW.length; i++){
			if(kw == info.undataKW[i]){
				info.undataKW.splice(i, 1);
				return;
			} 
		}
		for(i = 0; i <info.cankw.length; i++){
			if(kw == info.cankw[i]){
				info.cankw.splice(i,1);	
				return;
			}
		}
	};

	that.clear = function(){
		info.cankw = [];
		info.undataKW = [];
	};

	return that;
}

var textCapture = currentNoteStorage();
var keyWordsAbout = keyWordsGet();

function enableSelection(event){ 

	var note_edit_form = document.getElementById("kwj-note-form");
	var father = event.target.parentNode;
	while(father){
		if(father == note_edit_form)
			return;
		father = father.parentNode;
	}

	var text = window.getSelection().toString();
	if(text){ 
		/*set form data*/
		var block = "<div class='modal fade' id='kwj-note-form'"
			+ "tabindex='-1' aria-hidden='true' role='dialog' aria-labelledby='myModalLabel'>"
			+ "<div class='modal-dialog'><div class='modal-content' style='padding: 20px; text-align: left;'>"
			+ "<div class='modal-header'>"
			+ "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>"
			+ "<h3 class='modal-title' id='myModalLabel' style='color:black;'>编辑摘抄<h3>"
			+ "</div>"
			+ "<div class='modal-body'>"
			+ "<div id='note-form'>" 
			+ "<div id='createtime' style='color:#BF00FF;'><span>摘抄时间：</span>" 
			+ "<span id='note-form-date'></span></div>"
			+ "<div style='border-bottom: 2px solid #ddd;'>"
			+ "<h4 style='color: #FA5858; line-height: 18px;'>摘抄内容</h4>"
			+ "<div id='note-form-content' style='margin: 10px;'></div>"
			+ "</div>" 
			+ "<div id='note-form-kw' style='border-bottom: 2px solid #ddd;'>"
			+ "<h4 style='color: #FA5858; line-height: 18px;'>关键字</h4>" 
			+ "<label>输入<input type='text' id='nt-kw-in'/></label>"
			+ "<button>添加</button>"
			+ "<div id='note-chosen-kw'>已选择：</div>"
			+ "<div id='note-can-kw'>已有： </div>"
			+ "</div>"
			+ "<div id='note-button'>"
			+ "<a id='note-item-confirm'>确认</a>"
			+ "<a id='note-form-add'>继续添加</a>" 
			+ "<a id='note-item-cancel'>取消</a></div>"
			+ "</div></div>"; 
			+ "<div class='modal-footer'>"
			+ "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>"
			+ "<button type='button' class='btn btn-primary'>Save changes</button>"
			+ "</div></div></div></div>";
		if($("#kwj-note-form").size() == 0)
			$("body").append(block);
		$("#kwj-note-form").modal({"backdrop" : "static"});
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
						"<div class='note-paragraph'><p style='margin: 0 5px;'>" 
						+ storedTexts[i] 
						+ "<div class='note-par-del fn-hide' style='font-size: 10px; color: red; margin: 3px;'>删除</div>"
						+ "</p></div>"); 
				}
				var delBtn = document.getElementsByClassName("note-par-del");
				for(var i = 0; i < delBtn.length; i++){
					delBtn[i].onclick = function(num){
						return function(){
							textCapture.deleteText(num);	
							var delNode = this.parentNode;
							delNode.parentNode.removeChild(delNode);
						};
					}(i);
				}
				$(".note-paragraph").mouseover(function(){
					$(this).children(".note-par-del").removeClass("fn-hide");
				});
				$(".note-paragraph").mouseout(function(){
					$(this).children(".note-par-del").addClass("fn-hide"); 
				}); 
				/*end*/

				/*set the keywords from the background.
				If the keywords are not ready, show the waiting state, 
				otherwise, display all the keywords*/ 
				var waitKeyWords = setInterval(function(){
					if(keyWordsAbout.isDone()){
						var allKeyWords = keyWordsAbout.getKeyWords();
						for(var i = 0; i < allKeyWords.length; i++)
							$("#note-can-kw").append("<span style='margin: 5px; display: inline-block;'>"+allKeyWords[i]+"</span>");
						$("#note-can-kw span").click(function(){
							var newkw = $(this).text();
							if(keyWordsAbout.addKeyWords(newkw)){
								$("#note-chosen-kw").append("<span style='margin: 5px; display: inline-block;'>" + newkw + "</span>"); 
								$("#note-chosen-kw span").click(function(){
									keyWordsAbout.deleteKW($(this).text());
									this.parentNode.removeChild(this);
								});
							}
						});
						$("#nt-kw-in").keyup(function(event){
							//alert(event.target.value);	
							var similarw = keyWordsAbout.getSimilarKW(event.target.value);
							$("#note-can-kw").empty().append("已有：");
							for(var i in similarw){
								$("#note-can-kw").append("<span style='margin: 5px; display: inline-block;'>"+similarw[i]+"</span>");
								$("#note-can-kw span").click(function(){
									var newkw = $(this).text();
									if(keyWordsAbout.addKeyWords(newkw)){
										$("#note-chosen-kw").append("<span style='margin: 5px; display: inline-block;'>" + newkw + "</span>"); 
										$("#note-chosen-kw span").click(function(){
											keyWordsAbout.deleteKW($(this).text());
											this.parentNode.removeChild(this);
										});
									}
								});
							}
						});

						$("#note-form-kw button").attr("enable", true);
						$("#note-form-kw button").click(function(){
							var newkw = $("#nt-kw-in").val();
							if(newkw){
								if(keyWordsAbout.addKeyWords(newkw)){
									$("#note-chosen-kw").append("<span style='margin: 5px;'>" + newkw + "</span>");
									$("#note-chosen-kw span").click(function(){
										keyWordsAbout.deleteKW($(this).text());
										this.parentNode.removeChild(this);
									});
								}
							}
						});
						clearInterval(waitKeyWords);
					}
					else{
						$("#note-form-kw button").attr("enable", false);
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
					note_msg.note.content = textCapture.getText();
					note_msg.note.createTime = textCapture.getTime();
					note_msg.note.url = textCapture.getUrl();
					note_msg.note.canKW = keyWordsAbout.getCanKeyWords();
					note_msg.note.newKW = keyWordsAbout.getNewKeyWords();
					chrome.runtime.sendMessage(note_msg, 
						function(){ 
							//Clear the textCapture object;
							keyWordsAbout.addNewToData();
							gbclear(textCapture, keyWordsAbout);
						}
					); 
					$("#kwj-note-form").modal("hide");
					var body = document.getElementsByTagName("body")[0]; 
					body.removeEventListener("mouseup", enableSelection); 
				});
				/*end*/

				/*set the cancel button clicking to close the form
				 and detach the handler of capturing text*/
				$("#note-item-cancel").click(function(){
					var body = document.getElementsByTagName("body")[0]; 
					body.removeEventListener("mouseup", enableSelection);
					$("#kwj-note-form").modal("hide");
					gbclear(textCapture, keyWordsAbout);
				});
				/*end*/

				$("#note-form-add").click(function(){
					$("#kwj-note-form").modal("hide");
					gbclear(keyWordsAbout);
				});

				clearInterval(note_form_timer);
			}
		}, 100); 

		$("#kwj-note-form").on('hidden.bs.modal', function(e){
			var i;
			var paragraphs = document.getElementsByClassName("note-paragraph");
			var pl = paragraphs.length;
			for(i = 0; i < pl; i++)
				paragraphs[0].parentNode.removeChild(paragraphs[0]); 

			var keywords = document.getElementById("note-can-kw")
									.getElementsByTagName("span");
			var kl = keywords.length;
			for(i = 0; i < kl; i++)
				keywords[0].parentNode.removeChild(keywords[0]); 

			var ckeywords = document.getElementById("note-chosen-kw")
									.getElementsByTagName("span");
			var cl = ckeywords.length;
			for(i = 0; i < cl; i++)
				ckeywords[0].parentNode.removeChild(ckeywords[0]); 
		});

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
