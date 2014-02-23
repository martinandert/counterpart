'use strict';

var global  = require('global');
var extend  = require('extend');
var isArray = require('util').isArray;
var isDate  = require('util').isDate;
var sprintf = require('sprintf').sprintf;
var events  = require('events');

var strftime = require('./strftime');
var emitter  = new events.EventEmitter();

var translationScope = 'globalization';

var registry = global.__g11n = global.__g11n || {
  locale: 'en',
  scope: null,
  translations: {},
  normalizedKeys: {}
};

function getLocale() {
  return registry.locale;
}

function setLocale(value) {
  var previous = registry.locale;

  if (previous != value) {
    registry.locale = value;
    emitter.emit('localechange', value, previous);
  }

  return previous;
}

function registerTranslations(locale, data) {
  var translations = {};
  translations[locale] = data;
  extend(true, registry.translations, translations);
  return translations;
}

function addLocaleChangeListener(callback) {
  emitter.addListener('localechange', callback);
}

function removeLocaleChangeListener(callback) {
  emitter.removeListener('localechange', callback);
}

function translate(key, options) {
  if (!isArray(key) && typeof key !== 'string' || !key.length) {
    throw new Error('invalid argument: key');
  }

  options = options || {};

  var locale = options.locale || registry.locale;
  delete options.locale;

  var scope = options.scope || registry.scope;
  delete options.scope;

  var keys = normalizeKeys(locale, scope, key);

  var entry = keys.reduce(function(result, key) {
    if (Object.prototype.toString.call(result) === '[object Object]' && Object.prototype.hasOwnProperty.call(result, key)) {
      return result[key];
    } else {
      return null;
    }
  }, registry.translations);

  if (entry === null) {
    if (options.fallback) {
      entry = options.fallback;
    } else {
      entry = 'missing translation: ' + keys.join('.');
    }
  }

  entry = pluralize(locale, entry, options.count);

  if (options.interpolate !== false) {
    entry = interpolate(entry, options);
  }

  return entry;
}

function localize(object, options) {
  if (!isDate(object)) {
    throw new Error('invalid argument: object must be a date');
  }

  options = options || {};

  var locale  = options.locale  || registry.locale;
  var scope   = options.scope   || translationScope;
  var type    = options.type    || 'datetime';
  var format  = options.format  || 'default';

  options = { locale: locale, scope: scope };
  format  = translate(['formats', type, format], extend(true, {}, options));

  return strftime(object, format, translate('names', options));
}

function normalizeKeys(locale, scope, key) {
  var keys = [];

  keys = keys.concat(normalizeKey(locale));
  keys = keys.concat(normalizeKey(scope));
  keys = keys.concat(normalizeKey(key));

  return keys;
}

function normalizeKey(key) {
  registry.normalizedKeys[key] = registry.normalizedKeys[key] || (function(key) {
    if (isArray(key)) {
      var normalizedKeyArray = key.map(function(k) { return normalizeKey(k); });

      return [].concat.apply([], normalizedKeyArray);
    } else {
      if (typeof key === 'undefined' || key === null) {
        return [];
      }

      var keys = key.split('.');

      for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i] === '') {
          keys.splice(i, 1);
        }
      }

      return keys;
    }
  })(key);

  return registry.normalizedKeys[key];
}

function pluralize(locale, entry, count) {
  if (typeof entry !== 'object' || entry === null || typeof count !== 'number') {
    return entry;
  }

  var pluralizeFunc = translate('pluralize', { locale: locale, scope: translationScope });

  if (Object.prototype.toString.call(pluralizeFunc) !== '[object Function]') {
    return pluralizeFunc;
  }

  return pluralizeFunc(entry, count);
}

function interpolate(entry, values) {
  if (typeof entry !== 'string' || !Object.keys(values).length) {
    return entry;
  }

  return sprintf(entry, values);
}

function withLocale(locale, callback, context) {
  var previous = registry.locale;
  registry.locale = locale;
  var result = context ? callback.call(context) : callback();
  registry.locale = previous;
  return result;
}

function withScope(scope, callback, context) {
  var previous = registry.scope;
  registry.scope = scope;
  var result = context ? callback.call(context) : callback();
  registry.scope = previous;
  return result;
}

registerTranslations('en', require('./locales/en'));

module.exports = translate;

module.exports.setLocale            = setLocale;
module.exports.getLocale            = getLocale;
module.exports.localize             = localize;
module.exports.withLocale           = withLocale;
module.exports.withScope            = withScope;
module.exports.registerTranslations = registerTranslations;
module.exports.onLocaleChange       = addLocaleChangeListener;
module.exports.offLocaleChange      = removeLocaleChangeListener;

if (process.env.NODE_ENV !== 'production') {
  module.exports.__registry = registry;
}
