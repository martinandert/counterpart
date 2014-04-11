'use strict';

var global  = require('global');
var extend  = require('extend');
var isArray = require('util').isArray;
var isDate  = require('util').isDate;
var sprintf = require('sprintf').sprintf;
var events  = require('events');
var except  = require('except');

var strftime = require('./strftime');
var emitter  = new events.EventEmitter();

var translationScope = 'counterpart';

var registry = global.__counterpart = global.__counterpart || {
  locale: 'en',
  scope: null,
  translations: {},
  interpolations: {},
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

function registerInterpolations(data) {
  return extend(true, registry.interpolations, data);
}

function addLocaleChangeListener(callback) {
  emitter.addListener('localechange', callback);
}

function removeLocaleChangeListener(callback) {
  emitter.removeListener('localechange', callback);
}

function isString(val) {
  return typeof val === 'string' || Object.prototype.toString.call(val) === '[object String]';
}

function isFunction(val) {
  return typeof val === 'function' || Object.prototype.toString.call(val) === '[object Function]';
}

function isSymbol(key) {
  return isString(key) && key[0] === ':';
}

function resolve(locale, scope, object, subject, options) {
  options = options || {};

  if (options.resolve === false) {
    return subject;
  }

  var result;

  if (isSymbol(subject)) {
    result = translate(subject, extend({}, options, { locale: locale, scope: scope }));
  } else if (isFunction(subject)) {
    var dateOrTime;

    if (options.object) {
      dateOrTime = options.object;
      delete options.object;
    } else {
      dateOrTime = object;
    }

    result = resolve(locale, scope, object, subject(dateOrTime, options));
  } else {
    result = subject;
  }

  return /^missing translation:/.test(result) ? null : result;
}

function fallback(locale, scope, object, subject, options) {
  options = except(options, 'fallback');

  if (isArray(subject)) {
    for (var i = 0, ii = subject.length; i < ii; i++) {
      var result = resolve(locale, scope, object, subject[i], options);

      if (result) {
        return result;
      }
    }

    return null;
  } else {
    return resolve(locale, scope, object, subject, options);
  }
}

function translate(key, options) {
  if (!isArray(key) && !isString(key) || !key.length) {
    throw new Error('invalid argument: key');
  }

  if (isSymbol(key)) {
    key = key.substr(1);
  }

  options = extend(true, {}, options);

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

  if (entry === null && options.fallback) {
    entry = fallback(locale, scope, key, options.fallback, options);
  }

  if (entry === null) {
    entry = 'missing translation: ' + keys.join('.');
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

  options = extend(true, {}, options);

  var locale  = options.locale  || registry.locale;
  var scope   = options.scope   || translationScope;
  var type    = options.type    || 'datetime';
  var format  = options.format  || 'default';

  options = { locale: locale, scope: scope, interpolate: false };
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
  if (typeof entry !== 'string') {
    return entry;
  }

  return sprintf(entry, extend({}, registry.interpolations, values));
}

function withLocale(locale, callback, context) {
  var previous = registry.locale;
  registry.locale = locale;
  var result = callback.call(context);
  registry.locale = previous;
  return result;
}

function withScope(scope, callback, context) {
  var previous = registry.scope;
  registry.scope = scope;
  var result = callback.call(context);
  registry.scope = previous;
  return result;
}

registerTranslations('en', require('./locales/en'));

module.exports = translate;

module.exports.translate              = translate;
module.exports.setLocale              = setLocale;
module.exports.getLocale              = getLocale;
module.exports.localize               = localize;
module.exports.withLocale             = withLocale;
module.exports.withScope              = withScope;
module.exports.registerTranslations   = registerTranslations;
module.exports.registerInterpolations = registerInterpolations;
module.exports.onLocaleChange         = addLocaleChangeListener;
module.exports.offLocaleChange        = removeLocaleChangeListener;

if (process.env.NODE_ENV !== 'production') {
  module.exports.__registry = registry;
}
