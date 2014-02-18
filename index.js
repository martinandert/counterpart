"use strict";

var global  = require("global");
var extend  = require("extend");
var isArray = require("util").isArray;
var isDate  = require("util").isDate;
var sprintf = require("sprintf").sprintf;
var emitter = require("events").EventEmitter;

var strftime = require("./strftime");

var registry = global.__g11n = global.__g11n || {
  locale: "en",
  translations: {},
  normalizedKeys: {}
};

function locale(value) {
  if (value) {
    var oldLocale = registry.locale;

    if (oldLocale != value) {
      registry.locale = value;
      emitter.emit("localechange", value, oldLocale);
    }

    return value;
  } else {
    return registry.locale;
  }
}

function registerTranslations(scope, locale, data) {
  var translations = {};

  translations[locale] = {};
  translations[locale][scope] = data;

  extend(true, registry.translations, translations);
}

function addLocaleChangeListener(callback) {
  emitter.addListener("localechange", callback);
}

function removeLocaleChangeListener(callback) {
  emitter.removeListener("localechange", callback);
}

function translate(key, options) {
  options = options || {};

  var locale = options.locale || registry.locale;
  delete options.locale;

  var scope = options.scope;
  delete options.scope;

  if (!isArray(key) && typeof key !== "string" || !key.length) {
    throw new Error("invalid argument: key");
  }

  var keys = normalizeKeys(locale, scope, key);

  var entry = keys.reduce(function(result, key) {
    if (typeof result === "object" && result !== null && key in result) {
      return result[key];
    } else {
      return null;
    }
  }, registry.translations);

  if (entry === null) {
    if (options.fallback) {
      entry = options.fallback;
    } else {
      entry = "missing translation: " + keys.join(".");
    }
  }

  entry = pluralize(entry, options.count);
  entry = interpolate(entry, options);

  return entry;
}

function localize(object, options) {
  options = options || {};

  var locale = options.locale || registry.locale;
  var format = options.format || "default";

  if (!isDate(object)) {
    throw new Error("invalid argument: object must be a date");
  }

  format = translate(["date", "formats", format], { locale: locale, scope: "globalization" });

  options = { locale: locale, scope: "globalization", format: format };

  format = format.replace(/%[aAbBpP]/, function(match) {
    switch (match) {
      case '%a': return translate("date.names.abbreviated_days",                          options)[object.getDay()];
      case '%A': return translate("date.names.days",                                      options)[object.getDay()];
      case '%b': return translate("date.names.abbreviated_months",                        options)[object.getMonth()];
      case '%B': return translate("date.names.months",                                    options)[object.getMonth()];
      case '%p': return translate("date.names." + (object.getHours() < 12 ? "am" : "pm"), options).toUpperCase();
      case '%P': return translate("date.names." + (object.getHours() < 12 ? "am" : "pm"), options).toLowerCase();
    }
  });

  return strftime(object, format);
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
      if (typeof key === "undefined" || key === null) {
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

function pluralize(entry, count) {
  if (typeof entry !== "object" || entry === null || typeof count !== "number") {
    return entry;
  }

  var key;

  if (count === 0 && "zero" in entry) {
    key = "zero";
  }

  key = key || (count === 1 ? "one" : "other");

  return entry[key];
}

function interpolate(entry, values) {
  if (typeof entry !== "string" || !Object.keys(values).length) {
    return entry;
  }

  return sprintf(entry, values);
}

function withLocale(locale, callback, context) {
  var currentLocale = registry.locale;
  registry.locale = locale;
  var result = context ? callback.call(context) : callback();
  registry.locale = currentLocale;
  return result;
}

registerTranslations("globalization", "en", {
  date: {
    names: require("date-names/de"),
    formats: {
      default: "%d.%m.%Y",
      long: "%e. %B %Y",
      short: "%e. %b"
    }
  }
});

var g11n = {
  locale: locale,
  translate: translate,
  localize: localize,
  withLocale: withLocale,
  registerTranslations: registerTranslations,
  onLocaleChange: addLocaleChangeListener,
  offLocaleChange: removeLocaleChangeListener,
  __registry: registry
};

module.exports = g11n;
