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
