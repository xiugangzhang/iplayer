'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @name    iplayer视频播放器
 * @desc    一款使用HTML5新技术打造的浏览器端视频播放器，主持目前主流视频格式
 * @version v0.0.1
 * @author  xiugang
 */
;(function (root, factory) {
    // env: global define moudle
    if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
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
})(typeof window !== "undefined" ? window : undefined, function (window) {
    "use strict";
    // 常用工具

    var utils = {
        each: function each(obj, iterator, context) {
            if (obj == null) return;
            if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === false) return false;
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (iterator.call(context, obj[key], key, obj) === false) return false;
                    }
                }
            }
        },
        extend: function extend(prop) {
            Array.prototype.slice.call(arguments, 1).forEach(function (source) {
                for (var key in source) {
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

    var Vm = function () {
        function Vm(tagName) {
            var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

            _classCallCheck(this, Vm);

            if (!(this.tagName = tagName)) return;
            this.props = props;
            this.children = children;
        }

        _createClass(Vm, [{
            key: 'render',
            value: function render() {
                var self = this;
                var node = document.createElement(this.tagName),
                    props = this.props,
                    // {class: 'play-btn control-btn'}
                children = this.children;

                for (var key in props) {
                    if (/^on[A-Za-z]/.test(key)) {
                        var eventType = key.toLowerCase().replace('on', '');
                        self.addListener(node, eventType, props[key]);
                    } else {
                        // 对象的话
                        if (props[key] && _typeof(props[key]) === 'object') {
                            for (var k in props[key]) {
                                node.style[k] = props[key][k];
                            }
                        } else {
                            // 字符串的处理
                            node.setAttribute(key, props[key]);
                        }
                    }
                }
                children.forEach(function (child) {
                    if (Array.isArray(child)) {
                        child.forEach(function (item) {
                            item && (item instanceof HTMLElement ? node.appendChild(item) : node.insertAdjacentHTML('beforeend', item));
                        });
                    } else {
                        child && (child instanceof HTMLElement ? node.appendChild(child) : node.insertAdjacentHTML('beforeend', child));
                    }
                });
                return node;
            }
        }, {
            key: 'addListener',
            value: function addListener(element, event, listener) {
                var self = this;
                if (!this.hasOwnProperty('listeners')) {
                    this.listeners || (this.listeners = {});
                };
                self.listeners[event] || (self.listeners[event] = []);
                self.listeners[event].push(listener);
                element.addEventListener(event, listener);
            }
        }, {
            key: 'removeListener',
            value: function removeListener(element, event, listener) {
                var self = this,
                    list = void 0;
                list = self.listeners != null ? self.listeners[event] : void 0;
                if (!list) return;
                if (!listener) return delete self.listeners[event];
                list.forEach(function (handler, i) {
                    if (!(handler === listener)) return;
                    element.removeEventListener(event, handler);
                    list.splice(i, 1);
                    self.listeners[event] = list;
                });
            }
        }]);

        return Vm;
    }();

    var vm = function vm(tagName, props, children) {
        return new Vm(tagName, props, children).render();
    };

    var IPlayer = function IPlayer(element, options) {
        _classCallCheck(this, IPlayer);

        console.log('init', element, options);
    };

    return function (element, options) {
        return new IPlayer(element, options);
    };
});