'use strict';

describe('$FB', function () {

  var APP_ID = 'some fb app id';

  var loadSDKSpy, initSpy;

  beforeEach(function () {
    loadSDKSpy = jasmine.createSpy('load sdk');
    initSpy = jasmine.createSpy('init');

    // module('ezfb', function ($FBProvider) {
    //   // $FBProvider.setLoadSDKFunction(loadSDKFunc);
    //   // $FBProvider.setInitFunction(initFunc);
    //   // $FBProvider.setLocale(LOCALE);

    // });

    // inject(function (_$rootScope_, _$timeout_) {
    //   $rootScope = _$rootScope_;
    //   $timeout = _$timeout_;
    // });
  });


  it('should try to load FB JS SDK once', function () {
    module('ezfb', function ($FBProvider) {
      $FBProvider.setLoadSDKFunction(loadSDKSpy);
      $FBProvider.setInitParams({
        appId: APP_ID
      });
    });
    inject(function ($FB) {

      expect(loadSDKSpy).toHaveBeenCalled();
    });

  });

  it('should load FB JS SDK with correct locale', function () {
    var LOCALE = 'zhTW';

    module('ezfb', function ($FBProvider) {
      $FBProvider.setLoadSDKFunction(['$fbLocale', function ($fbLocale) {
        loadSDKSpy($fbLocale);
      }]);
      $FBProvider.setLocale(LOCALE);
      $FBProvider.setInitParams({
        appId: APP_ID
      });
    });
    inject(function ($FB) {

      expect(loadSDKSpy.mostRecentCall.args[0]).toEqual(LOCALE);
    });

  });

  it('should call init function with correct appId', function () {
    module('ezfb', function ($FBProvider) {
      $FBProvider.setLoadSDKFunction(['$fbAsyncInit', function ($fbAsyncInit) {
        // Can't rely on default load SDK function here
        $fbAsyncInit();
      }]);
      $FBProvider.setInitFunction(['$fbInitParams', function ($fbInitParams) {
        initSpy($fbInitParams);
      }]);
      $FBProvider.setInitParams({
        appId: APP_ID
      });
    });
    inject(function ($FB, $rootScope) {
      $rootScope.$apply();
      expect(initSpy).toHaveBeenCalled();
      expect(initSpy.mostRecentCall.args[0]).toEqual({
        appId      : APP_ID,
        status     : true,
        cookie     : true,
        xfbml      : true
      });
    });
  });

  it('should call init function even sdk is loaded asynchronously', function () {
    module('ezfb', function ($FBProvider) {
      $FBProvider.setLoadSDKFunction([
               '$fbAsyncInit', '$timeout', 
      function ($fbAsyncInit,   $timeout) {
        // Delay a bit
        $timeout(function () {
          $fbAsyncInit();
        }, 999999999999999);
      }]);
      $FBProvider.setInitFunction(initSpy);
      $FBProvider.setInitParams({
        appId: APP_ID
      });
    });
    inject(function ($FB, $rootScope, $timeout) {
      $rootScope.$apply();
      $timeout.flush();
      expect(initSpy).toHaveBeenCalled();
    });
  });

});
