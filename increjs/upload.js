/**
 * file uploader
 * @todo
 * 1、版本号冲突检测
 * 2、上传（cookie，post参数等）
 * 3、上传路径
 * 4、先上传全量文件、得到全量文件版本号之后，再修改增量文件版本号并上传
 * 5、上传过程中太慢，查一下
 * 6、提供覆盖上传功能
 *
 * @attention
 * 使用上传（腾讯CMS）checklist：
 * 1、修改increfile.js文件，重点是"cdnpath", "cdncsspath", "path_prefix", "csspath_prefix", "pathmap"字段
 * 2、cookie设置，此cookie应该有响应的上传权限
 */
var fs = require('fs');
var http = require('http');
var request = require('request');
var querystring = require('querystring');
var Gear = require('gearjs');
var colors = require('colors');

var Config = {};
var successList = [];

function printList(list, title){
  console.log(('  +++++++++++++++' + (title || 'list') + '+++++++++++++++').green);
  Gear._.each(list, function(file, key){
    console.log('  ', key + 1, '\t', file);
  });
  console.log('  ++++++++++++++++++++++++++++++++++++++++++++'.green);
}

//上传目录下的所有文件
//config
//{
//  cdnpath : '',
//  filePathMap : {
//    'page.js' : 'm/t/'
//  }
//}
function uploadDir(dir, idxs, config, callback){
  Config = config;
  Config.uploadDir = dir;
  var files = fs.readdirSync(dir);
  var tarFiles = [];//过滤之后的文件数组
  var sortFiles = [];
  var waiting = [];
  var all = (idxs == '0');//上传目录下所有文件

  idxs = Gear._.map(idxs, function(idx){
    return parseInt(idx, 10) - 1;
  });

  if(!all){
    Gear._.each(files, function(file, key){
      if(idxs.indexOf(key) != -1){
        tarFiles.push(file);
      }
    });
  }

  Gear._.each(all ? files : tarFiles, function(file, key){
    if(file.indexOf('$') == -1){//增量文件
      sortFiles.unshift(file);
    }
    else{
      sortFiles.push(file);
    }
  });

  Gear._.each(sortFiles, function(file, key){
    var noverfile = file.replace(/_\d{6}[a-zA-Z0-9]?(_\$)?/, '');
    var tmp = config.filePathMap[noverfile] + file;
    waiting.push({
      cdn : config.cdn,
      cdn_prefix : config.cdn_prefix,
      path : config.filePathMap[noverfile],
      file : file,
      noverfile : noverfile
    });
  });

  upload(waiting).done(function(verObj){
    if(callback){
      callback(verObj);
    }
    printList(successList, 'uploaded  list');
    successList = [];
  });
}

function listDir(dir){
  var files = fs.readdirSync(dir);
  printList(files, 'uploading list');
}

//获取上传列表中某文件的上传索引号(自然索引+1)
function indexOf(file, dir){
  var files = fs.readdirSync(dir);
  return files.indexOf(file) + 1;
}

//bpath,filename
var upload = (function(){
  var defer = Gear.q.defer();
  var verObj = {};//将全量文件的版本号存在这里

  //var cookie = 'PAS_COOKIE_PROJECT_AUTO=%u5185%u5BB9%u7BA1%u7406%u7CFB%u7EDF-%u6C7D%u8F66%u9891%u9053%7Chttp%3A//wizard2.webdev.com/tcms/%7Cauto; PAS_COOKIE_PROJECT_GROUP=|TCMS:auto:����Ƶ��|; PAS_COOKIE_SITENAME=auto; PAS_COOKIE_TICKET=90f6d2aa185240f6; PAS_COOKIE_USER=aslinwang; sitename=auto; sogou_switch=true';//TencentAuto Cookie
  //var cookie = 'PAS_COOKIE_PROJECT_AUTO=%u5185%u5BB9%u7BA1%u7406%u7CFB%u7EDF-%u623F%u4EA7%u9891%u9053%7Chttp%3A//wizard2.webdev.com/tcms/%7Chouse;PAS_COOKIE_PROJECT_GROUP=|TCMS:house:����Ƶ��|;PAS_COOKIE_SITENAME=house;PAS_COOKIE_TICKET=672441f2844ccb1c;PAS_COOKIE_USER=aslinwang;sitename=house;sogou_switch=true';//TencentHouse Cookie
  //var cookie = 'PAS_COOKIE_TICKET=d086538725ce05c1; PAS_COOKIE_USER=xhlv; sitename=www; PAS_COOKIE_SITENAME=www; PAS_COOKIE_PROJECT_AUTO=%u5185%u5BB9%u7BA1%u7406%u7CFB%u7EDF-%u817E%u8BAF%u9996%u9875%7Chttp%3A//wizard2.webdev.com/tcms/%7Cwww; PAS_COOKIE_PROJECT_GROUP=|TCMS:www:��Ѷ��ҳ|';//TencentWeibo Cookie

  /*这种方案，不能上传multipart/form-data数据
  var post = function(obj, callback){
    var options = {
      hostname : 'wizard2.webdev.com',
      path : '/cgi-bin/material/material_add',
      method : 'POST',
      headers : {'Cookie' : cookie}
    };

    var file = obj.file.replace(/(_\w*)_[0-9a-zA-Z]*\.js/, '$1_$.js');
    obj.path = 'mb/js/' + obj.path;

    Gear.fs.readFile(Config.uploadDir + file).done(function(code){
      var data = querystring.stringify({
        upfile : code,
        addmat : '1',
        defaultwater : '0',
        newname : obj.newname,
        overwrite : '1',
        path : obj.path,
        url : 'http://wizard2.webdev.com/cgi-bin/material/material_list?dir=' + obj.path,
        watermark : '0'
      });

      options.headers['Content-Length'] = data.length;

      var rets = '';

      var req = http.request(options, function(res){
        res.on('data', function(chunk){
          rets = rets + chunk;
        });
        res.on('end', function(){
          console.log(rets);
          if(callback){
            callback();
          }
        })
      });

      req.write(data);
      req.end();
      console.log(req);
    });
  }
  */

  //@todo 微博专用上传函数，其他使用者需要自己实现
  exports.uploadFun = true;//是否实现了cgi上传接口
  //解析上传api返回的数据（数据是一段script）
  var parseRes = function(body, file){
    if(body.indexOf('displaySucc') != -1){//上传成功
      console.log(('  Info : ' + file + ' upload success!').cyan);
      successList.push(file);
    }
    else if(body.indexOf('displayInfoByKey') != -1){//已经存在此文件
      console.log(('  Error : ' + file + ' is already exsit!').red);
    }
    else{//其他错误
      console.log(('  Error : ' + file + ' upload fail!').red);
    }
  }

  var getfile = function(file){
    return file.replace(/(_\d{6}[a-zA-Z]?)_\d{6}[a-zA-Z]?\.js/, '$1_$.js');
  }
  /*
   * newname : main-141002b.png
   * override : 1
   * addmat : 1
   * watermark : 0
   * defaultwater : 52
   * url : http://wizard2.webdev.com/cgi-bin/material/material_list?dir=css/mobi/sprite
   * path : css/mobi/sprite/
   */
  var post = function(obj, callback){
    var cookie = Config.cms_cookie;
    if(!cookie){//无cookie信息
      console.log('  Error : has no cookie when uploading!'.red);
      return;
    }

    var file = getfile(obj.file);//obj.file.replace(/(_\d{6}[a-zA-Z]?)_\d{6}[a-zA-Z]?\.js/, '$1_$.js');
    if(file.indexOf('.js') != -1){//js文件上传
      obj.path = Config.path_prefix + obj.path;
    }
    else if(file.indexOf('.css') != -1){//css文件上传
      obj.path = Config.csspath_prefix + obj.path;
    }
    if(obj.cdn_prefix){
      obj.path = obj.cdn_prefix + obj.path;
    }

    var options = {
      url : 'http://wizard2.webdev.com/cgi-bin/material/material_add',
      headers : {
        'Cookie' : cookie
      }
    };

    console.log('  Info : uploading ' + obj.newname);
    var r = request.post(options, function(err, res, body){
      if(err){
        console.log(('  Error : ' + err).red);
      }
      else{
        parseRes(body, obj.newname);
        
        if(callback){
          callback();
        }
      }
    });

    var form = r.form();
    form.append('upfile', fs.createReadStream(Config.uploadDir + file));
    form.append('addmat', '1');
    form.append('defaultwater', '0');
    form.append('newname', obj.newname);
    form.append('overwrite', obj.isnoVer ? '0' : '1');//控制是否覆盖上传 1 - 否 0 - 是
    form.append('path', obj.path);
    form.append('url', 'http://wizard2.webdev.com/cgi-bin/material/material_list?dir=' + obj.path);
    form.append('watermark', '0');
  }

  var action = function(queue, callback){
    var obj = queue.shift();
    if(obj){
      if(obj.file.indexOf('$') !== -1){//增量文件 更新文件名
        obj.file = obj.file.replace('$', verObj[obj.noverfile]);
      }
      if(Config.pathmap && Config.pathmap[obj.path]){//本地路径与cdn路径映射
        obj.path = Config.pathmap[obj.path];
      }

      rename(obj).done(function(fileObj){
        var file = fileObj.file;
        var ver = file.match(/\d{6}[a-zA-Z0-9]?/g);
        if(ver){
          ver = ver[0];
        }
        verObj[obj.noverfile] = ver;
        obj.newname = file;

        obj.isnoVer = fileObj.isnoVer;//此文件是否没有版本配置信息

        //do post
        post(obj, function(){
          //remove file
          var file = getfile(obj.file);//obj.file.replace(/(_\d{6}[a-zA-Z]?)_\d{6}[a-zA-Z]?\.js/, '$1_$.js');
          file = Config.uploadDir + file;
          fs.unlinkSync(file);

          action(queue, callback);
        });
      });
    }
    else{
      if(callback){
        callback();
      }
    }
  }
  return function(queue){
    action(queue, function(){
      defer.resolve(verObj);
    });
    return defer.promise;
  }
}());

//检测cdn上是否有此文件，有则改名
function rename(obj){
  var defer = Gear.q.defer();
  var suffix = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  var isnoVer = obj.file.match(/_\d{6}\w?\.(js|css|png)/);//是否不做版本控制
  isnoVer = isnoVer ? false : true;
  var cdnpath = '';

  if(obj.file.indexOf('.js') != -1){
    cdnpath = Config.cdnpath;
  }
  else if(obj.file.indexOf('.css') != -1){
    cdnpath = Config.cdncsspath;
  }

  if(obj.cdn){
    cdnpath = obj.cdn;
  }

  //pos为suffix串中游标
  function check(pos, callback){
    if(pos == suffix.length){
      if(callback){
        callback('');
      }
    }
    else{
      var f = suffix.slice(pos, pos + 1);
      var file = obj.file.replace(/(\.(js|css|png))$/, f + '$1');
      var url = cdnpath + obj.path + file;
      request.get(url, function(err, res, body){
        var colorfull = '';
        if(res.statusCode == 200){
          check(pos + 1, callback);
          colorfull = ('' + res.statusCode).green;
        }
        else{//不存在
          if(callback){
            callback(file);
          }
          colorfull = ('' + res.statusCode).red;
        }
        console.log('  Info : fetch ' + url + ' ' + colorfull);
      });
    }
  }

  console.log('  Info : get version of ' + obj.noverfile);

  if(isnoVer){
    defer.resolve({
      file : obj.file, 
      isnoVer : true
    });
  }
  else{
    check(-1, function(file){
      if(file == ''){
        defer.reject(file + '`s versions are too much!');
      }
      else{
        defer.resolve({
          file : file, 
          isnoVer : false
        });
      }
    });
  }

  return defer.promise;
}

exports.uploadDir = uploadDir;
exports.listDir = listDir;
exports.indexOf = indexOf;
