## v1.5.1

* Bump bower version

## v1.5.0

* Add [Send-to-Messenger Plugin](https://developers.facebook.com/docs/messenger-platform/plugin-reference#send_to_messenger) and [Message-Us Plugin](https://developers.facebook.com/docs/messenger-platform/plugin-reference#message_us)
* Change default FB JS SDK platform version to `v2.6`

## v1.4.4

* Fix intialization error when `xfbml: false` parameter is given ([#66](https://github.com/pc035860/angular-easyfb/issues/66))

## v1.4.3

* Fix the "childNodes error" caused by [Google Analytics Opt-out Add-on](https://chrome.google.com/webstore/detail/google-analytics-opt-out/fllaojicojecljbmefodhfapmkghcbnh) ([Ben Nadel's article](http://www.bennadel.com/blog/2892-typeerror-cannot-read-property-childnodes-of-undefined-in-angularjs.htm)) ([#65](https://github.com/pc035860/angular-easyfb/issues/65))


## v1.4.2

* Update `main` configuration of `package.json` ([#63](https://github.com/pc035860/angular-easyfb/issues/63))


## v1.4.1

* Update `main` configuration of `bower.json` ([#56](https://github.com/pc035860/angular-easyfb/issues/56))

## v1.4.0

* Add [Ad Preview Plugin](https://developers.facebook.com/docs/marketing-api/ad-preview-plugin/v2.4) support
* In order to support _Ad Preview Plugin_, default platform version is now `2.4`

## v1.3.2

* Support `100%` literal of `width` setting of [Comments](https://developers.facebook.com/docs/plugins/comments). ([#53](https://github.com/pc035860/angular-easyfb/issues/53))

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
