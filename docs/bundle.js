/*!
  niconicomments.js v0.2.70
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NiconiComments = factory());
})(this, (function () { 'use strict';

    let imageCache = {};
    const resetImageCache = () => {
        imageCache = {};
    };

    let nicoScripts = {
        reverse: [],
        default: [],
        replace: [],
        ban: [],
        seekDisable: [],
        jump: [],
    };
    const resetNicoScripts = () => {
        nicoScripts = {
            reverse: [],
            default: [],
            replace: [],
            ban: [],
            seekDisable: [],
            jump: [],
        };
    };

    let plugins = [];
    const setPlugins = (input) => {
        plugins = input;
    };

    var index$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get imageCache () { return imageCache; },
        get nicoScripts () { return nicoScripts; },
        get plugins () { return plugins; },
        resetImageCache: resetImageCache,
        resetNicoScripts: resetNicoScripts,
        setPlugins: setPlugins
    });

    let isDebug = false;
    const setIsDebug = (val) => {
        isDebug = val;
    };

    let defaultConfig;
    const updateConfig = (config) => {
        defaultConfig = config;
    };
    const defaultOptions = {
        config: {},
        debug: false,
        enableLegacyPiP: false,
        format: "default",
        formatted: false,
        keepCA: false,
        mode: "default",
        scale: 1,
        showCollision: false,
        showCommentCount: false,
        showFPS: false,
        useLegacy: false,
        video: undefined,
        lazy: false,
    };
    let config;
    let options;
    const setConfig = (value) => {
        config = value;
    };
    const setOptions = (value) => {
        options = value;
    };

    var config$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get config () { return config; },
        get defaultConfig () { return defaultConfig; },
        defaultOptions: defaultOptions,
        get options () { return options; },
        setConfig: setConfig,
        setOptions: setOptions,
        updateConfig: updateConfig
    });

    class CanvasRenderingContext2DError extends Error {
        constructor(options = {}) {
            super("CanvasRenderingContext2DError", options);
        }
    }
    CanvasRenderingContext2DError.prototype.name = "CanvasRenderingContext2DError";

    class InvalidFormatError extends Error {
        constructor(options = {}) {
            super("InvalidFormatError", options);
        }
    }
    InvalidFormatError.prototype.name = "InvalidFormatError";

    class InvalidOptionError extends Error {
        constructor(options = {}) {
            super("Invalid option\nPlease check document: https://xpadev-net.github.io/niconicomments/#p_options", options);
        }
    }
    InvalidOptionError.prototype.name = "InvalidOptionError";

    class NotImplementedError extends Error {
        pluginName;
        methodName;
        constructor(pluginName, methodName, options = {}) {
            super("NotImplementedError", options);
            this.pluginName = pluginName;
            this.methodName = methodName;
        }
    }
    NotImplementedError.prototype.name = "NotImplementedError";

    var index$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CanvasRenderingContext2DError: CanvasRenderingContext2DError,
        InvalidFormatError: InvalidFormatError,
        InvalidOptionError: InvalidOptionError,
        NotImplementedError: NotImplementedError
    });

    const arrayPush = (array, key, push) => {
        if (!array) {
            array = {};
        }
        if (!array[Number(key)]) {
            array[Number(key)] = [];
        }
        array[Number(key)]?.push(push);
    };
    const arrayEqual = (a, b) => {
        if (a.length !== b.length)
            return false;
        for (let i = 0, n = a.length; i < n; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    };

    const hex2rgb = (hex) => {
        if (hex.startsWith("#"))
            hex = hex.slice(1);
        if (hex.length === 3)
            hex =
                hex.slice(0, 1) +
                    hex.slice(0, 1) +
                    hex.slice(1, 2) +
                    hex.slice(1, 2) +
                    hex.slice(2, 3) +
                    hex.slice(2, 3);
        return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
            return parseInt(str, 16);
        });
    };
    const hex2rgba = (hex) => {
        if (hex.startsWith("#"))
            hex = hex.slice(1);
        if (hex.length === 4)
            hex =
                hex.slice(0, 1) +
                    hex.slice(0, 1) +
                    hex.slice(1, 2) +
                    hex.slice(1, 2) +
                    hex.slice(2, 3) +
                    hex.slice(2, 3) +
                    hex.slice(3, 4) +
                    hex.slice(3, 4);
        return [
            hex.slice(0, 2),
            hex.slice(2, 4),
            hex.slice(4, 6),
            hex.slice(4, 6),
        ].map((str, index) => {
            if (index === 3)
                return parseInt(str, 16) / 256;
            return parseInt(str, 16);
        });
    };
    const getStrokeColor = (comment) => {
        if (comment.strokeColor) {
            const color = comment.strokeColor.slice(1);
            const length = color.length;
            if (length === 3 || length === 6) {
                return `rgba(${hex2rgb(color).join(",")},${config.contextStrokeOpacity})`;
            }
            else if (length === 4 || length === 8) {
                return `rgba(${hex2rgba(color).join(",")})`;
            }
        }
        return `rgba(${hex2rgb(comment.color === "#000000"
        ? config.contextStrokeInversionColor
        : config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`;
    };

    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = !1;
          } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
        } catch (r) {
          o = !0, n = r;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function (r) {
          return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
      }
      return e;
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : String(i);
    }
    function _typeof(o) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
        return typeof o;
      } : function (o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
      }, _typeof(o);
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", {
        writable: false
      });
      return Constructor;
    }
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
      }
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      Object.defineProperty(subClass, "prototype", {
        writable: false
      });
      if (superClass) _setPrototypeOf(subClass, superClass);
    }
    function _getPrototypeOf(o) {
      _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
      return _getPrototypeOf(o);
    }
    function _setPrototypeOf(o, p) {
      _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };
      return _setPrototypeOf(o, p);
    }
    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct) return false;
      if (Reflect.construct.sham) return false;
      if (typeof Proxy === "function") return true;
      try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        return true;
      } catch (e) {
        return false;
      }
    }
    function _construct(Parent, args, Class) {
      if (_isNativeReflectConstruct()) {
        _construct = Reflect.construct.bind();
      } else {
        _construct = function _construct(Parent, args, Class) {
          var a = [null];
          a.push.apply(a, args);
          var Constructor = Function.bind.apply(Parent, a);
          var instance = new Constructor();
          if (Class) _setPrototypeOf(instance, Class.prototype);
          return instance;
        };
      }
      return _construct.apply(null, arguments);
    }
    function _isNativeFunction(fn) {
      try {
        return Function.toString.call(fn).indexOf("[native code]") !== -1;
      } catch (e) {
        return typeof fn === "function";
      }
    }
    function _wrapNativeSuper(Class) {
      var _cache = typeof Map === "function" ? new Map() : undefined;
      _wrapNativeSuper = function _wrapNativeSuper(Class) {
        if (Class === null || !_isNativeFunction(Class)) return Class;
        if (typeof Class !== "function") {
          throw new TypeError("Super expression must either be null or a function");
        }
        if (typeof _cache !== "undefined") {
          if (_cache.has(Class)) return _cache.get(Class);
          _cache.set(Class, Wrapper);
        }
        function Wrapper() {
          return _construct(Class, arguments, _getPrototypeOf(this).constructor);
        }
        Wrapper.prototype = Object.create(Class.prototype, {
          constructor: {
            value: Wrapper,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        return _setPrototypeOf(Wrapper, Class);
      };
      return _wrapNativeSuper(Class);
    }
    function _assertThisInitialized(self) {
      if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return self;
    }
    function _possibleConstructorReturn(self, call) {
      if (call && (typeof call === "object" || typeof call === "function")) {
        return call;
      } else if (call !== void 0) {
        throw new TypeError("Derived constructors may only return object or undefined");
      }
      return _assertThisInitialized(self);
    }
    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();
      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived),
          result;
        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;
          result = Reflect.construct(Super, arguments, NewTarget);
        } else {
          result = Super.apply(this, arguments);
        }
        return _possibleConstructorReturn(this, result);
      };
    }
    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
      if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
          if (it) o = it;
          var i = 0;
          var F = function () {};
          return {
            s: F,
            n: function () {
              if (i >= o.length) return {
                done: true
              };
              return {
                done: false,
                value: o[i++]
              };
            },
            e: function (e) {
              throw e;
            },
            f: F
          };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var normalCompletion = true,
        didErr = false,
        err;
      return {
        s: function () {
          it = it.call(o);
        },
        n: function () {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function (e) {
          didErr = true;
          err = e;
        },
        f: function () {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        }
      };
    }

    // src/error/ValiError/ValiError.ts
    var ValiError = /*#__PURE__*/function (_Error) {
      _inherits(ValiError, _Error);
      var _super = _createSuper(ValiError);
      /**
       * Creates a Valibot error with useful information.
       *
       * @param issues The error issues.
       */
      function ValiError(issues) {
        var _this;
        _classCallCheck(this, ValiError);
        _this = _super.call(this, issues[0].message);
        _defineProperty(_assertThisInitialized(_this), "issues", void 0);
        _this.name = "ValiError";
        _this.issues = issues;
        return _this;
      }
      return _createClass(ValiError);
    }( /*#__PURE__*/_wrapNativeSuper(Error));

    // src/utils/errorMessage/errorMessage.ts
    function errorMessage(message) {
      return typeof message === "function" ? message() : message;
    }

    // src/utils/actionIssue/actionIssue.ts
    function actionIssue(validation, message, input, requirement, path) {
      return {
        issues: [{
          validation: validation,
          message: errorMessage(message),
          input: input,
          requirement: requirement,
          path: path
        }]
      };
    }

    // src/utils/actionOutput/actionOutput.ts
    function actionOutput(output) {
      return {
        output: output
      };
    }

    // src/utils/defaultArgs/defaultArgs.ts
    function defaultArgs(arg1, arg2) {
      return Array.isArray(arg1) ? [void 0, arg1] : [arg1, arg2];
    }

    // src/utils/parseResult/parseResult.ts
    function parseResult(typed, output, issues) {
      return {
        typed: typed,
        output: output,
        issues: issues
      };
    }

    // src/utils/restAndDefaultArgs/restAndDefaultArgs.ts
    function restAndDefaultArgs(arg1, arg2, arg3) {
      if (!arg1 || _typeof(arg1) === "object" && !Array.isArray(arg1)) {
        var _defaultArgs = defaultArgs(arg2, arg3),
          _defaultArgs2 = _slicedToArray(_defaultArgs, 2),
          error2 = _defaultArgs2[0],
          pipe2 = _defaultArgs2[1];
        return [arg1, error2, pipe2];
      }
      var _defaultArgs3 = defaultArgs(arg1, arg2),
        _defaultArgs4 = _slicedToArray(_defaultArgs3, 2),
        error = _defaultArgs4[0],
        pipe = _defaultArgs4[1];
      return [void 0, error, pipe];
    }

    // src/utils/pipeResult/utils/pipeIssue/pipeIssue.ts
    function pipeIssue(info, issue) {
      return {
        reason: info === null || info === void 0 ? void 0 : info.reason,
        validation: issue.validation,
        origin: (info === null || info === void 0 ? void 0 : info.origin) || "value",
        message: issue.message,
        input: issue.input,
        requirement: issue === null || issue === void 0 ? void 0 : issue.requirement,
        path: issue.path,
        abortEarly: info === null || info === void 0 ? void 0 : info.abortEarly,
        abortPipeEarly: info === null || info === void 0 ? void 0 : info.abortPipeEarly,
        skipPipe: info === null || info === void 0 ? void 0 : info.skipPipe
      };
    }

    // src/utils/pipeResult/utils/pipeInfo/pipeInfo.ts
    function pipeInfo(info, reason) {
      return {
        reason: reason,
        origin: info === null || info === void 0 ? void 0 : info.origin,
        abortEarly: info === null || info === void 0 ? void 0 : info.abortEarly,
        abortPipeEarly: info === null || info === void 0 ? void 0 : info.abortPipeEarly,
        skipPipe: info === null || info === void 0 ? void 0 : info.skipPipe
      };
    }

    // src/utils/pipeResult/pipeResult.ts
    function pipeResult(input, pipe, parseInfo, reason, issues) {
      var info;
      var output = input;
      if (pipe !== null && pipe !== void 0 && pipe.length && !(parseInfo !== null && parseInfo !== void 0 && parseInfo.skipPipe)) {
        var _iterator = _createForOfIteratorHelper(pipe),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var action = _step.value;
            var result = action._parse(output);
            if (result.issues) {
              info = info || pipeInfo(parseInfo, reason);
              var _iterator2 = _createForOfIteratorHelper(result.issues),
                _step2;
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var issueInfo = _step2.value;
                  var issue = pipeIssue(info, issueInfo);
                  issues ? issues.push(issue) : issues = [issue];
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              if (info.abortEarly || info.abortPipeEarly) {
                break;
              }
            } else {
              output = result.output;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      return parseResult(true, output, issues);
    }
    function schemaIssue(info, reason, validation, message, input, path, issues) {
      return {
        typed: false,
        output: input,
        issues: [{
          reason: reason,
          validation: validation,
          origin: (info === null || info === void 0 ? void 0 : info.origin) || "value",
          message: errorMessage(message),
          input: input,
          path: path,
          issues: issues,
          abortEarly: info === null || info === void 0 ? void 0 : info.abortEarly,
          abortPipeEarly: info === null || info === void 0 ? void 0 : info.abortPipeEarly,
          skipPipe: info === null || info === void 0 ? void 0 : info.skipPipe
        }]
      };
    }

    // src/methods/getDefault/getDefault.ts
    function getDefault(schema) {
      return typeof schema["default"] === "function" ? schema["default"]() : schema["default"];
    }
    function is(schema, input, info) {
      return !schema._parse(input, {
        abortEarly: true,
        skipPipe: info === null || info === void 0 ? void 0 : info.skipPipe
      }).issues;
    }

    // src/schemas/array/array.ts
    function array(item, arg2, arg3) {
      var _defaultArgs5 = defaultArgs(arg2, arg3),
        _defaultArgs6 = _slicedToArray(_defaultArgs5, 2),
        _defaultArgs6$ = _defaultArgs6[0],
        message = _defaultArgs6$ === void 0 ? "Invalid type" : _defaultArgs6$,
        pipe = _defaultArgs6[1];
      return {
        type: "array",
        async: false,
        item: item,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (!Array.isArray(input)) {
            return schemaIssue(info, "type", "array", this.message, input);
          }
          var typed = true;
          var issues;
          var output = [];
          for (var key = 0; key < input.length; key++) {
            var value2 = input[key];
            var result = this.item._parse(value2, info);
            if (result.issues) {
              var pathItem = {
                type: "array",
                input: input,
                key: key,
                value: value2
              };
              var _iterator5 = _createForOfIteratorHelper(result.issues),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var _issues;
                  var issue = _step5.value;
                  if (issue.path) {
                    issue.path.unshift(pathItem);
                  } else {
                    issue.path = [pathItem];
                  }
                  (_issues = issues) === null || _issues === void 0 || _issues.push(issue);
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              if (!issues) {
                issues = result.issues;
              }
              if (info !== null && info !== void 0 && info.abortEarly) {
                typed = false;
                break;
              }
            }
            if (!result.typed) {
              typed = false;
            }
            output.push(result.output);
          }
          if (typed) {
            return pipeResult(output, this.pipe, info, "array", issues);
          }
          return parseResult(false, output, issues);
        }
      };
    }

    // src/schemas/boolean/boolean.ts
    function _boolean(arg1, arg2) {
      var _defaultArgs17 = defaultArgs(arg1, arg2),
        _defaultArgs18 = _slicedToArray(_defaultArgs17, 2),
        _defaultArgs18$ = _defaultArgs18[0],
        message = _defaultArgs18$ === void 0 ? "Invalid type" : _defaultArgs18$,
        pipe = _defaultArgs18[1];
      return {
        type: "boolean",
        async: false,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (typeof input !== "boolean") {
            return schemaIssue(info, "type", "boolean", this.message, input);
          }
          return pipeResult(input, this.pipe, info, "boolean");
        }
      };
    }

    // src/schemas/instance/instance.ts
    function instance(class_, arg2, arg3) {
      var _defaultArgs25 = defaultArgs(arg2, arg3),
        _defaultArgs26 = _slicedToArray(_defaultArgs25, 2),
        _defaultArgs26$ = _defaultArgs26[0],
        message = _defaultArgs26$ === void 0 ? "Invalid type" : _defaultArgs26$,
        pipe = _defaultArgs26[1];
      return {
        type: "instance",
        async: false,
        "class": class_,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (!(input instanceof this["class"])) {
            return schemaIssue(info, "type", "instance", this.message, input);
          }
          return pipeResult(input, this.pipe, info, "instance");
        }
      };
    }

    // src/schemas/intersect/utils/mergeOutputs/mergeOutputs.ts
    function mergeOutputs(output1, output2) {
      if (_typeof(output1) === _typeof(output2)) {
        if (output1 === output2 || output1 instanceof Date && output2 instanceof Date && +output1 === +output2) {
          return {
            output: output1
          };
        }
        if (Array.isArray(output1) && Array.isArray(output2)) {
          if (output1.length === output2.length) {
            var array2 = [];
            for (var index = 0; index < output1.length; index++) {
              var result = mergeOutputs(output1[index], output2[index]);
              if (result.invalid) {
                return result;
              }
              array2.push(result.output);
            }
            return {
              output: array2
            };
          }
          return {
            invalid: true
          };
        }
        if (output1 && output2 && output1.constructor === Object && output2.constructor === Object) {
          var object2 = _objectSpread2(_objectSpread2({}, output1), output2);
          for (var key in output1) {
            if (key in output2) {
              var _result = mergeOutputs(output1[key], output2[key]);
              if (_result.invalid) {
                return _result;
              }
              object2[key] = _result.output;
            }
          }
          return {
            output: object2
          };
        }
      }
      return {
        invalid: true
      };
    }

    // src/schemas/intersect/intersect.ts
    function intersect(options, arg2, arg3) {
      var _defaultArgs29 = defaultArgs(arg2, arg3),
        _defaultArgs30 = _slicedToArray(_defaultArgs29, 2),
        _defaultArgs30$ = _defaultArgs30[0],
        message = _defaultArgs30$ === void 0 ? "Invalid type" : _defaultArgs30$,
        pipe = _defaultArgs30[1];
      return {
        type: "intersect",
        async: false,
        options: options,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          var typed = true;
          var issues;
          var output;
          var outputs = [];
          var _iterator7 = _createForOfIteratorHelper(this.options),
            _step7;
          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var schema = _step7.value;
              var _result2 = schema._parse(input, info);
              if (_result2.issues) {
                if (issues) {
                  var _iterator8 = _createForOfIteratorHelper(_result2.issues),
                    _step8;
                  try {
                    for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                      var issue = _step8.value;
                      issues.push(issue);
                    }
                  } catch (err) {
                    _iterator8.e(err);
                  } finally {
                    _iterator8.f();
                  }
                } else {
                  issues = _result2.issues;
                }
                if (info !== null && info !== void 0 && info.abortEarly) {
                  typed = false;
                  break;
                }
              }
              if (!_result2.typed) {
                typed = false;
              }
              outputs.push(_result2.output);
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
          if (typed) {
            output = outputs[0];
            for (var index = 1; index < outputs.length; index++) {
              var result = mergeOutputs(output, outputs[index]);
              if (result.invalid) {
                return schemaIssue(info, "type", "intersect", this.message, input);
              }
              output = result.output;
            }
            return pipeResult(output, this.pipe, info, "intersect", issues);
          }
          return parseResult(false, output, issues);
        }
      };
    }

    // src/schemas/literal/literal.ts
    function literal(literal2) {
      var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Invalid type";
      return {
        type: "literal",
        async: false,
        literal: literal2,
        message: message,
        _parse: function _parse(input, info) {
          if (input !== this.literal) {
            return schemaIssue(info, "type", "literal", this.message, input);
          }
          return parseResult(true, input);
        }
      };
    }

    // src/schemas/nullable/nullable.ts
    function nullable(wrapped, default_) {
      return {
        type: "nullable",
        async: false,
        wrapped: wrapped,
        "default": default_,
        _parse: function _parse(input, info) {
          if (input === null) {
            var override = getDefault(this);
            if (override === void 0) {
              return parseResult(true, input);
            }
            input = override;
          }
          return this.wrapped._parse(input, info);
        }
      };
    }

    // src/schemas/number/number.ts
    function number(arg1, arg2) {
      var _defaultArgs35 = defaultArgs(arg1, arg2),
        _defaultArgs36 = _slicedToArray(_defaultArgs35, 2),
        _defaultArgs36$ = _defaultArgs36[0],
        message = _defaultArgs36$ === void 0 ? "Invalid type" : _defaultArgs36$,
        pipe = _defaultArgs36[1];
      return {
        type: "number",
        async: false,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (typeof input !== "number" || isNaN(input)) {
            return schemaIssue(info, "type", "number", this.message, input);
          }
          return pipeResult(input, this.pipe, info, "number");
        }
      };
    }

    // src/schemas/object/object.ts
    function object(entries, arg2, arg3, arg4) {
      var _restAndDefaultArgs = restAndDefaultArgs(arg2, arg3, arg4),
        _restAndDefaultArgs2 = _slicedToArray(_restAndDefaultArgs, 3),
        rest = _restAndDefaultArgs2[0],
        _restAndDefaultArgs2$ = _restAndDefaultArgs2[1],
        message = _restAndDefaultArgs2$ === void 0 ? "Invalid type" : _restAndDefaultArgs2$,
        pipe = _restAndDefaultArgs2[2];
      var cachedEntries;
      return {
        type: "object",
        async: false,
        entries: entries,
        rest: rest,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (!input || _typeof(input) !== "object") {
            return schemaIssue(info, "type", "object", this.message, input);
          }
          cachedEntries = cachedEntries || Object.entries(this.entries);
          var typed = true;
          var issues;
          var output = {};
          var _iterator13 = _createForOfIteratorHelper(cachedEntries),
            _step13;
          try {
            for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
              var _step13$value = _slicedToArray(_step13.value, 2),
                _key3 = _step13$value[0],
                schema = _step13$value[1];
              var _value = input[_key3];
              var _result3 = schema._parse(_value, info);
              if (_result3.issues) {
                var _pathItem = {
                  type: "object",
                  input: input,
                  key: _key3,
                  value: _value
                };
                var _iterator15 = _createForOfIteratorHelper(_result3.issues),
                  _step15;
                try {
                  for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
                    var _issues7;
                    var _issue2 = _step15.value;
                    if (_issue2.path) {
                      _issue2.path.unshift(_pathItem);
                    } else {
                      _issue2.path = [_pathItem];
                    }
                    (_issues7 = issues) === null || _issues7 === void 0 || _issues7.push(_issue2);
                  }
                } catch (err) {
                  _iterator15.e(err);
                } finally {
                  _iterator15.f();
                }
                if (!issues) {
                  issues = _result3.issues;
                }
                if (info !== null && info !== void 0 && info.abortEarly) {
                  typed = false;
                  break;
                }
              }
              if (!_result3.typed) {
                typed = false;
              }
              if (_result3.output !== void 0 || _key3 in input) {
                output[_key3] = _result3.output;
              }
            }
          } catch (err) {
            _iterator13.e(err);
          } finally {
            _iterator13.f();
          }
          if (this.rest && !(info !== null && info !== void 0 && info.abortEarly && issues)) {
            for (var key in input) {
              if (!(key in this.entries)) {
                var value2 = input[key];
                var result = this.rest._parse(value2, info);
                if (result.issues) {
                  var pathItem = {
                    type: "object",
                    input: input,
                    key: key,
                    value: value2
                  };
                  var _iterator14 = _createForOfIteratorHelper(result.issues),
                    _step14;
                  try {
                    for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                      var _issues6;
                      var issue = _step14.value;
                      if (issue.path) {
                        issue.path.unshift(pathItem);
                      } else {
                        issue.path = [pathItem];
                      }
                      (_issues6 = issues) === null || _issues6 === void 0 || _issues6.push(issue);
                    }
                  } catch (err) {
                    _iterator14.e(err);
                  } finally {
                    _iterator14.f();
                  }
                  if (!issues) {
                    issues = result.issues;
                  }
                  if (info !== null && info !== void 0 && info.abortEarly) {
                    typed = false;
                    break;
                  }
                }
                if (!result.typed) {
                  typed = false;
                }
                output[key] = result.output;
              }
            }
          }
          if (typed) {
            return pipeResult(output, this.pipe, info, "object", issues);
          }
          return parseResult(false, output, issues);
        }
      };
    }

    // src/schemas/optional/optional.ts
    function optional(wrapped, default_) {
      return {
        type: "optional",
        async: false,
        wrapped: wrapped,
        "default": default_,
        _parse: function _parse(input, info) {
          if (input === void 0) {
            var override = getDefault(this);
            if (override === void 0) {
              return parseResult(true, input);
            }
            input = override;
          }
          return this.wrapped._parse(input, info);
        }
      };
    }

    // src/schemas/string/string.ts
    function string(arg1, arg2) {
      var _defaultArgs39 = defaultArgs(arg1, arg2),
        _defaultArgs40 = _slicedToArray(_defaultArgs39, 2),
        _defaultArgs40$ = _defaultArgs40[0],
        message = _defaultArgs40$ === void 0 ? "Invalid type" : _defaultArgs40$,
        pipe = _defaultArgs40[1];
      return {
        type: "string",
        async: false,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (typeof input !== "string") {
            return schemaIssue(info, "type", "string", this.message, input);
          }
          return pipeResult(input, this.pipe, info, "string");
        }
      };
    }

    // src/schemas/record/utils/recordArgs/recordArgs.ts
    function recordArgs(arg1, arg2, arg3, arg4) {
      if (_typeof(arg2) === "object" && !Array.isArray(arg2)) {
        var _defaultArgs43 = defaultArgs(arg3, arg4),
          _defaultArgs44 = _slicedToArray(_defaultArgs43, 2),
          message2 = _defaultArgs44[0],
          pipe2 = _defaultArgs44[1];
        return [arg1, arg2, message2, pipe2];
      }
      var _defaultArgs45 = defaultArgs(arg2, arg3),
        _defaultArgs46 = _slicedToArray(_defaultArgs45, 2),
        message = _defaultArgs46[0],
        pipe = _defaultArgs46[1];
      return [string(), arg1, message, pipe];
    }

    // src/schemas/record/values.ts
    var BLOCKED_KEYS = ["__proto__", "prototype", "constructor"];

    // src/schemas/record/record.ts
    function record(arg1, arg2, arg3, arg4) {
      var _recordArgs = recordArgs(arg1, arg2, arg3, arg4),
        _recordArgs2 = _slicedToArray(_recordArgs, 4),
        key = _recordArgs2[0],
        value2 = _recordArgs2[1],
        _recordArgs2$ = _recordArgs2[2],
        message = _recordArgs2$ === void 0 ? "Invalid type" : _recordArgs2$,
        pipe = _recordArgs2[3];
      return {
        type: "record",
        async: false,
        key: key,
        value: value2,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          if (!input || _typeof(input) !== "object") {
            return schemaIssue(info, "type", "record", this.message, input);
          }
          var typed = true;
          var issues;
          var output = {};
          for (var _i = 0, _Object$entries = Object.entries(input); _i < _Object$entries.length; _i++) {
            var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
              inputKey = _Object$entries$_i[0],
              inputValue = _Object$entries$_i[1];
            if (!BLOCKED_KEYS.includes(inputKey)) {
              var pathItem = void 0;
              var keyResult = this.key._parse(inputKey, {
                origin: "key",
                abortEarly: info === null || info === void 0 ? void 0 : info.abortEarly,
                abortPipeEarly: info === null || info === void 0 ? void 0 : info.abortPipeEarly,
                skipPipe: info === null || info === void 0 ? void 0 : info.skipPipe
              });
              if (keyResult.issues) {
                pathItem = {
                  type: "record",
                  input: input,
                  key: inputKey,
                  value: inputValue
                };
                var _iterator18 = _createForOfIteratorHelper(keyResult.issues),
                  _step18;
                try {
                  for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                    var _issues10;
                    var issue = _step18.value;
                    issue.path = [pathItem];
                    (_issues10 = issues) === null || _issues10 === void 0 || _issues10.push(issue);
                  }
                } catch (err) {
                  _iterator18.e(err);
                } finally {
                  _iterator18.f();
                }
                if (!issues) {
                  issues = keyResult.issues;
                }
                if (info !== null && info !== void 0 && info.abortEarly) {
                  typed = false;
                  break;
                }
              }
              var valueResult = this.value._parse(inputValue, info);
              if (valueResult.issues) {
                pathItem = pathItem || {
                  type: "record",
                  input: input,
                  key: inputKey,
                  value: inputValue
                };
                var _iterator19 = _createForOfIteratorHelper(valueResult.issues),
                  _step19;
                try {
                  for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                    var _issues11;
                    var _issue3 = _step19.value;
                    if (_issue3.path) {
                      _issue3.path.unshift(pathItem);
                    } else {
                      _issue3.path = [pathItem];
                    }
                    (_issues11 = issues) === null || _issues11 === void 0 || _issues11.push(_issue3);
                  }
                } catch (err) {
                  _iterator19.e(err);
                } finally {
                  _iterator19.f();
                }
                if (!issues) {
                  issues = valueResult.issues;
                }
                if (info !== null && info !== void 0 && info.abortEarly) {
                  typed = false;
                  break;
                }
              }
              if (!keyResult.typed || !valueResult.typed) {
                typed = false;
              }
              if (keyResult.typed) {
                output[keyResult.output] = valueResult.output;
              }
            }
          }
          if (typed) {
            return pipeResult(output, this.pipe, info, "record", issues);
          }
          return parseResult(false, output, issues);
        }
      };
    }

    // src/schemas/union/union.ts
    function union(options, arg2, arg3) {
      var _defaultArgs55 = defaultArgs(arg2, arg3),
        _defaultArgs56 = _slicedToArray(_defaultArgs55, 2),
        _defaultArgs56$ = _defaultArgs56[0],
        message = _defaultArgs56$ === void 0 ? "Invalid type" : _defaultArgs56$,
        pipe = _defaultArgs56[1];
      return {
        type: "union",
        async: false,
        options: options,
        message: message,
        pipe: pipe,
        _parse: function _parse(input, info) {
          var issues;
          var output;
          var _iterator28 = _createForOfIteratorHelper(this.options),
            _step28;
          try {
            for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
              var schema = _step28.value;
              var result = schema._parse(input, info);
              if (result.issues) {
                if (issues) {
                  var _iterator29 = _createForOfIteratorHelper(result.issues),
                    _step29;
                  try {
                    for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                      var issue = _step29.value;
                      issues.push(issue);
                    }
                  } catch (err) {
                    _iterator29.e(err);
                  } finally {
                    _iterator29.f();
                  }
                } else {
                  issues = result.issues;
                }
              } else {
                output = [result.output];
                break;
              }
            }
          } catch (err) {
            _iterator28.e(err);
          } finally {
            _iterator28.f();
          }
          if (output) {
            return pipeResult(output[0], this.pipe, info, "union");
          }
          return schemaIssue(info, "type", "union", this.message, input, void 0, issues);
        }
      };
    }

    // src/schemas/unknown/unknown.ts
    function unknown(pipe) {
      return {
        type: "unknown",
        async: false,
        pipe: pipe,
        _parse: function _parse(input, info) {
          return pipeResult(input, this.pipe, info, "unknown");
        }
      };
    }

    // src/methods/omit/omit.ts
    function omit(schema, keys, arg3, arg4, arg5) {
      var _restAndDefaultArgs13 = restAndDefaultArgs(arg3, arg4, arg5),
        _restAndDefaultArgs14 = _slicedToArray(_restAndDefaultArgs13, 3),
        rest = _restAndDefaultArgs14[0],
        message = _restAndDefaultArgs14[1],
        pipe = _restAndDefaultArgs14[2];
      return object(Object.entries(schema.entries).reduce(function (entries, _ref24) {
        var _ref25 = _slicedToArray(_ref24, 2),
          key = _ref25[0],
          schema2 = _ref25[1];
        return keys.includes(key) ? entries : _objectSpread2(_objectSpread2({}, entries), {}, _defineProperty({}, key, schema2));
      }, {}), rest, message, pipe);
    }

    // src/methods/parse/parse.ts
    function parse(schema, input, info) {
      var result = schema._parse(input, info);
      if (result.issues) {
        throw new ValiError(result.issues);
      }
      return result.output;
    }

    // src/methods/safeParse/safeParse.ts
    function safeParse(schema, input, info) {
      var result = schema._parse(input, info);
      return {
        typed: result.typed,
        success: !result.issues,
        data: result.output,
        output: result.output,
        error: result.issues && new ValiError(result.issues),
        issues: result.issues
      };
    }

    // src/validations/custom/custom.ts
    function custom(requirement) {
      var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Invalid input";
      return {
        type: "custom",
        async: false,
        message: message,
        requirement: requirement,
        _parse: function _parse(input) {
          return !this.requirement(input) ? actionIssue(this.type, this.message, input, this.requirement) : actionOutput(input);
        }
      };
    }

    // src/validations/notValue/notValue.ts
    function notValue(requirement) {
      var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Invalid value";
      return {
        type: "not_value",
        async: false,
        message: message,
        requirement: requirement,
        _parse: function _parse(input) {
          return input === this.requirement ? actionIssue(this.type, this.message, input, this.requirement) : actionOutput(input);
        }
      };
    }

    // src/validations/regex/regex.ts
    function regex(requirement) {
      var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Invalid regex";
      return {
        type: "regex",
        async: false,
        message: message,
        requirement: requirement,
        _parse: function _parse(input) {
          return !this.requirement.test(input) ? actionIssue(this.type, this.message, input, this.requirement) : actionOutput(input);
        }
      };
    }

    const ZHTML5Fonts = union([
        literal("gothic"),
        literal("mincho"),
        literal("defont"),
    ]);

    const ZFormattedComment = object({
        id: optional(number(), 0),
        vpos: optional(number(), 0),
        content: optional(string(), ""),
        date: optional(number(), 0),
        date_usec: optional(number(), 0),
        owner: optional(_boolean(), false),
        premium: optional(_boolean(), false),
        mail: optional(array(string()), []),
        user_id: optional(number(), 0),
        layer: optional(number(), -1),
        is_my_post: optional(_boolean(), false),
    });
    const ZFormattedLegacyComment = omit(ZFormattedComment, [
        "layer",
        "user_id",
        "is_my_post",
    ]);

    const ZApiChat = object({
        thread: optional(string(), ""),
        no: optional(number(), 0),
        vpos: number(),
        date: optional(number(), 0),
        date_usec: optional(number(), 0),
        nicoru: optional(number(), 0),
        premium: optional(number(), 0),
        anonymity: optional(number(), 0),
        user_id: optional(string(), ""),
        mail: optional(string(), ""),
        content: string(),
        deleted: optional(number(), 0),
    });
    const ZRawApiResponse = union([
        object({ chat: ZApiChat }),
        record(string([notValue("chat")]), unknown()),
    ]);
    const ZApiPing = object({
        content: string(),
    });
    const ZApiThread = object({
        resultcode: number(),
        thread: string(),
        server_time: number(),
        ticket: string(),
        revision: number(),
    });
    const ZApiLeaf = object({
        thread: string(),
        count: number(),
    });
    const ZApiGlobalNumRes = object({
        thread: string(),
        num_res: number(),
    });

    const ZOwnerComment = object({
        time: string(),
        command: string(),
        comment: string(),
    });

    const ZV1Comment = object({
        id: string(),
        no: number(),
        vposMs: number(),
        body: string(),
        commands: array(string()),
        userId: string(),
        isPremium: _boolean(),
        score: number(),
        postedAt: string(),
        nicoruCount: number(),
        nicoruId: nullable(string()),
        source: string(),
        isMyPost: _boolean(),
    });
    const ZV1Thread = object({
        id: unknown(),
        fork: string(),
        commentCount: optional(number(), 0),
        comments: array(ZV1Comment),
    });

    const ZXml2jsChatItem = object({
        _: string(),
        $: object({
            no: optional(string()),
            vpos: string(),
            date: optional(string(), "0"),
            date_usec: optional(string(), "0"),
            user_id: optional(string()),
            owner: optional(string(), ""),
            premium: optional(string(), ""),
            mail: optional(string(), ""),
        }),
    });
    const ZXml2jsChat = object({
        chat: array(ZXml2jsChatItem),
    });
    const ZXml2jsPacket = object({
        packet: ZXml2jsChat,
    });

    const ZInputFormatType = union([
        literal("XMLDocument"),
        literal("niconicome"),
        literal("xml2js"),
        literal("formatted"),
        literal("legacy"),
        literal("legacyOwner"),
        literal("owner"),
        literal("v1"),
        literal("empty"),
        literal("default"),
    ]);

    const ZCommentFont = union([
        literal("defont"),
        literal("mincho"),
        literal("gothic"),
        literal("gulim"),
        literal("simsun"),
    ]);
    union([
        literal("defont"),
        literal("mincho"),
        literal("gothic"),
    ]);
    const ZCommentFlashFont = union([
        literal("defont"),
        literal("gulim"),
        literal("simsun"),
    ]);
    const ZCommentContentItemSpacer = object({
        type: literal("spacer"),
        char: string(),
        charWidth: number(),
        isButton: optional(_boolean()),
        font: optional(ZCommentFlashFont),
        count: number(),
    });
    const ZCommentContentItemText = object({
        type: literal("text"),
        content: string(),
        slicedContent: array(string()),
        isButton: optional(_boolean()),
        font: optional(ZCommentFlashFont),
        width: optional(array(number())),
    });
    const ZCommentContentItem = union([
        ZCommentContentItemSpacer,
        ZCommentContentItemText,
    ]);
    const ZCommentMeasuredContentItemText = intersect([
        ZCommentContentItem,
        object({
            width: array(number()),
        }),
    ]);
    const ZCommentMeasuredContentItem = union([
        ZCommentMeasuredContentItemText,
        ZCommentContentItemSpacer,
    ]);
    const ZCommentSize = union([
        literal("big"),
        literal("medium"),
        literal("small"),
    ]);
    const ZCommentLoc = union([
        literal("ue"),
        literal("naka"),
        literal("shita"),
    ]);
    const ZNicoScriptReverseTarget = union([
        literal("\u30b3\u30e1"),
        literal("\u6295\u30b3\u30e1"),
        literal("\u5168"),
    ]);
    const ZNicoScriptReplaceRange = union([
        literal("\u5358"),
        literal("\u5168"),
    ]);
    const ZNicoScriptReplaceTarget = union([
        literal("\u30b3\u30e1"),
        literal("\u6295\u30b3\u30e1"),
        literal("\u5168"),
        literal("\u542b\u307e\u306a\u3044"),
        literal("\u542b\u3080"),
    ]);
    const ZNicoScriptReplaceCondition = union([
        literal("\u90e8\u5206\u4e00\u81f4"),
        literal("\u5b8c\u5168\u4e00\u81f4"),
    ]);
    const ZMeasureInput = object({
        font: ZCommentFont,
        content: array(ZCommentContentItem),
        lineHeight: number(),
        charSize: number(),
        lineCount: number(),
    });

    const colors = {
        white: "#FFFFFF",
        red: "#FF0000",
        pink: "#FF8080",
        orange: "#FFC000",
        yellow: "#FFFF00",
        green: "#00FF00",
        cyan: "#00FFFF",
        blue: "#0000FF",
        purple: "#C000FF",
        black: "#000000",
        white2: "#CCCC99",
        niconicowhite: "#CCCC99",
        red2: "#CC0033",
        truered: "#CC0033",
        pink2: "#FF33CC",
        orange2: "#FF6600",
        passionorange: "#FF6600",
        yellow2: "#999900",
        madyellow: "#999900",
        green2: "#00CC66",
        elementalgreen: "#00CC66",
        cyan2: "#00CCCC",
        blue2: "#3399FF",
        marinblue: "#3399FF",
        purple2: "#6633CC",
        nobleviolet: "#6633CC",
        black2: "#666666",
    };

    var colors$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        colors: colors
    });

    const isBoolean = (i) => typeof i === "boolean";
    const isNumber = (i) => typeof i === "number";
    const isObject = (i) => typeof i === "object";
    const typeGuard = {
        formatted: {
            comment: (i) => is(ZFormattedComment, i),
            comments: (i) => is(array(ZFormattedComment), i),
            legacyComment: (i) => is(ZFormattedLegacyComment, i),
            legacyComments: (i) => is(array(ZFormattedLegacyComment), i),
        },
        legacy: {
            rawApiResponses: (i) => is(array(ZRawApiResponse), i),
            apiChat: (i) => is(ZApiChat, i),
            apiGlobalNumRes: (i) => is(ZApiGlobalNumRes, i),
            apiLeaf: (i) => is(ZApiLeaf, i),
            apiPing: (i) => is(ZApiPing, i),
            apiThread: (i) => is(ZApiThread, i),
        },
        xmlDocument: (i) => {
            if (!i.documentElement ||
                i.documentElement.nodeName !== "packet")
                return false;
            if (!i.documentElement.children)
                return false;
            for (const element of Array.from(i.documentElement.children)) {
                if (!element || element.nodeName !== "chat")
                    continue;
                if (!typeAttributeVerify(element, ["vpos", "date"]))
                    return false;
            }
            return true;
        },
        xml2js: {
            packet: (i) => is(ZXml2jsPacket, i),
            chat: (i) => is(ZXml2jsChat, i),
            chatItem: (i) => is(ZXml2jsChatItem, i),
        },
        legacyOwner: {
            comments: (i) => is(string([
                custom((i) => {
                    const lists = i.split(/\r\n|\r|\n/);
                    for (const list of lists) {
                        if (list.split(":").length < 3) {
                            return false;
                        }
                    }
                    return true;
                }),
            ]), i),
        },
        owner: {
            comment: (i) => is(ZOwnerComment, i),
            comments: (i) => is(array(ZOwnerComment), i),
        },
        v1: {
            comment: (i) => is(ZV1Comment, i),
            comments: (i) => is(array(ZV1Comment), i),
            thread: (i) => is(ZV1Thread, i),
            threads: (i) => is(array(ZV1Thread), i),
        },
        nicoScript: {
            range: {
                target: (i) => is(ZNicoScriptReverseTarget, i),
            },
            replace: {
                range: (i) => is(ZNicoScriptReplaceRange, i),
                target: (i) => is(ZNicoScriptReplaceTarget, i),
                condition: (i) => is(ZNicoScriptReplaceCondition, i),
            },
        },
        comment: {
            font: (i) => is(ZCommentFont, i),
            loc: (i) => is(ZCommentLoc, i),
            size: (i) => is(ZCommentSize, i),
            command: {
                key: (i) => is(union([
                    literal("full"),
                    literal("ender"),
                    literal("_live"),
                    literal("invisible"),
                ]), i),
            },
            color: (i) => is(string([custom((i) => Object.keys(colors).includes(i))]), i),
            colorCode: (i) => is(string([regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6})$/)]), i),
            colorCodeAllowAlpha: (i) => is(string([
                regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
            ]), i),
        },
        config: {
            initOptions: (item) => {
                if (typeof item !== "object" || !item)
                    return false;
                const keys = {
                    useLegacy: isBoolean,
                    formatted: isBoolean,
                    showCollision: isBoolean,
                    showFPS: isBoolean,
                    showCommentCount: isBoolean,
                    drawAllImageOnLoad: isBoolean,
                    debug: isBoolean,
                    enableLegacyPiP: isBoolean,
                    keepCA: isBoolean,
                    scale: isNumber,
                    config: isObject,
                    format: (i) => is(ZInputFormatType, i),
                    video: (i) => is(optional(instance(HTMLVideoElement)), i),
                };
                for (const key of Object.keys(keys)) {
                    if (item[key] !== undefined &&
                        !keys[key](item[key])) {
                        console.warn(`[Incorrect input] var: initOptions, key: ${key}, value: ${item[key]}`);
                        return false;
                    }
                }
                return true;
            },
        },
        internal: {
            CommentMeasuredContentItem: (i) => is(ZCommentMeasuredContentItem, i),
            CommentMeasuredContentItemArray: (i) => is(array(ZCommentMeasuredContentItem), i),
            MultiConfigItem: (i) => typeof i === "object" && objectVerify(i, ["html5", "flash"]),
            HTML5Fonts: (i) => is(ZHTML5Fonts, i),
            MeasureInput: (i) => is(ZMeasureInput, i),
        },
    };
    const objectVerify = (item, keys) => {
        if (typeof item !== "object" || !item)
            return false;
        for (const key of keys) {
            if (!Object.hasOwn(item, key))
                return false;
        }
        return true;
    };
    const typeAttributeVerify = (item, keys) => {
        if (typeof item !== "object" || !item)
            return false;
        for (const key of keys) {
            if (item.getAttribute(key) === null)
                return false;
        }
        return true;
    };

    var typeGuard$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: typeGuard
    });

    const getConfig = (input, isFlash = false) => {
        if (typeGuard.internal.MultiConfigItem(input)) {
            return input[isFlash ? "flash" : "html5"];
        }
        return input;
    };

    const isLineBreakResize = (comment) => {
        return (!comment.resized &&
            !comment.ender &&
            comment.lineCount >= config.lineBreakCount[comment.size]);
    };
    const getDefaultCommand = (vpos) => {
        nicoScripts.default = nicoScripts.default.filter((item) => !item.long || item.start + item.long >= vpos);
        let color = undefined, size = undefined, font = undefined, loc = undefined;
        for (const item of nicoScripts.default) {
            if (item.loc) {
                loc = item.loc;
            }
            if (item.color) {
                color = item.color;
            }
            if (item.size) {
                size = item.size;
            }
            if (item.font) {
                font = item.font;
            }
            if (loc && color && size && font)
                break;
        }
        return { color, size, font, loc };
    };
    const nicoscriptReplaceIgnoreable = (comment, item) => ((item.target === "\u30b3\u30e1" ||
        item.target === "\u542b\u307e\u306a\u3044") &&
        comment.owner) ||
        (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
        (item.target === "\u542b\u307e\u306a\u3044" && comment.owner) ||
        (item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
            comment.content !== item.keyword) ||
        (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
            comment.content.indexOf(item.keyword) === -1);
    const applyNicoScriptReplace = (comment, commands) => {
        nicoScripts.replace = nicoScripts.replace.filter((item) => !item.long || item.start + item.long >= comment.vpos);
        for (const item of nicoScripts.replace) {
            if (nicoscriptReplaceIgnoreable(comment, item))
                continue;
            if (item.range === "\u5358") {
                comment.content = comment.content.replaceAll(item.keyword, item.replace);
            }
            else {
                comment.content = item.replace;
            }
            item.loc && (commands.loc = item.loc);
            item.color && (commands.color = item.color);
            item.size && (commands.size = item.size);
            item.font && (commands.font = item.font);
        }
    };
    const parseCommandAndNicoScript = (comment) => {
        const isFlash = isFlashComment(comment);
        const commands = parseCommands(comment);
        processNicoscript(comment, commands);
        const defaultCommand = getDefaultCommand(comment.vpos);
        applyNicoScriptReplace(comment, commands);
        const size = commands.size ?? defaultCommand.size ?? "medium";
        return {
            size: size,
            loc: commands.loc ?? defaultCommand.loc ?? "naka",
            color: commands.color ?? defaultCommand.color ?? "#FFFFFF",
            font: commands.font ?? defaultCommand.font ?? "defont",
            fontSize: getConfig(config.fontSize, isFlash)[size].default,
            long: commands.long ? Math.floor(Number(commands.long) * 100) : 300,
            flash: isFlash,
            full: commands.full,
            ender: commands.ender,
            _live: commands._live,
            invisible: commands.invisible,
            strokeColor: commands.strokeColor,
            wakuColor: commands.wakuColor,
            fillColor: commands.fillColor,
            button: commands.button,
        };
    };
    const parseBrackets = (input) => {
        const content = input.split(""), result = [];
        let quote = "", lastChar = "", string = "";
        for (const i of content) {
            if (RegExp(/^["'\u300c]$/).exec(i) && quote === "") {
                quote = i;
            }
            else if (RegExp(/^["']$/).exec(i) && quote === i && lastChar !== "\\") {
                result.push(string.replaceAll("\\n", "\n"));
                quote = "";
                string = "";
            }
            else if (i === "\u300d" && quote === "\u300c") {
                result.push(string);
                quote = "";
                string = "";
            }
            else if (quote === "" && RegExp(/^\s+$/).exec(i)) {
                if (string) {
                    result.push(string);
                    string = "";
                }
            }
            else {
                string += i;
            }
            lastChar = i;
        }
        result.push(string);
        return result;
    };
    const addNicoscriptReplace = (comment, commands) => {
        const result = parseBrackets(comment.content.slice(4));
        if (result[0] === undefined ||
            (result[2] !== undefined &&
                !typeGuard.nicoScript.replace.range(result[2])) ||
            (result[3] !== undefined &&
                !typeGuard.nicoScript.replace.target(result[3])) ||
            (result[4] !== undefined &&
                !typeGuard.nicoScript.replace.condition(result[4])))
            return;
        nicoScripts.replace.unshift({
            start: comment.vpos,
            long: commands.long === undefined ? undefined : Math.floor(commands.long * 100),
            keyword: result[0],
            replace: result[1] ?? "",
            range: result[2] ?? "\u5358",
            target: result[3] ?? "\u30b3\u30e1",
            condition: result[4] ?? "\u90e8\u5206\u4e00\u81f4",
            color: commands.color,
            size: commands.size,
            font: commands.font,
            loc: commands.loc,
            no: comment.id,
        });
        sortNicoscriptReplace();
    };
    const sortNicoscriptReplace = () => {
        nicoScripts.replace.sort((a, b) => {
            if (a.start < b.start)
                return -1;
            if (a.start > b.start)
                return 1;
            if (a.no < b.no)
                return -1;
            if (a.no > b.no)
                return 1;
            return 0;
        });
    };
    const processNicoscript = (comment, commands) => {
        const nicoscript = RegExp(/^[@\uff20](\S+)(?:\s(.+))?/).exec(comment.content);
        if (!nicoscript)
            return;
        if (nicoscript[1] === "\u30dc\u30bf\u30f3" && nicoscript[2]) {
            processAtButton(comment, commands);
            return;
        }
        if (!comment.owner)
            return;
        commands.invisible = true;
        if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
            processDefaultScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u9006") {
            processReverseScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
            processBanScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b7\u30fc\u30af\u7981\u6b62") {
            processSeekDisableScript$1(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b8\u30e3\u30f3\u30d7" && nicoscript[2]) {
            processJumpScript$1(comment, commands, nicoscript[2]);
            return;
        }
        if (nicoscript[1] === "\u7f6e\u63db") {
            addNicoscriptReplace(comment, commands);
        }
    };
    const processDefaultScript = (comment, commands) => {
        nicoScripts.default.unshift({
            start: comment.vpos,
            long: commands.long === undefined ? undefined : Math.floor(commands.long * 100),
            color: commands.color,
            size: commands.size,
            font: commands.font,
            loc: commands.loc,
        });
    };
    const processReverseScript = (comment, commands) => {
        const reverse = RegExp(/^[@\uff20]\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/).exec(comment.content);
        if (!reverse?.[1] || !typeGuard.nicoScript.range.target(reverse[1]))
            return;
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.reverse.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
            target: reverse[1],
        });
    };
    const processBanScript = (comment, commands) => {
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.ban.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
        });
    };
    const processSeekDisableScript$1 = (comment, commands) => {
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.seekDisable.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
        });
    };
    const processJumpScript$1 = (comment, commands, input) => {
        const options = RegExp(/\s*((?:sm|so|nm|\uff53\uff4d|\uff53\uff4f|\uff4e\uff4d)?[1-9\uff11-\uff19][0-9\uff11-\uff19]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/).exec(input);
        if (!options?.[1])
            return;
        nicoScripts.jump.unshift({
            start: comment.vpos,
            end: commands.long === undefined ? undefined : commands.long * 100,
            to: options[1],
            message: options[2],
        });
    };
    const processAtButton = (comment, commands) => {
        const args = parseBrackets(comment.content);
        if (args[1] === undefined)
            return;
        commands.invisible = false;
        const content = RegExp(/^(?:(?<before>.*?)\[)?(?<body>.*?)(?:\](?<after>[^\]]*?))?$/su).exec(args[1]);
        const message = {
            before: content.groups?.before ?? "",
            body: content.groups?.body ?? "",
            after: content.groups?.after ?? "",
        };
        commands.button = {
            message,
            commentMessage: args[2] ?? `${message.before}${message.body}${message.after}`,
            commentVisible: args[3] !== "\u975e\u8868\u793a",
            commentMail: args[4]?.split(",") ?? [],
            limit: Number(args[5] ?? 1),
            local: comment.mail.includes("local"),
            hidden: comment.mail.includes("hidden"),
        };
    };
    const parseCommands = (comment) => {
        const commands = comment.mail, isFlash = isFlashComment(comment);
        const result = {
            loc: undefined,
            size: undefined,
            fontSize: undefined,
            color: undefined,
            strokeColor: undefined,
            wakuColor: undefined,
            font: undefined,
            full: false,
            ender: false,
            _live: false,
            invisible: false,
            long: undefined,
        };
        for (const command of commands) {
            parseCommand(comment, command, result, isFlash);
        }
        if (comment.content.startsWith("/")) {
            result.invisible = true;
        }
        return result;
    };
    const parseCommand = (comment, _command, result, isFlash) => {
        const command = _command.toLowerCase();
        const long = RegExp(/^[@\uff20]([0-9.]+)/).exec(command);
        if (long) {
            result.long = Number(long[1]);
            return;
        }
        const strokeColor = getColor(RegExp(/^nico:stroke:(.+)$/).exec(command));
        if (strokeColor) {
            result.strokeColor ??= strokeColor;
            return;
        }
        const rectColor = getColor(RegExp(/^nico:waku:(.+)$/).exec(command));
        if (rectColor) {
            result.wakuColor ??= rectColor;
            return;
        }
        const fillColor = getColor(RegExp(/^nico:fill:(.+)$/).exec(command));
        if (fillColor) {
            result.fillColor ??= fillColor;
            return;
        }
        if (is(ZCommentLoc, command)) {
            result.loc ??= command;
            return;
        }
        if (result.size === undefined && is(ZCommentSize, command)) {
            result.size = command;
            result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
            return;
        }
        if (config.colors[command]) {
            result.color ??= config.colors[command];
            return;
        }
        const colorCode = RegExp(/^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/).exec(command);
        if (colorCode && comment.premium) {
            result.color ??= colorCode[0].toUpperCase();
            return;
        }
        if (is(ZCommentFont, command)) {
            result.font ??= command;
            return;
        }
        if (typeGuard.comment.command.key(command)) {
            result[command] = true;
        }
    };
    const getColor = (match) => {
        if (!match)
            return;
        const value = match[1];
        if (typeGuard.comment.color(value)) {
            return colors[value];
        }
        else if (typeGuard.comment.colorCodeAllowAlpha(value)) {
            return value;
        }
        return;
    };
    const isFlashComment = (comment) => options.mode === "flash" ||
        (options.mode === "default" &&
            !(comment.mail.includes("gothic") ||
                comment.mail.includes("defont") ||
                comment.mail.includes("mincho")) &&
            (comment.date < config.flashThreshold ||
                comment.mail.includes("nico:flash")));
    const isReverseActive = (vpos, isOwner) => {
        for (const range of nicoScripts.reverse) {
            if ((range.target === "コメ" && isOwner) ||
                (range.target === "投コメ" && !isOwner))
                continue;
            if (range.start < vpos && vpos < range.end) {
                return true;
            }
        }
        return false;
    };
    const isBanActive = (vpos) => {
        for (const range of nicoScripts.ban) {
            if (range.start < vpos && vpos < range.end)
                return true;
        }
        return false;
    };
    const processFixedComment = (comment, collision, timeline, lazy = false) => {
        const posY = lazy ? -1 : getFixedPosY(comment, collision);
        for (let j = 0; j < comment.long; j++) {
            const vpos = comment.vpos + j;
            arrayPush(timeline, vpos, comment);
            if (j > comment.long - 20)
                continue;
            arrayPush(collision, vpos, comment);
        }
        comment.posY = posY;
    };
    const processMovableComment = (comment, collision, timeline, lazy = false) => {
        const beforeVpos = Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
        const posY = lazy ? -1 : getMovablePosY(comment, collision, beforeVpos);
        for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
            const vpos = comment.vpos + j;
            const leftPos = getPosX(comment.comment, vpos);
            if (timeline[vpos]?.includes(comment))
                break;
            arrayPush(timeline, vpos, comment);
            if (leftPos + comment.width + config.collisionPadding >=
                config.collisionRange.right &&
                leftPos <= config.collisionRange.right) {
                arrayPush(collision.right, vpos, comment);
            }
            if (leftPos + comment.width + config.collisionPadding >=
                config.collisionRange.left &&
                leftPos <= config.collisionRange.left) {
                arrayPush(collision.left, vpos, comment);
            }
        }
        comment.posY = posY;
    };
    const getFixedPosY = (comment, collision) => {
        let posY = 0, isChanged = true, count = 0;
        while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (let j = 0; j < comment.long; j++) {
                const result = getPosY(posY, comment, collision[comment.vpos + j]);
                posY = result.currentPos;
                isChanged = result.isChanged;
                if (result.isBreak)
                    break;
            }
        }
        return posY;
    };
    const getMovablePosY = (comment, collision, beforeVpos) => {
        if (config.canvasHeight < comment.height) {
            return (comment.height - config.canvasHeight) / -2;
        }
        let posY = 0;
        let isChanged = true;
        let lastUpdatedIndex = undefined;
        while (isChanged) {
            isChanged = false;
            for (let j = beforeVpos, n = comment.long + 125; j < n; j += 5) {
                const vpos = comment.vpos + j;
                const leftPos = getPosX(comment.comment, vpos);
                let isBreak = false;
                if (lastUpdatedIndex !== undefined && lastUpdatedIndex === vpos) {
                    return posY;
                }
                if (leftPos + comment.width >= config.collisionRange.right &&
                    leftPos <= config.collisionRange.right) {
                    const result = getPosY(posY, comment, collision.right[vpos]);
                    posY = result.currentPos;
                    isChanged ||= result.isChanged;
                    if (result.isChanged)
                        lastUpdatedIndex = vpos;
                    isBreak = result.isBreak;
                }
                if (leftPos + comment.width >= config.collisionRange.left &&
                    leftPos <= config.collisionRange.left) {
                    const result = getPosY(posY, comment, collision.left[vpos]);
                    posY = result.currentPos;
                    isChanged ||= result.isChanged;
                    if (result.isChanged)
                        lastUpdatedIndex = vpos;
                    isBreak = result.isBreak;
                }
                if (isBreak)
                    return posY;
            }
        }
        return posY;
    };
    const getPosY = (currentPos, targetComment, collision, isChanged = false) => {
        let isBreak = false;
        if (!collision)
            return { currentPos, isChanged, isBreak };
        for (const collisionItem of collision) {
            if (collisionItem.index === targetComment.index || collisionItem.posY < 0)
                continue;
            if (collisionItem.owner === targetComment.owner &&
                collisionItem.layer === targetComment.layer &&
                currentPos < collisionItem.posY + collisionItem.height &&
                currentPos + targetComment.height > collisionItem.posY) {
                if (collisionItem.posY + collisionItem.height > currentPos) {
                    currentPos = collisionItem.posY + collisionItem.height;
                    isChanged = true;
                }
                if (currentPos + targetComment.height > config.canvasHeight) {
                    if (config.canvasHeight < targetComment.height) {
                        if (targetComment.mail.includes("naka")) {
                            currentPos = (targetComment.height - config.canvasHeight) / -2;
                        }
                        else {
                            currentPos = 0;
                        }
                    }
                    else {
                        currentPos = Math.floor(Math.random() * (config.canvasHeight - targetComment.height));
                    }
                    isBreak = true;
                    break;
                }
                return getPosY(currentPos, targetComment, collision, true);
            }
        }
        return { currentPos, isChanged, isBreak };
    };
    const getPosX = (comment, vpos, isReverse = false) => {
        if (comment.loc !== "naka") {
            return (config.canvasWidth - comment.width) / 2;
        }
        const speed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) /
            (comment.long + 100);
        const vposLapsed = vpos - comment.vpos;
        const posX = config.commentDrawPadding +
            config.commentDrawRange -
            (vposLapsed + 100) * speed;
        if (isReverse) {
            return config.canvasWidth - comment.width - posX;
        }
        return posX;
    };
    const parseFont = (font, size) => {
        switch (font) {
            case "gulim":
            case "simsun":
                return config.fonts.flash[font].replace("[size]", `${size}`);
            case "gothic":
            case "mincho":
                return `${config.fonts.html5[font].weight} ${size}px ${config.fonts.html5[font].font}`;
            default:
                return `${config.fonts.html5.defont.weight} ${size}px ${config.fonts.html5.defont.font}`;
        }
    };

    const changeCALayer = (rawData) => {
        const userScoreList = getUsersScore(rawData);
        const filteredComments = removeDuplicateCommentArt(rawData);
        const commentArts = filteredComments.filter((comment) => (userScoreList[comment.user_id] ?? 0) >= config.sameCAMinScore &&
            !comment.owner);
        const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
        const commentArtsGroupedByTimes = groupCommentsByTime(commentArtsGroupedByUser);
        updateLayerId(commentArtsGroupedByTimes);
        return filteredComments;
    };
    const getUsersScore = (comments) => {
        const userScoreList = {};
        for (const comment of comments) {
            if (comment.user_id === undefined || comment.user_id === -1)
                continue;
            userScoreList[comment.user_id] ||= 0;
            if (comment.mail.includes("ca") ||
                comment.mail.includes("patissier") ||
                comment.mail.includes("ender") ||
                comment.mail.includes("full")) {
                userScoreList[comment.user_id] += 5;
            }
            const lineCount = (comment.content.match(/\r\n|\n|\r/g) ?? []).length;
            if (lineCount > 2) {
                userScoreList[comment.user_id] += lineCount / 2;
            }
        }
        return userScoreList;
    };
    const removeDuplicateCommentArt = (comments) => {
        const index = {};
        return comments.filter((comment) => {
            const key = `${comment.content}@@${[...comment.mail]
            .sort((a, b) => a.localeCompare(b))
            .filter((e) => !RegExp(/@[\d.]+|184|device:.+|patissier|ca/).exec(e))
            .join("")}`, lastComment = index[key];
            if (lastComment === undefined) {
                index[key] = comment;
                return true;
            }
            if (comment.vpos - lastComment.vpos > config.sameCAGap ||
                Math.abs(comment.date - lastComment.date) < config.sameCARange) {
                index[key] = comment;
                return true;
            }
            return false;
        });
    };
    const updateLayerId = (filteredComments) => {
        let layerId = 0;
        for (const user of filteredComments) {
            for (const time of user.comments) {
                for (const comment of time.comments) {
                    comment.layer = layerId;
                }
                layerId++;
            }
        }
    };
    const groupCommentsByUser = (comments) => {
        return comments.reduce((users, comment) => {
            const user = getUser(comment.user_id, users);
            user.comments.push(comment);
            return users;
        }, []);
    };
    const getUser = (userId, users) => {
        const user = users.find((user) => user.userId === userId);
        if (user)
            return user;
        const obj = {
            userId,
            comments: [],
        };
        users.push(obj);
        return obj;
    };
    const groupCommentsByTime = (comments) => {
        return comments.reduce((result, user) => {
            result.push({
                userId: user.userId,
                comments: user.comments.reduce((result, comment) => {
                    const time = getTime(comment.date, result);
                    time.comments.push(comment);
                    time.range.start = Math.min(time.range.start, comment.date);
                    time.range.end = Math.max(time.range.end, comment.date);
                    return result;
                }, []),
            });
            return result;
        }, []);
    };
    const getTime = (time, times) => {
        const timeObj = times.find((timeObj) => timeObj.range.start - config.sameCATimestampRange <= time &&
            timeObj.range.end + config.sameCATimestampRange >= time);
        if (timeObj)
            return timeObj;
        const obj = {
            range: {
                start: time,
                end: time,
            },
            comments: [],
        };
        times.push(obj);
        return obj;
    };

    const nativeSort = (getter) => {
        return (a, b) => {
            if (getter(a) > getter(b)) {
                return 1;
            }
            else if (getter(a) < getter(b)) {
                return -1;
            }
            else {
                return 0;
            }
        };
    };

    const getFlashFontIndex = (part) => {
        const regex = {
            simsunStrong: new RegExp(config.flashChar.simsunStrong),
            simsunWeak: new RegExp(config.flashChar.simsunWeak),
            gulim: new RegExp(config.flashChar.gulim),
            gothic: new RegExp(config.flashChar.gothic),
        };
        const index = [];
        let match;
        if ((match = regex.simsunStrong.exec(part)) !== null) {
            index.push({ font: "simsunStrong", index: match.index });
        }
        if ((match = regex.simsunWeak.exec(part)) !== null) {
            index.push({ font: "simsunWeak", index: match.index });
        }
        if ((match = regex.gulim.exec(part)) !== null) {
            index.push({ font: "gulim", index: match.index });
        }
        if ((match = regex.gothic.exec(part)) !== null) {
            index.push({ font: "gothic", index: match.index });
        }
        return index;
    };
    const getFlashFontName = (font) => {
        if (font === "simsunStrong" || font === "simsunWeak")
            return "simsun";
        if (font === "gothic")
            return "defont";
        return font;
    };
    const parseContent = (content) => {
        const results = [];
        const lines = Array.from(content.match(/\n|[^\n]+/g) ?? []);
        for (const line of lines) {
            const lineContent = parseLine(line);
            const firstContent = lineContent[0];
            const defaultFont = firstContent?.font;
            if (defaultFont) {
                results.push(...lineContent.map((val) => {
                    val.font ??= defaultFont;
                    if (val.type === "spacer") {
                        const spacer = config.compatSpacer.flash[val.char];
                        if (!spacer)
                            return val;
                        const width = spacer[val.font];
                        if (!width)
                            return val;
                        val.charWidth = width;
                    }
                    return val;
                }));
            }
            else {
                results.push(...lineContent);
            }
        }
        return results;
    };
    const parseLine = (line) => {
        const parts = Array.from(line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) ?? []);
        const lineContent = [];
        for (const part of parts) {
            if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
                addPartToResult(lineContent, part, "defont");
                continue;
            }
            parseFullWidthPart(part, lineContent);
        }
        return lineContent;
    };
    const addPartToResult = (lineContent, part, font) => {
        if (part === "")
            return;
        for (const key of Object.keys(config.compatSpacer.flash)) {
            const spacerWidth = config.compatSpacer.flash[key]?.[font ?? "defont"];
            if (!spacerWidth)
                continue;
            const compatIndex = part.indexOf(key);
            if (compatIndex >= 0) {
                addPartToResult(lineContent, part.slice(0, compatIndex), font);
                let i = compatIndex;
                for (; i < part.length && part[i] === key; i++) {
                }
                lineContent.push({
                    type: "spacer",
                    char: key,
                    charWidth: spacerWidth,
                    font,
                    count: i - compatIndex,
                });
                addPartToResult(lineContent, part.slice(i), font);
                return;
            }
        }
        lineContent.push({
            type: "text",
            content: part,
            slicedContent: part.split("\n"),
            font,
        });
    };
    const parseFullWidthPart = (part, lineContent) => {
        const index = getFlashFontIndex(part);
        if (index.length === 0) {
            addPartToResult(lineContent, part);
        }
        else if (index.length === 1 && index[0]) {
            addPartToResult(lineContent, part, getFlashFontName(index[0].font));
        }
        else {
            parseMultiFontFullWidthPart(part, index, lineContent);
        }
    };
    const parseMultiFontFullWidthPart = (part, index, lineContent) => {
        index.sort(nativeSort((val) => val.index));
        if (config.flashMode === "xp") {
            let offset = 0;
            for (let i = 1, n = index.length; i < n; i++) {
                const currentVal = index[i], lastVal = index[i - 1];
                if (currentVal === undefined || lastVal === undefined)
                    continue;
                const content = part.slice(offset, currentVal.index);
                addPartToResult(lineContent, content, getFlashFontName(lastVal.font));
                offset = currentVal.index;
            }
            const val = index[index.length - 1];
            if (val) {
                const content = part.slice(offset);
                addPartToResult(lineContent, content, getFlashFontName(val.font));
            }
            return;
        }
        const firstVal = index[0], secondVal = index[1];
        if (!firstVal || !secondVal) {
            addPartToResult(lineContent, part);
            return;
        }
        if (firstVal.font !== "gothic") {
            addPartToResult(lineContent, part, getFlashFontName(firstVal.font));
            return;
        }
        const firstContent = part.slice(0, secondVal.index);
        const secondContent = part.slice(secondVal.index);
        addPartToResult(lineContent, firstContent, getFlashFontName(firstVal.font));
        addPartToResult(lineContent, secondContent, getFlashFontName(secondVal.font));
    };
    const getButtonParts = (comment) => {
        let leftParts = undefined;
        const parts = [];
        const atButtonPadding = getConfig(config.atButtonPadding, true);
        const lineOffset = comment.lineOffset;
        const lineHeight = comment.fontSize * comment.lineHeight;
        const offsetKey = comment.resizedY ? "resized" : "default";
        const offsetY = config.flashCommentYPaddingTop[offsetKey] +
            comment.fontSize *
                comment.lineHeight *
                config.flashCommentYOffset[comment.size][offsetKey];
        let leftOffset = 0, lineCount = 0, isLastButton = false;
        for (const item of comment.content) {
            if (item.type === "spacer") {
                leftOffset += item.count * comment.fontSize * item.charWidth;
                continue;
            }
            const lines = item.slicedContent;
            for (let j = 0, n = lines.length; j < n; j++) {
                const line = lines[j];
                if (line === undefined)
                    continue;
                const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
                const partWidth = item.width[j] ?? 0;
                if (comment.button && !comment.button.hidden) {
                    if (!isLastButton && item.isButton) {
                        leftParts = {
                            type: "left",
                            left: leftOffset + atButtonPadding,
                            top: posY - lineHeight + atButtonPadding,
                            width: partWidth + atButtonPadding,
                            height: lineHeight,
                        };
                        leftOffset += atButtonPadding * 2;
                    }
                    else if (isLastButton && item.isButton) {
                        parts.push({
                            type: "middle",
                            left: leftOffset,
                            top: posY - lineHeight + atButtonPadding,
                            width: partWidth,
                            height: lineHeight,
                        });
                    }
                    else if (isLastButton && !item.isButton) {
                        if (leftParts) {
                            comment.buttonObjects = {
                                left: leftParts,
                                middle: parts,
                                right: {
                                    type: "right",
                                    right: leftOffset + atButtonPadding,
                                    top: posY - lineHeight + atButtonPadding,
                                    height: lineHeight,
                                },
                            };
                        }
                        return comment;
                    }
                }
                if (j < n - 1) {
                    leftOffset = 0;
                    lineCount += 1;
                    continue;
                }
                leftOffset += partWidth;
            }
            isLastButton = !!item.isButton;
        }
        if (comment.button && !comment.button.hidden && isLastButton && leftParts) {
            const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
            comment.buttonObjects = {
                left: leftParts,
                middle: parts,
                right: {
                    type: "right",
                    right: leftOffset + atButtonPadding,
                    top: posY - lineHeight + atButtonPadding,
                    height: lineHeight,
                },
            };
        }
        return comment;
    };
    const buildAtButtonComment = (comment, vpos) => {
        if (!comment.button || comment.button.limit <= 0)
            return;
        comment.button.limit -= 1;
        const mail = [...comment.button.commentMail, "from_button"];
        if (!comment.button.commentVisible) {
            mail.push("invisible");
        }
        return {
            id: -1,
            vpos,
            content: comment.button.commentMessage,
            date: -1,
            date_usec: -1,
            owner: false,
            premium: true,
            mail,
            user_id: -10,
            layer: -1,
            is_my_post: true,
        };
    };

    class TypeGuardError extends Error {
        constructor(options = {}) {
            super("Type Guard Error\nAn error occurred due to unexpected values\nPlease contact the developer on GitHub", options);
        }
    }
    TypeGuardError.prototype.name = "TypeGuardError";

    const getLineHeight = (fontSize, isFlash, resized = false) => {
        const lineCounts = getConfig(config.html5LineCounts, isFlash), commentStageSize = getConfig(config.commentStageSize, isFlash), lineHeight = commentStageSize.height / lineCounts.doubleResized[fontSize], defaultLineCount = lineCounts.default[fontSize];
        if (resized) {
            const resizedLineCount = lineCounts.resized[fontSize];
            return ((commentStageSize.height -
                lineHeight * (defaultLineCount / resizedLineCount)) /
                (resizedLineCount - 1));
        }
        return (commentStageSize.height - lineHeight) / (defaultLineCount - 1);
    };
    const getCharSize = (fontSize, isFlash) => {
        const lineCounts = getConfig(config.html5LineCounts, isFlash), commentStageSize = getConfig(config.commentStageSize, isFlash);
        return commentStageSize.height / lineCounts.doubleResized[fontSize];
    };
    const measure = (comment, renderer) => {
        const width = measureWidth(comment, renderer);
        return {
            ...width,
            height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
        };
    };
    const addHTML5PartToResult = (lineContent, part, font) => {
        if (part === "")
            return;
        font ??= "defont";
        for (const key of Object.keys(config.compatSpacer.html5)) {
            const spacerWidth = config.compatSpacer.html5[key]?.[font];
            if (!spacerWidth)
                continue;
            const compatIndex = part.indexOf(key);
            if (compatIndex >= 0) {
                addHTML5PartToResult(lineContent, part.slice(0, compatIndex), font);
                let i = compatIndex;
                for (; i < part.length && part[i] === key; i++) {
                }
                lineContent.push({
                    type: "spacer",
                    char: key,
                    charWidth: spacerWidth,
                    count: i - compatIndex,
                });
                addHTML5PartToResult(lineContent, part.slice(i), font);
                return;
            }
        }
        lineContent.push({
            type: "text",
            content: part,
            slicedContent: part.split("\n"),
        });
    };
    const measureWidth = (comment, renderer) => {
        const { fontSize, scale } = getFontSizeAndScale(comment.charSize), lineWidth = [], itemWidth = [];
        renderer.setFont(parseFont(comment.font, fontSize));
        let currentWidth = 0;
        for (const item of comment.content) {
            if (item.type === "spacer") {
                currentWidth += item.count * fontSize * item.charWidth;
                itemWidth.push([item.count * fontSize * item.charWidth]);
                lineWidth.push(Math.ceil(currentWidth * scale));
                continue;
            }
            const lines = item.content.split("\n");
            renderer.setFont(parseFont(item.font ?? comment.font, fontSize));
            const width = [];
            for (let j = 0, n = lines.length; j < n; j++) {
                const line = lines[j];
                if (line === undefined)
                    throw new TypeGuardError();
                const measure = renderer.measureText(line);
                currentWidth += measure.width;
                width.push(measure.width);
                if (j < lines.length - 1) {
                    lineWidth.push(Math.ceil(currentWidth * scale));
                    currentWidth = 0;
                }
            }
            itemWidth.push(width);
            lineWidth.push(Math.ceil(currentWidth * scale));
        }
        return {
            width: Math.max(...lineWidth),
            lineWidth,
            itemWidth,
        };
    };
    const getFontSizeAndScale = (charSize) => {
        charSize *= 0.8;
        if (charSize < config.html5MinFontSize) {
            if (charSize >= 1)
                charSize = Math.floor(charSize);
            return {
                scale: charSize / config.html5MinFontSize,
                fontSize: config.html5MinFontSize,
            };
        }
        return {
            scale: 1,
            fontSize: Math.floor(charSize),
        };
    };

    var index$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        addHTML5PartToResult: addHTML5PartToResult,
        arrayEqual: arrayEqual,
        arrayPush: arrayPush,
        buildAtButtonComment: buildAtButtonComment,
        changeCALayer: changeCALayer,
        getButtonParts: getButtonParts,
        getCharSize: getCharSize,
        getConfig: getConfig,
        getDefaultCommand: getDefaultCommand,
        getFixedPosY: getFixedPosY,
        getFlashFontIndex: getFlashFontIndex,
        getFlashFontName: getFlashFontName,
        getFontSizeAndScale: getFontSizeAndScale,
        getLineHeight: getLineHeight,
        getMovablePosY: getMovablePosY,
        getPosX: getPosX,
        getPosY: getPosY,
        getStrokeColor: getStrokeColor,
        hex2rgb: hex2rgb,
        hex2rgba: hex2rgba,
        isBanActive: isBanActive,
        isFlashComment: isFlashComment,
        isLineBreakResize: isLineBreakResize,
        isReverseActive: isReverseActive,
        measure: measure,
        nativeSort: nativeSort,
        parseCommandAndNicoScript: parseCommandAndNicoScript,
        parseContent: parseContent,
        parseFont: parseFont,
        processFixedComment: processFixedComment,
        processMovableComment: processMovableComment
    });

    class BaseComment {
        renderer;
        cacheKey;
        comment;
        pos;
        posY;
        pluginName = "BaseComment";
        image;
        buttonImage;
        index;
        constructor(comment, renderer, index) {
            this.renderer = renderer;
            this.posY = -1;
            this.pos = { x: 0, y: 0 };
            comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
            this.comment = this.convertComment(comment);
            this.cacheKey = this.getCacheKey();
            this.index = index;
        }
        get invisible() {
            return this.comment.invisible;
        }
        get loc() {
            return this.comment.loc;
        }
        get long() {
            return this.comment.long;
        }
        get vpos() {
            return this.comment.vpos;
        }
        get width() {
            return this.comment.width;
        }
        get height() {
            return this.comment.height;
        }
        get flash() {
            return false;
        }
        get layer() {
            return this.comment.layer;
        }
        get owner() {
            return this.comment.owner;
        }
        get mail() {
            return this.comment.mail;
        }
        get content() {
            throw new NotImplementedError(this.pluginName, "set: content");
        }
        set content(_) {
            throw new NotImplementedError(this.pluginName, "set: content");
        }
        getCommentSize(parsedData) {
            console.error("getCommentSize method is not implemented", parsedData);
            throw new NotImplementedError(this.pluginName, "getCommentSize");
        }
        parseCommandAndNicoscript(comment) {
            console.error("parseCommandAndNicoscript method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "parseCommandAndNicoscript");
        }
        parseContent(comment) {
            console.error("parseContent method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "parseContent");
        }
        measureText(comment) {
            console.error("measureText method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "measureText");
        }
        convertComment(comment) {
            console.error("convertComment method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "convertComment");
        }
        draw(vpos, showCollision, cursor) {
            if (isBanActive(vpos))
                return;
            const reverse = isReverseActive(vpos, this.comment.owner);
            const posX = getPosX(this.comment, vpos, reverse);
            const posY = this.comment.loc === "shita"
                ? config.canvasHeight - this.posY - this.comment.height
                : this.posY;
            this.pos = {
                x: posX,
                y: posY,
            };
            this._drawBackgroundColor(posX, posY);
            this._draw(posX, posY, cursor);
            this._drawRectColor(posX, posY);
            this._drawCollision(posX, posY, showCollision);
            this._drawDebugInfo(posX, posY);
        }
        _draw(posX, posY, cursor) {
            if (this.image === undefined) {
                this.image = this.getTextImage();
            }
            if (this.image) {
                this.renderer.save();
                if (this.comment._live) {
                    this.renderer.setGlobalAlpha(config.contextFillLiveOpacity);
                }
                else {
                    this.renderer.setGlobalAlpha(1);
                }
                if (this.comment.button && !this.comment.button.hidden) {
                    const button = this.getButtonImage(posX, posY, cursor);
                    button && this.renderer.drawImage(button, posX, posY);
                }
                this.renderer.drawImage(this.image, posX, posY);
                this.renderer.restore();
            }
        }
        _drawRectColor(posX, posY) {
            if (this.comment.wakuColor) {
                this.renderer.save();
                this.renderer.setStrokeStyle(this.comment.wakuColor);
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                this.renderer.restore();
            }
        }
        _drawBackgroundColor(posX, posY) {
            if (this.comment.fillColor) {
                this.renderer.save();
                this.renderer.setFillStyle(this.comment.fillColor);
                this.renderer.fillRect(posX, posY, this.comment.width, this.comment.height);
                this.renderer.restore();
            }
        }
        _drawDebugInfo(posX, posY) {
            if (isDebug) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 30));
                this.renderer.setFillStyle("#ff00ff");
                this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
                this.renderer.restore();
            }
        }
        _drawCollision(posX, posY, showCollision) {
            console.error("_drawCollision method is not implemented", posX, posY, showCollision);
            throw new NotImplementedError(this.pluginName, "_drawCollision");
        }
        getTextImage() {
            if (this.comment.invisible ||
                (this.comment.lineCount === 1 && this.comment.width === 0) ||
                this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
                    0)
                return null;
            const cache = imageCache[this.cacheKey];
            if (cache) {
                this.image = cache.image;
                window.setTimeout(() => {
                    delete this.image;
                }, this.comment.long * 10 + config.cacheAge);
                clearTimeout(cache.timeout);
                cache.timeout = window.setTimeout(() => {
                    imageCache[this.cacheKey]?.image.destroy();
                    delete imageCache[this.cacheKey];
                }, this.comment.long * 10 + config.cacheAge);
                return cache.image;
            }
            if (this.image)
                return this.image;
            const image = this._generateTextImage();
            this._cacheImage(image);
            return image;
        }
        _generateTextImage() {
            console.error("_generateTextImage method is not implemented");
            throw new NotImplementedError(this.pluginName, "_generateTextImage");
        }
        _cacheImage(image) {
            this.image = image;
            window.setTimeout(() => {
                delete this.image;
            }, this.comment.long * 10 + config.cacheAge);
            imageCache[this.cacheKey] = {
                timeout: window.setTimeout(() => {
                    delete imageCache[this.cacheKey];
                }, this.comment.long * 10 + config.cacheAge),
                image,
            };
        }
        getButtonImage(posX, posY, cursor) {
            console.error("getButtonImage method is not implemented", posX, posY, cursor);
            throw new NotImplementedError(this.pluginName, "getButtonImage");
        }
        isHovered(cursor, posX, posY) {
            console.error("isHovered method is not implemented", posX, posY, cursor);
            throw new NotImplementedError(this.pluginName, "getButtonImage");
        }
        getCacheKey() {
            return (JSON.stringify(this.comment.content) +
                `@@${this.pluginName}@@` +
                [...this.comment.mail].sort((a, b) => a.localeCompare(b)).join(","));
        }
    }

    const drawLeftBorder = (context, left, top, width, height, radius) => {
        context.save();
        context.beginPath();
        context.moveTo(left + width, top);
        context.lineTo(left + radius, top);
        context.quadraticCurveTo(left, top, left, top + radius);
        context.lineTo(left, top + height - radius);
        context.quadraticCurveTo(left, top + height, left + radius, top + height);
        context.lineTo(left + width, top + height);
        context.stroke();
        context.restore();
    };
    const drawMiddleBorder = (context, left, top, width, height) => {
        context.save();
        context.beginPath();
        context.moveTo(left + width, top);
        context.lineTo(left, top);
        context.moveTo(left + width, top + height);
        context.lineTo(left, top + height);
        context.stroke();
        context.restore();
    };
    const drawRightBorder = (context, right, top, height, radius) => {
        context.save();
        context.beginPath();
        context.moveTo(right - radius, top);
        context.quadraticCurveTo(right, top, right, top + radius);
        context.lineTo(right, top + height - radius);
        context.quadraticCurveTo(right, top + height, right - radius, top + height);
        context.stroke();
        context.restore();
    };

    class FlashComment extends BaseComment {
        _globalScale;
        pluginName = "FlashComment";
        buttonImage;
        constructor(comment, renderer, index) {
            super(comment, renderer, index);
            this._globalScale ??= getConfig(config.commentScale, true);
            this.buttonImage = renderer.getCanvas();
        }
        get content() {
            return this.comment.rawContent;
        }
        set content(input) {
            const { content, lineCount, lineOffset } = this.parseContent(input);
            const comment = {
                ...this.comment,
                rawContent: input,
                content,
                lineCount,
                lineOffset,
            };
            const val = content[0];
            if (val?.font) {
                comment.font = val.font;
            }
            this.comment = this.getCommentSize(comment);
            this.cacheKey = this.getCacheKey();
            delete this.image;
        }
        convertComment(comment) {
            this._globalScale = getConfig(config.commentScale, true);
            return getButtonParts(this.getCommentSize(this.parseCommandAndNicoscript(comment)));
        }
        getCommentSize(parsedData) {
            if (parsedData.invisible) {
                return {
                    ...parsedData,
                    height: 0,
                    width: 0,
                    lineHeight: 0,
                    fontSize: 0,
                    resized: false,
                    resizedX: false,
                    resizedY: false,
                    charSize: 0,
                    scale: 1,
                    scaleX: 1,
                    content: [],
                };
            }
            this.renderer.save();
            this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
            const measure = this.measureText({ ...parsedData, scale: 1 });
            if (options.scale !== 1 && parsedData.layer === -1) {
                measure.height *= options.scale;
                measure.width *= options.scale;
            }
            this.renderer.restore();
            if (parsedData.button && !parsedData.button.hidden) {
                measure.width += getConfig(config.atButtonPadding, true) * 4;
            }
            return {
                ...parsedData,
                height: measure.height * this._globalScale,
                width: measure.width * this._globalScale,
                lineHeight: measure.lineHeight,
                fontSize: measure.fontSize,
                resized: measure.resized,
                resizedX: measure.resizedX,
                resizedY: measure.resizedY,
                charSize: measure.charSize,
                scale: measure.scale,
                scaleX: measure.scaleX,
                content: measure.content,
            };
        }
        parseCommandAndNicoscript(comment) {
            const data = parseCommandAndNicoScript(comment);
            const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.button);
            const val = content[0];
            if (val?.font) {
                data.font = val.font;
            }
            return {
                ...comment,
                rawContent: comment.content,
                ...data,
                content,
                lineCount,
                lineOffset,
            };
        }
        parseContent(input, button) {
            const content = button
                ? [
                    ...parseContent(button.message.before),
                    ...parseContent(button.message.body).map((val) => {
                        val.isButton = true;
                        return val;
                    }),
                    ...parseContent(button.message.after),
                ]
                : parseContent(input);
            const lineCount = (input.match(/\n/g)?.length ?? 0) + 1;
            const lineOffset = (input.match(new RegExp(config.flashScriptChar.super, "g"))?.length ??
                0) *
                -1 *
                config.flashScriptCharOffset +
                (input.match(new RegExp(config.flashScriptChar.sub, "g"))?.length ?? 0) *
                    config.flashScriptCharOffset;
            return {
                content,
                lineCount,
                lineOffset,
            };
        }
        measureText(comment) {
            const configLineHeight = getConfig(config.lineHeight, true), configFontSize = getConfig(config.fontSize, true)[comment.size], configStageSize = getConfig(config.commentStageSize, true);
            const defaultFontSize = configFontSize.default;
            comment.lineHeight ??= configLineHeight[comment.size].default;
            const widthLimit = configStageSize[comment.full ? "fullWidth" : "width"];
            const { scaleX, width, height } = this._measureContent(comment);
            let scale = 1;
            if (isLineBreakResize(comment)) {
                comment.resized = true;
                comment.resizedY = true;
                const lineBreakScale = config.flashLineBreakScale[comment.size];
                const scaledWidth = width * lineBreakScale;
                if (comment.loc !== "naka" &&
                    this._isDoubleResize(scaledWidth, widthLimit, comment.size, comment.lineCount, comment.full)) {
                    if (scaledWidth > widthLimit) {
                        const resizedFontSize = Math.round((widthLimit / scaledWidth) * defaultFontSize);
                        const resizeRate = (resizedFontSize + 1) / (defaultFontSize + 1);
                        scale *= resizeRate;
                    }
                }
                else {
                    scale *= lineBreakScale;
                }
            }
            else if (comment.loc !== "naka" && width > widthLimit) {
                const resizeRate = (Math.round((widthLimit / width) * defaultFontSize) + 1) /
                    (defaultFontSize + 1);
                scale *= resizeRate;
            }
            comment.scale = scale;
            if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
                throw new TypeGuardError();
            }
            return {
                charSize: 0,
                height: height * scale,
                resized: !!comment.resized,
                fontSize: comment.fontSize,
                lineHeight: comment.lineHeight,
                content: comment.content,
                resizedX: !!comment.resizedX,
                resizedY: !!comment.resizedY,
                scale: comment.scale,
                scaleX: scaleX,
                width: width * scale,
            };
        }
        _isDoubleResize(width, widthLimit, size, lineCount, isFull) {
            if (width < widthLimit * 0.9 || widthLimit * 1.1 < width)
                return width > widthLimit;
            if (size === "big") {
                if (8 <= lineCount &&
                    lineCount <= 14 &&
                    !isFull &&
                    widthLimit * 0.99 < width)
                    return true;
                if (width <= widthLimit)
                    return false;
                if (16 <= lineCount && width * 0.95 < widthLimit)
                    return true;
                if (isFull) {
                    if (width * 0.95 < widthLimit)
                        return false;
                    return width > widthLimit;
                }
                return true;
            }
            if (width <= widthLimit)
                return false;
            if (((size === "medium" && 25 <= lineCount) ||
                (size === "small" && 38 <= lineCount)) &&
                width * 0.95 < widthLimit)
                return false;
            return widthLimit < width;
        }
        _measureContent(comment) {
            const widthArr = [], spacedWidthArr = [];
            let currentWidth = 0, spacedWidth = 0;
            for (const item of comment.content) {
                if (item.type === "spacer") {
                    spacedWidth +=
                        item.count * item.charWidth * comment.fontSize +
                            Math.max(item.count - 1, 0) * config.flashLetterSpacing;
                    currentWidth += item.count * item.charWidth * comment.fontSize;
                    widthArr.push(currentWidth);
                    spacedWidthArr.push(spacedWidth);
                    continue;
                }
                const lines = item.content.split("\n");
                const widths = [];
                this.renderer.setFont(parseFont(item.font ?? comment.font, comment.fontSize));
                for (let i = 0, n = lines.length; i < n; i++) {
                    const value = lines[i];
                    if (value === undefined)
                        continue;
                    const measure = this.renderer.measureText(value);
                    currentWidth += measure.width;
                    spacedWidth +=
                        measure.width +
                            Math.max(value.length - 1, 0) * config.flashLetterSpacing;
                    widths.push(measure.width);
                    if (i < lines.length - 1) {
                        widthArr.push(currentWidth);
                        spacedWidthArr.push(spacedWidth);
                        spacedWidth = 0;
                        currentWidth = 0;
                    }
                }
                widthArr.push(currentWidth);
                spacedWidthArr.push(spacedWidth);
                item.width = widths;
            }
            const leadLine = (function () {
                let max = 0, index = -1;
                spacedWidthArr.forEach((val, i) => {
                    if (max < val) {
                        max = val;
                        index = i;
                    }
                });
                return { max, index };
            })();
            const scaleX = leadLine.max / (widthArr[leadLine.index] ?? 1);
            const width = leadLine.max * comment.scale;
            const height = (comment.fontSize * (comment.lineHeight ?? 0) * comment.lineCount +
                config.flashCommentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
                comment.scale;
            return { scaleX, width, height };
        }
        _drawCollision(posX, posY, showCollision) {
            if (showCollision) {
                this.renderer.save();
                this.renderer.setStrokeStyle("rgba(255,0,255,1)");
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                for (let i = 0, n = this.comment.lineCount; i < n; i++) {
                    const linePosY = ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
                        config.flashCommentYPaddingTop[this.comment.resizedY ? "resized" : "default"]) *
                        this.comment.scale;
                    this.renderer.setStrokeStyle(`rgba(255,255,0,0.25)`);
                    this.renderer.strokeRect(posX, posY + linePosY * this._globalScale, this.comment.width, this.comment.fontSize *
                        this.comment.lineHeight *
                        -1 *
                        this._globalScale *
                        this.comment.scale *
                        (this.comment.layer === -1 ? options.scale : 1));
                }
                this.renderer.restore();
            }
        }
        _generateTextImage() {
            const renderer = this.renderer.getCanvas();
            this._setupCanvas(renderer);
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            const lineOffset = this.comment.lineOffset;
            const lineHeight = this.comment.fontSize * this.comment.lineHeight;
            const offsetKey = this.comment.resizedY ? "resized" : "default";
            const offsetY = config.flashCommentYPaddingTop[offsetKey] +
                this.comment.fontSize *
                    this.comment.lineHeight *
                    config.flashCommentYOffset[this.comment.size][offsetKey];
            let lastFont = this.comment.font, leftOffset = 0, lineCount = 0, isLastButton = false;
            for (const item of this.comment.content) {
                if (item.type === "spacer") {
                    leftOffset += item.count * item.charWidth * this.comment.fontSize;
                    isLastButton = !!item.isButton;
                    continue;
                }
                const font = item.font ?? this.comment.font;
                if (lastFont !== font) {
                    lastFont = font;
                    renderer.setFont(parseFont(font, this.comment.fontSize));
                }
                const lines = item.slicedContent;
                for (let lineIndex = 0, lineLength = lines.length; lineIndex < lineLength; lineIndex++) {
                    const line = lines[lineIndex];
                    if (line === undefined)
                        continue;
                    const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
                    const partWidth = item.width[lineIndex] ?? 0;
                    if (this.comment.button &&
                        !this.comment.button.hidden &&
                        ((!isLastButton && item.isButton) || (isLastButton && !item.isButton))) {
                        leftOffset += atButtonPadding * 2;
                    }
                    renderer.strokeText(line, leftOffset, posY);
                    renderer.fillText(line, leftOffset, posY);
                    leftOffset += partWidth;
                    if (lineIndex < lineLength - 1) {
                        leftOffset = 0;
                        lineCount += 1;
                    }
                }
                isLastButton = !!item.isButton;
            }
            return renderer;
        }
        getButtonImage(posX, posY, cursor) {
            if (!this.comment.button || this.comment.button.hidden)
                return undefined;
            const { renderer } = this._setupCanvas(this.buttonImage);
            const parts = this.comment.buttonObjects;
            if (!parts)
                return undefined;
            const atButtonRadius = getConfig(config.atButtonRadius, true);
            const isHover = this.isHovered(cursor, posX, posY);
            renderer.save();
            const getStrokeStyle = () => {
                if (isHover) {
                    return this.comment.color;
                }
                if (this.comment.button && this.comment.button.limit < 1) {
                    return "#777777";
                }
                return "white";
            };
            renderer.setStrokeStyle(getStrokeStyle());
            drawLeftBorder(renderer, parts.left.left, parts.left.top, parts.left.width, parts.left.height, atButtonRadius);
            for (const part of parts.middle) {
                drawMiddleBorder(renderer, part.left, part.top, part.width, part.height);
            }
            drawRightBorder(renderer, parts.right.right, parts.right.top, parts.right.height, atButtonRadius);
            renderer.restore();
            return renderer;
        }
        isHovered(_cursor, _posX, _posY) {
            if (!_cursor || !this.comment.buttonObjects)
                return false;
            const { left, middle, right } = this.comment.buttonObjects;
            const scale = this._globalScale *
                this.comment.scale *
                this.comment.scaleX *
                (this.comment.layer === -1 ? options.scale : 1);
            const posX = (_posX ?? this.pos.x) / scale;
            const posY = (_posY ?? this.pos.y) / scale;
            const cursor = {
                x: _cursor.x / scale,
                y: _cursor.y / scale,
            };
            if (cursor.x < posX ||
                posX + this.comment.width < cursor.x ||
                cursor.y < posY + left.top ||
                posY + right.top + right.height < cursor.y) {
                return false;
            }
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            const between = (val, min, max) => {
                return min < val && val < max;
            };
            for (const part of [left, ...middle]) {
                if (between(cursor.x, posX + part.left, posX + part.left + part.width) &&
                    between(cursor.y, posY + part.top, posY + part.top + part.height)) {
                    return true;
                }
            }
            return (between(cursor.x, posX + right.right - atButtonPadding, posX + right.right + getConfig(config.contextLineWidth, true) / 2) && between(cursor.y, posY + right.top, posY + right.top + right.height));
        }
        _setupCanvas(renderer) {
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            renderer.setSize(this.comment.width, this.comment.height + (this.comment.button ? atButtonPadding * 2 : 0));
            renderer.setStrokeStyle(getStrokeColor(this.comment));
            renderer.setFillStyle(this.comment.color);
            renderer.setLineWidth(getConfig(config.contextLineWidth, true));
            renderer.setFont(parseFont(this.comment.font, this.comment.fontSize));
            const scale = this._globalScale *
                this.comment.scale *
                (this.comment.layer === -1 ? options.scale : 1);
            renderer.setScale(scale * this.comment.scaleX, scale);
            return { renderer };
        }
    }

    class HTML5Comment extends BaseComment {
        pluginName = "HTML5Comment";
        constructor(comment, context, index) {
            super(comment, context, index);
            this.posY = -1;
        }
        get content() {
            return this.comment.rawContent;
        }
        set content(input) {
            const { content, lineCount, lineOffset } = this.parseContent(input);
            const comment = {
                ...this.comment,
                rawContent: input,
                content,
                lineCount,
                lineOffset,
            };
            this.comment = this.getCommentSize(comment);
            this.cacheKey = this.getCacheKey();
            delete this.image;
        }
        convertComment(comment) {
            return this.getCommentSize(this.parseCommandAndNicoscript(comment));
        }
        getCommentSize(parsedData) {
            if (parsedData.invisible) {
                return {
                    ...parsedData,
                    height: 0,
                    width: 0,
                    lineHeight: 0,
                    fontSize: 0,
                    resized: false,
                    resizedX: false,
                    resizedY: false,
                    charSize: 0,
                    content: [],
                    scaleX: 1,
                    scale: 1,
                };
            }
            this.renderer.save();
            this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
            const measure = this.measureText({ ...parsedData, scale: 1 });
            if (options.scale !== 1 && parsedData.layer === -1) {
                measure.height *= options.scale;
                measure.width *= options.scale;
                measure.fontSize *= options.scale;
            }
            this.renderer.restore();
            return {
                ...parsedData,
                height: measure.height,
                width: measure.width,
                lineHeight: measure.lineHeight,
                fontSize: measure.fontSize,
                resized: measure.resized,
                resizedX: measure.resizedX,
                resizedY: measure.resizedY,
                charSize: measure.charSize,
                content: measure.content,
                scaleX: measure.scaleX,
                scale: measure.scale,
            };
        }
        parseCommandAndNicoscript(comment) {
            const data = parseCommandAndNicoScript(comment);
            const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.font);
            return {
                ...comment,
                rawContent: comment.content,
                ...data,
                content,
                lineCount,
                lineOffset,
            };
        }
        parseContent(input, font) {
            const content = [];
            addHTML5PartToResult(content, input, font ?? "defont");
            const lineCount = input.split("\n").length;
            const lineOffset = 0;
            return {
                content,
                lineCount,
                lineOffset,
            };
        }
        measureText(comment) {
            const scale = getConfig(config.commentScale, false);
            const configFontSize = getConfig(config.fontSize, false), lineHeight = getLineHeight(comment.size, false), charSize = getCharSize(comment.size, false);
            if (!comment.lineHeight)
                comment.lineHeight = lineHeight;
            if (!comment.charSize)
                comment.charSize = charSize;
            comment.fontSize = comment.charSize * 0.8;
            this.renderer.setFont(parseFont(comment.font, comment.fontSize));
            if (isLineBreakResize(comment)) {
                comment.fontSize = configFontSize[comment.size].resized;
                const lineHeight = getLineHeight(comment.size, false, true);
                comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
                comment.lineHeight = lineHeight;
                comment.resized = true;
                comment.resizedY = true;
            }
            const { width, height, itemWidth } = this._measureComment(comment);
            for (let i = 0, n = comment.content.length; i < n; i++) {
                const item = comment.content[i];
                if (item?.type !== "text" || !itemWidth)
                    continue;
                item.width = itemWidth[i];
            }
            comment.fontSize = (comment.charSize ?? 0) * 0.8;
            if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
                throw new TypeGuardError();
            }
            return {
                width: width * scale,
                height: height * scale,
                resized: !!comment.resized,
                fontSize: comment.fontSize,
                lineHeight: comment.lineHeight ?? 0,
                content: comment.content,
                resizedX: !!comment.resizedX,
                resizedY: !!comment.resizedY,
                charSize: comment.charSize ?? 0,
                scaleX: 1,
                scale: 1,
            };
        }
        _measureComment(comment) {
            const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
            if (!typeGuard.internal.MeasureInput(comment))
                throw new TypeGuardError();
            const measureResult = measure(comment, this.renderer);
            if (comment.loc !== "naka" && measureResult.width > widthLimit) {
                return this._processResizeX(comment, measureResult.width);
            }
            return measureResult;
        }
        _processResizeX(comment, width) {
            const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
            const lineHeight = getLineHeight(comment.size, false);
            const charSize = getCharSize(comment.size, false);
            const scale = widthLimit / width;
            comment.resizedX = true;
            let _comment = { ...comment };
            _comment.charSize = (_comment.charSize ?? 0) * scale;
            _comment.lineHeight = (_comment.lineHeight ?? 0) * scale;
            _comment.fontSize = _comment.charSize * 0.8;
            if (!typeGuard.internal.MeasureInput(_comment))
                throw new TypeGuardError();
            let result = measure(_comment, this.renderer);
            if (result.width > widthLimit) {
                while (result.width >= widthLimit) {
                    const originalCharSize = _comment.charSize;
                    _comment.charSize -= 1;
                    _comment.lineHeight *= _comment.charSize / originalCharSize;
                    _comment.fontSize = _comment.charSize * 0.8;
                    result = measure(_comment, this.renderer);
                }
            }
            else {
                let lastComment = { ..._comment };
                while (result.width < widthLimit) {
                    lastComment = { ..._comment };
                    const originalCharSize = _comment.charSize;
                    _comment.charSize += 1;
                    _comment.lineHeight *= _comment.charSize / originalCharSize;
                    _comment.fontSize = _comment.charSize * 0.8;
                    result = measure(_comment, this.renderer);
                }
                _comment = lastComment;
            }
            if (comment.resizedY) {
                const scale = (_comment.charSize ?? 0) / (comment.charSize ?? 0);
                comment.charSize = scale * charSize;
                comment.lineHeight = scale * lineHeight;
            }
            else {
                comment.charSize = _comment.charSize;
                comment.lineHeight = _comment.lineHeight;
            }
            comment.fontSize = (comment.charSize ?? 0) * 0.8;
            if (!typeGuard.internal.MeasureInput(comment))
                throw new TypeGuardError();
            return measure(comment, this.renderer);
        }
        _drawCollision(posX, posY, showCollision) {
            if (showCollision) {
                this.renderer.save();
                const scale = getConfig(config.commentScale, false);
                this.renderer.setStrokeStyle("rgba(0,255,255,1)");
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                for (let i = 0, n = this.comment.lineCount; i < n; i++) {
                    if (!typeGuard.internal.HTML5Fonts(this.comment.font))
                        throw new TypeGuardError();
                    const linePosY = (this.comment.lineHeight * (i + 1) +
                        (this.comment.charSize - this.comment.lineHeight) / 2 +
                        this.comment.lineHeight * -0.16 +
                        (config.fonts.html5[this.comment.font]?.offset || 0)) *
                        scale;
                    this.renderer.setStrokeStyle("rgba(255,255,0,0.5)");
                    this.renderer.strokeRect(posX, posY + linePosY, this.comment.width, this.comment.fontSize * -1 * scale);
                }
                this.renderer.restore();
            }
        }
        _generateTextImage() {
            const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
            const paddingTop = (10 - scale * 10) *
                ((this.comment.lineCount + 1) / config.html5HiResCommentCorrection);
            const drawScale = getConfig(config.commentScale, false) *
                scale *
                (this.comment.layer === -1 ? options.scale : 1);
            const image = this.renderer.getCanvas();
            image.setSize(this.comment.width + 2 * 2 * this.comment.charSize, this.comment.height +
                (((paddingTop + 1) * this.comment.lineHeight) / scale) * drawScale);
            image.setStrokeStyle(getStrokeColor(this.comment));
            image.setFillStyle(this.comment.color);
            image.setLineWidth(getConfig(config.contextLineWidth, false));
            image.setFont(parseFont(this.comment.font, fontSize));
            image.setScale(drawScale);
            let lineCount = 0;
            if (!typeGuard.internal.HTML5Fonts(this.comment.font))
                throw new TypeGuardError();
            const offsetY = (this.comment.charSize - this.comment.lineHeight) / 2 +
                this.comment.lineHeight * -0.16 +
                (config.fonts.html5[this.comment.font]?.offset || 0);
            for (const item of this.comment.content) {
                if (item?.type === "spacer") {
                    lineCount += item.count * item.charWidth * this.comment.fontSize;
                    continue;
                }
                const lines = item.slicedContent;
                for (let j = 0, n = lines.length; j < n; j++) {
                    const line = lines[j];
                    if (line === undefined)
                        continue;
                    const posY = (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) /
                        scale;
                    image.strokeText(line, 0, posY);
                    image.fillText(line, 0, posY);
                    lineCount += 1;
                }
            }
            return image;
        }
        getButtonImage() {
            return undefined;
        }
        isHovered() {
            return false;
        }
    }

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BaseComment: BaseComment,
        FlashComment: FlashComment,
        HTML5Comment: HTML5Comment
    });

    const build = (fonts) => {
        return fonts.reduce((pv, val, index) => {
            if (index === 0) {
                return { ...val };
            }
            pv.font += `, ${val.font}`;
            return pv;
        }, { font: "", offset: 0, weight: 600 });
    };
    const fontTemplates = {
        arial: {
            font: 'Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
            offset: 0.01,
            weight: 600,
        },
        gothic: {
            font: '"游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium',
            offset: -0.04,
            weight: 400,
        },
        gulim: {
            font: 'Gulim, "黑体", SimHei',
            offset: 0.03,
            weight: 400,
        },
        mincho: {
            font: '"游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
            offset: -0.01,
            weight: 400,
        },
        simsun: {
            font: '"宋体", SimSun',
            offset: 0.135,
            weight: 400,
        },
        macGothicPro6: {
            font: '"ヒラギノ角ゴ ProN W6", HiraKakuProN-W6, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
            offset: -0.05,
            weight: 600,
        },
        macGothicPro3: {
            font: '"ヒラギノ角ゴ ProN W3", HiraKakuProN-W3, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
            offset: -0.04,
            weight: 300,
        },
        macMincho: {
            font: '"ヒラギノ明朝 ProN W3", HiraMinProN-W3, "ヒラギノ明朝 ProN", HiraMinProN, "Hiragino Mincho ProN"',
            offset: -0.02,
            weight: 300,
        },
        macGothic1: {
            font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
            offset: -0.05,
            weight: 600,
        },
        macGothic2: {
            font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
            offset: -0.04,
            weight: 300,
        },
        sansSerif600: {
            font: "sans-serif",
            offset: 0,
            weight: 600,
        },
        sansSerif400: {
            font: "sans-serif",
            offset: 0,
            weight: 400,
        },
        serif: {
            font: "serif",
            offset: 0,
            weight: 400,
        },
    };
    const fonts = {
        win7: {
            defont: build([fontTemplates.arial]),
            gothic: build([
                fontTemplates.gothic,
                fontTemplates.gulim,
                fontTemplates.arial,
            ]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
        },
        win8_1: {
            defont: build([fontTemplates.arial]),
            gothic: build([
                fontTemplates.gothic,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
        },
        win: {
            defont: build([fontTemplates.arial]),
            gothic: build([fontTemplates.gulim, fontTemplates.arial]),
            mincho: build([fontTemplates.simsun, fontTemplates.arial]),
        },
        mac10_9: {
            defont: build([fontTemplates.macGothicPro6]),
            gothic: build([fontTemplates.gothic, fontTemplates.macGothicPro3]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.macMincho,
                fontTemplates.macGothicPro3,
            ]),
        },
        mac10_11: {
            defont: build([fontTemplates.macGothic1]),
            gothic: build([fontTemplates.gothic, fontTemplates.macGothic2]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.macMincho,
                fontTemplates.macGothic2,
            ]),
        },
        mac: {
            defont: build([fontTemplates.macGothicPro6]),
            gothic: build([fontTemplates.macGothicPro3]),
            mincho: build([fontTemplates.macMincho]),
        },
        other: {
            defont: build([fontTemplates.sansSerif600]),
            gothic: build([fontTemplates.sansSerif400]),
            mincho: build([fontTemplates.serif]),
        },
    };

    var fonts$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        fontTemplates: fontTemplates,
        fonts: fonts
    });

    const initConfig = () => {
        const platform = (function (ua) {
            if (RegExp(/windows nt 6\.[12]/i).exec(ua))
                return "win7";
            else if (RegExp(/windows nt (6\.3|10\.\d+)|win32/i).exec(ua))
                return "win8_1";
            else if (RegExp(/windows nt/i).exec(ua))
                return "win";
            else if (RegExp(/mac os x 10(.|_)(9|10)/i).exec(ua))
                return "mac10_9";
            else if (RegExp(/mac os x 10(.|_)\d{2}|darwin/i).exec(ua))
                return "mac10_11";
            else if (RegExp(/mac os x/i).exec(ua))
                return "mac";
            return "other";
        })(typeof navigator !== "undefined" ? navigator.userAgent : process.platform);
        const defaultConfig = {
            colors: colors,
            contextStrokeColor: "#000000",
            contextStrokeInversionColor: "#FFFFFF",
            contextStrokeOpacity: 0.4,
            contextFillLiveOpacity: 0.5,
            contextLineWidth: {
                html5: 2.8,
                flash: 4,
            },
            commentScale: {
                html5: 1920 / 683,
                flash: 1920 / 683,
            },
            commentStageSize: {
                html5: {
                    width: 512,
                    fullWidth: 683,
                    height: 384,
                },
                flash: {
                    width: 512,
                    fullWidth: 640,
                    height: 385,
                },
            },
            fontSize: {
                html5: {
                    small: {
                        default: 18,
                        resized: 10,
                    },
                    medium: {
                        default: 27,
                        resized: 14,
                    },
                    big: {
                        default: 39,
                        resized: 19.5,
                    },
                },
                flash: {
                    small: {
                        default: 15,
                        resized: 7.5,
                    },
                    medium: {
                        default: 24,
                        resized: 12,
                    },
                    big: {
                        default: 39,
                        resized: 19.5,
                    },
                },
            },
            html5LineCounts: {
                default: {
                    big: 8.4,
                    medium: 13.1,
                    small: 21,
                },
                resized: {
                    big: 16,
                    medium: 25.4,
                    small: 38,
                },
                doubleResized: {
                    big: 7.8,
                    medium: 11.3,
                    small: 16.6,
                },
            },
            html5HiResCommentCorrection: 20,
            html5MinFontSize: 10,
            fonts: {
                html5: fonts[platform],
                flash: {
                    gulim: `normal 600 [size]px gulim, ${fonts[platform].gothic.font}, Arial`,
                    simsun: `normal 400 [size]px simsun, batang, "PMingLiU", MingLiU-ExtB, ${fonts[platform].mincho.font}, Arial`,
                },
            },
            fpsInterval: 500,
            cacheAge: 2000,
            canvasWidth: 1920,
            canvasHeight: 1080,
            commentDrawRange: 1530,
            commentDrawPadding: 195,
            collisionRange: {
                left: 235,
                right: 1685,
            },
            collisionPadding: 5,
            sameCARange: 3600,
            sameCAGap: 100,
            sameCAMinScore: 10,
            sameCATimestampRange: 300,
            plugins: [],
            flashThreshold: 1499871600,
            flashChar: {
                gulim: "[\u0126\u0127\u0132\u0133\u0138\u013f\u0140\u0149-\u014b\u0166\u0167\u02d0\u02da\u2074\u207f\u2081-\u2084\u2113\u2153\u2154\u215c-\u215e\u2194\u2195\u223c\u249c-\u24b5\u24d0-\u24e9\u25a3-\u25a9\u25b6\u25b7\u25c0\u25c1\u25c8\u25d0\u25d1\u260e\u260f\u261c\u261e\u2660\u2661\u2663-\u2665\u2667-\u2669\u266c\u3131-\u316e\u3200-\u321c\u3260-\u327b\u3380-\u3384\u3388-\u338d\u3390-\u339b\u339f\u33a0\u33a2-\u33ca\u33cf\u33d0\u33d3\u33d6\u33d8\u33db-\u33dd\uac00-\ud7a3\uf900-\uf928\uf92a-\uf994\uf996\ufa0b\uffe6]",
                simsunStrong: "[\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u0251\u0261\u02ca\u02cb\u2016\u2035\u216a\u216b\u2223\u2236\u2237\u224c\u226e\u226f\u2295\u2483-\u249b\u2504-\u250b\u256d-\u2573\u2581-\u2583\u2585-\u2587\u2589-\u258b\u258d-\u258f\u2594\u2595\u25e2-\u25e5\u2609\u3016\u3017\u301e\u3021-\u3029\u3105-\u3129\u3220-\u3229\u32a3\u33ce\u33d1\u33d2\u33d5\ue758-\ue864\ufa0c\ufa0d\ufe30\ufe31\ufe33-\ufe44\ufe49-\ufe52\ufe54-\ufe57\ufe59-\ufe66\ufe68-\ufe6b]",
                simsunWeak: "[\u02c9\u2105\u2109\u2196-\u2199\u220f\u2215\u2248\u2264\u2265\u2299\u2474-\u2482\u250d\u250e\u2511\u2512\u2515\u2516\u2519\u251a\u251e\u251f\u2521\u2522\u2526\u2527\u2529\u252a\u252d\u252e\u2531\u2532\u2535\u2536\u2539\u253a\u253d\u253e\u2540\u2541\u2543-\u254a\u2550-\u256c\u2584\u2588\u258c\u2593]",
                gothic: "[\u03fb\uff9f\u30fb]",
            },
            flashMode: "vista",
            flashScriptChar: {
                super: "[\u00aa\u00b2\u00b3\u00b9\u00ba\u02b0\u02b2\u02b3\u02b7\u02b8\u02e1-\u02e3\u0304\u1d2c-\u1d43\u1d45-\u1d61\u1d9b-\u1da1\u1da3-\u1dbf\u2070\u2071\u2074-\u207f\u2c7d]",
                sub: "[\u0320\u1d62-\u1d6a\u2080-\u208e\u2090-\u209c\u2c7c]",
            },
            lineHeight: {
                small: {
                    default: 18 / 15,
                    resized: 10 / 7.5,
                },
                medium: {
                    default: 29 / 25,
                    resized: 15 / 12,
                },
                big: {
                    default: 45 / 39,
                    resized: 24 / 19.5,
                },
            },
            flashCommentYPaddingTop: {
                default: 5,
                resized: 3,
            },
            flashCommentYOffset: {
                small: { default: -0.2, resized: -0.2 },
                medium: { default: -0.2, resized: -0.2 },
                big: { default: -0.2, resized: -0.2 },
            },
            flashLetterSpacing: 1,
            flashScriptCharOffset: 0.12,
            commentLimit: undefined,
            hideCommentOrder: "asc",
            lineBreakCount: {
                big: 3,
                medium: 5,
                small: 7,
            },
            commentPlugins: [
                {
                    class: FlashComment,
                    condition: isFlashComment,
                },
            ],
            nakaCommentSpeedOffset: 0.95,
            atButtonPadding: 5,
            atButtonRadius: 7,
            flashDoubleResizeHeights: {
                big: {
                    9: 392,
                    10: 384,
                    11: 389,
                    12: 388,
                    13: 381,
                    14: 381,
                    15: 384,
                },
            },
            flashLineBreakScale: {
                small: 0.557,
                medium: 0.519,
                big: 0.535,
            },
            compatSpacer: {
                flash: {
                    "\u3000": {
                        simsun: 0.98,
                        defont: 0.645,
                        gulim: 0.95,
                    },
                    "\u00a0": {
                        simsun: 0.25,
                    },
                    "\u0020": {
                        defont: 0.3,
                    },
                    "\u2001": {
                        defont: 0.95,
                    },
                    "\u2004": {
                        defont: 1.6,
                    },
                    "\u2007": {
                        defont: 1.6,
                    },
                    "\u202a": {
                        defont: 0.59,
                    },
                },
                html5: {},
            },
        };
        updateConfig(defaultConfig);
    };

    var initConfig$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        initConfig: initConfig
    });

    let handlerList = [];
    const handlerCounts = {
        seekDisable: 0,
        seekEnable: 0,
        commentDisable: 0,
        commentEnable: 0,
        jump: 0,
    };
    const registerHandler = (eventName, handler) => {
        handlerList.push({ eventName, handler });
        updateEventHandlerCounts();
    };
    const removeHandler = (eventName, handler) => {
        handlerList = handlerList.filter((item) => item.eventName !== eventName || item.handler !== handler);
        updateEventHandlerCounts();
    };
    const updateEventHandlerCounts = () => {
        for (const key_ of Object.keys(handlerCounts)) {
            const key = key_;
            handlerCounts[key] = handlerList.filter((item) => item.eventName === key).length;
        }
    };
    const triggerHandler = (vpos, lastVpos) => {
        processCommentDisableScript(vpos, lastVpos);
        processSeekDisableScript(vpos, lastVpos);
        processJumpScript(vpos, lastVpos);
    };
    const processCommentDisableScript = (vpos, lastVpos) => {
        if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1)
            return;
        for (const range of nicoScripts.ban) {
            const vposInRange = range.start < vpos && vpos < range.end, lastVposInRange = range.start < lastVpos && lastVpos < range.end;
            if (vposInRange && !lastVposInRange) {
                executeEvents("commentDisable", {
                    type: "commentDisable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
            else if (!vposInRange && lastVposInRange) {
                executeEvents("commentEnable", {
                    type: "commentEnable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
        }
    };
    const processSeekDisableScript = (vpos, lastVpos) => {
        if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1)
            return;
        for (const range of nicoScripts.seekDisable) {
            const vposInRange = range.start < vpos && vpos < range.end, lastVposInRange = range.start < lastVpos && lastVpos < range.end;
            if (vposInRange && !lastVposInRange) {
                executeEvents("seekDisable", {
                    type: "seekDisable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
            else if (!vposInRange && lastVposInRange) {
                executeEvents("seekEnable", {
                    type: "seekEnable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
        }
    };
    const processJumpScript = (vpos, lastVpos) => {
        if (handlerCounts.jump < 1)
            return;
        for (const range of nicoScripts.jump) {
            const vposInRange = range.start < vpos && (!range.end || vpos < range.end), lastVposInRange = range.start < lastVpos && (!range.end || lastVpos < range.end);
            if (vposInRange && !lastVposInRange) {
                executeEvents("jump", {
                    type: "jump",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                    to: range.to,
                    message: range.message,
                });
            }
        }
    };
    const executeEvents = (eventName, event) => {
        for (const item of handlerList) {
            if (eventName !== item.eventName)
                continue;
            item.handler(event);
        }
    };

    var eventHandler = /*#__PURE__*/Object.freeze({
        __proto__: null,
        registerHandler: registerHandler,
        removeHandler: removeHandler,
        triggerHandler: triggerHandler
    });

    const EmptyParser = {
        key: ["empty"],
        parse: () => {
            return [];
        },
    };

    const FormattedParser = {
        key: ["formatted", "niconicome"],
        parse: (input) => {
            return parse(array(ZFormattedComment), input);
        },
    };

    const LegacyParser = {
        key: ["legacy"],
        parse: (input) => {
            return fromLegacy(parse(array(ZRawApiResponse), input));
        },
    };
    const fromLegacy = (data) => {
        const data_ = [], userList = [];
        for (const _val of data) {
            const val = safeParse(ZApiChat, _val.chat);
            if (!val.success)
                continue;
            const value = val.output;
            if (value.deleted !== 1) {
                const tmpParam = {
                    id: value.no,
                    vpos: value.vpos,
                    content: value.content || "",
                    date: value.date,
                    date_usec: value.date_usec || 0,
                    owner: !value.user_id,
                    premium: value.premium === 1,
                    mail: [],
                    user_id: -1,
                    layer: -1,
                    is_my_post: false,
                };
                if (value.mail) {
                    tmpParam.mail = value.mail.split(/\s+/g);
                }
                if (value.content.startsWith("/") && !value.user_id) {
                    tmpParam.mail.push("invisible");
                }
                const isUserExist = userList.indexOf(value.user_id);
                if (isUserExist === -1) {
                    tmpParam.user_id = userList.length;
                    userList.push(value.user_id);
                }
                else {
                    tmpParam.user_id = isUserExist;
                }
                data_.push(tmpParam);
            }
        }
        return data_;
    };

    const LegacyOwnerParser = {
        key: ["legacyOwner"],
        parse: (input) => {
            if (!typeGuard.legacyOwner.comments(input))
                throw new InvalidFormatError();
            return fromLegacyOwner(input);
        },
    };
    const fromLegacyOwner = (data) => {
        const data_ = [], comments = data.split("\n");
        for (let i = 0, n = comments.length; i < n; i++) {
            const value = comments[i];
            if (!value)
                continue;
            const commentData = value.split(":");
            if (commentData.length < 3) {
                continue;
            }
            else if (commentData.length > 3) {
                for (let j = 3, n = commentData.length; j < n; j++) {
                    commentData[2] += `:${commentData[j]}`;
                }
            }
            const tmpParam = {
                id: i,
                vpos: Number(commentData[0]) * 100,
                content: commentData[2] ?? "",
                date: i,
                date_usec: 0,
                owner: true,
                premium: true,
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (commentData[1]) {
                tmpParam.mail = commentData[1].split(/[\s+]/g);
            }
            if (tmpParam.content.startsWith("/")) {
                tmpParam.mail.push("invisible");
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const OwnerParser = {
        key: ["owner"],
        parse: (input) => {
            return fromOwner(parse(array(ZOwnerComment), input));
        },
    };
    const fromOwner = (data) => {
        const data_ = [];
        for (let i = 0, n = data.length; i < n; i++) {
            const value = data[i];
            if (!value)
                continue;
            const tmpParam = {
                id: i,
                vpos: time2vpos(value.time),
                content: value.comment,
                date: i,
                date_usec: 0,
                owner: true,
                premium: true,
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (value.command) {
                tmpParam.mail = value.command.split(/\s+/g);
            }
            if (tmpParam.content.startsWith("/")) {
                tmpParam.mail.push("invisible");
            }
            data_.push(tmpParam);
        }
        return data_;
    };
    const time2vpos = (input) => {
        const time = RegExp(/^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/).exec(input);
        if (time) {
            if (time[1] !== undefined &&
                time[2] !== undefined &&
                time[3] !== undefined) {
                return ((Number(time[1]) * 60 + Number(time[2])) * 100 +
                    Number(time[3]) / Math.pow(10, time[3].length - 2));
            }
            else if (time[4] !== undefined && time[5] !== undefined) {
                return (Number(time[4]) * 60 + Number(time[5])) * 100;
            }
            else if (time[6] !== undefined && time[7] !== undefined) {
                return (Number(time[6]) * 100 +
                    Number(time[7]) / Math.pow(10, time[7].length - 2));
            }
            else if (time[8] !== undefined) {
                return Number(time[8]) * 100;
            }
        }
        return 0;
    };

    const V1Parser = {
        key: ["v1"],
        parse: (input) => {
            return fromV1(parse(array(ZV1Thread), input));
        },
    };
    const fromV1 = (data) => {
        const data_ = [], userList = [];
        for (const item of data) {
            const val = item.comments, forkName = item.fork;
            for (const value of val) {
                const tmpParam = {
                    id: value.no,
                    vpos: Math.floor(value.vposMs / 10),
                    content: value.body,
                    date: date2time(value.postedAt),
                    date_usec: 0,
                    owner: forkName === "owner",
                    premium: value.isPremium,
                    mail: value.commands,
                    user_id: -1,
                    layer: -1,
                    is_my_post: value.isMyPost,
                };
                if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                    tmpParam.mail.push("invisible");
                }
                const isUserExist = userList.indexOf(value.userId);
                if (isUserExist === -1) {
                    tmpParam.user_id = userList.length;
                    userList.push(value.userId);
                }
                else {
                    tmpParam.user_id = isUserExist;
                }
                data_.push(tmpParam);
            }
        }
        return data_;
    };
    const date2time = (date) => Math.floor(Date.parse(date) / 1000);

    const Xml2jsParser = {
        key: ["xml2js"],
        parse: (input) => {
            return fromXml2js(parse(ZXml2jsPacket, input));
        },
    };
    const fromXml2js = (data) => {
        const data_ = [], userList = [];
        let index = data.packet.chat.length;
        for (const item of data.packet.chat) {
            const tmpParam = {
                id: Number(item.$.no) || index++,
                vpos: Number(item.$.vpos),
                content: item._,
                date: Number(item.$.date),
                date_usec: Number(item.$.date_usec),
                owner: !(item.$.owner === "0" || item.$.user_id),
                premium: item.$.premium === "1",
                mail: item.$.mail.split(/\s+/g),
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                tmpParam.mail.push("invisible");
            }
            const userId = item.$.user_id ?? "";
            const isUserExist = userList.indexOf(userId);
            if (isUserExist === -1) {
                tmpParam.user_id = userList.length;
                userList.push(userId);
            }
            else {
                tmpParam.user_id = isUserExist;
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const XmlDocumentParser = {
        key: ["formatted", "niconicome"],
        parse: (input) => {
            if (!typeGuard.xmlDocument(input))
                throw new InvalidFormatError();
            return parseXMLDocument(input);
        },
    };
    const parseXMLDocument = (data) => {
        const data_ = [], userList = [];
        let index = Array.from(data.documentElement.children).length;
        for (const item of Array.from(data.documentElement.children)) {
            if (item.nodeName !== "chat")
                continue;
            const tmpParam = {
                id: Number(item.getAttribute("no")) || index++,
                vpos: Number(item.getAttribute("vpos")),
                content: item.textContent ?? "",
                date: Number(item.getAttribute("date")) || 0,
                date_usec: Number(item.getAttribute("date_usec")) || 0,
                owner: !item.getAttribute("user_id"),
                premium: item.getAttribute("premium") === "1",
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (item.getAttribute("mail")) {
                tmpParam.mail = item.getAttribute("mail")?.split(/\s+/g) ?? [];
            }
            if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                tmpParam.mail.push("invisible");
            }
            const userId = item.getAttribute("user_id") ?? "";
            const isUserExist = userList.indexOf(userId);
            if (isUserExist === -1) {
                tmpParam.user_id = userList.length;
                userList.push(userId);
            }
            else {
                tmpParam.user_id = isUserExist;
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const parsers = [
        EmptyParser,
        FormattedParser,
        LegacyParser,
        LegacyOwnerParser,
        OwnerParser,
        V1Parser,
        Xml2jsParser,
        XmlDocumentParser,
    ];

    const convert2formattedComment = (data, type) => {
        const parser = parsers.find((parser) => parser.key.includes(type));
        if (!parser)
            throw new InvalidFormatError();
        return sort(parser.parse(data));
    };
    const sort = (data) => {
        data.sort((a, b) => {
            if (a.vpos < b.vpos)
                return -1;
            if (a.vpos > b.vpos)
                return 1;
            if (a.date < b.date)
                return -1;
            if (a.date > b.date)
                return 1;
            if (a.date_usec < b.date_usec)
                return -1;
            if (a.date_usec > b.date_usec)
                return 1;
            return 0;
        });
        return data;
    };

    var inputParser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: convert2formattedComment
    });

    class CanvasRenderer {
        canvas;
        video;
        context;
        constructor(canvas, video) {
            this.canvas = canvas ?? document.createElement("canvas");
            const context = this.canvas.getContext("2d");
            if (!context)
                throw new CanvasRenderingContext2DError();
            this.context = context;
            this.context.textAlign = "start";
            this.context.textBaseline = "alphabetic";
            this.video = video;
        }
        drawVideo(enableLegacyPip) {
            if (this.video) {
                let scale;
                const height = this.canvas.height / this.video.videoHeight, width = this.canvas.width / this.video.videoWidth;
                if (enableLegacyPip ? height > width : height < width) {
                    scale = width;
                }
                else {
                    scale = height;
                }
                const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5, offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
                this.context.drawImage(this.video, offsetX, offsetY, this.video.videoWidth * scale, this.video.videoHeight * scale);
            }
        }
        getFont() {
            return this.context.font;
        }
        getFillStyle() {
            return this.context.fillStyle;
        }
        setScale(scale, arg1) {
            this.context.scale(scale, arg1 ?? scale);
        }
        drawImage(image, x, y, width, height) {
            if (width === undefined || height === undefined)
                this.context.drawImage(image.canvas, x, y);
            else
                this.context.drawImage(image.canvas, x, y, width, height);
        }
        fillRect(x, y, width, height) {
            this.context.fillRect(x, y, width, height);
        }
        strokeRect(x, y, width, height) {
            this.context.strokeRect(x, y, width, height);
        }
        fillText(text, x, y) {
            this.context.fillText(text, x, y);
        }
        strokeText(text, x, y) {
            this.context.strokeText(text, x, y);
        }
        quadraticCurveTo(cpx, cpy, x, y) {
            this.context.quadraticCurveTo(cpx, cpy, x, y);
        }
        clearRect(x, y, width, height) {
            this.context.clearRect(x, y, width, height);
        }
        setFont(font) {
            this.context.font = font;
        }
        setFillStyle(color) {
            this.context.fillStyle = color;
        }
        setStrokeStyle(color) {
            this.context.strokeStyle = color;
        }
        setLineWidth(width) {
            this.context.lineWidth = width;
        }
        setGlobalAlpha(alpha) {
            this.context.globalAlpha = alpha;
        }
        setSize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        getSize() {
            return { width: this.canvas.width, height: this.canvas.height };
        }
        measureText(text) {
            return this.context.measureText(text);
        }
        beginPath() {
            this.context.beginPath();
        }
        closePath() {
            this.context.closePath();
        }
        moveTo(x, y) {
            this.context.moveTo(x, y);
        }
        lineTo(x, y) {
            this.context.lineTo(x, y);
        }
        stroke() {
            this.context.stroke();
        }
        save() {
            this.context.save();
        }
        restore() {
            this.context.restore();
        }
        getCanvas() {
            return new CanvasRenderer();
        }
        destroy() {
        }
    }

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CanvasRenderer: CanvasRenderer
    });

    const createCommentInstance = (comment, context, index) => {
        for (const plugin of config.commentPlugins) {
            if (plugin.condition(comment)) {
                return new plugin.class(comment, context, index);
            }
        }
        return new HTML5Comment(comment, context, index);
    };

    const definition = {
        colors: colors$1,
        config: config$1,
        fonts: fonts$1,
        initConfig: initConfig$1,
    };

    var internal = /*#__PURE__*/Object.freeze({
        __proto__: null,
        comments: index$1,
        contexts: index$4,
        definition: definition,
        errors: index$3,
        eventHandler: eventHandler,
        inputParser: inputParser,
        renderer: index,
        typeGuard: typeGuard$1,
        utils: index$2
    });

    class NiconiComments {
        enableLegacyPiP;
        showCollision;
        showFPS;
        showCommentCount;
        lastVpos;
        processedCommentIndex;
        comments;
        renderer;
        collision;
        timeline;
        static typeGuard = typeGuard;
        static default = NiconiComments;
        static FlashComment = {
            condition: isFlashComment,
            class: FlashComment,
        };
        static internal = internal;
        constructor(renderer, data, initOptions = {}) {
            const constructorStart = performance.now();
            initConfig();
            if (!typeGuard.config.initOptions(initOptions))
                throw new InvalidOptionError();
            setOptions(Object.assign(defaultOptions, initOptions));
            setConfig(Object.assign(defaultConfig, options.config));
            setIsDebug(options.debug);
            resetImageCache();
            resetNicoScripts();
            if (renderer instanceof HTMLCanvasElement) {
                renderer = new CanvasRenderer(renderer, options.video);
            }
            else if (options.video) {
                console.warn("options.video is ignored because renderer is not HTMLCanvasElement");
            }
            this.renderer = renderer;
            this.renderer.setLineWidth(getConfig(config.contextLineWidth, false));
            const rendererSize = this.renderer.getSize();
            this.renderer.setScale(rendererSize.width / config.canvasWidth, rendererSize.height / config.canvasHeight);
            let formatType = options.format;
            if (options.formatted) {
                console.warn("Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format");
            }
            if (formatType === "default") {
                formatType = options.formatted ? "formatted" : "legacy";
            }
            if (options.useLegacy) {
                console.warn("Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode");
            }
            if (options.mode === "default" && options.useLegacy) {
                options.mode = "html5";
            }
            const parsedData = convert2formattedComment(data, formatType);
            this.showCollision = options.showCollision;
            this.showFPS = options.showFPS;
            this.showCommentCount = options.showCommentCount;
            this.enableLegacyPiP = options.enableLegacyPiP;
            this.timeline = {};
            this.collision = {
                ue: [],
                shita: [],
                left: [],
                right: [],
            };
            this.lastVpos = -1;
            this.processedCommentIndex = 0;
            this.comments = this.preRendering(parsedData);
            logger(`constructor complete: ${performance.now() - constructorStart}ms`);
        }
        preRendering(rawData) {
            const preRenderingStart = performance.now();
            if (options.keepCA) {
                rawData = changeCALayer(rawData);
            }
            let instances = rawData.reduce((pv, val, index) => {
                pv.push(createCommentInstance(val, this.renderer, index));
                return pv;
            }, []);
            this.getCommentPos(instances, instances.length, options.lazy);
            this.sortTimelineComment();
            const plugins = [];
            for (const plugin of config.plugins) {
                try {
                    const canvas = this.renderer.getCanvas();
                    const pluginInstance = new plugin(canvas, instances);
                    plugins.push({
                        canvas,
                        instance: pluginInstance,
                    });
                    if (pluginInstance.transformComments) {
                        instances = pluginInstance.transformComments(instances);
                    }
                }
                catch (e) {
                    console.error("Failed to init plugin");
                }
            }
            setPlugins(plugins);
            logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
            return instances;
        }
        getCommentPos(data, end, lazy = false) {
            const getCommentPosStart = performance.now();
            if (this.processedCommentIndex + 1 >= end)
                return;
            for (const comment of data.slice(this.processedCommentIndex, end)) {
                if (comment.invisible || (comment.posY > -1 && !lazy))
                    continue;
                if (comment.loc === "naka") {
                    processMovableComment(comment, this.collision, this.timeline, lazy);
                }
                else {
                    processFixedComment(comment, this.collision[comment.loc], this.timeline, lazy);
                }
                this.processedCommentIndex = comment.index;
            }
            if (lazy) {
                this.processedCommentIndex = 0;
            }
            logger(`getCommentPos complete: ${performance.now() - getCommentPosStart}ms`);
        }
        sortTimelineComment() {
            const sortCommentStart = performance.now();
            for (const vpos of Object.keys(this.timeline)) {
                const item = this.timeline[Number(vpos)];
                if (!item)
                    continue;
                const owner = [], user = [];
                for (const comment of item) {
                    if (comment?.owner) {
                        owner.push(comment);
                    }
                    else {
                        user.push(comment);
                    }
                }
                this.timeline[Number(vpos)] = user.concat(owner);
            }
            logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
        }
        addComments(...rawComments) {
            const comments = rawComments.reduce((pv, val, index) => {
                pv.push(createCommentInstance(val, this.renderer, this.comments.length + index));
                return pv;
            }, []);
            for (const plugin of plugins) {
                try {
                    plugin.instance.addComments?.(comments);
                }
                catch (e) {
                    console.error("Failed to add comments", e);
                }
            }
            for (const comment of comments) {
                if (comment.invisible)
                    continue;
                if (comment.loc === "naka") {
                    processMovableComment(comment, this.collision, this.timeline);
                }
                else {
                    processFixedComment(comment, this.collision[comment.loc], this.timeline);
                }
            }
        }
        drawCanvas(vpos, forceRendering = false, cursor) {
            const drawCanvasStart = performance.now();
            if (this.lastVpos === vpos && !forceRendering)
                return false;
            triggerHandler(vpos, this.lastVpos);
            const timelineRange = this.timeline[vpos];
            if (!forceRendering &&
                plugins.length === 0 &&
                timelineRange?.filter((item) => item.loc === "naka").length === 0 &&
                this.timeline[this.lastVpos]?.filter((item) => item.loc === "naka")
                    ?.length === 0) {
                const current = timelineRange.filter((item) => item.loc !== "naka"), last = this.timeline[this.lastVpos]?.filter((item) => item.loc !== "naka") ??
                    [];
                if (arrayEqual(current, last))
                    return false;
            }
            this.renderer.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
            this.lastVpos = vpos;
            this._drawVideo();
            for (const plugin of plugins) {
                try {
                    plugin.instance.draw?.(vpos);
                    this.renderer.drawImage(plugin.canvas, 0, 0);
                }
                catch (e) {
                    console.error(`Failed to draw comments`, e);
                }
            }
            this._drawCollision(vpos);
            this._drawComments(timelineRange, vpos, cursor);
            this._drawFPS(drawCanvasStart);
            this._drawCommentCount(timelineRange?.length);
            logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
            return true;
        }
        _drawVideo() {
            this.renderer.drawVideo(this.enableLegacyPiP);
        }
        _drawComments(timelineRange, vpos, cursor) {
            if (timelineRange) {
                const targetComment = (() => {
                    if (config.commentLimit === undefined) {
                        return timelineRange;
                    }
                    if (config.hideCommentOrder === "asc") {
                        return timelineRange.slice(-config.commentLimit);
                    }
                    return timelineRange.slice(0, config.commentLimit);
                })();
                for (const comment of targetComment) {
                    if (comment.invisible) {
                        continue;
                    }
                    this.getCommentPos(this.comments, comment.index + 1);
                    comment.draw(vpos, this.showCollision, cursor);
                }
            }
        }
        _drawCollision(vpos) {
            if (this.showCollision) {
                this.renderer.save();
                const leftCollision = this.collision.left[vpos], rightCollision = this.collision.right[vpos];
                this.renderer.setFillStyle("red");
                if (leftCollision) {
                    for (const comment of leftCollision) {
                        this.renderer.fillRect(config.collisionRange.left, comment.posY, getConfig(config.contextLineWidth, comment.flash), comment.height);
                    }
                }
                if (rightCollision) {
                    for (const comment of rightCollision) {
                        this.renderer.fillRect(config.collisionRange.right, comment.posY, getConfig(config.contextLineWidth, comment.flash) * -1, comment.height);
                    }
                }
                this.renderer.restore();
            }
        }
        _drawFPS(drawCanvasStart) {
            if (this.showFPS) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 60));
                this.renderer.setFillStyle("#00FF00");
                this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
                const drawTime = Math.floor(performance.now() - drawCanvasStart);
                const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
                this.renderer.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
                this.renderer.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
                this.renderer.restore();
            }
        }
        _drawCommentCount(count) {
            if (this.showCommentCount) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 60));
                this.renderer.setFillStyle("#00FF00");
                this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
                this.renderer.strokeText(`Count:${count ?? 0}`, 100, 200);
                this.renderer.fillText(`Count:${count ?? 0}`, 100, 200);
                this.renderer.restore();
            }
        }
        addEventListener(eventName, handler) {
            registerHandler(eventName, handler);
        }
        removeEventListener(eventName, handler) {
            removeHandler(eventName, handler);
        }
        clear() {
            const size = this.renderer.getSize();
            this.renderer.clearRect(0, 0, size.width, size.height);
        }
        click(vpos, pos) {
            const _comments = this.timeline[vpos];
            if (!_comments)
                return;
            const comments = [..._comments].reverse();
            for (const comment of comments) {
                if (comment.isHovered(pos)) {
                    const newComment = buildAtButtonComment(comment.comment, vpos);
                    if (!newComment)
                        continue;
                    this.addComments(newComment);
                }
            }
        }
    }
    const logger = (msg) => {
        if (isDebug)
            console.debug(msg);
    };

    return NiconiComments;

}));
