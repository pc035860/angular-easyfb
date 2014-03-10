'use strict';

describe('social plugin directive', function () {

  var MODULE_NAME = 'ezfb',
      APP_ID = 'some fb app id',
      DELAY = 999999999999,
      DIRECTIVES_CONFIG = {
        'fb:like':                ['href', 'kid_directed_site'],
        'fb:share-button':        ['href', 'layout'],
        'fb:send':                ['href', 'kid_directed_site'],
        'fb:post':                ['href', 'width'],
        'fb:follow':              ['href', 'kid_directed_site'],
        'fb:comments':            ['href', 'width'],
        'fb:activity':            ['site', 'app_id'],
        'fb:recommendations':     ['site', 'app_id'],
        'fb:recommendations-bar': ['href', 'site'],
        'fb:like-box':            ['href', 'show_faces'],
        'fb:facepile':            ['href', 'app_id']
      },
      INTERESTED_ATTRS = [
        'href', 'kid_directed_site', 'layout', 'width', 
        'site', 'show_faces', 'app_id'
      ];

  var jqLite = angular.element;

  var xfbmlParseSpy, onrenderSpy;

  var $scope, element;

  var $compile, $timeout, $log;

  beforeEach(function () {
    xfbmlParseSpy = jasmine.createSpy('FB.XFBML.parse call');
    onrenderSpy = jasmine.createSpy('directive onrender');
  });

  beforeEach(function () {
    mockSDKApi('init', angular.noop);
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
    $provide.decorator('$FB', function ($delegate, $log) {
      /**
       * Mock $FB.XFBML.parse
       */
      $delegate.XFBML.parse = function (elm, callback) {
        $timeout(function () {
          (callback || angular.noop)();
        }, DELAY);
        xfbmlParseSpy(elm, callback);

        var $elm = jqLite(elm), obj = {};
        angular.forEach(INTERESTED_ATTRS, function (attrName) {
          var val = $elm.children().attr(attrName);
          if (val) {
            obj[attrName] = val;
          }
        });
        $log.debug(obj);
      };
      return $delegate;
    });
  }));

  beforeEach(inject(function ($rootScope, _$compile_, _$timeout_, _$log_) {
    $scope = $rootScope.$new();
    $scope.rendered = onrenderSpy;
    $scope.renderSwitch = false;

    $compile = _$compile_;
    $timeout = _$timeout_;
    $log = _$log_;
    $log.reset();

    element = $compile('<div></div>')($scope);
  }));

  afterEach(function () {
    dealoc(element);
  });

  function makeItRendered () {
    $timeout.flush();
  }

  describe('ezfbXfbml', function () {
    function compileDir(template) {
      element.append($compile(template)($scope));
      $scope.$apply();
    }

    beforeEach(function () {
      compileDir('\
        <div ezfb-xfbml="renderSwitch" onrender="rendered()">\
          <fb:like onrender="rendered()"></fb:like>\
        </div>\
      ');
    });

    it('should call $FB.XFBML.parse once', function () {
      expect(xfbmlParseSpy.callCount).toEqual(1);
    });

    it('should call $FB.XFBML.parse with compiled element', function () {
      expect(xfbmlParseSpy.mostRecentCall.args[0]).toEqual(element.children()[0]);
    });

    it('should evaluate onrender expression after rendered', function () {
      expect(onrenderSpy.callCount).toEqual(0);
      makeItRendered();
      expect(onrenderSpy.callCount).toEqual(1);
    });

    it('should call $FB.XFBML.parse on triggering rerender', function () {
      makeItRendered();
      expect(xfbmlParseSpy.callCount).toEqual(1);

      $scope.renderSwitch = true;
      $scope.$apply();

      $timeout.flush();

      expect(xfbmlParseSpy.callCount).toEqual(2);
    });

    it('should evaluate onrender expression after triggering rerender', function () {
      makeItRendered();
      expect(onrenderSpy.callCount).toEqual(1);

      $scope.renderSwitch = true;
      $scope.$apply();

      $timeout.flush();  // Rerender call to parse method is in a $timeout

      makeItRendered();
      expect(onrenderSpy.callCount).toEqual(2);
    });
  });

  describe('seemless integration', function () {
    function compileDir(template) {
      var compiled = $compile(template)($scope);
      element.append(compiled);
    }

    function destroyDirectiveElement () {
      element.children().children().remove();
    }

    function getTemplate(dirTag, attrs) {
      var attrsStr = '', l;

      if (attrs && angular.isObject(attrs)) {
        l = [''];
        angular.forEach(attrs, function (value, name) {
          l.push(name + '="' + value + '"');
        });
        attrsStr += l.join(' ');
      }

      return '<'+ dirTag +' onrender="rendered()"'+ attrsStr +'></'+ dirTag +'>';
    }

    function toCamelCase(dirTag) {
      var l = [];
      angular.forEach(dirTag.split(/-|:/), function (token, i) {
        if (i === 0) {
          l.push(token);
        }
        else {
          l.push(token.charAt(0).toUpperCase() + token.slice(1));
        }
      });
      return l.join('');
    }

    function lastLoggedAttrs () {
      return $log.debug.logs[$log.debug.logs.length - 1][0];
    }

    var WRAPPER_TAG_NAME = 'SPAN';

    angular.forEach(DIRECTIVES_CONFIG, function (attrNames, dirTag) {

      describe(toCamelCase(dirTag), function () {
        it('should call $FB.XFBML.parse once', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          expect(xfbmlParseSpy.callCount).toEqual(1);
        });

        it('should call $FB.XFBML.parse with wrapper element', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();
          
          expect(xfbmlParseSpy.mostRecentCall.args[0]).toEqual(element.children()[0]);
        });

        it('should evaluate onrender expression after rendered', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          expect(onrenderSpy.callCount).toEqual(0);

          makeItRendered();

          expect(onrenderSpy.callCount).toEqual(1);
        });

        it('should unwrap after rendered', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          expect(element.children()[0].tagName).toEqual(WRAPPER_TAG_NAME);

          makeItRendered();

          expect(element.children()[0].tagName).toEqual(dirTag.toUpperCase());
        });
        
        it("should unwrap on $destroy even hasn't been rendered", function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();
          
          expect(element.children()[0].tagName).toEqual(WRAPPER_TAG_NAME);
          
          destroyDirectiveElement();
          
          expect(element.children().length).toEqual(0);
        });

        it('should call $FB.XFBML.parse with interpolated attribute', function () {
          var attrs = {}, lastAttrs;
          attrs[attrNames[0]] = '{{ v1 }}';
          $scope.v1 = attrNames[0];

          compileDir(getTemplate(dirTag, attrs));
          $scope.$apply();

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v1);
        });

        it('should call $FB.XFBML.parse with delay-interpolated attribute', function () {
          var attrs = {}, lastAttrs;

          attrs[attrNames[0]] = '{{ v1 }}';

          $timeout(function () {
            $scope.v1 = attrNames[0];
          }, DELAY);

          compileDir(getTemplate(dirTag, attrs));
          $scope.$apply();

          $timeout.flush();

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v1);
        });

        it('should call $FB.XFBML.parse with correct attributes when they are interpolated staggerly', function () {
          var attrs = {}, lastAttrs;
          attrs[attrNames[0]] = '{{ v1 }}';
          attrs[attrNames[1]] = '{{ v2 }}';

          $timeout(function () {
            $scope.v1 = attrNames[0];
          }, 100);
          $timeout(function () {
            $scope.v2 = attrNames[1];
          }, 300);

          compileDir(getTemplate(dirTag, attrs));
          $scope.$apply();

          $timeout.flush(100);

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v1);
          expect(lastAttrs[attrNames[1]]).toBeFalsy();

          $timeout.flush(300);
          
          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v1);
          expect(lastAttrs[attrNames[1]]).toEqual($scope.v2);
        });
      });

    });
  });

});
