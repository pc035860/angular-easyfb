'use strict';

describe('ezfb', function () {

  var MODULE_NAME = 'ezfb',
      APP_ID = 'some fb app id',
      DELAY = 999999999999,
      DEFAULT_INIT_PARAMS = {
        status     : true,
        cookie     : true,
        xfbml      : true,
        version    : 'v1.0'
      };

  var jqLite = angular.element;

  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module(MODULE_NAME));

  describe('configuration phase (ezfbProvider)', function () {
    
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

    function injectEzfb () {
      inject(function (ezfb, _$rootScope_) {
        $rootScope = _$rootScope_;
      });
    }

    describe('.setLoadSDKFunction', function () {
      
      it('should be called on ezfb injection', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setLoadSDKFunction(['ezfbAsyncInit', 'ezfbLocale', loadSDKSpy]);
        });
        injectEzfb();

        expect(loadSDKSpy.callCount).toEqual(1);
      });

      it('should be able to be called with DI locals: ezfbAsyncInit, ezfbLocale', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setLoadSDKFunction(['ezfbAsyncInit', 'ezfbLocale', loadSDKSpy]);
        });
        injectEzfb();

        // ezfbAsyncInit
        expect(typeof loadSDKSpy.mostRecentCall.args[0] === 'function').toBeTruthy();
        // ezfbLocale
        expect(typeof loadSDKSpy.mostRecentCall.args[1] === 'string').toBeTruthy();
      });
    });

    describe('.setInitParams', function () {

      beforeEach(module(function (ezfbProvider) {
        ezfbProvider.setLoadSDKFunction(function (ezfbAsyncInit) {
          mockSDKLoader(ezfbAsyncInit);
          loadSDKSpy(ezfbAsyncInit);
        });
      }));

      it('should cause SDK to be loaded', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setInitParams({
            appId: APP_ID
          });
        });
        injectEzfb();

        expect(loadSDKSpy.callCount).toEqual(1);
        expect(typeof loadSDKSpy.mostRecentCall.args[0] === 'function').toBeTruthy();
      });

      it('should have FB.init called with correct parameters', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setInitParams({
            appId: APP_ID
          });
        });
        injectEzfb();
        $rootScope.$apply();

        var expectedParams = angular.extend({}, DEFAULT_INIT_PARAMS, {appId: APP_ID});

        expect(initSpy.callCount).toEqual(1);
        expect(initSpy.mostRecentCall.args[0]).toEqualData(expectedParams);
      });

      it('should have FB.init called even SDK is loaded asynchronously', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setLoadSDKFunction([
                   'ezfbAsyncInit', '$timeout', 
          function (ezfbAsyncInit,   $timeout) {
            // Delay a bit
            $timeout(function () {
              ezfbAsyncInit();
            }, DELAY);
          }]);
          
          ezfbProvider.setInitParams({
            appId: APP_ID
          });
        });
        inject(function (ezfb, $rootScope, $timeout) {
          $rootScope.$apply();
          $timeout.flush();

          expect(initSpy.callCount).toEqual(1);
        });
      });
    });

    describe('.setLocale', function () {
      beforeEach(module(function (ezfbProvider) {
        ezfbProvider.setLoadSDKFunction(function (ezfbLocale) {
          loadSDKSpy(ezfbLocale);
        });
        ezfbProvider.setInitParams({
          appId: APP_ID
        });
      }));

      it('should cause SDK to be loaded with given locale', function () {
        var LOCALE = 'zhTW';

        module(function (ezfbProvider) {
          ezfbProvider.setLocale(LOCALE);
        });
        injectEzfb();

        expect(loadSDKSpy.mostRecentCall.args[0]).toEqual(LOCALE);
      });
    });

    describe('.setInitFunction', function () {
      var customInitSpy;

      beforeEach(module(function (ezfbProvider) {
        ezfbProvider.setLoadSDKFunction(mockSDKLoader);
        ezfbProvider.setInitParams({
          appId: APP_ID
        });
      }));

      beforeEach(function () {
        customInitSpy = jasmine.createSpy('custom init function');
      });

      it('should call custom init function on init', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setInitFunction(customInitSpy);
        });
        injectEzfb();
        $rootScope.$apply();

        expect(customInitSpy.callCount).toEqual(1);
      });

      it('should be able to be called with DI local: ezfbInitParams', function () {
        module(function (ezfbProvider) {
          ezfbProvider.setInitFunction(['ezfbInitParams', customInitSpy]);
        });
        injectEzfb();
        $rootScope.$apply();

        var expectedParams = angular.extend({}, DEFAULT_INIT_PARAMS, {appId: APP_ID});
        expect(customInitSpy.mostRecentCall.args[0]).toEqualData(expectedParams);
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

      module(function (ezfbProvider) {
        ezfbProvider.setLoadSDKFunction(mockSDKLoader);
      });
    });

    describe('.init', function () {
      /**
       * Ref: https://developers.facebook.com/docs/javascript/reference/FB.init
       */
      
      var ezfb, $rootScope;

      beforeEach(function () {
        mockSDKApi('init', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);
        });

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });
      });

      it('should call FB.init with correct parameters and set ezfb.$$ready to `true`', function () {
        ezfb.init({
          appId: APP_ID
        });

        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(1);
        expect(fbMockCallSpy.mostRecentCall.args[0]).toEqual(
          angular.extend(DEFAULT_INIT_PARAMS, {
            appId: APP_ID
          })
        );
        expect(ezfb.$$ready).toBeTruthy();
      });

    });

    describe('.api', function () {
      /**
       * Ref: https://developers.facebook.com/docs/javascript/reference/FB.api
       */
      
      var ezfb, $rootScope;

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

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });
      });
      
      it('should call FB.api', function () {
        ezfb.init({
          appId: APP_ID
        });

        ezfb.api('/me');
        ezfb.api('/me', null);
        ezfb.api('/me', angular.noop);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(3);
      });

      it('should call FB.api after FB.init is called', function () {
        inject(function ($timeout) {
          ezfb.api('/me');

          $timeout(function () {
            expect(fbMockCallSpy.callCount).toEqual(0);

            ezfb.init({
              appId: APP_ID
            });
          }, DELAY)

          $timeout.flush();

          expect(fbMockCallSpy.callCount).toEqual(1);
        });
      });

      it('should trigger callbacks under different arguments situation with correct response', function () {
        ezfb.init({
          appId: APP_ID
        });

        ezfb.api('/me', fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        ezfb.api('/me', {fields: 'last_name'}, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        ezfb.api('/me/feed', 'post', { message: 'post something' }, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        expect(fbMockCallbackSpy.callCount).toEqual(3);
      });

      it('should trigger promise under different arguments situation with correct response', function () {
        ezfb.init({
          appId: APP_ID
        });

        ezfb.api('/me').then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        ezfb.api('/me', {fields: 'last_name'}).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        ezfb.api('/me/feed', 'post', { message: 'post something' }).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);


        expect(fbMockPromiseSpy.callCount).toEqual(3);
      });

      it('should trigger both callback and promise with correct response', function () {
        ezfb.init({
          appId: APP_ID
        });

        ezfb.api('/me', fbMockCallbackSpy).then(fbMockPromiseSpy);
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
      
      var ezfb, $rootScope;

      var UI_PARAMS = {war: 1, machine: 2, rox: 3};

      beforeEach(function () {
        mockSDKApi('ui', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          if (typeof args[1] === 'function') {
            args[1](API_RESPONSE);
          }
        });

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });

        ezfb.init({
          appId: APP_ID
        });
      });

      it('should call FB.ui', function () {
        ezfb.ui(UI_PARAMS);
        ezfb.ui(UI_PARAMS, null);
        ezfb.ui(UI_PARAMS, angular.noop);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(3);
      });

      it('should trigger callback with correct response', function () {
        ezfb.ui(UI_PARAMS, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger promise with correct response ', function () {
        ezfb.ui(UI_PARAMS).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger both callback and promise with correct response', function () {
        ezfb.ui(UI_PARAMS, fbMockCallbackSpy).then(fbMockPromiseSpy);
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
      
      var ezfb, $rootScope;

      beforeEach(function () {
        mockSDKApi('getAuthResponse', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          return API_RESPONSE;
        });

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });

        ezfb.init({
          appId: APP_ID
        });
      });

      it('should call FB.getAuthResponse', function () {
        ezfb.getAuthResponse();

        expect(fbMockCallSpy.callCount).toEqual(1);
      });

      it('should retrieve synchronous response', function () {
        expect(ezfb.getAuthResponse()).toEqual(API_RESPONSE);
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
        
        var ezfb, $rootScope;

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

          inject(function (_ezfb_, _$rootScope_) {
            ezfb = _ezfb_;
            $rootScope = _$rootScope_;
          });

          ezfb.init({
            appId: APP_ID
          });
        });

        it('should call FB.' + apiName, function () {
          ezfb[apiName]();
          $rootScope.$apply();

          expect(fbMockCallSpy.callCount).toEqual(1);
        });

        it('should trigger callback with correct response', function () {
          ezfb[apiName](fbMockCallbackSpy);
          $rootScope.$apply();

          expect(fbMockCallbackSpy.callCount).toEqual(1);
          expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqualData({
            res: apiName
          });
        });

        it('should trigger promise with correct response', function () {
          ezfb[apiName]().then(fbMockPromiseSpy);
          $rootScope.$apply();

          expect(fbMockPromiseSpy.callCount).toEqual(1);
          expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqualData({
            res: apiName
          });
        });

        it('should trigger both callback and promise with correct response', function () {
          ezfb[apiName](fbMockCallbackSpy).then(fbMockPromiseSpy);
          $rootScope.$apply();

          expect(fbMockCallbackSpy.callCount).toEqual(1);
          expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqualData({
            res: apiName
          });
          expect(fbMockPromiseSpy.callCount).toEqual(1);
          expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqualData({
            res: apiName
          });
        });
      });

    });


    describe('.XFBML.parse', function () {
      var ezfb, $rootScope, elm;

      beforeEach(function () {
        mockSDKApi('XFBML.parse', function () {
          var args = [].slice.call(arguments);

          fbMockCallSpy.apply(jasmine, args);

          if (typeof args[1] === 'function') {
            args[1](API_RESPONSE);
          }
        });

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });

        ezfb.init({
          appId: APP_ID
        });

        elm = jqLite('<div>')[0];
      });

      it('should call FB.XFBML.parse', function () {
        ezfb.XFBML.parse();
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(1);

        ezfb.XFBML.parse(elm);
        $rootScope.$apply();

        expect(fbMockCallSpy.callCount).toEqual(2);
      });

      it('should trigger callback with correct response', function () {
        ezfb.XFBML.parse(elm, fbMockCallbackSpy);
        $rootScope.$apply();

        expect(fbMockCallbackSpy.callCount).toEqual(1);
        expect(fbMockCallbackSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger promise with correct response', function () {
        ezfb.XFBML.parse(elm).then(fbMockPromiseSpy);
        $rootScope.$apply();

        expect(fbMockPromiseSpy.callCount).toEqual(1);
        expect(fbMockPromiseSpy.mostRecentCall.args[0]).toEqual(API_RESPONSE);
      });

      it('should trigger both callback and promise with correct response', function () {
        ezfb.XFBML.parse(elm, fbMockCallbackSpy).then(fbMockPromiseSpy);
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
      
      var ezfb, $rootScope;

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

        inject(function (_ezfb_, _$rootScope_) {
          ezfb = _ezfb_;
          $rootScope = _$rootScope_;
        });

        ezfb.init({
          appId: APP_ID
        });
      });

      afterEach(function () {
        pubsub.clear();
      });

      describe('.subscribe', function () {
        it('should call FB.Event.subscribe', function () {
          ezfb.Event.subscribe(EVENT_NAME);
          $rootScope.$apply();

          expect(subSpy.callCount).toEqual(1);
        });

        it('should trigger handler on event takes place', function () {
          ezfb.Event.subscribe(EVENT_NAME, subHandlerSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
        });

        it('should trigger promise on event takes place', function () {
          ezfb.Event.subscribe(EVENT_NAME).then(subPromiseSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should trigger both handler and promise on event takes place', function () {
          ezfb.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should only trigger corresponding handler on event takes place', function () {
          var aHandler = jasmine.createSpy('a'),
              bHandler = jasmine.createSpy('b');

          ezfb.Event.subscribe('a', aHandler);
          ezfb.Event.subscribe('b', bHandler);
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
          ezfb.Event.unsubscribe(EVENT_NAME);
          $rootScope.$apply();

          expect(unsubSpy.callCount).toEqual(1);
        });

        it('should trigger both handler and promise on event takes place if called without specifying handler or a different handler', function () {
          ezfb.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          ezfb.Event.unsubscribe(EVENT_NAME);
          ezfb.Event.unsubscribe(EVENT_NAME, angular.noop);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(1);
          expect(subPromiseSpy.callCount).toEqual(1);
        });

        it('should not trigger either handler or promise after being called correctly', function () {
          ezfb.Event.subscribe(EVENT_NAME, subHandlerSpy).then(subPromiseSpy);
          ezfb.Event.unsubscribe(EVENT_NAME, subHandlerSpy);
          $rootScope.$apply();

          pubsub.pub(EVENT_NAME);
          expect(subHandlerSpy.callCount).toEqual(0);
          expect(subPromiseSpy.callCount).toEqual(0);
        });
      });

    });

    describe('.AppEvents', function () {
      /**
       * Ref:
       *   https://developers.facebook.com/docs/canvas/appevents
       */

          // FB.AppEvents.EventNames
      var EVENTS = [
            'ACHIEVED_LEVEL', 'ADDED_PAYMENT_INFO',
            'ADDED_TO_CART', 'ADDED_TO_WISHLIST',
            'COMPLETED_REGISTRATION', 'COMPLETED_TUTORIAL',
            'INITIATED_CHECKOUT', 'RATED', 'SEARCHED',
            'SPENT_CREDITS', 'UNLOCKED_ACHIEVEMENT',
            'VIEWED_CONTENT'
          ],
          // FB.AppEvents.ParameterNames
          PARAMS = [
            'CONTENT_ID', 'CONTENT_TYPE', 'CURRENCY',
            'DESCRIPTION', 'LEVEL', 'MAX_RATING_VALUE',
            'NUM_ITEMS', 'PAYMENT_INFO_AVAILABLE',
            'REGISTRATION_METHOD', 'SEARCH_STRING',
            'SUCCESS'
          ];


      var ezfb, $rootScope;

      describe('.EventNames', function () {
        beforeEach(function () {
          inject(function (_ezfb_, _$rootScope_) {
            ezfb = _ezfb_;
            $rootScope = _$rootScope_;
          });
          
          ezfb.init({
            appId: APP_ID
          });
        });

        it('should exist', function () {
          expect(ezfb.AppEvents.EventNames).not.toBeUndefined();
        });

        angular.forEach(EVENTS, function (name) {
          it('should have name `'+ name +'`', function () {
            expect(ezfb.AppEvents.EventNames[name]).not.toBeUndefined();
          });
        });
      });

      describe('.ParameterNames', function () {
        beforeEach(function () {
          inject(function (_ezfb_, _$rootScope_) {
            ezfb = _ezfb_;
            $rootScope = _$rootScope_;
          });
          
          ezfb.init({
            appId: APP_ID
          });
        });

        it('should exist', function () {
          expect(ezfb.AppEvents.ParameterNames).not.toBeUndefined();
        });

        angular.forEach(PARAMS, function (name) {
          it('should have name `'+ name +'`', function () {
            expect(ezfb.AppEvents.ParameterNames[name]).not.toBeUndefined();
          });
        });
      });

      angular.forEach([
        'activateApp', 'logEvent', 'logPurchase'
      ], function (apiName) {
        describe('.'+ apiName, function () {
          beforeEach(function () {
            // They don't have callback
            mockSDKApi('AppEvents.'+ apiName, function () {
              var args = [].slice.call(arguments);

              fbMockCallSpy.apply(jasmine, args);
            });

            inject(function (_ezfb_, _$rootScope_) {
              ezfb = _ezfb_;
              $rootScope = _$rootScope_;
            });
            
            ezfb.init({
              appId: APP_ID
            });
          });

          it('should exists', function () {
            expect(ezfb.AppEvents[apiName]).not.toBeUndefined();
          });

          it('should call `FB.AppEvents.'+ apiName +'` with correct parameters', function () {
            var ARGS;

            switch (apiName) {
              case 'activateApp':
                ARGS = [];
                break;
              case 'logEvent':
                ARGS = ['eventName', 0.1, {'parameters': 1}];
                break;
              case 'logPurchase':
                ARGS = [0.99, 'TWD', {'parameters': 1}];
                break;
            }

            ezfb.AppEvents[apiName].apply(ezfb, ARGS);
            $rootScope.$apply();

            expect(fbMockCallSpy.callCount).toEqual(1);
            expect(fbMockCallSpy.mostRecentCall.args).toEqualData(ARGS);
          });
        });
      });
    });

    // TODO: 
    //   Canvas.* APIs?
  });

});
