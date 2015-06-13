/*global angular*/
(function (module) {

  module
  .provider('ezfb', function () {

    // Borrow this from sdk/debug.js
    var APP_EVENTS_EVENT_NAMES = {
          COMPLETED_REGISTRATION: 'fb_mobile_complete_registration',
          VIEWED_CONTENT: 'fb_mobile_content_view',
          SEARCHED: 'fb_mobile_search',
          RATED: 'fb_mobile_rate',
          COMPLETED_TUTORIAL: 'fb_mobile_tutorial_completion',
          ADDED_TO_CART: 'fb_mobile_add_to_cart',
          ADDED_TO_WISHLIST: 'fb_mobile_add_to_wishlist',
          INITIATED_CHECKOUT: 'fb_mobile_initiated_checkout',
          ADDED_PAYMENT_INFO: 'fb_mobile_add_payment_info',
          ACHIEVED_LEVEL: 'fb_mobile_level_achieved',
          UNLOCKED_ACHIEVEMENT: 'fb_mobile_achievement_unlocked',
          SPENT_CREDITS: 'fb_mobile_spent_credits'
        },
        APP_EVENTS_PARAMETER_NAMES = {
          CURRENCY: 'fb_currency',
          REGISTRATION_METHOD: 'fb_registration_method',
          CONTENT_TYPE: 'fb_content_type',
          CONTENT_ID: 'fb_content_id',
          SEARCH_STRING: 'fb_search_string',
          SUCCESS: 'fb_success',
          MAX_RATING_VALUE: 'fb_max_rating_value',
          PAYMENT_INFO_AVAILABLE: 'fb_payment_info_available',
          NUM_ITEMS: 'fb_num_items',
          LEVEL: 'fb_level',
          DESCRIPTION: 'fb_description'
        };

    var NO_CALLBACK = -1;

    /**
     * Specify published apis and executable callback argument index
     *
     * ref: https://developers.facebook.com/docs/reference/javascript/
     */
    var _publishedApis = {
      // core
      'api': [1, 2, 3],
      'ui': 1,

      // auth
      'getAuthResponse': NO_CALLBACK,
      'getLoginStatus': 0,
      'login': 0,
      'logout': 0,

      // event
      'Event.subscribe': 1,
      'Event.unsubscribe': 1,  // not quite a callback though

      // xfbml
      'XFBML.parse': 1,

      // canvas
      'Canvas.Prefetcher.addStaticResource': NO_CALLBACK,
      'Canvas.Prefetcher.setCollectionMode': NO_CALLBACK,
      'Canvas.getPageInfo': 0,
      'Canvas.hideFlashElement': NO_CALLBACK,
      'Canvas.scrollTo': NO_CALLBACK,
      'Canvas.setAutoGrow': NO_CALLBACK,
      'Canvas.setDoneLoading': 0,
      'Canvas.setSize': NO_CALLBACK,
      'Canvas.setUrlHandler': 0,
      'Canvas.showFlashElement': NO_CALLBACK,
      'Canvas.startTimer': NO_CALLBACK,
      'Canvas.stopTimer': 0,

      // app events for canvas apps
      // https://developers.facebook.com/docs/canvas/appevents
      'AppEvents.logEvent': NO_CALLBACK,
      'AppEvents.logPurchase': NO_CALLBACK,
      'AppEvents.activateApp': NO_CALLBACK
    };

    // Default locale
    var _locale = 'en_US';

    // Default init parameters
    var _initParams = {
      // appId      : '{your-app-id}', // App ID from the App Dashboard
      status     : true, // check the login status upon init?
      cookie     : true, // set sessions cookies to allow your server to access the session?
      xfbml      : true,  // parse XFBML tags on this page?

      // version information: https://developers.facebook.com/docs/apps/changelog/
      version    : 'v2.0'
    };
    
    /**
     * Default load SDK function
     *
     * Injectable local: 
     *   ezfbAsyncInit - module's private trigger of FB.init, should always be called to complete the ezfb init process
     *   ezfbLocale    - configured SDK locale
     */
    var _defaultLoadSDKFunction = [
                   '$window', '$document', 'ezfbAsyncInit', 'ezfbLocale',
          function ($window,   $document,   ezfbAsyncInit,   ezfbLocale) {
            // Load the SDK's source Asynchronously
            (function(d){
              var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
              if (d.getElementById(id)) {return;}
              js = d.createElement('script'); js.id = id; js.async = true;
              js.src = "//connect.facebook.net/" + ezfbLocale + "/sdk.js";
              // js.src = "//connect.facebook.net/" + ezfbLocale + "/sdk/debug.js";  // debug
              ref.parentNode.insertBefore(js, ref);
            }($document[0]));

            $window.fbAsyncInit = ezfbAsyncInit;
          }],
        _loadSDKFunction = _defaultLoadSDKFunction;

    /**
     * Default init function
     *
     * Injectable locals: 
     *   ezfbInitParams - parameters provided by ezfbProvider.setInitParams() or ezfb.init()
     */
    var _defaultInitFunction = [
                   '$window', 'ezfbInitParams', 
          function ($window,   ezfbInitParams) {
            // Initialize the FB JS SDK
            $window.FB.init(ezfbInitParams);
          }],
        _initFunction = _defaultInitFunction;

    /**
     * Getter/setter of a config
     *
     * @param  {object} target to be configured object
     * @param  {object} config configuration(optional)
     * @return {*}             copied target if "config" is not given
     */
    function _config(target, config) {
      if (angular.isObject(config)) {
        angular.extend(target, config);
      }
      else {
        return angular.copy(target);
      }
    }

    /**
     * Context and arguments proxy function
     *
     * @param  {function} func    the function
     * @param  {object}   context the context
     * @param  {array}    args    arguments
     * @return {function}         proxied function
     */
    function _proxy(func, context, args) {
      return function () {
        return func.apply(context, args);
      };
    }

    return {
      ////////////////////////////
      // provider configuration //
      ////////////////////////////
      setInitParams: function (params) {
        _config(_initParams, params);
      },
      getInitParams: function () {
        return _config(_initParams);
      },

      setLocale: function(locale) {
        _locale = locale;
      },
      getLocale: function() {
        return _locale;
      },
      
      setLoadSDKFunction: function (func) {
        if (angular.isArray(func) || angular.isFunction(func)) {
          _loadSDKFunction = func;
        }
        else {
          throw new Error('Init function type error.');
        }
      },
      getLoadSDKFunction: function () {
        return _loadSDKFunction;
      },

      setInitFunction: function (func) {
        if (angular.isArray(func) || angular.isFunction(func)) {
          _initFunction = func;
        }
        else {
          throw new Error('Init function type error.');
        }
      },
      getInitFunction: function () {
        return _initFunction;
      },

      //////////
      // $get //
      //////////
      $get: [
               '$window', '$q', '$document', '$parse', '$rootScope', '$injector', '$timeout',
      function ($window,   $q,   $document,   $parse,   $rootScope,   $injector,   $timeout) {
        var _initReady, _initRenderReady, _ezfb, _savedListeners, 
            _paramsReady, ezfbAsyncInit;

        _savedListeners = {};

        _paramsReady = $q.defer();

        if (_initParams.appId || _initFunction !== _defaultInitFunction) {
          _paramsReady.resolve();
        }

        _initReady = $q.defer();
        _initRenderReady = $q.defer();
        
        /**
         * #fb-root check & create
         */
        if (!$document[0].getElementById('fb-root')) {
          $document.find('body').append('<div id="fb-root"></div>');
        }

        // Run load SDK function
        ezfbAsyncInit = function () {
          _paramsReady.promise.then(function() {
            // console.log('params ready');

            var onRender = function () {
              // console.log('on render');
              _ezfb.$$rendered = true;
              $timeout(function () {
                _initRenderReady.resolve();
              });
              _ezfb.Event.unsubscribe('xfbml.render', onRender);
            };
            _ezfb.Event.subscribe('xfbml.render', onRender);

            // Run init function
            $injector.invoke(_initFunction, null, {'ezfbInitParams': _initParams});

            _ezfb.$$ready = true;

            _initReady.resolve();
          });
        };
        $injector.invoke(_loadSDKFunction, null, {
          'ezfbAsyncInit': ezfbAsyncInit,
          'ezfbLocale': _locale
        });

        _ezfb = {
          $$ready: false,
          $$rendered: false,
          $ready: function (fn) {
            if (angular.isFunction(fn)) {
              _initReady.promise.then(fn);
            }
            return _initReady.promise;
          },
          $rendered: function (fn) {
            if (angular.isFunction(fn)) {
              _initRenderReady.promise.then(fn);
            }
            return _initRenderReady.promise;
          },
          init: function (params) {
            _config(_initParams, params);
            _paramsReady.resolve();
          },
          AppEvents: {
            EventNames: APP_EVENTS_EVENT_NAMES,
            ParameterNames: APP_EVENTS_PARAMETER_NAMES
          }
        };

        /**
         * _ezfb initialization
         *
         * Publish FB APIs with auto-check ready state
         */
        angular.forEach(_publishedApis, function (cbArgIndex, apiPath) {
          var getter = $parse(apiPath),
              setter = getter.assign;
          setter(_ezfb, function () {
            var apiCall = _proxy(function (args) {
              var dfd, replaceCallbackAt;

              dfd = $q.defer();

              /**
               * Add or replce original callback function with deferred resolve
               * 
               * @param  {number} index expected api callback index
               */
              replaceCallbackAt = function (index) {
                var func, newFunc;

                func = angular.isFunction(args[index]) ? args[index] : angular.noop;
                newFunc = function () {
                  var funcArgs = Array.prototype.slice.call(arguments);

                  if ($rootScope.$$phase) {
                    // already in angularjs context
                    func.apply(null, funcArgs);
                    dfd.resolve.apply(dfd, funcArgs);
                  }
                  else {
                    // not in angularjs context
                    $rootScope.$apply(function () {
                      func.apply(null, funcArgs);
                      dfd.resolve.apply(dfd, funcArgs);
                    });
                  }
                };

                while (args.length <= index) {
                  args.push(null);
                }

                /**
                 * `FB.Event.unsubscribe` requires the original listener function.
                 * Save the mapping of original->wrapped on `FB.Event.subscribe` for unsubscribing.
                 */
                var eventName;
                if (apiPath === 'Event.subscribe') {
                  eventName = args[0];
                  if (angular.isUndefined(_savedListeners[eventName])) {
                    _savedListeners[eventName] = [];
                  }
                  _savedListeners[eventName].push({
                    original: func,
                    wrapped: newFunc
                  });
                }
                else if (apiPath === 'Event.unsubscribe') {
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

                // Replace the original one (or null) with newFunc
                args[index] = newFunc;
              };

              if (cbArgIndex !== NO_CALLBACK) {
                if (angular.isNumber(cbArgIndex)) {
                  /**
                   * Constant callback argument index
                   */
                  replaceCallbackAt(cbArgIndex);
                }
                else if (angular.isArray(cbArgIndex)) {
                  /**
                   * Multiple possible callback argument index
                   */
                  var i, c;
                  for (i = 0; i < cbArgIndex.length; i++) {
                    c = cbArgIndex[i];

                    if (args.length == c ||
                        args.length == (c + 1) && angular.isFunction(args[c])) {

                      replaceCallbackAt(c);

                      break;
                    }
                  }
                }
              }

              /**
               * Apply back to original FB SDK
               */
              var origFBFunc = getter($window.FB);
              if (!origFBFunc) {
                throw new Error("Facebook API `FB." + apiPath + "` doesn't exist.");
              }
              origFBFunc.apply($window.FB, args);

              return dfd.promise;
            }, null, [Array.prototype.slice.call(arguments)]);

            /**
             * Wrap the api function with our ready promise
             *
             * The only exception is `getAuthResponse`, which doesn't rely on a callback function to get the response
             */
            if (apiPath === 'getAuthResponse') {
              if (angular.isUndefined($window.FB)) {
                throw new Error('`FB` is not ready.');
              }
              return $window.FB.getAuthResponse();
            }
            else if (cbArgIndex === NO_CALLBACK) {
              // Do not return promise for no-callback apis
              _initReady.promise.then(apiCall); 
            }
            else {
              return _initReady.promise.then(apiCall);
            }
          });
        });

        return _ezfb;
      }]
    };
  })

  /**
   * @ngdoc directive
   * @name ng.directive:ezfbXfbml
   * @restrict EAC
   *
   * @description
   * Parse XFBML inside the directive
   *
   * @param {boolean} ezfb-xfbml Reload trigger for inside XFBML,
   *                             should keep only XFBML content inside the directive.
   * @param {expr}    onrender   Evaluated every time content xfbml gets rendered.
   */
  .directive('ezfbXfbml', [
           'ezfb', '$parse', '$compile', '$timeout',
  function (ezfb,   $parse,   $compile,   $timeout) {
    return {
      restrict: 'EAC',
      controller: function () {
        // do nothing
      },
      compile: function (tElm, tAttrs) {
        var _savedHtml = tElm.html();

        return function postLink(scope, iElm, iAttrs) {
          var _rendering = true,
              onrenderExp = iAttrs.onrender,
              onrenderHandler = function () {
                if (_rendering) {
                  if (onrenderExp) {
                    scope.$eval(onrenderExp);
                  }
                  
                  _rendering = false;
                }
              };

          ezfb.XFBML.parse(iElm[0], onrenderHandler);

          /**
           * The trigger
           */
          var setter = $parse(iAttrs.ezfbXfbml).assign;
          scope.$watch(iAttrs.ezfbXfbml, function (val) {
            if (val) {
              _rendering = true;
              iElm.html(_savedHtml);

              $compile(iElm.contents())(scope);
              $timeout(function () {
                ezfb.XFBML.parse(iElm[0], onrenderHandler);
              });

              // Reset the trigger if it's settable
              (setter || angular.noop)(scope, false);
            }
          }, true);

        };
      }
    };
  }]);


  // ref: https://developers.facebook.com/docs/plugins
  var _socialPluginDirectiveConfig = {
    'fbLike': [
      'action', 'colorscheme', 'href', 'kidDirectedSite',
      'layout', 'ref', 'share', 'showFaces', 'width'
    ],
    'fbShareButton': [
      'href', 'layout', 'width'
    ],
    'fbSend': [
      'colorscheme', 'href', 'kidDirectedSite', 'ref'
    ],
    'fbPost': [
      'href', 'width'
    ],
    'fbFollow': [
      'colorscheme', 'href', 'kidDirectedSite', 'layout',
      'showFaces', 'width'
    ],
    'fbComments': [
      'colorscheme', 'href', 'mobile', 'numPosts',
      'orderBy', 'width'
    ],
    'fbCommentsCount': [
      'href'
    ],
    'fbActivity': [
      'action', 'appId', 'colorscheme', 'filter', 'header',
      'height', 'linktarget', 'maxAge', 'recommendations',
      'ref', 'site', 'width'
    ],
    'fbRecommendations': [
      'action', 'appId', 'colorscheme', 'header', 'height',
      'linktarget', 'maxAge', 'ref', 'site', 'width'
    ],
    'fbRecommendationsBar': [
      'action', 'href', 'maxAge', 'numRecommendations',
      'readTime', 'ref', 'side', 'site', 'trigger'
    ],
    'fbLikeBox': [
      'colorscheme', 'forceWall', 'header', 'height',
      'href', 'showBorder', 'showFaces', 'stream', 'width'
    ],
    'fbFacepile': [
      'action', 'appId', 'colorscheme', 'href', 'maxRows',
      'size', 'width'
    ],
    'fbPage': [
      'href', 'width', 'height', 'hideCover', 'showFacepile', 'showPosts'
    ],
    'fbVideo': [
      'href', 'width', 'allowfullscreen'
    ]
  };

  angular.forEach(_socialPluginDirectiveConfig, creatSocialPluginDirective);

  function creatSocialPluginDirective(availableAttrs, dirName) {
    var CLASS_WRAP = 'ezfb-social-plugin-wrap',
        STYLE_WRAP_SPAN = 'display: inline-block; width: 0; height: 0; overflow: hidden;';

    // Adpative width plugins
    // e.g. https://developers.facebook.com/docs/plugins/page-plugin#adaptive-width
    var PLUGINS_WITH_ADAPTIVE_WIDTH = ['fbPage'];
    
    /**
     * Wrap-related functions
     */
    var _wrap = function ($elm) {
          var tmpl = '<span class="'+CLASS_WRAP+'" style="'+STYLE_WRAP_SPAN+'">';
          return $elm.wrap(tmpl).parent();
        },
        _wrapAdaptive = function ($elm) {
          // Plugin with adaptive width prefers the "blocky" wrapping element
          var tmpl = '<div class="'+CLASS_WRAP+'">';
          return $elm.wrap(tmpl).parent();
        },
        _isWrapped = function ($elm) {
          return $elm.parent().hasClass(CLASS_WRAP);
        },
        _unwrap = function ($elm) {
          var $parent = $elm.parent();
          $parent.after($elm).remove();
          return $elm;
        };
    
    module.directive(dirName, [
             'ezfb', '$q', '$document',
    function (ezfb,   $q,   $document) {
      var _withAdaptiveWidth = PLUGINS_WITH_ADAPTIVE_WIDTH.indexOf(dirName) >= 0;

      var _dirClassName = dirName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

      return {
        restrict: 'EC',
        require: '?^ezfbXfbml',
        compile: function (tElm, tAttrs) {
          tElm.removeClass(_dirClassName);

          return function postLink(scope, iElm, iAttrs, xfbmlCtrl) {
            /**
             * For backward compatibility, skip self rendering if contained by easyfb-xfbml directive
             */
            if (xfbmlCtrl) {
              return;
            }

            var rendering = false,
                renderId = 0;

            ezfb.$rendered()
            .then(function () {
              iElm.addClass(_dirClassName);

              scope.$watch(function () {
                var watchList = [];
                angular.forEach(availableAttrs, function (attrName) {
                  watchList.push(iAttrs[attrName]);
                });
                return watchList;
              }, function (v) {
                var wrapFn;

                renderId++;
                if (!rendering) {
                  rendering = true;

                  wrapFn = _withAdaptiveWidth ? _wrapAdaptive : _wrap;
                  // Wrap the social plugin code for FB.XFBML.parse
                  ezfb.XFBML.parse(wrapFn(iElm)[0], genOnRenderHandler(renderId));
                }
                else {
                  // Already rendering, do not wrap
                  ezfb.XFBML.parse(iElm.parent()[0], genOnRenderHandler(renderId));
                }
              }, true);
            });


            // Unwrap on $destroy
            iElm.bind('$destroy', function () {
              if (_isWrapped(iElm)) {
                _unwrap(iElm);
              }
            });

            function genOnRenderHandler(id) {
              return function () {
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
    }]);
  }

})(angular.module('ezfb', []));
