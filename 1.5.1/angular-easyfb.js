/*! angular-easyfb
version: 1.5.1
build date: 2016-05-27
author: Robin Fan
https://github.com/pc035860/angular-easyfb.git */
(function(module) {
    module.provider("ezfb", function() {
        var APP_EVENTS_EVENT_NAMES = {
            COMPLETED_REGISTRATION: "fb_mobile_complete_registration",
            VIEWED_CONTENT: "fb_mobile_content_view",
            SEARCHED: "fb_mobile_search",
            RATED: "fb_mobile_rate",
            COMPLETED_TUTORIAL: "fb_mobile_tutorial_completion",
            ADDED_TO_CART: "fb_mobile_add_to_cart",
            ADDED_TO_WISHLIST: "fb_mobile_add_to_wishlist",
            INITIATED_CHECKOUT: "fb_mobile_initiated_checkout",
            ADDED_PAYMENT_INFO: "fb_mobile_add_payment_info",
            ACHIEVED_LEVEL: "fb_mobile_level_achieved",
            UNLOCKED_ACHIEVEMENT: "fb_mobile_achievement_unlocked",
            SPENT_CREDITS: "fb_mobile_spent_credits"
        }, APP_EVENTS_PARAMETER_NAMES = {
            CURRENCY: "fb_currency",
            REGISTRATION_METHOD: "fb_registration_method",
            CONTENT_TYPE: "fb_content_type",
            CONTENT_ID: "fb_content_id",
            SEARCH_STRING: "fb_search_string",
            SUCCESS: "fb_success",
            MAX_RATING_VALUE: "fb_max_rating_value",
            PAYMENT_INFO_AVAILABLE: "fb_payment_info_available",
            NUM_ITEMS: "fb_num_items",
            LEVEL: "fb_level",
            DESCRIPTION: "fb_description"
        };
        var NO_CALLBACK = -1;
        var _publishedApis = {
            api: [ 1, 2, 3 ],
            ui: 1,
            getAuthResponse: NO_CALLBACK,
            getLoginStatus: 0,
            login: 0,
            logout: 0,
            "Event.subscribe": 1,
            "Event.unsubscribe": 1,
            "XFBML.parse": 1,
            "Canvas.Prefetcher.addStaticResource": NO_CALLBACK,
            "Canvas.Prefetcher.setCollectionMode": NO_CALLBACK,
            "Canvas.getPageInfo": 0,
            "Canvas.hideFlashElement": NO_CALLBACK,
            "Canvas.scrollTo": NO_CALLBACK,
            "Canvas.setAutoGrow": NO_CALLBACK,
            "Canvas.setDoneLoading": 0,
            "Canvas.setSize": NO_CALLBACK,
            "Canvas.setUrlHandler": 0,
            "Canvas.showFlashElement": NO_CALLBACK,
            "Canvas.startTimer": NO_CALLBACK,
            "Canvas.stopTimer": 0,
            "AppEvents.logEvent": NO_CALLBACK,
            "AppEvents.logPurchase": NO_CALLBACK,
            "AppEvents.activateApp": NO_CALLBACK
        };
        var _locale = "en_US";
        var _initParams = {
            status: true,
            cookie: true,
            xfbml: true,
            version: "v2.6"
        };
        var _defaultLoadSDKFunction = [ "$window", "$document", "$timeout", "ezfbAsyncInit", "ezfbLocale", function($window, $document, $timeout, ezfbAsyncInit, ezfbLocale) {
            (function(d) {
                var insertScript = function() {
                    var js, id = "facebook-jssdk", ref = d.getElementsByTagName("script")[0];
                    if (d.getElementById(id)) {
                        return;
                    }
                    js = d.createElement("script");
                    js.id = id;
                    js.async = true;
                    js.src = "//connect.facebook.net/" + ezfbLocale + "/sdk.js";
                    ref.parentNode.insertBefore(js, ref);
                };
                $timeout(insertScript, 0, false);
            })($document[0]);
            $window.fbAsyncInit = ezfbAsyncInit;
        } ], _loadSDKFunction = _defaultLoadSDKFunction;
        var _defaultInitFunction = [ "$window", "ezfbInitParams", function($window, ezfbInitParams) {
            $window.FB.init(ezfbInitParams);
        } ], _initFunction = _defaultInitFunction;
        function _config(target, config) {
            if (angular.isObject(config)) {
                angular.extend(target, config);
            } else {
                return angular.copy(target);
            }
        }
        function _proxy(func, context, args) {
            return function() {
                return func.apply(context, args);
            };
        }
        return {
            setInitParams: function(params) {
                _config(_initParams, params);
            },
            getInitParams: function() {
                return _config(_initParams);
            },
            setLocale: function(locale) {
                _locale = locale;
            },
            getLocale: function() {
                return _locale;
            },
            setLoadSDKFunction: function(func) {
                if (angular.isArray(func) || angular.isFunction(func)) {
                    _loadSDKFunction = func;
                } else {
                    throw new Error("Init function type error.");
                }
            },
            getLoadSDKFunction: function() {
                return _loadSDKFunction;
            },
            setInitFunction: function(func) {
                if (angular.isArray(func) || angular.isFunction(func)) {
                    _initFunction = func;
                } else {
                    throw new Error("Init function type error.");
                }
            },
            getInitFunction: function() {
                return _initFunction;
            },
            $get: [ "$window", "$q", "$document", "$parse", "$rootScope", "$injector", "$timeout", function($window, $q, $document, $parse, $rootScope, $injector, $timeout) {
                var _initReady, _initRenderReady, _ezfb, _savedListeners, _paramsReady, ezfbAsyncInit;
                _savedListeners = {};
                _paramsReady = $q.defer();
                if (_initParams.appId || _initFunction !== _defaultInitFunction) {
                    _paramsReady.resolve();
                }
                _initReady = $q.defer();
                _initRenderReady = $q.defer();
                if (!$document[0].getElementById("fb-root")) {
                    $document.find("body").append('<div id="fb-root"></div>');
                }
                ezfbAsyncInit = function() {
                    _paramsReady.promise.then(function() {
                        if (_initParams.xfbml) {
                            var onRender = function() {
                                _ezfb.$$xfbmlRendered = true;
                                $timeout(function() {
                                    _initRenderReady.resolve(true);
                                });
                                _ezfb.Event.unsubscribe("xfbml.render", onRender);
                            };
                            _ezfb.Event.subscribe("xfbml.render", onRender);
                        } else {
                            $timeout(function() {
                                _initRenderReady.resolve(false);
                            });
                        }
                        $injector.invoke(_initFunction, null, {
                            ezfbInitParams: _initParams
                        });
                        _ezfb.$$ready = true;
                        _initReady.resolve();
                    });
                };
                $injector.invoke(_loadSDKFunction, null, {
                    ezfbAsyncInit: ezfbAsyncInit,
                    ezfbLocale: _locale
                });
                _ezfb = {
                    $$ready: false,
                    $$xfbmlRendered: false,
                    $ready: function(fn) {
                        if (angular.isFunction(fn)) {
                            _initReady.promise.then(fn);
                        }
                        return _initReady.promise;
                    },
                    $rendered: function(fn) {
                        if (angular.isFunction(fn)) {
                            _initRenderReady.promise.then(fn);
                        }
                        return _initRenderReady.promise;
                    },
                    init: function(params) {
                        _config(_initParams, params);
                        _paramsReady.resolve();
                    },
                    AppEvents: {
                        EventNames: APP_EVENTS_EVENT_NAMES,
                        ParameterNames: APP_EVENTS_PARAMETER_NAMES
                    }
                };
                angular.forEach(_publishedApis, function(cbArgIndex, apiPath) {
                    var getter = $parse(apiPath), setter = getter.assign;
                    setter(_ezfb, function() {
                        var apiCall = _proxy(function(args) {
                            var dfd, replaceCallbackAt;
                            dfd = $q.defer();
                            replaceCallbackAt = function(index) {
                                var func, newFunc;
                                func = angular.isFunction(args[index]) ? args[index] : angular.noop;
                                newFunc = function() {
                                    var funcArgs = Array.prototype.slice.call(arguments);
                                    if ($rootScope.$$phase) {
                                        func.apply(null, funcArgs);
                                        dfd.resolve.apply(dfd, funcArgs);
                                    } else {
                                        $rootScope.$apply(function() {
                                            func.apply(null, funcArgs);
                                            dfd.resolve.apply(dfd, funcArgs);
                                        });
                                    }
                                };
                                while (args.length <= index) {
                                    args.push(null);
                                }
                                var eventName;
                                if (apiPath === "Event.subscribe") {
                                    eventName = args[0];
                                    if (angular.isUndefined(_savedListeners[eventName])) {
                                        _savedListeners[eventName] = [];
                                    }
                                    _savedListeners[eventName].push({
                                        original: func,
                                        wrapped: newFunc
                                    });
                                } else if (apiPath === "Event.unsubscribe") {
                                    eventName = args[0];
                                    if (angular.isArray(_savedListeners[eventName])) {
                                        var i, subscribed, l = _savedListeners[eventName].length;
                                        for (i = 0; i < l; i++) {
                                            subscribed = _savedListeners[eventName][i];
                                            if (subscribed.original === func) {
                                                newFunc = subscribed.wrapped;
                                                _savedListeners[eventName].splice(i, 1);
                                                break;
                                            }
                                        }
                                    }
                                }
                                args[index] = newFunc;
                            };
                            if (cbArgIndex !== NO_CALLBACK) {
                                if (angular.isNumber(cbArgIndex)) {
                                    replaceCallbackAt(cbArgIndex);
                                } else if (angular.isArray(cbArgIndex)) {
                                    var i, c;
                                    for (i = 0; i < cbArgIndex.length; i++) {
                                        c = cbArgIndex[i];
                                        if (args.length == c || args.length == c + 1 && angular.isFunction(args[c])) {
                                            replaceCallbackAt(c);
                                            break;
                                        }
                                    }
                                }
                            }
                            var origFBFunc = getter($window.FB);
                            if (!origFBFunc) {
                                throw new Error("Facebook API `FB." + apiPath + "` doesn't exist.");
                            }
                            origFBFunc.apply($window.FB, args);
                            return dfd.promise;
                        }, null, [ Array.prototype.slice.call(arguments) ]);
                        if (apiPath === "getAuthResponse") {
                            if (angular.isUndefined($window.FB)) {
                                throw new Error("`FB` is not ready.");
                            }
                            return $window.FB.getAuthResponse();
                        } else if (cbArgIndex === NO_CALLBACK) {
                            _initReady.promise.then(apiCall);
                        } else {
                            return _initReady.promise.then(apiCall);
                        }
                    });
                });
                return _ezfb;
            } ]
        };
    }).directive("ezfbXfbml", [ "ezfb", "$parse", "$compile", "$timeout", function(ezfb, $parse, $compile, $timeout) {
        return {
            restrict: "EAC",
            controller: function() {},
            compile: function(tElm, tAttrs) {
                var _savedHtml = tElm.html();
                return function postLink(scope, iElm, iAttrs) {
                    var _rendering = true, onrenderExp = iAttrs.onrender, onrenderHandler = function() {
                        if (_rendering) {
                            if (onrenderExp) {
                                scope.$eval(onrenderExp);
                            }
                            _rendering = false;
                        }
                    };
                    ezfb.XFBML.parse(iElm[0], onrenderHandler);
                    var setter = $parse(iAttrs.ezfbXfbml).assign;
                    scope.$watch(iAttrs.ezfbXfbml, function(val) {
                        if (val) {
                            _rendering = true;
                            iElm.html(_savedHtml);
                            $compile(iElm.contents())(scope);
                            $timeout(function() {
                                ezfb.XFBML.parse(iElm[0], onrenderHandler);
                            });
                            (setter || angular.noop)(scope, false);
                        }
                    }, true);
                };
            }
        };
    } ]);
    var _socialPluginDirectiveConfig = {
        fbLike: [ "action", "colorscheme", "href", "kidDirectedSite", "layout", "ref", "share", "showFaces", "width" ],
        fbShareButton: [ "href", "layout", "width" ],
        fbSend: [ "colorscheme", "href", "kidDirectedSite", "ref" ],
        fbPost: [ "href", "width" ],
        fbFollow: [ "colorscheme", "href", "kidDirectedSite", "layout", "showFaces", "width" ],
        fbComments: [ "colorscheme", "href", "mobile", "numPosts", "orderBy", "width" ],
        fbCommentsCount: [ "href" ],
        fbActivity: [ "action", "appId", "colorscheme", "filter", "header", "height", "linktarget", "maxAge", "recommendations", "ref", "site", "width" ],
        fbRecommendations: [ "action", "appId", "colorscheme", "header", "height", "linktarget", "maxAge", "ref", "site", "width" ],
        fbRecommendationsBar: [ "action", "href", "maxAge", "numRecommendations", "readTime", "ref", "side", "site", "trigger" ],
        fbLikeBox: [ "colorscheme", "forceWall", "header", "height", "href", "showBorder", "showFaces", "stream", "width" ],
        fbFacepile: [ "action", "appId", "colorscheme", "href", "maxRows", "size", "width" ],
        fbPage: [ "href", "width", "height", "hideCover", "showFacepile", "showPosts" ],
        fbVideo: [ "href", "width", "allowfullscreen" ],
        fbAdPreview: [ "adAccountId", "adgroupId", "creative", "creativeId", "adFormat", "pageType", "targeting", "post" ],
        fbSendToMessenger: [ "messengerAppId", "pageId", "ref", "color", "size" ],
        fbMessengermessageus: [ "messengerAppId", "pageId", "color", "size" ]
    };
    angular.forEach(_socialPluginDirectiveConfig, creatSocialPluginDirective);
    function creatSocialPluginDirective(availableAttrs, dirName) {
        var CLASS_WRAP = "ezfb-social-plugin-wrap", STYLE_WRAP_SPAN = "display: inline-block; width: 0; height: 0; overflow: hidden;";
        var PLUGINS_WITH_ADAPTIVE_WIDTH = [ "fbPage", "fbComments" ];
        var _wrap = function($elm) {
            var tmpl = '<span class="' + CLASS_WRAP + '" style="' + STYLE_WRAP_SPAN + '">';
            return $elm.wrap(tmpl).parent();
        }, _wrapAdaptive = function($elm) {
            var tmpl = '<div class="' + CLASS_WRAP + '">';
            return $elm.wrap(tmpl).parent();
        }, _isWrapped = function($elm) {
            return $elm.parent().hasClass(CLASS_WRAP);
        }, _unwrap = function($elm) {
            var $parent = $elm.parent();
            $parent.after($elm).remove();
            return $elm;
        };
        module.directive(dirName, [ "ezfb", "$q", "$document", function(ezfb, $q, $document) {
            var _withAdaptiveWidth = PLUGINS_WITH_ADAPTIVE_WIDTH.indexOf(dirName) >= 0;
            var _dirClassName = dirName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            return {
                restrict: "EC",
                require: "?^ezfbXfbml",
                compile: function(tElm, tAttrs) {
                    tElm.removeClass(_dirClassName);
                    return function postLink(scope, iElm, iAttrs, xfbmlCtrl) {
                        if (xfbmlCtrl) {
                            return;
                        }
                        var rendering = false, renderId = 0;
                        ezfb.$rendered().then(function() {
                            iElm.addClass(_dirClassName);
                            scope.$watch(function() {
                                var watchList = [];
                                angular.forEach(availableAttrs, function(attrName) {
                                    watchList.push(iAttrs[attrName]);
                                });
                                return watchList;
                            }, function(v) {
                                var wrapFn;
                                renderId++;
                                if (!rendering) {
                                    rendering = true;
                                    wrapFn = _withAdaptiveWidth ? _wrapAdaptive : _wrap;
                                    ezfb.XFBML.parse(wrapFn(iElm)[0], genOnRenderHandler(renderId));
                                } else {
                                    ezfb.XFBML.parse(iElm.parent()[0], genOnRenderHandler(renderId));
                                }
                            }, true);
                        });
                        iElm.bind("$destroy", function() {
                            if (_isWrapped(iElm)) {
                                _unwrap(iElm);
                            }
                        });
                        function genOnRenderHandler(id) {
                            return function() {
                                var onrenderExp;
                                if (rendering && id === renderId) {
                                    onrenderExp = iAttrs.onrender;
                                    if (onrenderExp) {
                                        scope.$eval(onrenderExp);
                                    }
                                    rendering = false;
                                    _unwrap(iElm);
                                }
                            };
                        }
                    };
                }
            };
        } ]);
    }
})(angular.module("ezfb", []));