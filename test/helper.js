/**
 * FB SDK Loading function for testing
 * We don't load real FB JS SDK in. We mock it with `mockSDKApi`
 * 
 * @param  {function} fbAsyncInit module initialization function
 */
function mockSDKLoader(ezfbAsyncInit) {
  ezfbAsyncInit();
}

/**
 * Decorate $window for mocking FB JS SDK, with given api path and method.
 * May accept string/array as api path. Also support object input.
 * 
 * @param  {mixed}    apiPath path to the api call
 * @param  {function} value   must be a function if presented
 */
function mockSDKApi(apiPath, value) {
  var __toString = Object.prototype.toString;

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

    if (typeof apiPath === 'string') {
      apiPath = [apiPath];
    }

    var mockFB = {
      // Still required to provide an `init` function
      init: angular.noop
    };
    if (__toString.call(apiPath) === '[object Object]' && !value) {
      // map mode
      angular.forEach(apiPath, function (v, p) {
        pathAssign(mockFB, p, v);
      });
    }
    else {
      // array mode
      angular.forEach(apiPath, function (p) {
        pathAssign(mockFB, p, value);
      });
    }

    $provide.decorator('$window', function ($delegate) {
      $delegate.FB = mockFB;
      return $delegate;
    });
  });
}


/**
 * Ref: https://github.com/angular/angular.js/blob/master/test/helpers/testabilityPatch.js
 */
function dealoc(obj) {
  var jqCache = angular.element.cache;
  if (obj) {
    if (angular.isElement(obj)) {
      cleanup(angular.element(obj));
    } else {
      for(var key in jqCache) {
        var value = jqCache[key];
        if (value.data && value.data.$scope == obj) {
          delete jqCache[key];
        }
      }
    }
  }

  function cleanup(element) {
    element.off().removeData();
    // Note:  We aren't using element.contents() here.  Under jQuery, element.contents() can fail
    // for IFRAME elements.  jQuery explicitly uses (element.contentDocument ||
    // element.contentWindow.document) and both properties are null for IFRAMES that aren't attached
    // to a document.
    var children = element[0].childNodes || [];
    for ( var i = 0; i < children.length; i++) {
      cleanup(angular.element(children[i]));
    }
  }
}
