'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @name    iplayer视频播放器
 * @desc    一款使用HTML5新技术打造的浏览器端视频播放器，主持目前主流视频格式
 * @version v0.0.1
 * @author  xiugang
 */
;(function (window) {
    var iplayer = function iplayer(config) {
        if (!config) {
            return this.errorTips('iplayer init failed, config params does not exist! ');
        }
        // 初始化播放器内核
        this._init(config);
    };

    iplayer.prototype = {
        /***********************************参数配置**********************************/
        // 全局变量；Object；播放器的基本配置参数；
        config: {
            videoClick: true, // 是否支持单击播放/暂停功能
            videoDbClick: true, // 是否支持双击全屏/退出全屏
            errorTime: 100, // 延迟判断失败的时间，单位：毫秒
            videoDrawImage: false // 是否使用drawImage功能
        },
        // 播放器的内部的默认参数配置，用户输入参数之后，进行相应的转换
        iplayerConfig: {
            playerName: 'iplayer', // 播放器名称
            container: '', // 视频容器的ID
            flashPlayer: false, // 是否强制使用flashPlayer播放视频,
            video: '' // 视频的播放信息
        },
        // 全局变量；Object; 模拟双击功能的计时器
        timerClick: null,
        // 全局变量；Boolean; 模拟双击功能的判断
        isClick: false,
        // 全局变量；Object; 存储标准化之后的参数的结果
        vars: {},
        // 全局变量; Boolean; 是否使用video标签播放
        html5Video: true,
        // 全局变量；Int；参数大于0的时候就进行跳转
        needSeek: 0,
        // 全局变量；Boolean；是否为m3u8视频格式
        isM3u8: false,
        // 全局变量；Object; 视频地址，类型，清新度
        VA: [],
        // 全局变量；Object; 播放器对象
        V: null,
        /***********************************私有函数**********************************/
        // 参数初始化入口
        _init: function _init(config) {
            // 1. 参数校验
            if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
                this.errorTips('The type of config params is not a object!');
            }
            // 2. 开始将用户输入的参数转换为player内核参数
            this.vars = this.standardization(this.iplayerConfig, config);
            // 3. 判断浏览器支持的视频格式
            if (!this.supportVideo() && this.vars['flashplayer']) {
                // 如果用户强制开启了使用flashplayer 的话
                this.html5Video = false;
            }
            // 4. 没有视频地址的话无法播放
            if (!this.vars['video']) {
                this.errorTips('The play url of video is not exist!');
            }
            this._AnalyzeVideoUrl(this.vars['video']);
            // 5. 支持链式访问视频对象
            return this;
        },
        _AnalyzeVideoUrl: function _AnalyzeVideoUrl(video) {
            if (typeof video === 'string') {
                // 1. video就是视频的播放地址
                this.VA = [[video, '', '', 0]];
                // 2. 获取文件的后缀名称信息
                var ext = this._getVideoExtension(video);
                switch (ext) {
                    case ".mp4":
                        this.VA[0][1] = 'video/mp4';
                        break;
                    case ".ogg":
                        this.VA[0][1] = 'video/ogg';
                        break;
                    case ".webm":
                        this.VA[0][1] = 'video/webm';
                        break;
                    default:
                        break;
                }
                // 开始获取当前的视频
                this._getVideo();
            } else if ((typeof video === 'undefined' ? 'undefined' : _typeof(video)) === 'object') {} else {
                this.errorTips('Video object format error!');
            }
        },
        _getVideoExtension: function _getVideoExtension(path) {
            var ext = '';
            if (path) {
                // 获取http://example.com/a.1.1.1.mp4?前面的内容信息
                if (path.indexOf('?') !== -1) {
                    path = path.split('?')[0];
                }
                ext = '.' + path.replace(/.+\./, '');
            }
            return ext;
        },
        _getVideo: function _getVideo() {
            // 1.开始构建视频播放器
            var container = this.getDOMElement(this.vars['container']);
            if (!container) {
                this.errorTips('get video container failed!');
            }
            // 2. 获取类名
            var playerID = this.vars['playerName'] + '-' + this.getRandomString();
            var playerDiv = document.createElement('div');
            playerDiv.className = playerID;
            container.appendChild(playerDiv);

            // 3. 开始构建
            this.css(container, {
                backgroundColor: '#000000',
                overflow: 'hidden',
                position: 'relative'
            });
            this.css(playerDiv, {
                backgroundColor: '#000000',
                width: '100%',
                height: '100%',
                fontFamily: 'Microsoft YaHei", YaHei, "\u5FAE\u8F6F\u96C5\u9ED1", SimHei,"\\5FAE\\8F6F\\96C5\\9ED1", "\u9ED1\u4F53",Arial'
            });
            // 4. 根据浏览器支持的视频类型，判断使用哪种方式来实现构建
            var src = '',
                source = '',
                poster = '',
                loop = '',
                autoplay = '',
                track = '';
            if (this.html5Video) {
                // 使用HTML5的video标签来实现
                // 禁止鼠标选择文本
                playerDiv.onselectstart = playerDiv.ondrag = function () {
                    return false;
                };
                // 构建video播放器
                if (this.VA.length === 1) {
                    src = 'src=' + this.VA[0][0];
                } else {
                    /*
                    <video>
                        <source src='' type=''></source>
                        <source src='' type=''></source>
                        <source src='' type=''></source>
                    </video>
                    */
                    // 1. 将原来的数组深拷贝一份
                    var videoArr = this.VA.slice(0);
                    videoArr.sort(function (a, b) {
                        return a - b;
                    });
                    for (var i = 0, len = videoArr.length; i < len; i++) {
                        var type = '';
                        var va = videoArr[i];
                        va[1] && (type = 'type=' + va[1]);
                        source += '<source src=' + va[0] + ' ' + type + '>';
                    }
                }
                // 2. 其他参数
                this.vars['autoplay'] && (autoplay = 'autoplay=' + this.vars['autoplay']);
                this.vars['poster'] && (poster = 'poster="' + this.vars['poster'] + '"');
                this.vars['loop'] && (loop = 'loop=' + this.vars['loop']);
                this.vars['seek'] && (this.needSeek = this.vars['seek']);
                if (this.vars['track'] != null && this.vars['chtrack'] == null) {
                    // <track src="cn_track.vtt" srcLang="zh-cn" label="简体中文" kind="caption">
                    // 字幕功能
                }
                console.log(autoplay, poster, loop, this.vars);
                // 其他视频格式的处理(m3u8)
                var vid = this.getRandomString();
                var html = '';
                if (!this.isM3u8) {
                    // playsinline在移动端可以默认实现全屏播放的
                    html = '<video id="' + vid + '" ' + src + ' width="100%" height="100%" ' + autoplay + ' ' + poster + ' ' + loop + ' webkit-playsinline="true" playsinline>' + source + '</video>';
                } else {
                    html = '<video id="' + vid + '" width="100%" height="100%" ' + autoplay + ' ' + poster + ' ' + loop + ' webkit-playsinline="true" playsinline>' + track + '</video>';
                }
                playerDiv.innerHTML = html;
                // 获取当前的video对象
                this.V = this.getDOMElement('#' + vid);
                this.V.volume = this.vars['volume'];
                this.css(this.V, 'backgroundColor', '#000000');

                // 使用canvas实现自定义的组件的绘制功能
                if (this.config.videoDrawImage) {
                    var canvasID = 'icanvas' + this.getRandomString();
                    var canvasDiv = document.createElement('div');
                    canvasDiv.className = canvasID;
                    playerDiv.appendChild(canvasDiv);
                    this.css(canvasDiv, {
                        backgroundColor: '#000000',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        display: 'none',
                        cursor: 'pointer',
                        left: '0',
                        top: '0',
                        zIndex: '10'
                    });
                    var cvid = 'icanvas' + this.getRandomString();
                    canvasDiv.innerHTML = this._getCanvas(cvid, playerDiv.offsetWidth, playerDiv.offsetHeight);
                    var canvas = this.getDOMElement(cvid);
                    var context = canvas.getContext('2d');
                }
                // 添加播放器的事件
                this._addEvent();
            } else {
                // 使用flash实现的播放器来实现

            }
        },
        _getCanvas: function _getCanvas(id, width, height) {
            return '<canvas class="' + id + '" width="' + width + '" height="' + height + '"> Yours browser dose not support canvas </canvas>';
        },
        _addEvent: function _addEvent() {
            var _this = this;

            // 监听视频的单击事件
            var eventVideoClick = function eventVideoClick() {
                _this._videoClick();
            };
        },
        _videoClick: function _videoClick() {
            var _this2 = this;

            var clearTimerClick = function clearTimerClick() {
                if (_this2.timerClick != null) {
                    _this2.timerClick.running ? _this2.timerClick.stop() : _this2.timerClick = null;
                }
            };
            var timerClickFun = function timerClickFun() {
                clearTimerClick();
                _this2.isClick = false;
                _this2.playOrPause();
            };
            clearTimerClick();
            if (this.isClick) {
                this.isClick = false;
                if (this.config.videoDbClick) {}
            } else {
                this.isClick = true;
                this.timerClick = new this.timer(300, timerClickFun, 1);
            }
        },

        /***********************************接口函数**********************************/
        _playOrPause: function _playOrPause() {
            if (this.config.videoClick) {
                // 支持点击切换功能的话
                if (this.V == null) {
                    return;
                }
                this.V.paused ? this._play() : this._pause();
            }
        },
        _play: function _play() {
            if (this.V) {
                this.playerType === 'html5video' ? this.V.play() : null;
            }
        },
        _pause: function _pause() {
            if (this.V) {
                this.playerType === 'html5video' ? this.V.pause() : null;
            }
        },

        /***********************************公共函数**********************************/
        /**
         * 错误信息提示
         * @param err
         */
        errorTips: function errorTips(err) {
            // 不是开发模式的话，直接返回
            console.error(err);
        },

        /**
         * 标准化用户输入的配置参数信息
         * @param s
         * @param d
         */
        standardization: function standardization(s, d) {
            var obj = {};
            // 1. 先把原始的对象参数s深拷贝一份(deep clone)
            for (var k in s) {
                if (s.hasOwnProperty(k)) {
                    obj[k] = s[k];
                }
            }
            // 2. 把用户输入的参数d进行处理
            for (var _k in d) {
                // 3. 进行参数校验处理（必须符合预期的数据类型）
                var type = _typeof(obj[_k]);
                switch (type) {
                    case "number":
                        obj[_k] = parseFloat(d[_k]);
                        break;
                    case 'string':
                        if (typeof d[_k] !== 'string' && typeof d[_k] != null) {
                            // 其他类型
                            obj[_k] = d[_k].toString();
                        } else {
                            // 字符串类型
                            obj[_k] = d[_k];
                        }
                    default:
                        obj[_k] = d[_k];
                }
            }
            return obj;
        },
        supportVideo: function supportVideo() {
            var videoConfig = {
                oggTest: 'video/ogg; codecs="theora, vorbis"',
                h264Test: 'video/mp4;codecs="avc1.42E01E, mp4a.40.2"',
                webmTest: 'video/webm; codecs="vp8.0, vorbis"'
            };
            // 通过动态创建一个video标签，获取参数的类型
            var video = document.createElement('video');
            if (video && video.canPlayType) {
                // 开始检查支持的类型
                for (var type in videoConfig) {
                    var res = video.canPlayType(videoConfig[type]);
                    if (res && res === 'probably') {
                        return true;
                    }
                }
            }
            return false;
        },
        getRandomString: function getRandomString(len) {
            len = len || 16;
            var chars = 'abcdefghijklmnopqrstuvwxyz';
            var maxLen = chars.length;
            var val = '';
            for (var i = 0; i < len; i++) {
                // 每次随机从字符串数组中取出来一个字符
                val += chars.charAt(Math.floor(Math.random() * maxLen));
            }
            return val;
        },
        getDOMElement: function getDOMElement(selector, parent) {
            parent = parent || document;
            // 统一转换为字符串进行查询
            var res = parent.querySelectorAll(selector + '');
            return res[0];
        },

        /**
         * 功能：修改样式或获取指定样式的值，
         示例一：
         this.css(ID,'width','100px');
         示例二：
         this.css('id','width','100px');
         示例三：
         this.css([ID1,ID2,ID3],'width','100px');
         示例四：
         this.css(ID,{
        width:'100px',
        height:'100px'
        });
         示例五(获取宽度)：
         var width=this.css(ID,'width');
         * @param ele ID对象或ID对应的字符，如果多个对象一起设置，则可以使用数组
         * @param attr 样式名称或对象，如果是对象，则省略掉value值
         * @param val attribute为样式名称时，定义的样式值
         */
        css: function css(ele, attr, val) {
            if (Array.isArray(ele)) {
                // 数组的话
                for (var i = 0, len = ele.length; i < len; i++) {
                    var el = void 0;
                    if ((typeof el === 'undefined' ? 'undefined' : _typeof(el)) !== 'object') {
                        el = this.getDOMElement(ele[i]);
                    } else {
                        el = ele[i];
                    }
                    // 开始对el设置属性
                    if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === 'object') {
                        for (var k in attr) {
                            attr[k] && (el.style[k] = attr[k]);
                        }
                    } else {
                        val && (el.style[attr] = val);
                    }
                }
            } else {
                // 如果是一个字符串的话
                if ((typeof ele === 'undefined' ? 'undefined' : _typeof(ele)) !== 'object') {
                    // 字符串的话，先转换为DOM元素
                    ele = this.getDOMElement(ele);
                }
                // 开始根据参数进行取出来/设置值
                if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === "object") {
                    for (var _k2 in attr) {
                        attr[_k2] && (ele.style[_k2] = attr[_k2]);
                    }
                } else {
                    if (!val && ele.style[attr]) {
                        return ele.style[attr];
                    } else {
                        val && (ele.style[attr] = val);
                    }
                }
            }
        },

        /**
         * 计时器函数
         * @param time 计时时间（毫秒）
         * @param fn 接受函数
         * @param number 运行次数
         */
        timer: function timer(time, fn, number) {}
    };

    // 函数入口
    window.iplayer = iplayer;
})(window);