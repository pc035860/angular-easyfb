'use strict';

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
