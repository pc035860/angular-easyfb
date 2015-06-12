/*global angular*/
var pubsub = (function () {
  var jqLite = angular.element;
  var _core = jqLite('<span>');

  return {
    pub: function (name) {
      // console.log('pubsub:pub', name);
      _core.triggerHandler(name);
    },
    sub: function (name, handler) {
      // console.log('pubsub:sub', name, handler);
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
