/**
 * FiddlerConsole - js接口
 * 此文件需要与Fiddler插件FiddlerConsole配合使用,项目主页：https://github.com/aslinwang/fc
 * @example
 * 说明：
 *    默认调用——
 *    参数1~n - 要打印的值（字符串或对象）
 *    fc.log({a:1,b:2}, 'something string want to display');
 *
 *    带标识调用——
 *    参数1~n-1 - 要打印的值（字符串或对象）
 *    参数n - {fcflag:'print 1'} "print 1"为fc标识（字符串，可任意填写，便于在fiddler中找到该次打印对应的session） 
 *    fc.log('something want to display',{name:'aslin', age:'23', job:'code farmer'}, {fcflag:'print 1'});
 * 
 *    fc.enable = false//禁用此功能
 */
;

var Fc = (function(){
	var fc = {};
  var FC_URL = 'http://fiddler.fc.com';//自定义的不存在的域名。应该不存在吧。。
  var enable = true;
  var Flag_Count = 0;

  //ajax实现
  var ajax = (function(){
    var Xhr = (function(){
      var f;
      if(window.ActiveXObject){
        f = function() {return new ActiveXObject('Microsoft.XMLHTTP');};
      }
      else if(window.XMLHttpRequest){
        f = function() {return new XMLHttpRequest();};
      }
      else{
        f = function() {return ;};
      }
      return f;
    })();
    return function(o){
      var xhr = o.xhr || Xhr(),
        complete,
        timeout;
      xhr.onreadystatechange = function(){
        if(xhr){
          if(xhr.readyState == 1){
            if(o.timeout && o.fail){
              timeout = setTimeout(function(){
                if (!complete){
                  complete = 1;
                  o.fail();
                  xhr.abort();
                  xhr = null;
                }
              },o.timeout);
              o.timeout = 0;
            }
          }
          else if(xhr.readyState == 2){
            if (o.send){
              o.send();
            }
          }
          else if(xhr.readyState == 4 && !complete){
            complete = 1;
            if(xhr.status == 200){
              if(o.success){
                o.success(xhr.responseText);
              }
            }
            else{
              if(o.fail){
                o.fail();
              }
            }
            clearTimeout(timeout);
            xhr = null;
          }
        }
      };
      if(typeof o.data == 'object'){
        var data = [];
        for(var i in o.data){
          data.push(i + '=' + encodeURIComponent(o.data[i]));
        }
        o.data = data.join('&');
      }
      if(o.type == 'get'){
        if(o.data){
          o.url += (o.url.indexOf('?') == -1 ? '?' : '&') + o.data;
        }
        xhr.open('GET', o.url);
        xhr.send(null);
      }
      else{
        xhr.open('POST', o.url);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(o.data);
      }
      return xhr;
    };
  })();

  //解析参数
  var parseargs = function(data){
    var res = [];
    var flag = '';

    for(var i = 0; i < data.length; i++){
      if(typeof data[i] == 'object' && data[i].fcflag && i == data.length - 1){
        flag = data[i].fcflag;
      }
      else{
        res.push(data[i]);
      }
    }
    if(flag == ''){
      flag = Flag_Count;
      Flag_Count++;
    }

    return {
      flag : flag,
      value : JSON.stringify(res)
    }
  };

  /**
   * 打印log
   * @example
   *  fc.log('1','{name:'aslin',age:23}');//第一个参数为log标识，便于在Fiddler中识别
   * @return {[type]} [description]
   */
  fc.log = function(){
    if(!fc.enable){
      return;
    }
    if(arguments.length < 1){
      return;
    }
    var data = parseargs(arguments);
    ajax({
      url : FC_URL + '?flag=' + data.flag,
      data : {value : data.value},
      fail : function(){
        fc.enable = false;//可能不在Fiddler环境下运行，需要禁用此功能
      }
    });
  };

  fc.enable = enable;

  return fc;
})();

if(typeof window.define === 'function'){
  window.define('fc', [], function(){
    return Fc;
  });
}
if(window.MI){
  window.MI.define('lib/fc', function(){
    return Fc;
  });
}