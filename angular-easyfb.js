angular.module('ezfb', [])

.provider('$FB', function () {

  // ref: https://developers.facebook.com/docs/reference/javascript/
  var _publishedApis = [
    // core
    'api', 
    'ui', 

    // auth
    'getAuthResponse', 
    'getLoginStatus', 
    'login', 
    'logout', 

    // event
    'Event.subscribe', 
    'Event.unsubscribe',

    // xfbml
    'XFBML.parse',

    // canvas
    'Canvas.Prefetcher.addStaticResource',
    'Canvas.Prefetcher.setCollectionMode',
    'Canvas.hideFlashElement',
    'Canvas.scrollTo',
    'Canvas.setAutoGrow',
    'Canvas.setDoneLoading',
    'Canvas.setSize',
    'Canvas.setUrlHandler',
    'Canvas.showFlashElement',
    'Canvas.startTimer',
    'Canvas.stopTimer'
  ];

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
    path = paths.shift();
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
      func.apply(context, args);
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
        // init the FB JS SDK
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
      angular.forEach(_publishedApis, function (apiPath) {
        _pathGen(_$FB, apiPath.split(/\./));

        var getter = $parse(apiPath),
            setter = getter.assign;
        setter(_$FB, function () {

          var args = Array.prototype.slice.call(arguments),
              func = _proxy(function (args) {
                angular.forEach(args, function (arg, i) {
                  /**
                   * Wrap API function arg with angularjs context
                   */
                  if (angular.isFunction(arg)) {
                    var func = arg;
                    args[i] = function () {
                      var funcArgs = Array.prototype.slice.call(arguments);

                      if ($rootScope.$$phase) {
                        // already in angularjs context
                        func.apply(null, funcArgs);
                      }
                      else {
                        // not in angularjs context
                        $rootScope.$apply(function () {
                          func.apply(null, funcArgs);
                        });
                      }
                    };
                  }
                });

                /**
                 * Apply back to original FB SDK
                 */
                var origFBFunc = getter($window.FB);
                if (!origFBFunc) {
                  throw new Error("Facebook API `FB." + apiPath + "` doesn't exist.");
                }
                origFBFunc.apply($window.FB, args);

              }, null, [args]);

          /**
           * Wrap the api function with our ready promise
           */
          _initReady.promise.then(func);
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
 */
.directive('ezfbXfbml', [
         '$FB', '$parse', '$compile', '$timeout',
function ($FB,   $parse,   $compile,   $timeout) {
  return {
    restrict: 'EAC',
    compile: function (tElm, tAttrs) {
      var _savedHtml = tElm.html();

      return function postLink(scope, iElm, iAttrs) {
        $FB.XFBML.parse(iElm[0]);

        var setter = $parse(iAttrs.ezfbXfbml).assign;
        scope.$watch(iAttrs.ezfbXfbml, function (val) {
          if (val) {
            iElm.html(_savedHtml);

            $compile(iElm.contents())(scope);
            $timeout(function () {
              $FB.XFBML.parse(iElm[0]);
            });
            
            // reset the trigger if its settable
            (setter || angular.noop)(scope, false);
          }
        }, true);
      };
    }
  };
}]);
