# angular-easyfb v1.3.1 [![Build Status](https://travis-ci.org/pc035860/angular-easyfb.svg?branch=master)](https://travis-ci.org/pc035860/angular-easyfb)

AngularJS + Facebook JavaScript SDK.

**Since v1.1.0, `angular-easyfb` adds support for [Facebook Platform versioning](https://developers.facebook.com/docs/apps/changelog/).**

**Please check out [the new FB JS SDK setup doc](https://developers.facebook.com/docs/javascript/quickstart#loading) if you want to switch platform versions (module default is `v2.0`).**

#### Features

* Full [Facebook JavaScript SDK](https://developers.facebook.com/docs/reference/javascript/) support
* Seamless FB SDK initialization (asynchronously load script and FB.init)
* All SDK API callbacks are automatically applied with AngularJS context
* Support both callback and $q promise
* Provide built-in directive support for Facebook XFBML plugins

#### Demos

* [API demo](http://plnkr.co/edit/qclqht?p=preview)
* [API demo (promise version)](http://plnkr.co/edit/UMUtFc?p=preview)
* [Built-in social plugin directives demo](http://plnkr.co/edit/1c5cWB?p=preview)


## Getting started

Include the angular-easyfb module with AngularJS script in your page.
```html
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.13/angular.min.js"></script>
<script src="http://pc035860.github.io/angular-easyfb/angular-easyfb.min.js"></script>
```

Add `ezfb` to your app module's dependency.
```js
angular.module('myApp', ['ezfb']);
```

### Install with Bower

```sh
bower install angular-easyfb
```

## Usage

### `ezfb` service

#### Configuration

###### `getLocale` / `setLocale`

Configure the locale of the original FB script file. Default locale is `en_US`.

```js
angular.module('myApp')

.config(function (ezfbProvider) {
  ezfbProvider.setLocale('zh_TW');
});
```

###### `getInitParams` / `setInitParams`

Configure parameters for the original `FB.init` with `ezfbProvider.setInitParams`. (See also [`ezfb.init`](#fbinit))

```js
angular.module('myApp')

.config(function (ezfbProvider) {
  ezfbProvider.setInitParams({
    // This is my FB app id for plunker demo app
    appId: '386469651480295',

    // Module default is `v2.0`.
    // If you want to use Facebook platform `v2.3`, you'll have to add the following parameter.
    // https://developers.facebook.com/docs/javascript/reference/FB.init
    version: 'v2.3'
  });  
});
```

###### `getInitFunction` / `setInitFunction`

Customize the original `FB.init` function call with services injection support. The initialization parameters set in `setInitParams` are available via local injection `ezfbInitParams`.

```js
// Default init function
var _defaultInitFunction = ['$window', 'ezfbInitParams', function ($window, ezfbInitParams) {
  // Initialize the FB JS SDK
  $window.FB.init(ezfbInitParams);
}];
```

Customization example:
```js
angular.module('myApp')

.config(function (ezfbProvider) {
  var myInitFunction = function ($window, $rootScope, ezfbInitParams) {
    $window.FB.init({
      appId: '386469651480295'
    });
    // or
    // $window.FB.init(ezfbInitParams);

    $rootScope.$broadcast('FB.init');
  };

  ezfbProvider.setInitFunction(myInitFunction);
});
```

###### `getLoadSDKFunction / setLoadSDKFunction`

Customize Facebook JS SDK loading. The function also supports DI, with two more local injections:

- `ezfbLocale` - locale name
- `ezfbAsyncInit` - must called to finish the module initialization process

```js
// Default load SDK function
var _defaultLoadSDKFunction = [
         '$window', '$document', 'ezfbAsyncInit', 'ezfbLocale',
function ($window,   $document,   ezfbAsyncInit,   ezfbLocale) {
  // Load the SDK's source Asynchronously
  (function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/" + ezfbLocale + "/all.js";
    // js.src = "//connect.facebook.net/" + ezfbLocale + "/all/debug.js";  // debug
    ref.parentNode.insertBefore(js, ref);
  }($document[0]));

  $window.fbAsyncInit = ezfbAsyncInit;
}];
```

Customization example:
```js
angular.module('myApp')

.config(function (ezfbProvider) {
  // Feasible config if the FB JS SDK script is already loaded
  ezfbProvider.setLoadSDKFunction(function (ezfbAsyncInit) {
    ezfbAsyncInit();
  });
});
```


#### ezfb.init

In the case that you don't want to(or you can't) configure your `FB.init` parameters in configuration phase, you may use `ezfb.init` in run phase. And any `ezfb` API call will not run until `ezfb.init` is called.

```js
angular.module('myApp')

.run(function (ezfb) {
  ezfb.init({
    // This is my FB app id for plunker demo app
    appId: '386469651480295'
  });  
});
```


#### using ezfb

This is the original `FB` wrapping service, all `FB.*` APIs are available through `ezfb.*`.

No need to worry about FB script loading and Angular context applying at all.


```js
angular.module('myApp')

/**
 * Inject into controller
 */
.controller('MainCtrl', function (ezfb) {
  /**
   * Origin: FB.getLoginStatus
   */
  ezfb.getLoginStatus(function (res) {
    $scope.loginStatus = res;

    (more || angular.noop)();
  });

  /**
   * Origin: FB.api
   */
  ezfb.api('/me', function (res) {
    $scope.apiMe = res;
  });
});

```

Watch the [demo](http://plnkr.co/edit/qclqht?p=preview) to see it in action.

#### $q promise support

Support of $q promise create more possibility for `ezfb` service.

**Only the APIs with callback support returning promise.**

##### Combine multiple api calls
```js
$q.all([
  ezfb.api('/me'),
  ezfb.api('/me/likes')
])
.then(function (rsvList) {
  // result of api('/me')
  console.log(rsvList[0]);

  // result of api('/me/likes')
  console.log(rsvList[1]);
});
```

Watch the [promise version api demo](http://plnkr.co/edit/UMUtFc?p=preview) to see it in action.


### Social plugins support

[Facebook Social Plugins](https://developers.facebook.com/docs/plugins/) are now supported with built-in directives.

The code copied from the above link will automatically work in `angular-easyfb`-covered AngularJS apps.

Additionally, you can add an `onrender` parameter to the social plugin directive. Expressions in the `onrender` parameter will be evaluated every time the social plugin gets rendered.

```html
<div class="fb-like" onrender="fbLikeRendered()"
  data-href="https://developers.facebook.com/docs/plugins/" 
  data-layout="standard" 
  data-action="like" 
  data-show-faces="true" 
  data-share="true"></div>
```

[Demo (directives demostration)](http://plnkr.co/edit/1c5cWB?p=preview)

[Demo2 (interpolated attributes)](http://plnkr.co/edit/gFM1LV?p=preview)


## Changelog

See the changelog [here](https://github.com/pc035860/angular-easyfb/blob/master/CHANGELOG.md).


## Develop

`angular-easyfb` uses [Grunt](http://gruntjs.com/) to run all the development tasks.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

`angular-easyfb` also uses [Bower](http://bower.io/) to manage packages for tests.

### Setup

After cloning the git repo to your place, simply run following commands to install required packages.
```sh
npm install
bower install
```

### Build

Generate a minified js file after running all the tests.

```sh
grunt
```

### Running tests

Unit tests:
```sh
grunt test:unit
```

Test coverage:
```sh
grunt coverage
```
