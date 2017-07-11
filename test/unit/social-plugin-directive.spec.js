/*jshint undef:false, multistr:true*/
describe('social plugin directive', function () {
  'use strict';

  var MODULE_NAME = 'ezfb',
      APP_ID = 'some fb app id',
      DIRECTIVES_CONFIG = {
        'fb:like':                ['href', 'kid_directed_site'],
        'fb:share-button':        ['href', 'layout'],
        'fb:send':                ['href', 'kid_directed_site'],
        'fb:post':                ['href', 'width'],
        'fb:follow':              ['href', 'kid_directed_site'],
        'fb:comments':            ['href', 'width'],
        'fb:comments-count':      ['href'],
        'fb:activity':            ['site', 'app_id'],
        'fb:recommendations':     ['site', 'app_id'],
        'fb:recommendations-bar': ['href', 'site'],
        'fb:like-box':            ['href', 'show_faces'],
        'fb:facepile':            ['href', 'app_id'],
        'fb:page':                ['href', 'show_facepile'],
        'fb:video':               ['href', 'width'],
        'fb:ad-preview':          ['creative', 'ad_format'],
        'fb:send-to-messenger':   ['messenger_app_id', 'page_id'],
        'fb:messengermessageus':  ['messenger_app_id', 'page_id'],
        'fb:login-button':        ['scope', 'size'],
        'fb:comment-embed':       ['href', 'width'],
        'fb:save':                ['uri']
      },
      INTERESTED_ATTRS = [
        'href', 'kid_directed_site', 'layout', 'width', 
        'site', 'show_faces', 'app_id', 'show_facepile',
        'creative', 'ad_format', 'messenger_app_id', 'page_id',
        'scope', 'size', 'uri'
      ],
      HELLO_RENDER_DELAY = 20,
      PARSE_DELAY_BY = 100;

  var jqLite = angular.element;

  var xfbmlParseSpy, onrenderSpy, xfbmlParseSpyExtra;

  var $scope, element, $rootScope;

  var $compile, $timeout, $log;

  beforeEach(function () {
    xfbmlParseSpy = jasmine.createSpy('FB.XFBML.parse call');
    onrenderSpy = jasmine.createSpy('directive onrender');
    xfbmlParseSpyExtra = jasmine.createSpy('FB.XFBML.parse call extra info')
  });

  beforeEach(function () {
    mockSDKApi();
  });

  beforeEach(module(MODULE_NAME, function (ezfbProvider) {
    ezfbProvider.setLoadSDKFunction(function (ezfbAsyncInit) {
      ezfbAsyncInit();
    });
    ezfbProvider.setInitParams({
      appId: APP_ID
    });
  }));

  beforeEach(module(function ($provide) {
    $provide.decorator('ezfb', function ($delegate, $log) {
      var callCount = 1;

      /**
       * Mock ezfb.XFBML.parse
       */
      $delegate.XFBML.parse = function (elm, callback) {
        /**
         * Makes different $timeout delay for each 
         * @return {[type]} [description]
         */
        $timeout(function () {
          (callback || angular.noop)();
        }, PARSE_DELAY_BY * callCount);

        callCount++;

        var childTagName = jqLite(elm).children()[0].tagName;
        xfbmlParseSpy(elm, callback);
        xfbmlParseSpyExtra(childTagName);

        var $elm = jqLite(elm), obj = {};
        angular.forEach(INTERESTED_ATTRS, function (attrName) {
          var val = $elm.children().attr(attrName);
          if (val) {
            obj[attrName] = val;
          }
        });
        // log attr values for tests
        $log.debug(obj);
      };
      return $delegate;
    });
  }));

  beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_, _$log_) {
    $rootScope = _$rootScope_;

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

  function makeItRendered(callCount) {
    if (callCount) {
      $timeout.flush(PARSE_DELAY_BY * callCount);
    }
    else {
      $timeout.flush();
    }
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

    it('should call ezfb.XFBML.parse once', function () {
      expect(xfbmlParseSpy.callCount).toEqual(1);
    });

    it('should call ezfb.XFBML.parse with compiled element', function () {
      expect(xfbmlParseSpy.mostRecentCall.args[0]).toEqual(element.children()[0]);
    });

    it('should evaluate onrender expression after rendered', function () {
      expect(onrenderSpy.callCount).toEqual(0);
      makeItRendered();
      expect(onrenderSpy.callCount).toEqual(1);
    });

    it('should call ezfb.XFBML.parse on triggering rerender', function () {
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
      if ($log.debug.logs.length === 0) {
        return null;
      }
      // $log.debug is called in the mocked ezfb.XFBML.parse
      return $log.debug.logs[$log.debug.logs.length - 1][0];
    }

    function makeValue(attrName) {
      return '_' + attrName + '_';
    }

    var WRAPPER_CLASS = 'ezfb-social-plugin-wrap';

    angular.forEach(DIRECTIVES_CONFIG, function (attrNames, dirTag) {

      describe(toCamelCase(dirTag), function () {
        function helloRendered() {
          $timeout.flush(HELLO_RENDER_DELAY);
        }

        beforeEach(function () {
          // Simulate init xfbml parsing
          $timeout(function () {
            mockXFBMLrendered();
          }, HELLO_RENDER_DELAY);
        });

        it('should call ezfb.XFBML.parse once', function () {
          compileDir(getTemplate(dirTag));

          expect(xfbmlParseSpy.callCount).toEqual(0);

          helloRendered();

          expect(xfbmlParseSpy.callCount).toEqual(1);
        });

        it('should call ezfb.XFBML.parse with wrapper element', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          helloRendered();
          
          expect(xfbmlParseSpy.mostRecentCall.args[0]).toEqual(element.children()[0]);
        });

        it('should evaluate onrender expression after rendered', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          helloRendered();

          expect(onrenderSpy.callCount).toEqual(0);

          makeItRendered();

          expect(onrenderSpy.callCount).toEqual(1);
        });

        it('should unwrap after rendered', function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();

          helloRendered();

          var classList = Array.prototype.slice.call(element.children()[0].classList);
          expect(classList.indexOf(WRAPPER_CLASS) >= 0).toBeTruthy();

          makeItRendered();

          expect(element.children()[0].tagName).toEqual(dirTag.toUpperCase());
        });
        
        it("should unwrap on $destroy even hasn't been rendered", function () {
          compileDir(getTemplate(dirTag));
          $scope.$apply();
          
          helloRendered();

          var classList = Array.prototype.slice.call(element.children()[0].classList);
          expect(classList.indexOf(WRAPPER_CLASS) >= 0).toBeTruthy();
          
          destroyDirectiveElement();
          
          expect(element.children().length).toEqual(0);
        });

        it('should call ezfb.XFBML.parse with interpolated attribute', function () {
          var attrs = {}, lastAttrs;
          attrs[attrNames[0]] = '{{v0}}';
          $scope.v0 = attrNames[0];

          compileDir(getTemplate(dirTag, attrs));

          expect(lastLoggedAttrs()).toBeFalsy();

          $scope.$apply();

          helloRendered();

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v0);
        });

        it('should call ezfb.XFBML.parse with delay-interpolated attribute', function () {
          var INTERPOLATE_0 = 150;

          var attrs = {}, lastAttrs;

          attrs[attrNames[0]] = '{{v0}}';

          $timeout(function () {
            $scope.v0 = makeValue(attrNames[0]);
          }, INTERPOLATE_0);

          compileDir(getTemplate(dirTag, attrs));
          $scope.$apply();

          helloRendered();

          // No attr interpolated
          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toBeFalsy();

          // attrNames[0] interpolated
          $timeout.flush(INTERPOLATE_0);

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v0);
        });

        it('should call ezfb.XFBML.parse with correct attributes when they are interpolated staggerly', function () {
          if (attrNames.length <= 1) {
            return;
          }

          var INTERPOLATE_0 = 50,
              INTERPOLATE_1 = 250;

          var attrs = {}, lastAttrs, callChildTagName;

          attrs[attrNames[0]] = '{{v0}}';
          attrs[attrNames[1]] = '{{v1}}';

          $timeout(function () {
            $scope.v0 = makeValue(attrNames[0]);
          }, INTERPOLATE_0);
          $timeout(function () {
            $scope.v1 = makeValue(attrNames[1]);
          }, INTERPOLATE_1);

          compileDir(getTemplate(dirTag, attrs));
          $scope.$apply();

          helloRendered();

          // No attr interpolated
          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toBeFalsy();
          expect(lastAttrs[attrNames[1]]).toBeFalsy();
          expect(xfbmlParseSpy.callCount).toEqual(1);
          // Make sure there's no nesting of wrapper element
          callChildTagName = xfbmlParseSpyExtra.mostRecentCall.args[0];
          expect(callChildTagName).toEqual(dirTag.toUpperCase());

          // attrNames[0] interpolated
          $timeout.flush(INTERPOLATE_0);  // at 50

          // First call rendered
          makeItRendered(1);  // at 100

          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v0);
          expect(lastAttrs[attrNames[1]]).toBeFalsy();
          expect(xfbmlParseSpy.callCount).toEqual(2);
          // Make sure there's no nesting of wrapper element
          callChildTagName = xfbmlParseSpyExtra.mostRecentCall.args[0];
          expect(callChildTagName).toEqual(dirTag.toUpperCase());

          // Second call rendered
          makeItRendered(2);  // at 200

          // attrNames[1] interpolated
          $timeout.flush(INTERPOLATE_1);  // at 250
          
          lastAttrs = lastLoggedAttrs();
          expect(lastAttrs[attrNames[0]]).toEqual($scope.v0);
          expect(lastAttrs[attrNames[1]]).toEqual($scope.v1);
          expect(xfbmlParseSpy.callCount).toEqual(3);
          // Make sure there's no nesting of wrapper element
          callChildTagName = xfbmlParseSpyExtra.mostRecentCall.args[0];
          expect(callChildTagName).toEqual(dirTag.toUpperCase());
        });
      });

    });
  });

});
