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
        module .exports = factory(root, document);
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
    // 常用工具
    let utils = {
        each: function(obj, iterator, context) {
            if (obj == null) return;
            if (obj.length === +obj.length) {
                for (let i = 0, l = obj.length; i < l; i++) {
                    if(iterator.call(context, obj[i], i, obj) === false)
                        return false;
                }
            } else {
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if(iterator.call(context, obj[key], key, obj) === false)
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
        }
    };
    // 类型判断方法
    ['String', 'Function', 'Array', 'Number', 'RegExp', 'Object', 'Date'].forEach(function (v) {
        utils['is' + v] = function (obj) {
            return {}.toString.call(obj) === "[object " + v + "]";
        };
    });

    // 虚拟DOM生成器
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

            for( let key in props) {
                if (/^on[A-Za-z]/.test(key)) {
                    let eventType = key.toLowerCase().replace('on', '');
                    self.addListener(node, eventType, props[key]);
                } else {
                    // 对象的话
                    if (props[key] && typeof props[key] === 'object') {
                        for (let k in props[key]) {
                            node.style[k] = props[key][k];
                        }
                    } else {
                        // 字符串的处理
                        node.setAttribute(key, props[key]);
                    }
                }
            }
            children.forEach(function(child) {
                if (Array.isArray(child)) {
                    child.forEach(function(item){
                        item && (item instanceof HTMLElement ? node.appendChild(item) : node.insertAdjacentHTML('beforeend', item));
                    })
                } else {
                    child && (child instanceof HTMLElement ? node.appendChild(child) : node.insertAdjacentHTML('beforeend', child));
                }
            });
            return node;
        }

        addListener(element, event, listener) {
            let self = this;
            if (!this.hasOwnProperty('listeners')) {
                this.listeners || (this.listeners = {});
            };
            self.listeners[event] || (self.listeners[event] = []);
            self.listeners[event].push(listener);
            element.addEventListener(event, listener);
        }

        removeListener(element, event, listener) {
            let self = this, list;
            list = self.listeners != null ? self.listeners[event] : void 0;
            if (!list) return;
            if (!listener) return delete self.listeners[event];
            list.forEach(function(handler,i){
                if (!(handler === listener)) return;
                element.removeEventListener(event, handler)
                list.splice(i, 1);
                self.listeners[event] = list;
            });
        }
    }
    let vm = function(tagName, props, children) {
        return new Vm(tagName, props, children).render();
    }


    class IPlayer {
        constructor(element, options) {
            console.log('init', element, options)
        }

    }

    return (element, options) => {
        return new IPlayer(element, options);
    };
}));