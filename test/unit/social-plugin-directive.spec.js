'use strict';

describe('social plugin directive', function () {

  var MODULE_NAME = 'ezfb',
      APP_ID = 'some fb app id',
      DELAY = 999999999999;



  var xfbmlParseSpy, onrenderSpy;

  var $scope, element;

  var $compile, $timeout;

  beforeEach(function () {
    xfbmlParseSpy = jasmine.createSpy('FB.XFBML.parse call');
    onrenderSpy = jasmine.createSpy('directive onrender');
  });

  beforeEach(module(MODULE_NAME, function ($FBProvider) {
    $FBProvider.setLoadSDKFunction(function ($fbAsyncInit) {
      $fbAsyncInit();
    });
    $FBProvider.setInitParams({
      appId: APP_ID
    });
  }));

  beforeEach(module(function ($provide) {
    $provide.decorator('$FB', function ($delegate) {
      /**
       * Mock $FB.XFBML.parse
       */
      $delegate.XFBML.parse = function (elm, callback) {
        $timeout(function () {
          (callback || angular.noop)();
        }, DELAY);
        xfbmlParseSpy(elm, callback);
      };
      return $delegate;
    });
  }));

  beforeEach(inject(function ($rootScope, _$compile_, _$timeout_) {
    $scope = $rootScope.$new();
    $scope.rendered = onrenderSpy;

    $compile = _$compile_;
    $timeout = _$timeout_;

    element = $compile('<div></div>')($scope);
  }));

  afterEach(function () {
    dealoc(element);
  });

  function compileDir(template) {
    var compiled = $compile(template)($scope);
    // Since the compiled element is being wrapped by a parent node
    element.append(compiled.parent());
    $scope.$apply();
  }

  function makeItRendered () {
    $timeout.flush();
  }

  function destroyDirectiveElement () {
    element.children().children().remove();
  }

  function getTemplate(dirTag) {
    return '<'+ dirTag +' onrender="rendered()"></'+ dirTag +'>';
  }

  var WRAPPER_TAG_NAME = 'SPAN';

  angular.forEach([
    'fb:like', 'fb:share-button', 'fb:send', 'fb:post',
    'fb:follow', 'fb:comments', 'fb:activity', 'fb:recommendations',
    'fb:recommendations-bar', 'fb:like-box', 'fb:facepile'
  ], function (dirTag) {
    var dirClass = dirTag.replace(':', '-');

    describe('<'+ dirTag + '>', function () {
      beforeEach(function () {
        compileDir(getTemplate(dirTag));
      });

      it('should have called $FB.XFBML.parse', function () {
        expect(xfbmlParseSpy.callCount).toEqual(1);
      });

      it('should have called $FB.XFBML.parse with wapper element', function () {
        expect(xfbmlParseSpy.mostRecentCall.args[0]).toEqual(element.children()[0]);
      });

      it('should evaluate onrender expression after rendered', function () {
        expect(onrenderSpy.callCount).toEqual(0);
        makeItRendered();
        expect(onrenderSpy.callCount).toEqual(1);
      });

      it('should be unwrapped after rendered', function () {
        expect(element.children()[0].tagName).toEqual(WRAPPER_TAG_NAME);
        makeItRendered();
        expect(element.children()[0].tagName).toEqual(dirTag.toUpperCase());
      });
      
      it("should be unwrapped on $destroy even hasn't been rendered", function () {
        expect(element.children()[0].tagName).toEqual(WRAPPER_TAG_NAME);
        destroyDirectiveElement();
        expect(element.children().length).toEqual(0);
      });
    });

  });


});
