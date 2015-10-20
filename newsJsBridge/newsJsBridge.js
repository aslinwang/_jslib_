/**
 * 新闻客户端jsBridge
 * 
 */
define(function(require, exports, module){
  var publicName = 'QQCar';
  var context = window;
  var callType;

  /**
   * 版本号
   */
  var version = "1.0";

  /**
   * 系统声明和可以调用的方法
   */
  var declaredPublicMethods = [
    'setTitle',
    'startShare',
    'checkCanShare',
    'setGestureQuit',
    'getGestureQuit',
    'zoomImageSrc'
  ];

  /**
   * 全局对象
   */
  var T = {};

  /**
   * 一个数组用来存储回调函数
   */
  T.callBackQueue = [];

  /**
   * 临时变量
   */
  var S = Array.prototype.slice;
  var ua = navigator.userAgent;

  /**
   * 获取Chrome浏览器的版本号
   * @name Q.chrome
   * @example
     Q.firefox
   * @return {Number} Chrome浏览器的版本号，如果是0表示不是此浏览器
   */

  function getNewsVersion() {
    var tem = ua.match(/qqnews\/([\.\d]+)/i);
    return tem && tem[1] ? tem[1] : "0.0.0";
  };
  
  function isAndroid() {
    return /android/i.test(ua) ? true : false;
  }

  /**
   * 版本比较
   */
  function versionCompare(v1, v2, options) {
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
  }

  /**
   * 异步回调处理函数
   */
  T.javascriptBridgeCallBack = function() {
    var params = S.call(arguments, 0);
    var index = Nubmer(params.shift());
    T.callBackQueue[index].apply(this, params);
  };

  /**
   * 参数数据转化成所需的Json字符串
   */
  function arrayToJsonString(paramsArray) {
    var typeArray = [];
    var method = paramsArray.shift();
    var n = paramsArray.length;
    for (var i = 0; i < n; i++) {
      var params = paramsArray[i];
      var type = typeof params;
      if(params == null) {
        typeArray[typeArray.length] = "string";
      } else {
        typeArray[typeArray.length] = type;
      }
      if (type == "function") {
        var d = T.callBackQueue.length;
        T.callBackQueue[d] = params;
        paramsArray[i] = d;
      }
    }
    return JSON.stringify({
      method: method,
      types: typeArray,
      args: paramsArray,
      instanceName: publicName
    });
  }

  /**
   * webview代码中通过监听onLoadResource触发调用Java方法
   */
  function resourceCall() {
    var paramsArray = S.call(arguments, 0);
    var img = new Image();
    img.onload = function() {
      img = null;
    };
    img.src = 'jsbridge://get_with_json_data?json=' + encodeURIComponent(arrayToJsonString(paramsArray));
  }

  /**
   * 通过prompt调用Java对象方法
   */
  function promptCall() {
    var paramsArray = S.call(arguments, 0);
    var jsonResult = prompt(arrayToJsonString(paramsArray));
    var re = JSON.parse(jsonResult);
    if (re.code != 200) {
      throw "call error, code:" + re.code + ", message:" + re.result;
    }
    return re.result;
  }

  /**
   * 此处QQCar跟java代码调用实例名一致
   */
  if (true || isAndroid() && typeof context[publicName] == "undefined" && !context[publicName] && versionCompare(getNewsVersion(), "4.4.5") > 0) {
    declaredPublicMethods.forEach(function(d) {
      T[d] = function() {
        switch (callType) {
          case 1:
            return resourceCall.apply(T, [d].concat(S.call(arguments, 0)));
          default:
            return promptCall.apply(T, [d].concat(S.call(arguments, 0)));
        }
      }
    });
    context[publicName] = T;
  }
});