/*global angular*/
angular.module('ezfb', [])

.provider('$FB', function () {

  var NO_CALLBACK = -1;

  /**
   * Specify published apis and executable callback argument index
   *
   * ref: https://developers.facebook.com/docs/reference/javascript/
   */
  var _publishedApis = {
    // core
    api: [1, 2, 3],
    ui: 1,

    // auth
    // getAuthResponse: 0,  // deprecated
    getLoginStatus: 0,
    login: 0,
    logout: 0,

    // event
    'Event.subscribe': 1,
    'Event.unsubscribe': NO_CALLBACK,

    // xfbml
    'XFBML.parse': NO_CALLBACK,

    // canvas
    'Canvas.Prefetcher.addStaticResource': NO_CALLBACK,
    'Canvas.Prefetcher.setCollectionMode': NO_CALLBACK,
    'Canvas.hideFlashElement': NO_CALLBACK,
    'Canvas.scrollTo': NO_CALLBACK,
    'Canvas.setAutoGrow': NO_CALLBACK,
    'Canvas.setDoneLoading': 0,
    'Canvas.setSize': NO_CALLBACK,
    'Canvas.setUrlHandler': 0,
    'Canvas.showFlashElement': NO_CALLBACK,
    'Canvas.startTimer': NO_CALLBACK,
    'Canvas.stopTimer': 0
  };

  var _initParams = {
    // appId      : '', // App ID from the App Dashboard
    // channelUrl : '', // Channel File for x-domain communication
    status     : true, // check the login status upon init?
    cookie     : true, // set sessions cookies to allow your server to access the session?
    xfbml      : true  // parse XFBML tags on this page?
  };

  /**
   * Generate namespace route in an object
   *
   * @param  {object} obj   target object
   * @param  {array}  paths ordered path asc
   */
  function _pathGen(obj, paths) {
    if (paths.length === 0) {
      return;
    }
    var path = paths.shift();
    if (!obj[path]) {
      obj[path] = {};
    }
    _pathGen(obj, paths);
  }

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

    //////////
    // $get //
    //////////
    $get: [
             '$window', '$q', '$document', '$parse', '$rootScope',
    function ($window,   $q,   $document,   $parse,   $rootScope) {
      var _initReady, _$FB;

      if (!_initParams.appId) {
        throw new Error('appId required.');
      }

      /**
       * #fb-root check & create
       */
      if (!$document[0].getElementById('fb-root')) {
        $document.find('body').append('<div id="fb-root"></div>');
      }

      _initReady = $q.defer();
      // Load the SDK's source Asynchronously
      (function(d){
        var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        ref.parentNode.insertBefore(js, ref);
      }($document[0]));

      $window.fbAsyncInit = function () {
        // Initialize the FB JS SDK
        $window.FB.init(_initParams);

        _$FB.$$ready = true;
        $rootScope.$apply(function () {
          _initReady.resolve();
        });
      };

      _$FB = {
        $$ready: false
      };

      /**
       * _$FB initialization
       *
       * Publish FB APIs with auto-check ready state
       */
      angular.forEach(_publishedApis, function (cbArgIndex, apiPath) {
        _pathGen(_$FB, apiPath.split(/\./));

        var getter = $parse(apiPath),
            setter = getter.assign;
        setter(_$FB, function () {

          var args = Array.prototype.slice.call(arguments),
              apiCall = _proxy(function (args) {
                var dfd = $q.defer(),
                    /**
                     * Add or replce original callback function with deferred resolve
                     * 
                     * @param  {number} index expected api callback index
                     */
                    putWithIndex = function (index) {
                      var func = angular.isFunction(args[index]) ? args[index] : angular.noop,
                          myFunc = function () {
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

                      // Replace the original one (or null) with myFunc
                      args[index] = myFunc;
                    };

                if (cbArgIndex !== NO_CALLBACK) {
                  if (angular.isNumber(cbArgIndex)) {
                    /**
                     * Constant callback argument index
                     */
                    putWithIndex(cbArgIndex);
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

                        putWithIndex(c);

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
              }, null, [args]);

          /**
           * Wrap the api function with our ready promise
           */
          if (cbArgIndex === NO_CALLBACK) {
            // Do not return promise for no-callback apis
            _initReady.promise.then(apiCall); 
          }
          else {
            return _initReady.promise.then(apiCall);
          }
        });
      });

      return _$FB;
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
         '$FB', '$parse', '$compile', '$timeout',
function ($FB,   $parse,   $compile,   $timeout) {
  return {
    restrict: 'EAC',
    compile: function (tElm, tAttrs) {
      var _savedHtml = tElm.html();

      return function postLink(scope, iElm, iAttrs) {
        var _rendering = true,
            onrenderExp = iAttrs.onrender || '',
            onrenderHandler = function () {
              if (_rendering) {
                scope.$eval(onrenderExp);
                _rendering = false;
              }
            },
            renderEvent = 'xfbml.render';

        /**
         * Render event
         */
        if (onrenderExp) {
          // Subscribe
          $FB.Event.subscribe(renderEvent, onrenderHandler);

          // Unsubscibe on $destroy
          iElm.bind('$destroy', function () {
            $FB.Event.unsubscribe(renderEvent, onrenderHandler);

            iElm.unbind('$destroy');
          });
        }

        $FB.XFBML.parse(iElm[0]);

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
              $FB.XFBML.parse(iElm[0]);
            });

            // Reset the trigger if it's settable
            (setter || angular.noop)(scope, false);
          }
        }, true);

      };
    }
  };
}]);
