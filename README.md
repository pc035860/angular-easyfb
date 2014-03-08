# angular-easyfb

AngularJS + Facebook JavaScript SDK.

#### Features

* Full [Facebook JavaScript SDK](https://developers.facebook.com/docs/reference/javascript/) support
* Seemless FB SDK initialization(asynchronouslly load script and FB.init)
* All SDK API callbacks are automatically applied with AngularJS context
* Bundled a handy directive for parsing Facebook XFBML plugins dynamically (deprecated since v0.3.0)
* Support both callback and $q promise
* Provide built-in directive support for Facebook XFBML plugins (v0.3.0)

#### Demos

* [API demo](http://plnkr.co/edit/qclqht?p=preview)
* [XFBML demo](http://plnkr.co/edit/eak9VY?p=preview)
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

### `$FB` service

#### Configuration

###### `getLocale` / `setLocale`

Configure the locale of the original FB script file. Default locale is `en_US`.

```js
angular.module('myApp')

.config(function ($FBProvider) {
  $FBProvider.setLocale('zh_TW');
});
```

###### `getInitParams` / `setInitParams`

Configure paramters for the original `FB.init` with `$FBProvider.setInitParams`. (See also [`$FB.init`](#fbinit))

```js
angular.module('myApp')

.config(function ($FBProvider) {
  $FBProvider.setInitParams({
    // This is my FB app id for plunker demo app
    appId: '386469651480295'
  });  
});
```

###### `getInitFunction` / `setInitFunction`

Customize the original `FB.init` function call with services injection support. The initialization parameters set in `setInitParams` are available via local injection `$fbInitParams`.

```js
// Default init function
var _defaultInitFunction = ['$window', '$fbInitParams', function ($window, $fbInitParams) {
  // Initialize the FB JS SDK
  $window.FB.init($fbInitParams);
}];
```

Customization example:
```js
angular.module('myApp')

.config(function ($FBProvider) {
  var myInitFunction = function ($window, $rootScope, $fbInitParams) {
    $window.FB.init({
      appId: '386469651480295'
    });
    // or
    // $window.FB.init($fbInitParams);

    $rootScope.$broadcast('$onFBInit');
  };

  $FBProvider.setInitFunction(myInitFunction);
});
```

###### `getLoadSDKFunction / setLoadSDKFunction`

Customize Facebook JS SDK loading. The function also supports DI, with two more local injections:

- `$fbLocale` - locale name
- `$fbAsyncInit` - must called to finish the module initialization process

```js
// Defaul load SDK function
var _defaultLoadSDKFunction = [
         '$window', '$document', '$fbAsyncInit', '$fbLocale',
function ($window,   $document,   $fbAsyncInit,   $fbLocale) {
  // Load the SDK's source Asynchronously
  (function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/" + $fbLocale + "/all.js";
    // js.src = "//connect.facebook.net/" + $fbLocale + "/all/debug.js";  // debug
    ref.parentNode.insertBefore(js, ref);
  }($document[0]));

  $window.fbAsyncInit = $fbAsyncInit;
}];
```

Customization example:
```js
angular.module('myApp')

.config(function ($FBProvider) {
  // Feasible config if the FB JS SDK script is already loaded
  $FBProvider.setLoadSDKFunction(function ($fbAsyncInit) {
    $fbAsyncInit();
  });
});
```


#### $FB.init

In the case that you don't want to(or you can't) configure your `FB.init` parameters in configuration phase, you may use `$FB.init` in run phase. And any `$FB` API call will not run until `$FB.init` is called.

```js
angular.module('myApp')

.run(function ($FB) {
  $FB.init({
    // This is my FB app id for plunker demo app
    appId: '386469651480295'
  });  
});
```


#### using $FB

This is the original `FB` wrapping service, all `FB.*` APIs are available through `$FB.*`.

No need to worry about FB script loading and Angular context applying at all.


```js
angular.module('myApp')

/**
 * Inject into controller
 */
.controller('MainCtrl', function ($FB) {
  /**
   * Origin: FB.getLoginStatus
   */
  $FB.getLoginStatus(function (res) {
    $scope.loginStatus = res;

    (more || angular.noop)();
  });

  /**
   * Origin: FB.api
   */
  $FB.api('/me', function (res) {
    $scope.apiMe = res;
  });
});

```

Watch the [demo](http://plnkr.co/edit/qclqht?p=preview) to see it in action.

#### $q promise support

Support of $q promise create more possibility for `$FB` service.

**Only the APIs with callback support returning promise.**

##### Combine multiple api calls
```js
$q.all([
  $FB.api('/me'),
  $FB.api('/me/likes')
])
.then(function (rsvList) {
  // result of api('/me')
  console.log(rsvList[0]);

  // result of api('/me/likes')
  console.log(rsvList[1]);
});
```

Watch the [promise version api demo](http://plnkr.co/edit/UMUtFc?p=preview) to see it in action.


### Social plugins support (v0.3.0)

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

Demo: http://plnkr.co/edit/1c5cWB?p=preview


### `ezfb-xfbml` directive (deprecated since v0.3.0)

```
<ANY ezfb-xfbml[="{expression}"]
     [onrender="{expression}"]
   
   {XFBML content}
</ANY>
```

Simply put XFBML contents inside the directive.

```html
<!-- an embedded post plugin -->
<div class="tab" ng-if="currentTab == 'Embedded Posts'" ezfb-xfbml>
  <div class="fb-post" 
       data-href="https://www.facebook.com/FacebookDevelopers/posts/10151471074398553"></div>
</div>
```

#### `ezfb-xfbml` paramater

The directive itself may work as an reload trigger, it will reload directive contents when `ezfb-xfbml` evaluates as `true`.

Moreover, it'll try to reset `ezfb-xfbml` value to `false` after reload triggered(if the value is fed through an scope variable rather than an expression).

```html
<!-- button for triggering reload -->
<button class="btn btn-primary" ng-click="model.reloadWidget['Comments'] = true">Trigger reload</button>

<!-- a comments plugin -->
<div class="tab" ng-if="currentTab == 'Comments'" ezfb-xfbml="model.reloadWidget['Comments']">
  <div class="fb-comments" 
       data-href="{{ pageUrl }}" 
       data-width="{{ widgetWidth }}"></div>
</div>
```

#### `onrender` parameter

`onrender` expression will be evaluated every time the `ezfb-xfbml` target gets rendered.

```html
<div class="tab" 
     ezfb-xfbml="model.reloadWidget['Like Button']" 
     onrender="model.renderedWidget = 'Like Button'">
     
     <div class="fb-like" 
          data-href="{{ pageUrl }}" 
          data-width="{{ widgetWidth }}" 
          data-show-faces="true" 
          data-send="false"></div>
</div>
```

Watch the [demo](http://plnkr.co/edit/eak9VY?p=preview) to see them in action.

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
grunt converage
```
