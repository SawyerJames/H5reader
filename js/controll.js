(function (){
	// 公共类
	var Util = (function(){
		//H5 本地存储
		var prefix = 'html_reader_';
		var StorageGetter = function(key){
			return localStorage.getItem(prefix + key);
		}
		var StorageSetter = function(key,val){
			return localStorage.setItem(prefix + key,val);
		}
		//应用base64和Jsonp进行文字解码
		var getBSONP = function(url,callback){
			return $.jsonp({
				url : url,
				cache : true,
				//回调函数：“url下解析的json的函数”
				callback : 'duokan_fiction_chapter',
				success : function(result){
					//base64解码
					var data = $.base64.decode(result);
					var json = decodeURIComponent(escape(data));
					callback(json);
				}
			})
		}
		return{
			StorageSetter:StorageSetter,
			StorageGetter:StorageGetter,
			getBSONP:getBSONP
		}
	})();

	// 变量
	var Dom = {
		topNav : $('.m-top-nav'),
		bottomNav : $('.m-bottom-nav-contain'),
		awake_font : $('.awake-font'),
		read_content : $('.m-read-content'),
		root_contain : $('#root'),
		read_content_title : $('.m-read-content h4'),
		night : $('#u_nav_night'),
		font_icon : $('.nav-font-icon'),
		night_icon : $('.nav-night-icon'),
 	}
 	var Color = {
 		c1 : $('.radius-outside1'),
 		c2 : $('.radius-outside2'),
 		c3 : $('.radius-outside3'),
 		c4 : $('.radius-outside4'),
 		c5 : $('.radius-outside5'),
 		c6 : $('.radius-outside6')
 	}
	var Win = $(window);
	var Doc = $(document);
	var ChapterSum;
	var ReaderContainer = $('#fiction_container');
	var ReaderModle;
	var InitUI;

	//加载缓存字号
	var fontVal = Util.StorageGetter('afontsize');
	fontVal = parseInt(fontVal);
	if (!fontVal) {
		fontVal = 14;
	}
	Dom.read_content.css('font-size', fontVal);

	// todo 事件处理
	function eventHandle(){
		// 唤醒一级菜单
		$('#awake_meau').click(function() {
			if (Dom.topNav.css('display') == "none") {
				Dom.topNav.show();
				Dom.bottomNav.show();
			}else{
				Dom.topNav.hide();
				Dom.bottomNav.hide();
				Dom.awake_font.hide();
			}
		});

		Win.scroll(function() {
			Dom.topNav.hide();
			Dom.bottomNav.hide();
			Dom.awake_font.hide();
		});

		// 唤醒二级菜单
		$('#u_nav_font').click(function() {
			if (Dom.awake_font.css('display') == 'none') {
				Dom.awake_font.show();
				Dom.font_icon.addClass('nav-fontArouse-icon');
			}else{
				Dom.awake_font.hide();
				Dom.font_icon.removeClass('nav-fontArouse-icon');
			}
		});

		//设置字号
		$('#big_font').click(function() {
			if (fontVal>20) {
				return;
			}
				fontVal += 1;
				Dom.read_content.css('font-size', fontVal);
				Util.StorageSetter('afontsize',fontVal);//本地缓存
		});
		$('#small_font').click(function() {
			if (fontVal<10) {
				return;
			}
				fontVal -= 1;
				Dom.read_content.css('font-size', fontVal);
				Util.StorageSetter('afontsize',fontVal);//本地缓存
		});

		// 设置背景
		Color.c1.click(function(){
			colorSet("#D7AF05","#131313","#131313");
		});
		Color.c2.click(function(){
			colorSet("#F2041C","#C8C1C1","#C8C1C1");
		});
		Color.c3.click(function(){
			colorSet("#0E549F","#9A9A9A","#9A9A9A");
		});
		Color.c4.click(function(){
			colorSet("#0CAF2A","#131313","#131313");
		});
		Color.c5.click(function(){
			colorSet("#4C4B47","#131313","#131313");
		});
		Color.c6.click(function(){
			colorSet("#e9dfc7","#555555","#555555");
		});

		function colorSet(colorVal,fontcolor,title){
			Dom.root_contain.css('background', colorVal);
			Dom.read_content.css('color', fontcolor);
			Dom.read_content_title.css('color',title);
		}

		//日夜间切换>>>>>BUG
		var i=0;
		Dom.night.click(function(){
			if (Dom.root_contain.css('background') !== "#4C4B47") {
				colorSet("#4C4B47","#131313","#131313");
			}
			if (i%2==1){
				colorSet("#e9dfc7","#555555","#555555");
			}
			i++;
		});

		//上下翻页
		$('#prev_bar').click(function() {
			ReaderModle.prevChapter(function(data){
				InitUI(data);
			});
		});
		$('#next_bar').click(function(){
			ReaderModle.nextChapter(function(data){
				InitUI(data);
			});
		});
	}
		
	// todo 入口
	function main(){
		ReaderModle = readerModle();
		InitUI = initUI(ReaderContainer);
		//渲染页面入口
		ReaderModle.init(function(data){
			InitUI(data);
		});
		//事件处理机制入口
		eventHandle();
	}

	// todo 初始化动态渲染 参数container是为了渲染可以自由调动想要渲染的页面
	function initUI(container){
		function parseChapterData(jsonData){
			var jsonObj = JSON.parse(jsonData);
			//解析数据，搭页面结构
			var html = '<h4>' + jsonObj.t + '</h4>';
			for (var i = 0; i < jsonObj.p.length; i++) {
				html += '<p>' + jsonObj.p[i] + '</p>';
				}
			return html;
		}
		//渲染页面
		return function(data){
			container.html(parseChapterData(data));
		}
	}

	// todo 实现阅读器相关的数据交互
	function readerModle(){
		var Chapter_id;
		//渲染页面逻辑
		var init = function(UIcallback){
			getFictionInfo(function(){
				getCurChaptercontent(Chapter_id,function(data){
					UIcallback && UIcallback(data);
				})
			});
		}

		//获取章节信息
		var getFictionInfo = function(callback){
			$.get('data/chapter.json',function(data){
				//获取章节ID
				//本地存储获取ID，如没有，为1
				Chapter_id = Util.StorageGetter('rem_Chapter_id');
				if (Chapter_id == null) {
					Chapter_id = data.chapters[1].chapter_id;
				}
				ChapterSum = data.chapters.length;
				callback && callback();
			},'json');
		} 

		//获取当前的章节内容
		var getCurChaptercontent = function(chapter_id,callback){
			$.get('data/data' + chapter_id + '.json',function(data){
				if (data.result == 0) {
					var url = data.jsonp;
					//调用公共类下的getBSONP功能，解析数据，data参数为get方法获取的章节内容
					Util.getBSONP(url , function(data){
						callback && callback(data)
					});
				}
			},'json');
    	}

    	//上下翻页的逻辑函数
    	var prevChapter = function(UIcallback){
    		Chapter_id = parseInt(Chapter_id,10);
    		if (Chapter_id == 1) {
    			return;
    		}else{
    			Chapter_id -= 1;
    			getCurChaptercontent(Chapter_id,UIcallback);
    		}
    		Util.StorageSetter('rem_Chapter_id',Chapter_id);
    	};
    	var nextChapter = function(UIcallback){
    		Chapter_id = parseInt(Chapter_id,10);
    		if (Chapter_id == ChapterSum) {
    			return;
    		}else{
    			Chapter_id += 1;
    			getCurChaptercontent(Chapter_id,UIcallback);
    		}
    		Util.StorageSetter('rem_Chapter_id',Chapter_id);
    	};

    	return{
    		prevChapter : prevChapter,
    		nextChapter : nextChapter,
    		init : init
    	}
	}
	//开通主函数
	main(); 	
})();