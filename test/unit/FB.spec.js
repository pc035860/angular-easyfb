'use strict';

describe('$FB', function () {

  var MODULE_NAME = 'ezfb',
      APP_ID = 'some fb app id',
      DELAY = 999999999999,
      DEFAULT_INIT_PARAMS = {
        status     : true,
        cookie     : true,
        xfbml      : true
      };

  var jqLite = angular.element;

  beforeEach(module(MODULE_NAME));

  describe('configuration phase ($FBProvider)', function () {
    
    var loadSDKSpy, initSpy;

    var $rootScope;

    beforeEach(function () {
      loadSDKSpy = jasmine.createSpy('load sdk');
      initSpy = jasmine.createSpy('init');

      module(function ($provide) {
        $provide.decorator('$window', function ($delegate) {
          $delegate.FB = {
            init: initSpy
          };
          return $delegate;
        });
      });
    });

    function inject$FB () {
      inject(function ($FB, _$rootScope_) {
        $rootScope = _$rootScope_;
      });
    }

    describe('.setLoadSDKFunction', function () {
      
      it('should be called on $FB injection', function () {
        module(function ($FBProvider) {
          $FBProvider.setLoadSDKFunction(['$fbAsyncInit', '$fbLocale', loadSDKSpy]);
        });
        inject$FB();

        expect(loadSDKSpy.callCount).toEqual(1);
      });

      it('should be able to be called with DI locals: $fbAsyncInit, $fbLocale', function () {
        module(function ($FBProvider) {
          $FBProvider.setLoadSDKFunction(['$fbAsyncInit', '$fbLocale', loadSDKSpy]);
        });
        inject$FB();

        // $fbAsyncInit
        expect(typeof loadSDKSpy.mostRecentCall.args[0] === 'function').toBeTruthy();
        // $fbLocale
        expect(typeof loadSDKSpy.mostRecentCall.args[1] === 'string').toBeTruthy();
      });
    });

    describe('.setInitParams', function () {

      beforeEach(module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(function ($fbAsyncInit) {
          mockSDKLoader($fbAsyncInit);
          loadSDKSpy($fbAsyncInit);
        });
      }));

      it('should cause SDK to be loaded', function () {
        module(function ($FBProvider) {
          $FBProvider.setInitParams({
            appId: APP_ID
          });
        });
        inject$FB();

        expect(loadSDKSpy.callCount).toEqual(1);
        expect(typeof loadSDKSpy.mostRecentCall.args[0] === 'function').toBeTruthy();
      });

      it('should have FB.init called with correct parameters', function () {
        module(function ($FBProvider) {
          $FBProvider.setInitParams({
            appId: APP_ID
          });
        });
        inject$FB();
        $rootScope.$apply();

        var expectedParams = angular.extend({}, DEFAULT_INIT_PARAMS, {appId: APP_ID});

        expect(initSpy.callCount).toEqual(1);
        expect(initSpy.mostRecentCall.args[0]).toEqual(expectedParams);
      });

      it('should have FB.init called even SDK is loaded asynchronously', function () {
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
    });

    describe('.setLocale', function () {
      beforeEach(module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(function ($fbLocale) {
          loadSDKSpy($fbLocale);
        });
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      }));

      it('should cause SDK to be loaded with given locale', function () {
        var LOCALE = 'zhTW';

        module(function ($FBProvider) {
          $FBProvider.setLocale(LOCALE);
        });
        inject$FB();

        expect(loadSDKSpy.mostRecentCall.args[0]).toEqual(LOCALE);
      });
    });

    describe('.setInitFunction', function () {
      var customInitSpy;

      beforeEach(module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(mockSDKLoader);
        $FBProvider.setInitParams({
          appId: APP_ID
        });
      }));

      beforeEach(function () {
        customInitSpy = jasmine.createSpy('custom init function');
      });

      it('should call custom init function on init', function () {
        module(function ($FBProvider) {
          $FBProvider.setInitFunction(customInitSpy);
        });
        inject$FB();
        $rootScope.$apply();

        expect(customInitSpy.callCount).toEqual(1);
      });

      it('should be able to be called with DI local: $fbInitParams', function () {
        module(function ($FBProvider) {
          $FBProvider.setInitFunction(['$fbInitParams', customInitSpy]);
        });
        inject$FB();
        $rootScope.$apply();

        var expectedParams = angular.extend({}, DEFAULT_INIT_PARAMS, {appId: APP_ID});
        expect(customInitSpy.mostRecentCall.args[0]).toEqual(expectedParams);
      });
    });

  });

  describe('the instance', function () {
    var API_RESPONSE = {
      angular: 1,
      easyfb: 2
    };

    var fbMockCallSpy, fbMockCallbackSpy, fbMockPromiseSpy;

    beforeEach(function () {
      fbMockCallSpy = jasmine.createSpy('fb api call');
      fbMockCallbackSpy = jasmine.createSpy('fb api callback');
      fbMockPromiseSpy = jasmine.createSpy('fb api promise');

      module(function ($FBProvider) {
        $FBProvider.setLoadSDKFunction(mockSDKLoader);
      });
    });

    describe('.init', function () {
      /**
       * Ref: https://developers.facebook.com/docs/javascript/reference/FB.init
       */
      
      var $FB, $rootScope;

      beforeEach(function () {
        mockSDKApi('init', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });
      });

      it('should call FB.init with correct parameters and set $FB.$$ready to `true`', function () {
        $FB.init({
          appId: APP_ID
        });

        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(1);
        expect(fbMockCallSpy.mostRecentCall.args[0]).toEqual(
          angular.extend(DEFAULT_INIT_PARAMS, {
            appId: APP_ID
          })
        );
        expect($FB.$$ready).toBeTruthy();
      });

    });

    describe('.api', function () {
      /**
       * Ref: https://developers.facebook.com/docs/javascript/reference/FB.api
       */
      
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

        $FB.api('/me');
        $FB.api('/me', null);
        $FB.api('/me', angular.noop);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(3);
      });

      it('should call FB.api after FB.init is called', function () {
        inject(function ($timeout) {
          $FB.api('/me');

          $timeout(function () {
            expect(fbMockCallSpy.callCount).toEqual(0);

            $FB.init({
              appId: APP_ID
            });
          }, DELAY)

          $timeout.flush();

          expect(fbMockCallSpy.callCount).toEqual(1);
        });
      });

      it('should trigger callbacks under different arguments situation with correct response', function () {
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

      it('should trigger promise under different arguments situation with correct response', function () {
        $FB.init({
          appId: APP_ID
        });

        $FB.api('/me').then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        $FB.api('/me', {fields: 'last_name'}).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        $FB.api('/me/feed', 'post', { message: 'post something' }).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        expect(fbMockPromiseSpy.callCount).toEqual(3);
      });

      it('should trigger both callback and promise with correct response', function () {
        $FB.init({
          appId: APP_ID
        });

        $FB.api('/me', fbMockCallbackSpy).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });
    });

    describe('.ui', function () {
      /**
       * Ref: https://developers.facebook.com/docs/javascript/reference/FB.ui
       */
      
      var $FB, $rootScope;

      var UI_PARAMS = {war: 1, machine: 2, rox: 3};

      beforeEach(function () {
        mockSDKApi('ui', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          if (typeof args[1] === 'function') {
            args[1](API_RESPONSE);
          }
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });

        $FB.init({
          appId: APP_ID
        });
      });

      it('should call FB.ui', function () {
        $FB.ui(UI_PARAMS);
        $FB.ui(UI_PARAMS, null);
        $FB.ui(UI_PARAMS, angular.noop);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(3);
      });

      it('should trigger callback with correct response', function () {
        $FB.ui(UI_PARAMS, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger promise with correct response ', function () {
        $FB.ui(UI_PARAMS).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger both callback and promise with correct response', function () {
        $FB.ui(UI_PARAMS, fbMockCallbackSpy).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });
    });

    describe('.getAuthResponse', function () {
      /**
       * Ref: https://developers.facebook.com/docs/reference/javascript/FB.getAuthResponse
       */
      
      var $FB, $rootScope;

      beforeEach(function () {
        mockSDKApi('getAuthResponse', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          return API_RESPONSE;
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });

        $FB.init({
          appId: APP_ID
        });
      });

      it('should call FB.getAuthResponse', function () {
        $FB.getAuthResponse();

        expect(fbMockCallSpy.callCount).toEqual(1);
      });

      it('should retrieve synchronous response', function () {
        expect($FB.getAuthResponse()).toEqual(API_RESPONSE);
      });
    });


    /**
     * Ref:
     *   https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus
     *   https://developers.facebook.com/docs/reference/javascript/FB.login
     *   https://developers.facebook.com/docs/reference/javascript/FB.logout
     */
    angular.forEach([
      'getLoginStatus', 'login', 'logout'
    ], function (apiName) {

      describe('.' + apiName, function () {
        
        var $FB, $rootScope;

        beforeEach(function () {
          mockSDKApi(apiName, function () {
            var args = [].slice.call(arguments);

            fbMockCallSpy.apply(jasmine, args);

            if (typeof args[0] === 'function') {
              args[0]({
                res: apiName
              });
            }
          });

          inject(function (_$FB_, _$rootScope_) {
            $FB = _$FB_;
            $rootScope = _$rootScope_;
          });

          $FB.init({
            appId: APP_ID
          });
        });

        it('should call FB.' + apiName, function () {
          $FB[apiName]();
          $rootScope.$apply();

          expect(fbMockCallSpy.callCount).toEqual(1);
        });

        it('should trigger callback with correct response', function () {
          $FB[apiName](fbMockCallbackSpy);
          $rootScope.$apply();

          expect(fbMockCallbackSpy.callCount).toEqual(1);
          expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual({
            res: apiName
          });
        });

        it('should trigger promise with correct response', function () {
          $FB[apiName]().then(fbMockPromiseSpy);
          $rootScope.$apply();

          expect(fbMockPromiseSpy.callCount).toEqual(1);
          expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual({
            res: apiName
          });
        });

        it('should trigger both callback and promise with correct response', function () {
          $FB[apiName](fbMockCallbackSpy).then(fbMockPromiseSpy);
          $rootScope.$apply();

          expect(fbMockCallbackSpy.callCount).toEqual(1);
          expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual({
            res: apiName
          });
          expect(fbMockPromiseSpy.callCount).toEqual(1);
          expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual({
            res: apiName
          });
        });
      });

    });


    describe('.XFBML.parse', function () {
      var $FB, $rootScope, elm;

      beforeEach(function () {
        mockSDKApi('XFBML.parse', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          if (typeof args[1] === 'function') {
            args[1](API_RESPONSE);
          }
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });

        $FB.init({
          appId: APP_ID
        });

        elm = jqLite('<div>')[0];
      });

      it('should call FB.XFBML.parse', function () {
        $FB.XFBML.parse();
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(1);

        $FB.XFBML.parse(elm);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(2);
      });

      it('should trigger callback with correct response', function () {
        $FB.XFBML.parse(elm, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger promise with correct response', function () {
        $FB.XFBML.parse(elm).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger both callback and promise with correct response', function () {
        $FB.XFBML.parse(elm, fbMockCallbackSpy).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });
    });

    var pubsub = (function () {
      var _core = jqLite('<span>');

      return {
        pub: function (name) {
          _core.triggerHandler(name);
        },
        sub: function (name, handler) {
          _core.on(name, handler);
        },
        unsub: function (name, handler) {
          if (!handler || typeof handler !== 'function') {
            return;
          }
          _core.off(name, handler);
        },
        clear: function () {
          _core.off();
        }
      };
    }());

    describe('pubsub service with jqLite', function () {
      var EVENT_NAME = 'sweetjs';

      var handlerSpy;

      beforeEach(function () {
        handlerSpy = jasmine.createSpy('pubsub sub handler');
      });

      afterEach(function () {
        pubsub.clear();
      });

      it('should trigger handler', function () {
        pubsub.sub(EVENT_NAME, handlerSpy);
        pubsub.pub(EVENT_NAME);

        expect(handlerSpy.callCount).toEqual(1);
      });

      it('should not trigger handler if sub after pub', function () {
        pubsub.pub(EVENT_NAME);
        pubsub.sub(EVENT_NAME, handlerSpy);

        expect(handlerSpy.callCount).toEqual(0);
      });

      it('should not trigger handler after unsub', function () {
        pubsub.sub(EVENT_NAME, handlerSpy);
        pubsub.unsub(EVENT_NAME, handlerSpy);
        pubsub.pub(EVENT_NAME);

        expect(handlerSpy.callCount).toEqual(0);
      });

      it('should trigger handler if unsub with a different handler', function () {
        pubsub.sub(EVENT_NAME, handlerSpy);
        pubsub.unsub(EVENT_NAME, angular.noop);
        pubsub.pub(EVENT_NAME);

        expect(handlerSpy.callCount).toEqual(1);
      });

      it('should trigger handler if unsub without specifying handler', function () {
        pubsub.sub(EVENT_NAME, handlerSpy);
        pubsub.unsub(EVENT_NAME);
        pubsub.pub(EVENT_NAME);

        expect(handlerSpy.callCount).toEqual(1);
      });

      it('should not trigger handler after clear', function () {
        pubsub.sub(EVENT_NAME, handlerSpy);
        pubsub.clear();
        pubsub.pub(EVENT_NAME);

        expect(handlerSpy.callCount).toEqual(0);
      });
    });

    describe('.Event', function () {
      /**
       * Ref:
       *   https://developers.facebook.com/docs/reference/javascript/FB.Event.subscribe
       *   https://developers.facebook.com/docs/reference/javascript/FB.Event.unsubscribe
       */

      var EVENT_NAME = 'edge.create';
      
      var $FB, $rootScope;

      var subSpy, subHandlerSpy, unsubSpy, subPromiseSpy;

      beforeEach(function () {
        subSpy = jasmine.createSpy('.Event.subscribe call');
        subHandlerSpy = jasmine.createSpy('.Event.subscribe handler call');
        subPromiseSpy = jasmine.createSpy('.Event.subscribe promise call');
        unsubSpy = jasmine.createSpy('.Event.unsubscribe call');

        mockSDKApi({
          'Event.subscribe': function (name, handler) {
            pubsub.sub(name, handler);
            subSpy(name, handler);
          },
          'Event.unsubscribe': function (name, handler) {
            pubsub.unsub(name, handler);
            unsubSpy(name, handler);
          }
        });

        inject(function (_$FB_, _$rootScope_) {
          $FB = _$FB_;
          $rootScope = _$rootScope_;
        });

        $FB.init({
          appId: APP_ID
        });
      });

      afterEach(function () {
        pubsub.clear();
      });

      describe('.subscribe', function () {
        it('should call FB.Event.subscribe', function () {
          $FB.Event.subscribe(EVENT_NAME);
          $rootScope.$apply();

          expect(subSpy.callCount).toEqual(1);
        });

        it('should trigger handler on event takes place', function () {
          $FB.Event.subscribe(EVENT_NAME, subHandlerSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
        });

        it('should trigger promise on event takes place', function () {
          $FB.Event.subscribe(EVENT_NAME).then(subPromiseSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should trigger both handler and promise on event takes place', function () {
          $FB.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should only trigger corresponding handler on event takes place', function () {
          var aHandler = jasmine.createSpy('a'),
              bHandler = jasmine.createSpy('b');

          $FB.Event.subscribe('a', aHandler);
          $FB.Event.subscribe('b', bHandler);
          $rootScope.$apply();

          pubsub.pub('a');
          expect(aHandler.callCount).toEqual(1);
          expect(bHandler.callCount).toEqual(0);

          pubsub.pub('b');
          expect(aHandler.callCount).toEqual(1);
          expect(bHandler.callCount).toEqual(1);
        });
      });

      describe('.unsubscribe', function () {
        it('should call FB.Event.unsubscribe', function () {
          $FB.Event.unsubscribe(EVENT_NAME);
          $rootScope.$apply();

          expect(unsubSpy.callCount).toEqual(1);
        });

        it('should trigger both handler and promise on event takes place if called without specifying handler or a different handler', function () {
          $FB.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          $FB.Event.unsubscribe(EVENT_NAME);
          $FB.Event.unsubscribe(EVENT_NAME, angular.noop);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should not trigger either handler or promise after being called correctly', function () {
          $FB.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          $FB.Event.unsubscribe(EVENT_NAME, subHandlerSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(0);
          expect(subPromiseSpy.callCount).toEqual(0);
        });
      });

    });

    // TODO: Canvas.* APIs
  });

});
