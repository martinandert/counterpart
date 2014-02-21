# globalization

A translation and localization library for Node.js and the browser. The project is inspired by Ruby's famous [I18n gem](https://github.com/svenfuchs/i18n).

Features:

-  translation and localization
-  interpolation of values to translations (sprintf-style with named arguments)
-  pluralization (CLDR compatible)


## Installation

Install via npm:

```bash
% npm install globalization
```


## Usage

Require the globalization module to get a reference to the `translate` function:

```js
var translate = require('globalization');
```

This function expects a `key` and `options` as arguments and translates, pluralizes and interpolates a given key using a given locale, scope, and fallback, as well as interpolation values.

### Lookup

Translation data is organized as a nested object using the top-level key as namespace. *E.g.*, the [damals package](https://github.com/martinandert/damals) ships with the translation:

```js
{ 
  damals: { 
    about_x_hours_ago: {
      one:   'about one hour ago',
      other: 'about %(count)s hours ago'
    }
    /* ... */
  }
}
```

Translations can be looked up at any level of this object using the `key` argument and the `scope` option. *E.g.*, in the following example, a whole translation object is returned:

```js
translate('damals')  // => { about_x_hours_ago: { one: '...', other: '...' } }
```

The `key` argument can be either a single key, a dot-separated key or an array of keys or dot-separated keys. So these examples will all look up the same translation:

```js
translate('damals.about_x_hours_ago.one')          // => 'about one hour ago'
translate(['damals', 'about_x_hours_ago', 'one'])  // => 'about one hour ago'
translate(['damals', 'about_x_hours_ago.one'])     // => 'about one hour ago'
```

The `scope` option can be either a single key, a dot-separated key or an array of keys or dot-separated keys. Keys and scopes can be combined freely. Again, these examples will all look up the same translation:

```js
translate('damals.about_x_hours_ago.one')
translate('about_x_hours_ago.one', { scope: 'damals' })
translate('one', { scope: 'damals.about_x_hours_ago' })
translate('one', { scope: ['damals', 'about_x_hours_ago'] })
```

### Interpolation

Translations can contain interpolation variables which will be replaced by values passed to the function as part of the options object, with the keys matching the interpolation variable names.

*E.g.*, with a translation `{ foo: 'foo %(bar)s' }` the option value for the key `bar` will be interpolated into the translation:

```js
translate('foo', { bar: 'baz' }) // => 'foo baz'
```

### Pluralization

Translation data can contain pluralized translations. Pluralized translations are provided as a sub-object to the translation key containing the keys `one`, `other` and optionally `zero`:

```js
{
  x_items: {
    zero:  'No items.',
    one:   'One item.',
    other: '%(count)s items.'
  }
}
```

Then use the `count` option to select a specific pluralization:

```js
translate('x_items', { count: 0  })  // => 'No items.'
translate('x_items', { count: 1  })  // => 'One item.'
translate('x_items', { count: 42 })  // => '42 items.'
```

Note that this library currently only supports an algorithm for English-like pluralization rules (see [locales/en.js](locales/en.js). You can easily add  pluralization algorithms for other locales by [adding custom translation data](#adding-translation-data) to the "globalization" namespace. Pull requests are welcome.

As seen above, the `count` option can be used both for pluralization and interpolation.

### Fallbacks

If for a key no translation could be found, `translate` returns an error string of the form "translation missing: %(key)s". 

To mitigate this, provide the `fallback` option with an alternate text. The following example returns the translation for "baz" or "default" if no translation was found:

```js
translate('baz', { fallback: 'default' })
```

You can use interpolations with the `fallback` option, too.

### Locales

The default locale is English ("en"). To change this, call the `setLocale` function:

```js
translate.getLocale()     // => 'en'
translate.setLocale('de') // => 'en' (returns the previous locale)
translate.getLocale()     // => 'de'
```

Note that it is advised to call `setLocale` only once at the start of the application or when the user changes her language preference. A library author integrating the globalization package in a library should not call `setLocale` at all and leave that to the developer incorporating the library.

In case of a locale change, the `setLocale` function emits an event you can listen to:

```js
translate.onLocaleChange(function(newLocale, oldLocale) {
  // do important stuff here...
}, [callbackContext]);
```

Use `translate.offLocaleChange(myHandler)` to stop listening to locale changes.

You can temporarily change the current locale with the `withLocale` function:

```js
translate.withLocale(otherLocale, myCallback, [myCallbackContext]);
```

`withLocale` does not emit the locale change event. The function returns the return value of the supplied callback argument.

Another way to temporarily change the current locale is by using the `locale` option on `translate` itself:

```js
translate('foo', { locale: 'de' });
```

There is also a `withScope` function that works exactly the same as `withLocale`.

### Adding Translation Data

You can use the `registerTranslation` function to deep-merge data for a specific locale into the global translation object:

```js
translate.registerTranslations('de', require('globalization/locales/de'));
translate.registerTranslations('de', require('./locales/de.json'));
```

The data object to merge should contain a namespace (e.g. the name of your app/library) as top-level key. The namespace ensures that there are no merging conflicts between different projects. Example (./locales/de.json):

```json
{
  "my_project": {
    "greeting": "Hallo, %(name)s!",
    "x_items": {
      "one":   "1 Stück",
      "other": "%(count)s Stücke"
    } 
  }
}
```

The translations are instantly made available:

```js
translate('greeting', { scope: 'my_project', name: 'Martin' })  // => 'Hallo, Martin!'
```

Note that library authors should preload their translations only for the default ("en") locale, since tools like [webpack](http://webpack.github.io/) or [browserify](http://browserify.org/) will recursively bundle up all the required modules of a library into a single file. This will include even unneeded translations and so unnecessarily bloat the bundle. 

Instead, you as a library author should advise end-users to on-demand-load translations for other locales provided by your package:

```js
// Execute this code to load the 'de' translations:
require('globalization').registerTranslations('de', require('my_package/locales/de'));
```

### Localization

The globalization package comes with support for localizing JavaScript Date objects. The `localize` function expects a date and options as arguments. The following example demonstrates the possible options.

```js
var date = new Date('Fri Feb 21 2014 13:46:24 GMT+0100 (CET)');

translate.localize(date)                       // => 'Fri, 21 Feb 2014 13:46'
translate.localize(date, { format: 'short' })  // => '21 Feb 13:46'
translate.localize(date, { format: 'long' })   // => 'Friday, February 21st, 2014 13:46:24 +01:00'

translate.localize(date, { type: 'date' })                  // => 'Fri, 21 Feb 2014'
translate.localize(date, { type: 'date', format: 'short' }) // => 'Feb 21'
translate.localize(date, { type: 'date', format: 'long' })  // => 'Friday, February 21st, 2014'

translate.localize(date, { type: 'time' })                  // => '13:46'
translate.localize(date, { type: 'time', format: 'short' }) // => '13:46'
translate.localize(date, { type: 'time', format: 'long' })  // => '13:46:24 +01:00'

translate.registerTranslations('de', require('globalization/locales/de'));
translate.localize(date, { locale: 'de' }))  // => 'Fr, 21.02.2014, 13:46'
```

Sure, you can add your custom localizations by adding to or overwriting the "globalization" namespace. See [locales/en.js](locales/en.js) and [locales/de.js](locales/de.js) for example localization files.


## Contributing

Here's a quick guide:

1. Fork the repo and `make install`.

2. Run the tests. We only take pull requests with passing tests, and it's great to know that you have a clean slate: `make test`.

3. Add a test for your change. Only refactoring and documentation changes require no new tests. If you are adding functionality or are fixing a bug, we need a test!

4. Make the test pass.

5. Push to your fork and submit a pull request.


## License

Released under The MIT License.
