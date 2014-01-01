# angular-easyfb

AngularJS + Facebook JavaScript SDK.

#### Features

* Full [Facebook JavaScript SDK](https://developers.facebook.com/docs/reference/javascript/) support
* Seemless FB SDK initialization(asynchronouslly load script and FB.init)
* All SDK API callbacks are automatically applied with AngularJS context
* Bundled a handy directive for parsing Facebook XFBML plugins dynamically
* Support both callback and $q promise

#### Demos

* [API demo](http://plnkr.co/edit/qclqht?p=preview)
* [XFBML demo](http://plnkr.co/edit/eak9VY?p=preview)
* [API demo (promise version)](http://plnkr.co/edit/UMUtFc?p=preview)

## Getting started

Include the angular-easyfb module with AngularJS script in your page.
```html
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min.js"></script>
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

#### $FB.init

In the case that you don't want to(or you can't) configure your `FB.init` parameters in configuration block, you may use `$FB.init` in run block. And any `$FB` API call will not run until `$FB.init` is called.

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

##### Convenient view integration (deprecated in AngularJS 1.2.0-rc3)

```js
/**
 * In controller
 */
$scope.me = $FB.getLoginStatus()
  .then(function () { 
    return $FB.api('/me');
  });
```

```html
<!-- In view template -->
<p>{{ me.name }}</p>
```

Output:
```html
<p>Robin Fan</p>
```

Watch the [promise version api demo](http://plnkr.co/edit/UMUtFc?p=preview) to see them in action.

### `ezfb-xfbml` directive

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

`onrender` expression will be evaluated every time the `ezfb-xfbml` target gets rendered(via FB event `xfbml.render`).

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

## Todo

* Test
* Better documentation?
