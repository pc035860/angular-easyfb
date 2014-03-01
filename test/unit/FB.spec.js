'use strict';

describe('$FB', function () {

  var MODULE = 'ezfb',
      APP_ID = 'some fb app id',
      DELAY = 999999999999;

  beforeEach(function () {
    module(MODULE);
  });

  describe('configuration and initialization', function () {
    
    var loadSDKSpy, initSpy;

    beforeEach(function () {
      loadSDKSpy = jasmine.createSpy('load sdk');
      initSpy = jasmine.createSpy('init');

      module(function ($provide) {
        $provide.decorator('$window', function ($delegate) {
          angular.extend($delegate, {
            FB: {
              init: initSpy
            }
          });
          return $delegate;
        });
      });
    });


    it('should try to load FB JS SDK once', function () {
      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(loadSDKSpy);
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      });
      inject(function ($FB) {
        expect(loadSDKSpy.callCount).toEqual(1);
      });

    });

    it('should load FB JS SDK with correct locale', function () {
      var LOCALE = 'zhTW';

      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(['$fbLocale', function ($fbLocale) {
          loadSDKSpy($fbLocale);
        }]);
        $FBProvider.setLocale(LOCALE);
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      });
      inject(function ($FB) {
        expect(loadSDKSpy.callCount).toEqual(1);
        expect(loadSDKSpy.mostRecentCall.args[0]).toEqual(LOCALE);
      });

    });

    it('should call init function with correct appId', function () {
      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(['$fbAsyncInit', function ($fbAsyncInit) {
          // Can't rely on default load SDK function here
          $fbAsyncInit();
        }]);
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      });
      inject(function ($FB, $rootScope) {
        $rootScope.$apply();
        expect(initSpy.callCount).toEqual(1);
        expect(initSpy.mostRecentCall.args[0]).toEqual({
          appId      : APP_ID,
          status     : true,
          cookie     : true,
          xfbml      : true
        });
      });
    });

    it('should call init function even sdk is loaded asynchronously', function () {
      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction([
                 '$fbAsyncInit', '$timeout', 
        function ($fbAsyncInit,   $timeout) {
          // Delay a bit
          $timeout(function () {
            $fbAsyncInit();
          }, DELAY);
        }]);
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      });
      inject(function ($FB, $rootScope, $timeout) {
        $rootScope.$apply();
        $timeout.flush();
        expect(initSpy.callCount).toEqual(1);
      });
    });

    it('should call init function when setting up parameters in the run phase', function () {
      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(['$fbAsyncInit', function ($fbAsyncInit) {
          // Can't rely on default load SDK function here
          $fbAsyncInit();
        }]);
      });
      inject(function ($FB, $rootScope) {
        $FB.init({
          appId: APP_ID
        });
        $rootScope.$apply();
        expect(initSpy).toHaveBeenCalled();
      });
    });

  });

  describe('the instance', function () {
    var API_RESPONSE = {
      angular: 1,
      easyfb: 2
    };

    var fbMockCallSpy, fbMockCallbackSpy;

    var mockSDKApi = function (apiPath, value) {
      module(function ($provide) {
        var pathAssign = function (obj, pathStr, value) {
          var paths = pathStr.split(/\./);

          if (paths.length === 0) {
            return;
          }

          var path = paths.shift();

          if (paths.length === 0) {
            obj[path] = value;
            return;
          }
          
          if (!obj[path]) {
            obj[path] = {};
          }

          pathAssign(obj[path], paths.join('.'), value);
        };

        var mockFB = {
          // Still required to provide an `init` function
          init: angular.noop
        };
        pathAssign(mockFB, apiPath, value);

        $provide.decorator('$window', function ($delegate) {
          angular.extend($delegate, {
            FB: mockFB
          });
          return $delegate;
        });
      });
    };

    beforeEach(function () {
      fbMockCallSpy = jasmine.createSpy('fb api call');
      fbMockCallbackSpy = jasmine.createSpy('fb api callback');

      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(['$fbAsyncInit', function ($fbAsyncInit) {
          // Can't rely on default load SDK function here
          $fbAsyncInit();
        }]);
      });
    });

    describe('.api', function () {
      // https://developers.facebook.com/docs/javascript/reference/FB.api/
      
      var $FB, $rootScope;

      beforeEach(function () {
        mockSDKApi('api', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          if (typeof args[1] === 'function') {
            args[1](API_RESPONSE);
          }
          else if (typeof args[2] === 'function') {
            args[2](API_RESPONSE);
          }
          else if (typeof args[3] === 'function') {
            args[3](API_RESPONSE);
          }
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });
      });
      
      it('should call FB.api', function () {
        $FB.init({
          appId: APP_ID
        });

        $FB.api('/me', angular.noop);
        $rootScope.$apply();
        expect(fbMockCallSpy.callCount).toEqual(1);
      });

      it('should call FB.api after FB.init', function () {
        inject(function ($timeout) {
          $FB.api('/me', angular.noop);

          $timeout(function () {
            $FB.init({
              appId: APP_ID
            });
          }, DELAY)

          $timeout.flush();

          expect(fbMockCallSpy.callCount).toEqual(1);
        });
      });

      it('should trigger callbacks passed with different arg position with correct response', function () {
        $FB.init({
          appId: APP_ID
        });

        $FB.api('/me', fbMockCallbackSpy);
        $rootScope.$apply();
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);

        $FB.api('/me', {fields: 'last_name'}, fbMockCallbackSpy);
        $rootScope.$apply();
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);

        $FB.api('/me/feed', 'post', { message: 'post something' }, fbMockCallbackSpy);
        $rootScope.$apply();
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);

        expect(fbMockCallbackSpy.callCount).toEqual(3);
      });
    });

  });

});
