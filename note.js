//名字模块
var app = {
	util:{},
	store:{}
};

//工具方法模块
app.util = {

//取元素的方法
 $: function(selector, node){
 	return (node || document).querySelector(selector);
 },

 //格式化时间
 formatTime: function (t){
 	var d = new Date(t);
 	var pad = function (s){
 		if(s.toString().length==1){
 			s='0' + s;
 		}
 		return s;
 	}
 	var year = d.getFullYear();
 	var month = d.getMonth()+1;
 	var day = d.getDate();
 	var hour = d.getHours();
 	var minute = d.getMinutes();
 	var second = d.getSeconds();

 	return year+'-'+pad(month)+'-'+pad(day)+' '+pad(hour)+':'+pad(minute)+':'+pad(second); 	
 }
};
//store模块
app.store = {
	__store_key:'__sticky_note__',
	get:function (id){
		var notes = this.getNote();
		return notes[id] || {};
	},
	set:function (id,content){
		var notes = this.getNote();
		if(notes[id]){
			Object.assign(notes[id],content);
		}else{
			notes[id] = content;
		}
		localStorage[this.__store_key] = JSON.stringify(notes);
		console.log('saved note: id: ' + id + ' content: ' + JSON.stringify(notes[id]));

	},
	remove:function (id){
		var notes = this.getNote();
		delete notes[id];
		localStorage[this.__store_key] = JSON.stringify(notes);

	},
	getNote:function (){
		return JSON.parse(localStorage[this.__store_key] || '{}');
	}
};


(function (util,store){
	var $ = util.$;
	var moveNote = null;//被移动的note
	var startX ;//X坐标
	var startY ;//Y坐标
	var maxZIndex = 0;//z-index值
	var noteTpl = `	
		<i class="close"></i>
		<div class="editor" contenteditable="true"></div>
		<div class="timestamp">
			<span>更新</span>
			<span class="time">2017-07-01</span>
		</div>
	`;//Es6模块字符串

	

	function createNote ( options ){
		var note = document.createElement('div');
		note.className = 'note';
		note.innerHTML = noteTpl;
		note.id = options.id || 'note'+Date.now();
		$('.editor',note).innerHTML = options.content || '';
		note.style.left = options.left + 'px';
		note.style.top = options.top + 'px';
		note.style.zIndex = options.zIndex;
		document.body.appendChild(note);
		this.note=note;
		this.updateTime(options.updateTime);
		this.addEvent();
	

	};

	createNote.prototype.updateTime = function (t){
		var ts = $('.time', this.note);
		t = t || Date.now();
		this.updateTimeInMS = t;
		ts.innerHTML = util.formatTime(t);

	}

	createNote.prototype.save = function (){
		store.set(this.note.id,{
			left:this.note.offsetLeft,
			top:this.note.offsetTop,
			zIndex:parseInt(this.note.style.zIndex),
			content:$('.editor',this.note).innerHTML,
			updateTime:this.updateTimeInMS
		});
	}

	createNote.prototype.close = function (e){		
		document.body.removeChild(this.note);
	};


	createNote.prototype.addEvent = function (){	
		
		var mousedownHandler = function (e){
			moveNote = this.note;
			startX = e.clientX - this.note.offsetLeft;
			startY = e.clientY - this.note.offsetTop;
			if(parseInt(moveNote.style.zIndex)!==maxZIndex - 1){
				moveNote.style.zIndex = maxZIndex++;
				store.set(moveNote.id,{
					zIndex:maxZIndex-1
				});
			}
		}.bind(this);
		this.note.addEventListener('mousedown' , mousedownHandler);


		//便签输入事件
		var editor = $('.editor',this.note);
		var inputTimer;
		var inputHandler =  function (e){
			
			var content = editor.innerHTML;
			
			clearTimeout(inputTimer);
			inputTimer = setTimeout(function (){
				var time = Date.now()
				store.set(this.note.id,{
					content:content,
					updateTime:time
				});
				this.updateTime(time);

			}.bind(this),300);
		}.bind(this);
		editor.addEventListener('input',inputHandler);

		//关闭处理程序
		var closeBtn = $('.close',this.note);
		var closeHandler = function (e){
			store.remove(this.note.id);
			this.close(e);
			
			this.note.removeEventListener('mousedown' , mousedownHandler);
			closeBtn.removeEventListener('click',closeHandler);
		}.bind(this);
		closeBtn.addEventListener('click',closeHandler);
	};


	document.addEventListener( 'DOMContentLoaded', function(e){
		//创建添加事件
		$('#create').addEventListener('click',function(e){
			var note = new createNote({
				left:Math.round(Math.random()*(window.innerWidth - 220)),
				top:Math.round(Math.random()*(window.innerHeight - 320)),
				zIndex: maxZIndex++,
				
			});
			note.save();
		});

		//移动监听
		var mousemoveHandler = function (e){
			if(!moveNote){
				return;
			}
			moveNote.style.left = e.clientX - startX + 'px';
			moveNote.style.top = e.clientY - startY + 'px';
		}
		var mouseupHandler = function (e){
			if(!moveNote){
				return;
			};
			store.set(moveNote.id,{
				left:moveNote.offsetLeft,
				top:moveNote.offsetTop
			});
			moveNote = null;
		}
		document.addEventListener('mousemove', mousemoveHandler);
		document.addEventListener('mouseup', mouseupHandler);
	
		//初始化
		var notes = store.getNote();
		Object.keys(notes).forEach(function(id){
			var options = notes[id];
			if(maxZIndex<options.zIndex){
				maxZIndex=options.zIndex;
			}
			new createNote(Object.assign(options,{
				id:id
			}));
		});
		maxZIndex+=1;
	});	
})(app.util,app.store);