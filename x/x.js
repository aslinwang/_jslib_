/**
 * x.js
 * @dependences jquery.js/zepto.js underscore.js
 */
var X = {};
(function(){
  /**
   * 判断是否有字符
   * 
   * @param {String} String 字符
   * @return {Boolean} Boolean 返回布尔值
   *            @example
   *            'abc'.hasString('a');
   *            'abc'.hasString(['a','b']);
   */
  String.prototype.hasString = function(o) {
    if (typeof o == 'object') {
      for (var i = 0,n = o.length;i < n;i++) {
        if (!this.hasString(o[i])) return false;
      }
      return true;
    }
    else if (this.indexOf(o) != -1) return true;
  }

  /**
   * https://tc-svn.tencent.com/pub/pub_txTpl_rep/txTpl_proj/trunk/txtpl.js
   * 
   * 模板解析器txTpl: 
   * @author: wangfz
   * @param {String}  模板id || 原始模板text
   * @param {Object}  数据源json 
   * @param {String}  可选 要匹配的开始选择符 '<%' 、'[%' 、'<#' ..., 默认为'<%'
   * @param {String}  可选 要匹配的结束选择符 '%>' 、'%]' 、'#>' ..., 默认为'%>'
   * @param {Boolean} 可选 默认为true 
   * @return {String}  
   * 注意1: 输出"\"时, 要转义,用"\\"或者实体字符"&#92"; 
   *　　　  输出"开始选择符"或"结束选择符"时, 至少其中一个字符要转成实体字符。 
   *　　　  html实体对照表：http://www.f2e.org/utils/html_entities.html
   * 注意2: 模板拼接时用单引号。
   * 注意3: 数据源尽量不要有太多的冗余数据。 
   */
  X.txTpl = (function(){
    var cache={};
    return function(str, data, startSelector, endSelector, isCache){
      var fn, d=data, valueArr=[], isCache=isCache!=undefined ? isCache : true;
      if(isCache && cache[str]){
        for (var i=0, list=cache[str].propList, len=list.length; i<len; i++){valueArr.push(d[list[i]]);}  
        fn=cache[str].parsefn;
      }else{
        var propArr=[], formatTpl=(function(str, startSelector, endSelector){
          if(!startSelector){var startSelector='<%';}
          if(!endSelector){var endSelector='%>';}
          var tpl=/[^\w\d_:\.-]/g.test(str) == false ? document.getElementById(str).innerHTML : str;
          return tpl
            .replace(/\\/g, "\\\\")                       
            .replace(/[\r\t\n]/g, " ")                      
            .split(startSelector).join("\t")                    
            .replace(new RegExp("((^|"+endSelector+")[^\t]*)'","g"), "$1\r")  
            .replace(new RegExp("\t=(.*?)"+endSelector,"g"), "';\n s+=$1;\n s+='")            
            .split("\t").join("';\n")                     
            .split(endSelector).join("\n s+='")   
            .split("\r").join("\\'");   
        })(str, startSelector, endSelector);  
        for (var p in d) {propArr.push(p);valueArr.push(d[p]);} 
        fn = new Function(propArr, " var s='';\n s+='" + formatTpl+ "';\n return s");
        isCache && (cache[str]={parsefn:fn, propList:propArr});
      }
        
      try{
        return fn.apply(null,valueArr);
      }catch(e){
        function globalEval(strScript) {
          var ua = navigator.userAgent.toLowerCase(), head=document.getElementsByTagName("head")[0], script = document.createElement("script"); 
          if(ua.indexOf('gecko') > -1 && ua.indexOf('khtml') == -1){window['eval'].call(window, fnStr); return}       
          script.innerHTML = strScript; 
          head.appendChild(script); 
          head.removeChild(script);
        } 
        
        var fnName='txTpl' + new Date().getTime(), fnStr='var '+ fnName+'='+fn.toString();
        globalEval(fnStr);
        window[fnName].apply(null,valueArr);    
      }     
    }
  })();

  //获取中英文总字符长度，一个汉字的长度=两个英文字母的长度
  //X.strlen('中en'); //获取中英文总字符长度
  X.strlen = function(str){
    var arr = (str || '').match(/[^\x00-\x80]/g);
    return str.length + (arr ? arr.length : 0);
  };

  /**
   * 按字符长度裁剪字符串
   * 
   * @param {String} String 原字符串
   * @return {number}  number截取长度
   * @return {string}  string 截取后填充字符
   *            @example
   *            X.strcut('我是xiaom565',4,'');    //返回  '我是'
   *            X.strcut('daklfjsklafjas',7,''); //返回  'daklfjs' 
   */
  X.strcut = function(str,num,replace){
    replace = typeof replace == 'undefined' ? '...' : replace;
    var arrNew = [],
      strNew = '',
      arr,
      length = X.strlen(str);
    if (length > num) {
      arr = str.split('');
      for(var i = 0; i < arr.length; i++){
        var a = arr[i];
        if (num > 0) {
          arrNew.push(a);
          num -= X.strlen(a);
        }
        else {
          break;
        }
      }
      strNew = arrNew.join('') + replace;
    }
    else {
      strNew = str;
    }
    return strNew;
  };

  X.getType = function(o){
    return Object.prototype.toString.call(o).slice(8, -1);
  };

  X.isArray = function(o){
    return X.getType(o) == 'Array';
  }

  X.isNumber = function(o){
    return X.getType(o) == 'Number';
  }

  X.isString = function(o){
    return X.getType(o) == 'String';
  }

  X.isFunction = function(o){
    return X.getType(o) == 'Function';
  }

  X.isUndefined = function(o){
    return typeof o == 'undefined';
  }

  X.isObject = function(o){
    return typeof o == 'object';
  }

  /**
   * 判断对象是否为空({}或null)
   * @param  {Object}  o 待检测对象
   */
  X.isEmptyObj = function(o){
    for(var name in o){
      if(o.hasOwnProperty(name)){
        return false;
      }
    }
    return true;
  }


  /**
   * 将对象转化为querystring
   * @param  {Object} obj 对象
   */
  X.obj2qs = function(obj){
    var qs = '';
    for(var key in obj){
      qs += key + '=' + encodeURIComponent(obj[key]) + '&';
    }
    qs = qs.replace(/&$/g,'');//去掉末尾多加的那个"&"
    return qs;
  }


  /**
   * 获取Json对象
   * 
   * @param {String} String Json字符串
   * @return {Object} Object Json对象
   *            @example
   *            data = X.json(data); //主要用于Json容错
   */
  X.json = function(data){
    var o = {};
    if (data){
      try{
        o = eval('(' + data + ')');
      }catch(e){};
    }
    return o;
  };

  X.json2str = function(obj){
    var string = [],
        isArray = X.isArray(obj);
    if(X.isObject(obj)){
      if(obj === null){
        return 'null';
      }

      if(window.JSON && window.JSON.stringify){
        return JSON.stringify(obj);
      }

      for(var i in obj){
        string.push((isArray ? '' : '"' + i + '":') + X.json2str(obj[i]));
      }
      string = string.join();
      return isArray ? ('[' + string + ']') : ('{' + string + '}');
    }
    else if(X.isNumber(obj) || X.isFunction(obj)){
      return obj.toString();
    }
    else if(X.isUndefined(obj)){
      return 'undefined';
    }

    return !obj ? '""' : ('"' + data + '"');
  };

  /**
   * 数字补零
   * 
   * @param {Number} Number 数字
   * @return {Number} Number 补零位数
   * @return {String} String 补零后的字符串
   *            @example
   *            X.addZero(9,2); //返回 09
   */
  X.addZero = function(num,n) {
    n = n || 2;
    return Array(Math.abs(('' + num).length - (n + 1))).join(0) + num;
  }

  // 格式化时间戳
  // X.formatDate('1427040180000', 'yyyy-MM-dd hh:mm:ss')
  X.formatDate = function(v, f){
    var F = f.replace(/\W/g,',').split(','),format = ['yyyy','MM','dd','hh','mm','ss','ww'];
    v = new Date(parseInt(v, 10));
    var date = {
      y : v.getFullYear(),
      M : v.getMonth() + 1,
      d : v.getDate(),
      h : v.getHours(),
      m : v.getMinutes(),
      s : v.getSeconds(),
      w : v.getDay()
    };
    for (var i = 0,num = F.length;i < num;i++) {
      var o = F[i];
      for (var j = 0;j < 7;j++) {
        var S = format[j].slice(-1);
        if (o.indexOf(S) != -1) {
          if (S == 'w' && date[S] == 0) date[S] = 7; //Sunday
          if (o.indexOf(format[j]) != -1) {
            f = f.replace(RegExp(format[j],'g'),X.addZero(date[S]));
          }
          else f = f.replace(RegExp(format[j].slice(format[j].length/2),'g'),date[S]);
        }
      }
    }
    return f;
  };

  X.parseDate = function(v, f){
    if (!f) f = 'yyyy-MM-dd hh:mm:ss';
    f = f.split(/\W/);
    v = v.split(/\D/);
    var y = 2000,M = 0,d = 1,h = 0,m = 0,s = 0,D = true;

    for(var i=0; i < f.length; i++){
      var o = f[i];
      if (v[i] != '' && !isNaN(v[i])) {
        if (o.hasString('y')) y = Number(v[i]);
        if (o.hasString('M')) M = Number(v[i]) - 1;
        if (o.hasString('d')) d = Number(v[i]);
        if (o.hasString('h')) h = Number(v[i]);
        if (o.hasString('m')) m = Number(v[i]);
        if (o.hasString('s')) s = Number(v[i]);
        if (o.hasString('w')) s = Number(v[i]);
      }
    }
    if (!D) return false;
    return new Date(y,M,d,h,m,s);
  };

  // 格式化货币
  // from avalon.js
  X.formatCurrency = function(number, decimals, point, thousands){
    //form http://phpjs.org/functions/number_format/
    //number  必需，要格式化的数字
    //decimals  可选，规定多少个小数位。
    //point 可选，规定用作小数点的字符串（默认为 . ）。
    //thousands 可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = thousands || ",",
        dec = point || ".",
        s = '',
        toFixedFix = function(n, prec) {
          var k = Math.pow(10, prec);
          return '' + (Math.round(n * k) / k).toFixed(prec);
        }
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
    if(s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if((s[1] || '').length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
  };

  // X.expire('2015-06-01 00:00:00', '2015-06-20 23:59:59', 1432778400000)
  X.expire = function(s, e, n){
    var st = X.parseDate(s).getTime();
    var et = X.parseDate(e).getTime();
    var now = (n ? n : +new Date());
    if(now >= st && now <= et){
      return false;
    }
    else{
      return true;
    }
  };

  /**
   * cookie操作
   * 
   * @param {String} String cookie名
   * @param {String} String cookie值
   * @param {Number} Number 存储时间，以天为单位
   * @param {String} String 域名
   * @return {String} String cookie值
   *            @example
   *            var refresh = UI.cookie('refresh');
   *            UI.cookie('refresh',1); //设置refresh为1
   *            UI.cookie('refresh',1,7); //设置refresh为1，存活7天
   *            UI.cookie('refresh',1,7,'qq.com'); //设置设置refresh为1，存活7天，域名qq.com
   */
  X.cookie = function(n,v,d,domain) { //Cookie
    if (v == undefined) {
      var N = n + '=',C = document.cookie.split(';');
      for(var i=0,l=C.length;i<l;i++) {
        var c = C[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(N) == 0) return decodeURIComponent(c.substring(N.length,c.length));
      }
      return null;
    }
    else {
      var k = '';
      if (d) {
        var D = new Date();
        D.setTime(D.getTime() + d * 24 * 60 * 60 * 1000);
        k = '; expires=' + D.toGMTString();
      }
      document.cookie = n + '=' + v + k + '; path=/' + (domain ? ';domain=' + domain : '');
    }
  };

  (function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
                                      window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if(!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
        var id = window.setTimeout(function() {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  }());

  //依赖jquery.js/zepto.js的方法写在此处
  (function($){
    if($){
      if(!window.$){
        window.$ = $;
      }
    }
    else{
      return;
    }

    //===============================extend=======================
    var ua = navigator.userAgent.toUpperCase();
    $.os = $.extend($.os, {
      hm : ua.indexOf('HM') != -1,
      c8813 : ua.indexOf('HW-HUAWEI_C8813') != -1,
      qqnews : ua.indexOf('QQNEWS') != -1,
      wechat : ua.indexOf('MICROMESSENGER') != -1,//微信
      qqcar : ua.indexOf('QQCAR') != -1//购车通
    });
    /* 获取各种版本号 */
    $.os.vers = {
      qqnews : (function(){
        var tem = ua.match(/qqnews\/([\.\d]+)/i);
        return tem && tem[1] ? tem[1] : "0.0.0";
      }()),
      qqcar : (function(){
        var tem = ua.match(/qqcar\/([\.\d]+)/i);
        return tem && tem[1] ? tem[1] : "0.0.0";
      }()),
      ios : (function(){
        var tem = ua.match(/iPhone\sOS\s([_\d]+)/i);
        var ver = tem && tem[1] ? tem[1] : "0.0.0";
        ver = ver.replace(/_/g, '.');
        return ver;
      }()),
      android : (function(){
        var tem = ua.match(/Android\s([\.\d]+)/i);
        var ver = tem && tem[1] ? tem[1] : "0.0.0";
        return ver;
      }())
    };
    /**
     * 版本号比较，适用于x.y.z的版本号
     * @return 
     */
    $.os.vc = function(v1, v2, options){
      var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

      function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
      }
      if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
      }
      if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
      }
      if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
      }
      for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }
        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
      }
      if (v1parts.length != v2parts.length) {
        return -1;
      }
      return 0;
    };
    //===============================/extend=======================

    //动态在页面中添加CSS规则
    X.addCssRule = (function(){
      var elStyle;
      
      function initSheet(){
        elStyle = $('<style/>').attr('type', 'text/css').appendTo($('head'));
      }  

      return function(rule){
        if(!elStyle){
          initSheet();
        }
        elStyle.append(rule);
        elStyle.append(document.createTextNode(''));
      }
    }());

    //设置或获取css3样式，自动判断样式前缀(-webkit,-moz,-o)
    X.css3 = (function(){
      var dummyStyle = document.createElement('div').style,
      h5Vender = (function(){
        // 将transform放在最后作为默认
        // 小米手机-webkit-transform和transform同时存在，但生效的是前者
        var vendors = 'webkitT,MozT,msT,OT,t'.split(','), 
          t, l = vendors.length;

        for (var i = 0; i < l; i++) {
          t = vendors[i] + 'ransform';
          if (t in dummyStyle) {
            var vender = vendors[i].substr(0, vendors[i].length - 1);
            vender = vender ? '-' + vender + '-' : vender
            return vender;
          }
        }

        return false;
      })();

      return function(el, key, value){
        key = h5Vender + key;
        if(!value){
          return $(el).css(key);
        }
        else{
          $(el).css(key, value);
        }
      }
    }());

    /**
     * 平滑滚动
     * @param  {DomElement} el       dom
     * @param  {Int} to       滚动位置
     * @param  {int} duration 缓动时间
     * @return {[type]}          [description]
     */
    X.smoothScroll = function(el, to, duration){
      if (duration < 0) {
        return;
      }
      var difference = to - $(window).scrollTop();
      var perTick = difference / duration * 10;
      this.scrollToTimerCache = setTimeout(function() {
          if (!isNaN(parseInt(perTick, 10))) {
              window.scrollTo(0, $(window).scrollTop() + perTick);
              X.smoothScroll(el, to, duration - 10);
          }
      }.bind(this), 10);
    };

    X.getRect = function(el){
      el = $(el)[0];
      if(document.body.getBoundingClientRect && el){
        return el.getBoundingClientRect();
      }
      return null;
    };

    // 将光标移动到可编辑DOM的末尾
    // http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
    X.setCursorEnd = function(el){
      var range,selection;
      if(document.createRange){//Firefox, Chrome, Opera, Safari, IE 9+
          range = document.createRange();//Create a range (a range is a like the selection but invisible)
          range.selectNodeContents(el);//Select the entire contents of the element with the range
          range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
          selection = window.getSelection();//get the selection object (allows you to change selection)
          selection.removeAllRanges();//remove any selections already made
          selection.addRange(range);//make the range you have just created the visible selection
      }
      else if(document.selection){ //IE 8 and lower
          range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
          range.moveToElementText(el);//Select the entire contents of the element with the range
          range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
          range.select();//Select the range (make it the visible selection
      }
    }

    /**
     * 禁用body滚动条
     * @param  {Boolean} isDisable 是否禁用
     * @param  {Boolean}  useCss    使用样式禁用
     * @return {[type]}            [description]
     */
    X.disableBodyScroll = function(isDisable, useCss){
      var _body = document.body;
      var _html = _body.parentNode;
      var handle = function(e){
        e.preventDefault();
      };

      if(isDisable){
        if(!$(document.body).data('st')){
          $(document.body).data('st', $(document.body)[0].scrollTop);
        }

        if(!useCss){
          $(document.body).on('touchmove', handle);
        }
        else{
          $(_body).css({
            'overflow' : 'hidden',
            'height' : '100%'
          });
          $(_html).css({
            'overflow' : 'hidden',
            'height' : '100%'
          });
        }
      }
      else{
        if(!useCss){
          $(document.body).unbind('touchmove');
        }
        else{
          $(_body).css({
            'overflow' : '',
            'height' : 'auto'
          });
          $(_html).css({
            'overflow' : '',
            'height' : 'auto'
          });
        }

        $(document.body)[0].scrollTop = $(document.body).data('st');
        $(document.body).data('st', '');
      }
    }

    /**
     * 滚动加载图片
     * @return {[type]} [description]
     */
    X.Crs = (function(){
      var MAX_LINKS = 6;
      var loading = 0;
      var imgarr = [];

      function down(imgs){
        var defer = $.Deferred();
        var count = 0
        $.each(imgs, function(idx, el){
          var src = $(el).attr('crs');
          if(src){
            var img = new Image();
            img.src = src;
            img.onload = function(){
              count++;
              $(el).attr('src', src);
              $(el).attr('crs', '');

              img = null;

              if(count == imgs.length){
                defer.resolve();
              }
            };
            img.onerror = function(){
              count++;
              if(count == imgs.length){
                defer.resolve();
              }
            };
          }
        });

        return defer.promise();
      }

      //cfg.isold - 是否使用旧版本X.Crs
      //cfg.reload - 是否重新load图片（正在load的图片取消load）
      return function(els, cfg){
        cfg = cfg || {};
        if(cfg.isold){
          $.each($('img', els), function(idx, el){
            var src = $(el).attr('crs');
            if(src){
              var img = new Image();
              img.src = src;
              img.onload = function(){
                $(el).attr('src', src);
                $(el).attr('crs', '');

                img = null;
              };
            }
          });
          return;
        }

        var links = MAX_LINKS;
        var loaded = 0;
        var imgs = $('img', els);
        if(cfg.reload){
          imgarr = [];
        }

        function action(){
          var arr = imgarr.shift();
          if(arr){
            loading = 1;
            down(arr).done(function(){
              action();
            });
          }
          else{
            loading = 0;
          }
        }

        for(var i = 0 ; i < Math.ceil(imgs.length/links, 10); i++){
          imgarr.push(imgs.slice(i*links, (i+1)*links));
        }

        if(!loading){
          action();
        }
      };
    }());

    X.UrlParser = {
      //REG_HASH : /#(.*)$/,
      //REG_SEARCH : /\?([^#]*)($|#)/,
      REG_ILLEGAL : /[\?#]/g,
      REG_AMP : /&(?!amp;)/,

      /**
       * 解析Url，返回url参数对象
       * @param  {str} url url链接
       * @return {object}     [description]
       * @example
       *   parse('http://t.qq.com/mb/qzone/set.html?type=1#tab=index&anthor=config');
       *   return {
       *             type : 1,
       *             tab : index,
       *             anthor : config
       *           }
       */
      parse : function(url) {
        var url2Parse = url || location.href,
          el,
          values = {},
          result = {};

        if (url2Parse) {
          el = document.createElement('a');
          el.href = url2Parse;
          _.each([
            'protocol',
            'hostname',
            'port',
            'pathname',
            'search',
            'hash',
            'host'
          ], function (key) {
            result[key] = el[key];
          });
          $.extend(values,
            this.getMapByUrlStr(result.search),
            this.getMapByUrlStr(result.hash)
            );
        }
        result.values = values;

        return result;
      },

      getMapByUrlStr : function(str) {
        var i, value,
          result = {};

        str = str.replace(this.REG_ILLEGAL, '');

        str = str.split(this.REG_AMP);

        i = str.length;
        while (i--) {
          value = str[i];
          if (value) {
            value = value.split('=');
            if (value.length === 2) {
              result[this.decode(value[0])] = value[1] ? this.decode(value[1]) : '';
            }
          }
        }

        return result;
      },
      encode : function(str) {
        return encodeURIComponent(str).replace(/%20/g, '+');
      },

      decode : function(str) {
        return decodeURIComponent(str.replace(/\+/g, ' '));
      }
    };
    /**
     * Helper - 本地存储
     * @param {String|Object} name 键|键值对象
     * @param {String} value 值
     *       @example
     *       //默认存到当前页面域下，需要存到api.t.qq.com下，请设置isCross:1
     *       
     *       //存储
     *       S('key', 'value');
     *       S('key', '');
     *       
     *       //读取
     *       S('key');
     *       
     *       //存储（当前页面域名下）
     *       S({
     *           name : 'key',
     *           value : 'value',
     *           isCross : 0
     *       });
     *       
     *       //读取（当前页面域名下）
     *       S({
     *           name : 'key',
     *           isCross : 0
     *       });
     *       
     *       //在页面没有ready前（跨域代理页面不一定存在的情况下）调用
     *       S(function(){
     *           S({
     *               name : 'key',
     *               isCross : 0
     *           });
     *       });
     *
     *       //手动清除本地存储的内容,在url后面添加noS=1参数即可
     *       http://w.auto.qq.com?noS=1
     *
     *       // safira下跨域存储无法执行
     *       // http://stackoverflow.com/questions/20401751/iframe-localstorage-on-safari-and-safari-mobile
     **/
    X.S = (function(){ //Storage
      var list = [],//存放S调用的队列
        ready = 0,
        _body,
        hasClear,
        id = 'sIframeProxy',
        noS = X.UrlParser.parse().values.noS,
        run = function(o){
          if(ready){
            o();
          }
          else{
            list.push(o);
          }
        },
        clear = function(win){
          var filter = /^draft|top|time|option|tips|follow/,local = win.localStorage; // @联想数据过大，有时后会有问题
          if (local) {
            try{
              for (var i in local) {
                if (!i.match(filter)) {
                  local[i] = '';
                  local.removeItem(i);
                }
              }
            }catch(e){}
          }
          hasClear = 1; //记录已经被clear，不再执行存储满和清存储的操作
        },
        S = function(name, value){
          var isCross = false;//默认存在当前页面内
          if(typeof name == 'function'){
            run(name);
            return;
          }
          if(typeof name == 'object'){//新的本地存储支持跨域
            isCross = (typeof name.isCross == 'undefined' ? true : name.isCross);
            value = name.value;
            name = name.name;
          }
          var proxy = $('#' + id)[0],
            iframeWindow = (proxy && isCross && ready) ? proxy.contentWindow : window;
          try{
            if (iframeWindow.localStorage) { //For HTML5 : IE8+,FF3.5+,Chrome,Safari,Opera...
              if (value !== undefined) {
                iframeWindow.localStorage[name] = value;
              }
              else{
                if(noS){
                  iframeWindow.localStorage[name] = '';
                  return '';
                }
                else{
                  return iframeWindow.localStorage[name] || '';
                }
              }
            }
          }catch(e){
            if (!hasClear){
              //@todo 上报
              //要确保iframe代理页已经加载完成
              run(function(){
                clear(iframeWindow);
              });
            }
          }
          return '';
        };
      S.exec = function(){
        ready = 1;
        $.each(list, function(idx, o){
          if(typeof o == 'function'){
            o();
          }
        });
        list = [];
      };
      S.iframe = function(){
        //创建Iframe，本地存储用
        var sIframe = $(['<iframe id="', id , '" name="', id , '" src="http://d.auto.qq.com/proxy.html" onload="X.S.exec();" style="display:none"></iframe>'].join(''))[0];
        $(document.body).append(sIframe);
      };

      return S;
    })();

    /**
     * 路由层事件代理
     */
    X.evtProxy = (function(){
      var fakedom = $('<i style="display:none"></i>');
      $(document.body).append(fakedom);

      return {
        on : function(evt, fun){
          // $(fakedom).off(evt); //http://html-js.com/article/Nothing-blind-about-the-binding-of-DOM-events%203004
          $(fakedom).on(evt, function(e, options){
            fun(e, options);
          });
        },
        trigger : function(evt, data){
          $(fakedom).trigger(evt, data);
        }
      }
    }());

    /**
     * 图片裁剪
     * 
     * 
     */
    X.cutImg = (function(){
      return function(el, cfg){
        var parent = $(el).parent();

        $(parent).css('position', 'relative')
                .css('width', cfg.w0 ? cfg.w0 : '100%')
                .css('height', cfg.h0 ? cfg.h0 : '100%')
                .css('overflow', 'hidden');

        var w0 = $(parent).width();
        var h0 = $(parent).height();
        var w = $(el).width();
        var h = $(el).height();

        var top = (h0 - h)/2;
        $(el).css('position', 'relative')
            .css('top', top + 'px');
      }
    }());

    // =================================
    // ===============pjax==============
    // =================================
    /**
     * pjax(ajax + history.pushState) for jquery/zepto
     * https://github.com/welefen/pjax
     */
    var Util = {
      support : {
        pjax : window.history && window.history.pushState && window.history.replaceState && !navigator.userAgent.match(/(iPod|iPhone|iPad|WebApps\/.+CFNetwork)/),
        storage : !!window.localStorage
      },
      toInt : function(obj) {
        return parseInt(obj);
      },
      stack : {},
      getTime : function() {
        return new Date * 1;
      },
      // 获取URL不带hash的部分,切去掉pjax=true部分
      getRealUrl : function(url) {
        url = (url || '').replace(/\#.*?$/, '');
        url = url.replace('?pjax=true&', '?').replace('?pjax=true', '').replace('&pjax=true', '');
        return url;
      },
      // 获取url的hash部分
      getUrlHash : function(url) {
        return url.replace(/^[^\#]*(?:\#(.*?))?$/, '$1');
      },
      // 获取本地存储的key
      getLocalKey : function(src) {
        var s = 'pjax_' + encodeURIComponent(src);
        return {
          data : s + '_data',
          time : s + '_time',
          title : s + '_title'
        };
      },
      // 清除所有的cache
      removeAllCache : function() {
        if (!Util.support.storage)
          return;
        for ( var name in localStorage) {
          if ((name.split('_') || [ '' ])[0] === 'pjax') {
            delete localStorage[name];
          }
        }
      },
      // 获取cache
      getCache : function(src, time, flag) {
        var item, vkey, tkey, tval;
        time = Util.toInt(time);
        if (src in Util.stack) {
          item = Util.stack[src], ctime = Util.getTime();
          if ((item.time + time * 1000) > ctime) {
            return item;
          } else {
            delete Util.stack[src];
          }
        } else if (flag && Util.support.storage) { // 从localStorage里查询
          var l = Util.getLocalKey(src);
          vkey = l.data;
          tkey = l.time;
          item = localStorage.getItem(vkey);
          if (item) {
            tval = Util.toInt(localStorage.getItem(tkey));
            if ((tval + time * 1000) > Util.getTime()) {
              return {
                data : item,
                title : localStorage.getItem(l.title)
              };
            } else {
              localStorage.removeItem(vkey);
              localStorage.removeItem(tkey);
              localStorage.removeItem(l.title);
            }
          }
        }
        return null;
      },
      // 设置cache
      setCache : function(src, data, title, flag) {
        var time = Util.getTime(), key;
        Util.stack[src] = {
          data : data,
          title : title,
          time : time
        };
        if (flag && Util.support.storage) {
          key = Util.getLocalKey(src);
          localStorage.setItem(key.data, data);
          localStorage.setItem(key.time, time);
          localStorage.setItem(key.title, title);
        }
      },
      // 清除cache
      removeCache : function(src) {
        src = Util.getRealUrl(src || location.href);
        delete Util.stack[src];
        if (Util.support.storage) {
          var key = Util.getLocalKey(src);
          localStorage.removeItem(key.data);
          localStorage.removeItem(key.time);
          localStorage.removeItem(key.title);
        }
      }
    };

    // pjax
    var pjax = function(options) {
      options = $.extend({
        selector : '',
        container : '',
        callback : function() {},
        filter : function() {}
      }, options);
      if (!options.container || !options.selector) {
        throw new Error('selector & container options must be set');
      }
      $('body').delegate(options.selector, 'click', function(event) {
        if (event.which > 1 || event.metaKey) {
          return true;
        }
        var $this = $(this), href = $this.attr('href');
        // 过滤
        if (typeof options.filter === 'function') {
          if (options.filter.call(this, href, this) === true){
            return true;
          }
        }
        if (href === location.href) {
          return true;
        }
        // 只是hash不同
        if (Util.getRealUrl(href) == Util.getRealUrl(location.href)) {
          var hash = Util.getUrlHash(href);
          if (hash) {
            location.hash = hash;
            options.callback && options.callback.call(this, {
              type : 'hash'
            });
          }
          return true;
        }
        event.preventDefault();
        options = $.extend(true, options, {
          url : href,
          element : this,
          title: '',
          push: true
        });
        // 发起请求
        pjax.request(options);
      });
    };
    pjax.xhr = null;
    pjax.options = {};
    pjax.state = {};
    
    // 默认选项
    pjax.defaultOptions = {
      timeout : 2000,
      element : null,
      cache : 24 * 3600, // 缓存时间, 0为不缓存, 单位为秒
      storage : true, // 是否使用localstorage将数据保存到本地
      url : '', // 链接地址
      push : true, // true is push, false is replace, null for do nothing
      show : '', // 展示的动画
      title : '', // 标题
      titleSuffix : '',// 标题后缀
      type : 'GET',
      data : {
        pjax : true
      },
      dataType : 'html',
      callback : null, // 回调函数
      // for jquery
      beforeSend : function(xhr) {
        $(pjax.options.container).trigger('pjax.start', [ xhr, pjax.options ]);
        xhr && xhr.setRequestHeader('X-PJAX', true);
      },
      error : function() {
        pjax.options.callback && pjax.options.callback.call(pjax.options.element, {
          type : 'error'
        });
        location.href = pjax.options.url;
      },
      complete : function(xhr) {
        $(pjax.options.container).trigger('pjax.end', [ xhr, pjax.options ]);
      }
    };
    // 展现动画
    pjax.showFx = {
      "_default" : function(data, callback, isCached) {
        this.html(data);
        callback && callback.call(this, data, isCached);
      },
      fade: function(data, callback, isCached){
        var $this = this;
        if(isCached){
          $this.html(data);
          callback && callback.call($this, data, isCached);
        }else{
          this.fadeOut(500, function(){
            $this.html(data).fadeIn(500, function(){
              callback && callback.call($this, data, isCached);
            });
          });
        }
      }
    }
    // 展现函数
    pjax.showFn = function(showType, container, data, fn, isCached) {
      var fx = null;
      if (typeof showType === 'function') {
        fx = showType;
      } else {
        if (!(showType in pjax.showFx)) {
          showType = "_default";
        }
        fx = pjax.showFx[showType];
      }
      fx && fx.call(container, data, function() {
        var hash = location.hash;
        if (hash != '') {
          location.href = hash;
          //for FF
          if(/Firefox/.test(navigator.userAgent)){
            history.replaceState($.extend({}, pjax.state, {
              url : null
            }), document.title);
          }
        } else {
          window.scrollTo(0, 0);
        }
        fn && fn.call(this, data, isCached);
      }, isCached);
    }
    // success callback
    pjax.success = function(data, isCached) {
      // isCached default is success
      if (isCached !== true) {
        isCached = false;
      }
      //accept Whole html
      if (pjax.html) {
        data = $(data).find(pjax.html).html();
      }
      if ((data || '').indexOf('<html') != -1) {
        pjax.options.callback && pjax.options.callback.call(pjax.options.element, {
          type : 'error'
        });
        location.href = pjax.options.url;
        return false;
      }
      var title = pjax.options.title || "", el;
      if (pjax.options.element) {
        el = $(pjax.options.element);
        title = el.attr('title') || el.text();
      }
      var matches = data.match(/<title>(.*?)<\/title>/);
      if (matches) {
        title = matches[1];
      }
      if (title) {
        if (title.indexOf(pjax.options.titleSuffix) == -1) {
          title += pjax.options.titleSuffix;
        }
      }
      document.title = title;
      pjax.state = {
        container : pjax.options.container,
        timeout : pjax.options.timeout,
        cache : pjax.options.cache,
        storage : pjax.options.storage,
        show : pjax.options.show,
        title : title,
        url : pjax.options.oldUrl
      };
      var query = $.param(pjax.options.data);
      if (query != "") {
        pjax.state.url = pjax.options.url + (/\?/.test(pjax.options.url) ? "&" : "?") + query;
      }
      if (pjax.options.push) {
        if (!pjax.active) {
          history.replaceState($.extend({}, pjax.state, {
            url : null
          }), document.title);
          pjax.active = true;
        }
        history.pushState(pjax.state, document.title, pjax.options.oldUrl);
      } else if (pjax.options.push === false) {
        history.replaceState(pjax.state, document.title, pjax.options.oldUrl);
      }
      pjax.options.showFn && pjax.options.showFn(data, function() {
        pjax.options.callback && pjax.options.callback.call(pjax.options.element,{
          type : isCached? 'cache' : 'success'
        });
      }, isCached);
      // 设置cache
      if (pjax.options.cache && !isCached) {
        Util.setCache(pjax.options.url, data, title, pjax.options.storage);
      }
    };
    
    // 发送请求
    pjax.request = function(options) {
      options = $.extend(true, pjax.defaultOptions, options);
      var cache, container = $(options.container);
      options.oldUrl = options.url;
      options.url = Util.getRealUrl(options.url);
      if($(options.element).length){
        cache = Util.toInt($(options.element).attr('data-pjax-cache'));
        if (cache) {
          options.cache = cache;
        }
      }
      if (options.cache === true) {
        options.cache = 24 * 3600;
      }
      options.cache = Util.toInt(options.cache);
      // 如果将缓存时间设为0，则将之前的缓存也清除
      if (options.cache === 0) {
        Util.removeAllCache();
      }
      // 展现函数
      if (!options.showFn) {
        options.showFn = function(data, fn, isCached) {
          pjax.showFn(options.show, container, data, fn, isCached);
        };
      }
      pjax.options = options;
      pjax.options.success = pjax.success;
      if (options.cache && (cache = Util.getCache(options.url, options.cache, options.storage))) {
        options.beforeSend();
        options.title = cache.title;
        pjax.success(cache.data, true);
        options.complete();
        return true;
      }
      if (pjax.xhr && pjax.xhr.readyState < 4) {
        pjax.xhr.onreadystatechange = $.noop;
        pjax.xhr.abort();
      }
      pjax.xhr = $.ajax(pjax.options);
    };

    // popstate event
    var popped = ('state' in window.history), initialURL = location.href;
    $(window).bind('popstate', function(event) {
      var initialPop = !popped && location.href == initialURL;
      popped = true;
      if (initialPop) return;
      var state = event.state;
      if (state && state.container) {
        if ($(state.container).length) {
          var data = {
            url : state.url,
            container : state.container,
            push : null,
            timeout : state.timeout,
            cache : state.cache,
            storage : state.storage,
            title: state.title,
            element: null
          };
          pjax.request(data);
        } else {
          window.location = location.href;
        }
      }
    });

    // not support
    if (!Util.support.pjax) {
      pjax = function() {
        return true;
      };
      pjax.request = function(options) {
        if (options && options.url) {
          location.href = options.url;
        }
      };
    }
    // pjax bind to $
    X.pjax = pjax;
    X.util = X.pjax.util = Util;

    // =================================
    // ===========enhance ajax==========
    // =================================
    /**
     * @fileOverview 将普通 ajax 接口 promise 化，同时解决 ajax 请求互斥、新请求替代旧的管理功能
     * @author <a href="mailto:staurenliu@tencent.com">staurenliu</a>
     * @description 这个类使用起来有点纠结，没办法，这个提取出来的逻辑得有点杂，不过好在这个方法应该通
     *              常应该是用来扩展库中的ajax方法，写一次后，实际的调用就方便了，也还好吧
     * @example
     *
     * var promiseAjax = new PromiseAjax();
     * function startAjax(url, data) {
     *   var xhr,
     *     def = promiseAjax.getDeferred(url, {
     *       unique : true, //同一个url的请求只能同时存在一份
     *       newerPrior : true //新请求顶掉旧请求
     *     });
     *
     *   if (!promiseAjax.isRejected(def) { //如果是被拒绝，说明有请求在 blocking 中，不用真的发起请求
     *
     *      xhr = doRealAjax({//发起真正ajax请求
     *        url : url,
     *        data : data,
     *        success : function (data) {
     *          def.resolve(data); //成功
     *        },
     *        error : function (data) {
     *          def.reject(data); //失败
     *        }
     *      });
     *
     *      promiseAjax.setLoading(def, xhr);
     *   }
     *
     *   return def.promise();
     * }
     *
     */

    var PromiseAjax = (function () {
      'use strict';
      var Klass,
        MSG_LOAD_LOCK = 'lock',
        ATTR_LOADING_KEY = '_loading_key';

      Klass = function () {
        var rejectedDef = $.Deferred();
        rejectedDef.reject();

        this.rejectedDef = rejectedDef;
        this.loading = {};
      };

      /*
       * @param {String} url ajax request url base (the key for blocking-ajax)
       * @param {Object} options
       * @config {Mixed} unique only allow one request to be loading, set to true to use url
       *                 as key, or you could set a string as key for different urls
       * @config {Boolean} newerPrior set to true to abort the previous request, replace it with the
       *                   new one. default to false. (this option is available when unique is set)
       */
      Klass.prototype.getDeferred = function (url, options) {
        var loadingKey, lastReq,
          that = this,
          loadDef = $.Deferred();

        options = options || {};

        loadingKey = options.unique ? (options.unique === true ? url : options.unique) : false;

        if (loadingKey) {
          lastReq = this.loading[loadingKey];

          if (lastReq) {
            if (!options.newerPrior) {
              return this.rejectedDef;
            }
            lastReq[0].abort();
            lastReq[1].reject(MSG_LOAD_LOCK);
          }

          loadDef.always(function () {
            that.loading[loadingKey] = null;
          });

          loadDef[ATTR_LOADING_KEY] = loadingKey;
        }

        return loadDef;
      };

      Klass.prototype.setLoading = function (theDeferred, xhr) {
        var key = theDeferred[ATTR_LOADING_KEY];
        if (key) {
          this.loading[key] = [
            xhr, theDeferred
          ];
        }
      };

      Klass.prototype.isRejected = function (def) {
        return def === this.rejectedDef;
      };

      return Klass;
    }());

    /**
     * @fileOverview ajax跨子域请求 (Promise 格式接口)
     * @author <a href="mailto:staurenliu@tencent.com">staurenliu</a>
     * @example
     *   SubdomainAjax.promiseXhr(requestUrl).done(function (xhr) {
     *     //request with this 'xhr'
     *   });
     */

    //Cross sub-domain ajax helper
    var SubdomainAjax = (function (root) {
      var NAME_ROOT_API = 'GLOBAL_API',
        API_NAME = 'subdomainAjaxReady';

      return {

        ifrTmpl : '<iframe id="<%= id %>" name="<%= id %>" src="http://<%= host %>/proxy.html"' +
          'style="display:none" onload="setTimeout(function(){' + NAME_ROOT_API + '.' +
            API_NAME + '(\'' + '<%= id %>\');},50);"></iframe>',

        mapId2Host : {},

        loadedIframes  : {},//域名与跨域iframe id映射表

        pendingDefs : {},//域名与Deferred映射表

        ajaxQueue : {},//跨域ajax队列

        getXhrById : function (id) {
          var iframeId = '#' + id,
            ifr = $(iframeId)[0],
            xhr;

          if (ifr) {
            try {
              xhr = ifr.contentWindow.xmlHttp();
            } catch (ignore) {
            }
          }

          return xhr;
        },

        resolve : function (id, def) {
          var xhr = this.getXhrById(id);

          if (xhr) {
            def.resolve(xhr);
          } else {
            def.reject(xhr);
          }
        },

        ready : function (id) {
          var domain = this.mapId2Host[id];
          this.resolve(id, this.pendingDefs[domain]);
          this.pendingDefs[domain] = null;

          X.ajax.exec(domain);
        },

        promiseXhrByDomain : function (domain) {
          var ifr,
            that = this,
            uid = this.loadedIframes[domain],
            loadDef = $.Deferred();

          if (uid) {
            this.resolve(uid, loadDef);
          } else if (this.pendingDefs[domain]) {//iframe初始化未完成，第二个ajax请求又来了
            // @todo ajax并行时有问题，可能是iframe初始化工作未完成的原因
            // 如果iframe初始化还没有结束，第二次ajax过来时，应该先阻止resolve过程
            var _this = this;
            this.pendingDefs[domain].then(function (xhr) {
              console.log(_this.pendingDefs[domain]);
              loadDef.resolve(xhr);
            }, function () {
              loadDef.reject();
            });
          } else {
            uid = _.uniqueId('ajaxProxy_');
            this.mapId2Host[uid] = domain;
            ifr = $(X.txTpl(this.ifrTmpl, {
              id : uid,
              host : domain
            }));

            loadDef.done(function () {
              that.loadedIframes[domain] = uid;
            });

            $(function () {
              if (!root[NAME_ROOT_API]) {
                root[NAME_ROOT_API] = {};
              }
              root[NAME_ROOT_API][API_NAME] = $.proxy(SubdomainAjax.ready, SubdomainAjax);

              that.pendingDefs[domain] = loadDef;
              $('body').append(ifr);
            });
          }

          return loadDef.promise();
        },

        initIfr : function(url){
          var ifr,
            that = this,
            urlDetail = X.UrlParser.parse(url),
            domain = urlDetail.host,
            uid = this.loadedIframes[domain],
            loadDef = $.Deferred();

          if(uid){

          }
          else if(this.pendingDefs[domain]){

          }
          else{
            uid = _.uniqueId('ajaxProxy_'),
            this.mapId2Host[uid] = domain;
            ifr = $(X.txTpl(this.ifrTmpl, {
              id : uid,
              host : domain
            }));

            loadDef.done(function(){
              that.loadedIframes[domain] = uid;
            });

            $(function(){
              if(!root[NAME_ROOT_API]){
                root[NAME_ROOT_API] = {};
              }
              root[NAME_ROOT_API][API_NAME] = $.proxy(SubdomainAjax.ready, SubdomainAjax);

              that.pendingDefs[domain] = loadDef;
              $('body').append(ifr);
            });
          }
        },

        promiseXhr : function (url) {
          var urlDetail = X.UrlParser.parse(url),
            loadDef,
            promise;

          if (urlDetail.host === document.domain) {
            loadDef = $.Deferred();
            loadDef.resolve(undefined);
            promise = loadDef.promise();
          } else {
            promise = this.promiseXhrByDomain(urlDetail.host);
          }

          return promise;
        }
      };
    }(window));

    var promiseAjax = new PromiseAjax();
    X.ajax = function(options){
      var def, theXhr;
      var urlDetail = X.UrlParser.parse(options.url),
          url = options.url,
          host = urlDetail.host;

      options = options || {};

      options.dataType = options.dataType || 'json';

      def = promiseAjax.getDeferred(options.url, options);

      if(host != document.domain && !SubdomainAjax.loadedIframes[host]){
        if(!SubdomainAjax.ajaxQueue[host]){
          X.ajax.initIfr(url);
          SubdomainAjax.ajaxQueue[host] = [];
        }
        SubdomainAjax.ajaxQueue[host].push({
          def : def,
          options : options,
          theXhr : theXhr
        });
      }
      else{
        X.ajax.action({
          def : def,
          options : options,
          theXhr : theXhr
        });
      }

      def.abort = function () {
        if (theXhr) {
          theXhr.abort();
        }
        this.reject();
      };

      return def;
    };

    X.ajax.exec = function(domain){
      var queue = SubdomainAjax.ajaxQueue[domain];
      if(queue){
        var ajax = queue.shift();
        if(ajax){
          X.ajax.action(ajax);
          X.ajax.exec(domain);
        }
      }
    }

    X.ajax.action = function(ajax){
      var def = ajax.def,
          options = ajax.options,
          theXhr = ajax.theXhr;
      if (!promiseAjax.isRejected(def)) {
        SubdomainAjax.promiseXhr(options.url).then(function (xhr) {
          var oldSuccess = options.success,
            oldError = options.error;

          theXhr = xhr;

          options.xhr = function () {
            return xhr;
          };

          def.then(oldSuccess, oldError);

          options.success = function (resp) {
            if(resp){
              def.resolve(resp);
            } else {
              def.reject(resp);
            }
          };

          options.error = function (xhr, type) {
            var result;
            if (type === 'parsererror') {
              try {
                result = eval('(' + xhr.responseText + ')');
              } catch (ignore) {}
              if (result !== undefined) {
                options.success(result);
                return;
              }
            }
            def.reject(xhr.status, xhr.statusText);
          };

          $.ajax(options);

          promiseAjax.setLoading(def, xhr);

        }, options.error);
      }
    };

    // 初始化跨域iframe
    X.ajax.initIfr = function(url){
      SubdomainAjax.initIfr(url);
    };

    // extra
    if ($.event.props && $.inArray('state', $.event.props) < 0) {
      $.event.props.push('state');
    }

  }((typeof jQuery == 'undefined' ? null : jQuery) || (typeof Zepto == 'undefined' ? null : Zepto)));

  //依赖zepto.js的方法写在此处
  (function($){
    if(!$){
      return;
    }
    
    // 依赖zepto.history.js, sea.js
    // 基于History的页面跳转
    // 不支持History的，切换到SPA
    // 
    // @todo
    // ~ 页面共用body滚动条，当隐藏某页面之后，取消占位，滚动信息会被丢失
    X.Page = (function(){
      // tmpl - 页面模板（page壳 + 内容）
      // eventsMap - 事件代理
      // id - page id
      var tmpl = '<section class="page-wrap page-<%=pageId%>" data-id="<%=pageId%>"><section class="wrap scroll"><%=content%></section></section>';
      var that = {};
      var hEnabled = false && !!History && History.enabled;//是否支持History模式

      var His = (function(){
        var _that = {};

        if(hEnabled){
          History.Adapter.bind(window, 'statechange', function(){
            var State = History.getState();
            
            if(State.data.type){
              show(State.data.type, State);
            }
            else{
              hide();
            }
          });
        }

        function show(id, state){
          var appendPage = function(Page, pageTmpl){
            var body = $(X.txTpl(tmpl, {
              pageId : id,
              content : pageTmpl || 'here is content'
            }));
            $(document.body).append(body);
            hideExpectOne(id);

            Page.init(body);
          };

          if($('.page-' + id)[0]){
            $('.page-' + id).show();
            hideExpectOne(id);

            X.evtProxy.trigger('page_' + id + ':refresh', {
              body : $('.page-' + id + ' .wrap'),
              params : state.data.params
            });
          }
          else{
            seajs.use(state.data ? state.data.params.module : state.module, function(Page){
              var pageTmpl = (function(){
                if(typeof Page.tmpl == 'function' && !state.data.params.isPromise){
                  return Page.tmpl(state.data.params, id);
                }
                else{
                  return Page.tmpl;
                }
              }());
              
              if(typeof Page.tmpl == 'function' && state.data.params.isPromise){
                Page.tmpl(state.data.params, id).done(function(html){
                  appendPage(Page, html);
                });
              }
              else{
                appendPage(Page, pageTmpl);
              }

            });
          }
        }

        function hide(id){
          if(!id){
            $.each($('.page-wrap'), function(idx,el){
              $(el).hide();
            });
            $('.page-index').show();
          }
          else{
            $('.page-' + id).hide();
          }
        }

        function hideExpectOne(id){
          $.each($('.page-wrap'), function(idx,el){
            if($(el).data('id') != id){
              $(el).hide();
            }
          });
        }

        _that.push = function(id, cfg){
          var urlParams = X.UrlParser.parse().values;
          urlParams.page = id;
          var href = location.href.replace(/\?.*/, '') + '?' + X.obj2qs(urlParams);
          if(cfg.params.index){
            href = location.href;
            show(id, cfg.params);
          }
          else{
            History.pushState({type : id, params : cfg.params}, cfg.title || '', href);
          }
        };

        // History ready
        _that.ready = function(){
          //http://stackoverflow.com/questions/21792248/statechange-on-refresh-in-history-js
          if(History.getCurrentIndex() == 0){
            History.Adapter.trigger(window, 'statechange');
          }
        };

        return _that;
      }());

      // 根据公共api X.Page.push传入的参数
      // hash路由
      // 展示内容（module）
      // spa也依赖pushState
      var Spa = (function(){
        var _that = {};

        function show(id, params){
          if($('.page-' + id)[0]){
            $('.page-' + id).show();
            hideExpectOne(id);
          }
          else{
            seajs.use(params.module, function(Page){
              var body = $(X.txTpl(tmpl, {
                pageId : id,
                content : Page.tmpl || 'here is content'
              }));
              $(document.body).append(body);
              hideExpectOne(id);

              Page.init(body);

            });
          }
        }

        function hideExpectOne(id){
          $.each($('.page-wrap'), function(idx,el){
            if($(el).data('id') != id){
              $(el).hide();
            }
          });
        }

        _that.push = function(id, cfg){
          show(id, cfg.params);
        }

        return _that;
      }());

      /**
       * push page
       * @param  {String} id  页面id
       * @param  {Object} cfg 配置
       * @cfg {String} title 页面title
       * @cfg {Object} params 页面参数
       *      params.module 下个页面的js module
       *      module必须实现接口——
       *        tmpl：模板提供函数（支持string，function，promise）
       *        init：初始化函数
       */
      that.push = function(id, cfg){
        if(hEnabled){
          His.push(id, cfg);
        }
        else{
          Spa.push(id, cfg);
        }
      };

      that.back = function(id){
        if(hEnabled){
          History.back();
        }
        else{
          //@todo 隐藏当前page，显示上一个page
        }
      };

      that.ready = function(){
        if(hEnabled){
          His.ready();
        }
      }

      return that;
    }());

  }(typeof Zepto == 'undefined' ? null : Zepto));

}());
