/**
 * @name    iplayer视频播放器
 * @desc    一款使用HTML5新技术打造的浏览器端视频播放器，主持目前主流视频格式
 * @version v0.0.1
 * @author  xiugang
 */
;(function (root, factory) {
    // env: global define moudle
    if (typeof module === 'object' && typeof module.exports === 'object') {
        // NodeJS CommonJS Specification
        module.exports = factory(root, document);
    } else if (typeof define === 'function' && define.amd) {
        // AMD Specification
        define([], function () {
            return factory(root, document);
        });
    } else {
        // Browser globals(root is window)
        root.IPlayer = factory(root, document);
    }
}(typeof window !== "undefined" ? window : this, function (window) {
    "use strict";
    /******************************************Common Utils********************************************/
    let utils = {
        each: function (obj, iterator, context) {
            if (obj == null) return;
            if (obj.length === +obj.length) {
                for (let i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === false)
                        return false;
                }
            } else {
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (iterator.call(context, obj[key], key, obj) === false)
                            return false;
                    }
                }
            }
        },
        extend: function (prop) {
            Array.prototype.slice.call(arguments, 1).forEach(function (source) {
                for (let key in source) {
                    if (source.hasOwnProperty(key)) {
                        prop[key] = source[key];
                    }
                }
            });
            return prop;
        },
        error: function (msg) {
            console.error(msg);
        }
    };

    /**
     * 类型判断方法
     * eg:
     * utils.isString(str)
     * utils.isDate(date)
     */
    ['String', 'Function', 'Array', 'Number', 'RegExp', 'Object', 'Date'].forEach(function (v) {
        utils['is' + v] = function (obj) {
            return {}.toString.call(obj) === "[object " + v + "]";
        };
    });

    /******************************************Virtual DOM********************************************/
    class Vm {
        constructor(tagName, props = {}, children = []) {
            if (!(this.tagName = tagName)) return;
            this.props = props;
            this.children = children;
        }

        render() {
            let self = this;
            let node = document.createElement(this.tagName),
                props = this.props, // {class: 'play-btn control-btn'}
                children = this.children;

            for (let key in props) {
                if (/^on[A-Za-z]/.test(key)) {
                    let eventType = key.toLowerCase().replace('on', '');
                    // 放入自己的事件监听队列里面（订阅事件）
                    self.addListener(node, eventType, props[key]);
                } else if (/^style/.test(key) && props[key] && typeof props[key] === 'object') {
                    // {style: {color : 'red'}}
                    for (let k in props[key]) {
                        node.style[k] = props[key][k];
                    }
                } else if (/^text/.test(key) && typeof props[key] === 'string') {
                    node.textContent = props[key];
                } else {
                    // 字符串的处理
                    node.setAttribute(key, props[key]);
                }
            }

            children.forEach(function (child) {
                if (Array.isArray(child)) {
                    // beforeEnd插入到标签结束标记前
                    child.forEach(function (item) {
                        item && (item instanceof HTMLElement ? node.appendChild(item) : node.insertAdjacentHTML('beforeend', item));
                    })
                } else {
                    child && (child instanceof HTMLElement ? node.appendChild(child) : node.insertAdjacentHTML('beforeend', child));
                }
            });
            return node;
        }

        /**
         * 为element元素添加事件
         * @param element 目标元素
         * @param event 事件类型
         * @param listener 回调函数
         */
        addListener(element, event, listener) {
            let self = this;
            if (!this.hasOwnProperty('listeners')) {
                this.listeners || (this.listeners = {});
            }
            self.listeners[event] || (self.listeners[event] = []);
            self.listeners[event].push(listener);
            element.addEventListener(event, listener);
        }

        /**
         * 为element 元素移出event事件
         * @param element 目标元素
         * @param event 事件类型
         * @param listener 监听回调
         * @returns {boolean}
         */
        removeListener(element, event, listener) {
            let self = this, list;
            list = self.listeners != null ? self.listeners[event] : void 0;
            if (!list) return;
            if (!listener) return delete self.listeners[event];
            list.forEach(function (handler, i) {
                if (!(handler === listener)) return;
                element.removeEventListener(event, handler)
                list.splice(i, 1);
                self.listeners[event] = list;
            });
        }
    }

    /**
     * eg: 使用VDOM创建元素
     * vm('div', {style : {color : 'res'}, class : 'icon'}, [...])
     * @param tagName
     * @param props
     * @param children
     * @returns {any}
     */
    let vm = function (tagName, props, children) {
        return new Vm(tagName, props, children).render();
    }

    /******************************************Player kernel********************************************/
    // 默认的配置参数
    let defaults = {
            source: '',
            poster: '',
            muted: false,
            width: '600px',
            height: '400px',
            autoplay: true,
            currentTime: 0
        };
    let IPlayer = function (element, options) {
        this._init(element, options);
    }
    IPlayer.prototype = {
        _init: function (element, options) {
            // 0. all buttons
            this.btns = {};
            // 1. 用户输入参数标准化处理
            this._standardization(element, options)
            // 2. 构建播放器界面
            this._buildControls();
            // 3. 监听事件
            this._bindEvents();
        },
        _standardization: function (element, options) {
            // container
            element = utils.isObject(element) ? element : document.getElementById(element);
            if (!element) {
                return utils.error('container can not be null!')
            }
            // handle user-enterd params
            utils.extend(defaults, options);
            this.media = vm('video', {
                src: defaults.source,
                poster: defaults.poster,
                width : defaults.width,
                height : defaults.height
            });
            this.css(element, {
                width: defaults.width,
                height: defaults.height,
                backgroundColor: 'rgb(0, 0, 0)',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: `Microsoft YaHei", YaHei, "微软雅黑", SimHei,"\\5FAE\\8F6F\\96C5\\9ED1", "黑体",Arial`
            });
            this.wrap = element;

            // remove video default attributes
            this.media.removeAttribute('controls');
            this.media.removeAttribute('muted');
            this.wrap.appendChild(this.media);
        },
        _buildControls : function () {
            let bWidth = 38,                        //按钮的宽
                bHeight = 38;                       //按钮的高
            let bBgColor = '#FFFFFF',               //按钮元素默认颜色
                bOverColor = '#0782F5';             //按钮元素鼠标经过时的颜色
            let timeInto = '00:00 / 00:00';         //时间显示框默认显示内容

            // 获取所有的控件
            let controls = this.getControls();
            this.control = vm('div', {
                style : {
                    width: '100%',
                    height: bHeight + 'px',
                    backgroundColor: '#000000',
                    position: 'absolute',
                    bottom: '0px',
                    filter: 'alpha(opacity:0.8)',
                    opacity: '0.8',
                    zIndex: '90'
                }
            }, [
                controls.play,
                controls.pause,
                controls.last,
                controls.next
            ]);
            this.wrap.appendChild(this.control);

            // 挂载所有的控件信息
            this.controls = controls;

            // 绘制控件
            this._drawControls(controls);

        },
        _bindEvents : function () {
            let self = this;
            this.media.addEventListener('loadeddata', function () {
                // self.btns.currenttime.textContent = timeCount(this.currentTime);
                // self.btns.duration.textContent = timeCount(this.duration);
                this.volume = 0.6;
                self.loadeddata = true;

                // 跳转到指定位置
                // self.seek(defaults.currentTime);

                if (defaults.autoplay) {
                    // self._play();
                }
                if (defaults.muted) {
                    self.media.muted = false;
                    // self.mute(true);
                    // self.volume(0);
                    // self.btns.voicePoint.style.left = '0%';
                    // self.btns.voiceVed.style.left = '0%';
                }
                console.log('loaded')
            });

            this.media.addEventListener('play', function () {
                // self.emit('play');
                console.log('play')
            });

            this.media.addEventListener('pause', function () {
                // self.loading.classList.remove('show');
                // self.emit('pause');
                console.log('pause')
            });


            // 视频正在缓冲
            this.media.addEventListener('seeking', function () {
                // self.loading.classList.add('show');
                // self.emit('seeking');
                console.log('seeking')
            });

            // 视频缓冲完毕
            this.media.addEventListener('seeked', function () {
                // self.loading.classList.remove('show');
                // self.emit('seeked');
                console.log('seeked')
            });
        },
        _canvasFill : function(context, path){
            context.beginPath();
            for (let i = 0, len = path.length; i < len; i++) {
                let d = path[i];
                if (i > 0) {
                    context.lineTo(d[0], d[1]);
                } else {
                    context.moveTo(d[0], d[1]);
                }
            }
            context.closePath();
            context.fill();
        },
        _canvasFillRect : function(context, path){
            for (let i = 0, len = path.length; i < len; i++) {
                let d = path[i];
                context.fillRect(d[0], d[1], d[2], d[3]);
            }
        },
        _drawControls : function(controls){
            let self = this;
            let bWidth = 38,                        //按钮的宽
                bHeight = 38;                       //按钮的高
            let bBgColor = '#FFFFFF',               //按钮元素默认颜色
                bOverColor = '#0782F5';             //按钮元素鼠标经过时的颜色
            let timeInto = '00:00 / 00:00';         //时间显示框默认显示内容



            // -----------绘制播放按钮
            let playButton = controls.play.children[0]
            let playContext = playButton.getContext('2d');
            drawPlay(bBgColor);
            function drawPlay(color){
                playContext.clearRect(0, 0, bWidth, bHeight);
                playContext.fillStyle = color;
                self._canvasFill(playContext, [
                    [12, 10],
                    [29, 19],
                    [12, 28]
                ]);
            }
            // 自己订阅一个事件
            this.on('play', e => {
                e === 'mouseover' ? drawPlay(bOverColor) : drawPlay(bBgColor);
                e === 'click' && this._play();
            });

            // -----------绘制暂停按钮
            let pauseButton = controls.pause.children[0];
            let pauseContext = pauseButton.getContext('2d');
            drawPause(bBgColor);
            function drawPause(color) {
                pauseContext.clearRect(0, 0, bWidth, bHeight);
                pauseContext.fillStyle = color;
                self._canvasFillRect(pauseContext, [
                    [10, 10, 5, 18],
                    [22, 10, 5, 18]
                ]);
            }
            this.on('pause', e=> {
                e === 'mouseover' ? drawPause(bOverColor) : drawPause(bBgColor);
                e === 'click' && this._pause();
            });

            // -----------绘制上一集按钮
            let lastButton = controls.last.children[0];
            let lastContext = lastButton.getContext('2d');
            drawLast(bBgColor);
            function drawLast(color) {
                lastContext.clearRect(0, 0, bWidth, bHeight);
                lastContext.fillStyle = color;
                self._canvasFill(lastContext, [
                    [16, 19],
                    [30, 10],
                    [30, 28]
                ]);
                self._canvasFillRect(lastContext, [
                    [8, 10, 5, 18]
                ]);
            }
            this.on('last', e=> {
                e === 'mouseover' ? drawLast(bOverColor) : drawLast(bBgColor);
                e === 'click' && this._last();
            });

            // -----------绘制下一集按钮
            let nextButton = controls.next.children[0];
            let nextContext = nextButton.getContext('2d');
            drawNext(bBgColor);
            function drawNext(color) {
                nextContext.clearRect(0, 0, bWidth, bHeight);
                nextContext.fillStyle = color;
                self._canvasFill(nextContext, [
                    [8, 10],
                    [22, 19],
                    [8, 28]
                ]);
                self._canvasFillRect(nextContext, [
                    [25, 10, 5, 18]
                ]);
            }
            this.on('next', e=> {
                e === 'mouseover' ? drawNext(bOverColor) : drawNext(bBgColor);
                e === 'click' && this._next();
            });


        },
        _play: function(){
            console.log(this.loadeddata);
            if ('play' in this.media && this.loadeddata) {
                this.media.play();

                // 修改形状
                this.controls.play.style.display = 'none';
                this.controls.pause.style.display = '';
            }
        },
        _pause: function(){
            console.log(this.loadeddata);

            if ('pause' in this.media  && this.loadeddata) {
                this.media.pause();

                // 修改形状
                this.controls.play.style.display = '';
                this.controls.pause.style.display = 'none';
            }
        },
        _last: function(){
            console.log('last');
        },
        _next: function(){
            console.log('next');
        },
        getControls: function(){
            let self = this;
            let bWidth = 38,                        //按钮的宽
                bHeight = 38;                       //按钮的高
            let bBgColor = '#FFFFFF',               //按钮元素默认颜色
                bOverColor = '#0782F5';             //按钮元素鼠标经过时的颜色
            let timeInto = '00:00 / 00:00';



            return {
                play : vm('div', {
                    style : {
                        width: bWidth + 'px',
                        height: bHeight + 'px',
                        float: 'left',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }
                }, [
                     self.btns.play =  vm('canvas', {
                        width : bWidth,
                        height : bHeight,
                        onMouseover(e){
                            self.emit('play', 'mouseover')
                        },
                        onMouseout(e){
                            self.emit('play', 'mouseout');
                        },
                        onClick(e){
                             self.emit('play', 'click');
                        }
                    })
                ]),
                pause: vm('div', {
                    class : 'pause',
                    style : {
                        width: bWidth + 'px',
                        height: bHeight + 'px',
                        float: 'left',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display : 'none'
                    }
                }, [
                     vm('canvas', {
                        width : bWidth,
                        height : bHeight,
                        onMouseover(e){
                            self.emit('pause', 'mouseover')
                        },
                        onMouseout(e){
                            self.emit('pause', 'mouseout');
                        },
                        onClick(e){
                            self.emit('pause', 'click');
                        }
                    })
                ]),
                last: vm('div', {
                    class: 'last',
                    style : {
                        width: bWidth + 'px',
                        height: bHeight + 'px',
                        float: 'left',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }
                }, [
                    self.btns.last =  vm('canvas', {
                        width : bWidth,
                        height : bHeight,
                        onMouseover(e){
                            self.emit('last', 'mouseover')
                        },
                        onMouseout(e){
                            self.emit('last', 'mouseout');
                        },
                        onClick(e){
                            self.emit('last', 'click');
                        }
                    })
                ]),
                next: vm('div', {
                    class : 'next',
                    style : {
                        width: bWidth + 'px',
                        height: bHeight + 'px',
                        float: 'left',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }
                }, [
                    self.btns.next = vm('canvas', {
                        width : bWidth,
                        height : bHeight,
                        onMouseover(e){
                            self.emit('next', 'mouseover')
                        },
                        onMouseout(e){
                            self.emit('next', 'mouseout');
                        },
                        onClick(e){
                            self.emit('next', 'click');
                        }
                    })
                ]),
                loading: vm('div', {
                    style : {
                        width: '60px',
                        height: '60px',
                        position: 'absolute',
                        display: 'none',
                        zIndex: '100'
                    }
                }),
                pauseCenter: vm('div', {
                    style : {
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        position: 'absolute',
                        display: 'none',
                        cursor: 'pointer',
                        zIndex: '100'
                    }
                }),
                logo: vm('div', {
                    style : {
                        height: '30px',
                        lineHeight: '30px',
                        color: '#FFFFFF',
                        fontFamily: 'Arial',
                        fontSize: '28px',
                        textAlign: 'center',
                        position: 'absolute',
                        float: 'left',
                        left: '-1000px',
                        top: '20px',
                        zIndex: '100',
                        filter: 'alpha(opacity:0.8)',
                        opacity: '0.8',
                        cursor: 'default'
                    }
                }),
                timeProgressBar: vm('div', {
                    style : {
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#3F3F3F',
                        overflow: 'hidden',
                        position: 'absolute',
                        bottom: '38px',
                        zIndex: '88'
                    }
                })
            }
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
        css(ele, attr, val) {
            if (Array.isArray(ele)) {
                // 数组的话
                for (let i = 0, len = ele.length; i < len; i++) {
                    let el;
                    if (typeof el !== 'object') {
                        el = this.getDOMElement(ele[i]);
                    } else {
                        el = ele[i];
                    }
                    // 开始对el设置属性
                    if (typeof attr === 'object') {
                        for (let k in attr) {
                            attr[k] && (el.style[k] = attr[k]);
                        }
                    } else {
                        val && (el.style[attr] = val);
                    }
                }
            } else {
                // 如果是一个字符串的话
                if (typeof ele !== 'object') {
                    // 字符串的话，先转换为DOM元素
                    ele = this.getDOMElement(ele);
                }
                // 开始根据参数进行取出来/设置值
                if (typeof attr === "object") {
                    for (let k in attr) {
                        attr[k] && (ele.style[k] = attr[k]);
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
        addListener(event,listener) {
            let self = this, events = event.split(' ');
            if (!this.hasOwnProperty('listeners')) {
                this.listeners || (this.listeners = {});
            };
            events.forEach(function(event){
                self.listeners[event] || (self.listeners[event] = []);
                self.listeners[event].push(listener);
            });
            return this;
        },
        removeListener(event,listener) {
            let self = this, events, listeners, list;
            if (arguments.length === 0) {
                this.listeners = {};
                return this;
            };
            events = event.split(' ');
            events.forEach(function(event){
                list = (listeners = self.listeners) != null ? listeners[event] : void 0;
                if (!list) return;
                if (!listener) return delete self.listeners[event];
                list.forEach(function(event,i){
                    if (!(event === listener)) return;
                    list.splice(i, 1);
                    self.listeners[event] = list;
                });
            });
            return this;
        },
        listenerList(event) {
            return this.listeners[event];
        },
        on(event, listener) {
            return this.addListener(event,listener);
        },
        once(event,listener) {
            function handler(){
                this.removeListener(event,handler);
                return listener.apply(this,arguments);
            };
            return this.addListener(event,handler);
        },
        off(event,listener) {
            return this.removeListener(event,listener);
        },
        emit() {
            let self = this, args, listeners, event, list;
            args = arguments.length >= 1 ? [].slice.call(arguments,0) : [];
            event = args.shift();
            list = (listeners = this.listeners) != null ? listeners[event] : void 0;
            if (!list) return;
            list.forEach(function(event){
                event.apply(self, args);
            });
            return true;
        }
    };


    /******************************************IPlayer init********************************************/
    return (element, options) => {
        if (!options) {
            return utils.error('iplayer init failed, config params does not exist!');
        }
        return new IPlayer(element, options);
    };
}));