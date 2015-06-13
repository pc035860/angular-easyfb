## v1.3.1

* Refine social plugin directives parsing process for plugins with adaptive width (`fb-page` for now) ([#45](https://github.com/pc035860/angular-easyfb/pull/45))
* Add [Embedded Video Player](https://developers.facebook.com/docs/plugins/embedded-video-player/) support

## v1.3.0

* Change default `FB.init` version from `v1.0` to `v2.0`
* Add [Page plugin](https://developers.facebook.com/docs/plugins/page-plugin/) support ([#45](https://github.com/pc035860/angular-easyfb/pull/45))

## v1.2.1

* Add API support: `Canvas.getPageInfo` ([#40](https://github.com/pc035860/angular-easyfb/pull/40))

## v1.2.0

* Add [App Events for Canvas](https://developers.facebook.com/docs/canvas/appevents) support. ([#39](https://github.com/pc035860/angular-easyfb/issues/39))

## v1.1.0

* Upgrade Facebook JS SDK loading function to support [Facebook Platform versioning](https://developers.facebook.com/docs/apps/changelog/)
  * Default version is `v1.0`

## v1.0.1

* Add [fb:comments-count](https://developers.facebook.com/docs/plugins/comments/#faqcount) directive

## v1.0.0

* Rename service `$FB` to `ezfb`
* Local DIs get renamed.
  * `$fbInitParams` -> `ezfbInitParams`
  * `$fbAsyncInit` -> `ezfbAsyncInit`
  * `$fbLocale` -> `ezfbLocale`

## v0.3.1

* Social plugin directivs now support interpolated attributes

## v0.3.0

* `setLoadSDKFunction()` in configuration phase for sdk loading customization
* Support [Facebook Social Plugins](https://developers.facebook.com/docs/plugins) with built-in directives
* `ezfb-xfbml` directive is now deprecated
* Add unit tests for `$FB` and all directives

## v0.2.3

* Implement `$FB.getAuthResponse()` which maps to [`FB.getAuthResponse()`](https://developers.facebook.com/docs/reference/javascript/FB.getAuthResponse/)

## v0.2.2

* `setInitFunction()` in configuration phase for initialization customization
* Make `$FB.Event.unsubscribe` unsubscribes events properly

## v0.2.1

* `setLocale()` in configuration phase
* Configure `FB.init` parameters with `$FB.init` in run block

## v0.2.0

* AngularJS $q promise support
* Fix minified code run-time error

## v0.1.0

First release!
