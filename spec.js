var assert    = require('assert');
var translate = require('./');

describe('translate', function() {
  it('is a function', function() {
    var type = Object.prototype.toString.call(translate);
    assert.equal(type, '[object Function]');
  });

  describe('when called', function() {
    describe('with a non-empty string or an array as first argument', function() {
      it('does not throw an invalid argument error', function() {
        assert.doesNotThrow(function() { translate('foo'); },   /invalid argument/);
        assert.doesNotThrow(function() { translate(['foo']); }, /invalid argument/);
      });

      describe('with the default locale present', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(translate('foo'), 'missing translation: en.foo');
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            translate.withScope('other', function() {
              assert.equal(translate('foo'), 'missing translation: en.other.foo');
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(translate('foo', { scope: 'other' }), 'missing translation: en.other.foo');
          });
        });
      });

      describe('with a different locale present', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            translate.withLocale('de', function() {
              assert.equal(translate('foo'), 'missing translation: de.foo');
            });
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            translate.withLocale('de', function() {
              translate.withScope('other', function() {
                assert.equal(translate('foo'), 'missing translation: de.other.foo');
              });
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            translate.withLocale('de', function() {
              assert.equal(translate('foo', { scope: 'other' }), 'missing translation: de.other.foo');
            });
          });
        });
      });

      describe('with a locale provided as option', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(translate('foo', { locale: 'de' }), 'missing translation: de.foo');
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            translate.withScope('other', function() {
              assert.equal(translate('foo', { locale: 'de' }), 'missing translation: de.other.foo');
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(translate('foo', { locale: 'de', scope: 'other' }), 'missing translation: de.other.foo');
          });
        });
      });

      describe('with a translation for the key present', function() {
        it('returns that translation', function() {
          translate.registerTranslations('en', { foo: { bar: { baz: { bam: 'boo' } } } });

          // strings
          assert.equal(translate('foo.bar.baz.bam'),                                'boo');
          assert.equal(translate('bar.baz.bam',         { scope: 'foo' }),          'boo');
          assert.equal(translate('baz.bam',             { scope: 'foo.bar' }),      'boo');
          assert.equal(translate('bam',                 { scope: 'foo.bar.baz' }),  'boo');

          // arrays
          assert.equal(translate(['foo', 'bar', 'baz', 'bam']),                                     'boo');
          assert.equal(translate(['bar', 'baz', 'bam'],         { scope: ['foo'] }),                'boo');
          assert.equal(translate(['baz', 'bam'],                { scope: ['foo', 'bar'] }),         'boo');
          assert.equal(translate(['bam'],                       { scope: ['foo', 'bar', 'baz'] }),  'boo');

          // mixed
          assert.equal(translate(['foo.bar', 'baz', 'bam']),                                 'boo');
          assert.equal(translate(['bar', 'baz.bam'],         { scope: 'foo' }),              'boo');
          assert.equal(translate(['baz', 'bam'],             { scope: 'foo.bar' }),          'boo');
          assert.equal(translate('bam',                      { scope: ['foo.bar', 'baz'] }), 'boo');

          // strange looking
          assert.equal(translate(['..foo.bar', 'baz', '', 'bam']),                                            'boo');
          assert.equal(translate(['bar', 'baz..bam.'],             { scope: '.foo' }),                        'boo');
          assert.equal(translate(['baz', null, 'bam'],             { scope: 'foo.bar.' }),                    'boo');
          assert.equal(translate('bam...',                         { scope: [null, 'foo..bar', '', 'baz'] }), 'boo');
        });

        describe('with a `count` provided as option', function() {
          it('correctly pluralizes the translated value', function() {
            translate.registerTranslations('en', { foo: { zero: 'no items', one: 'one item', other: '%(count)s items' } });

            assert.equal(translate('foo', { count: 0 }),   'no items');
            assert.equal(translate('foo', { count: 1 }),   'one item');
            assert.equal(translate('foo', { count: 2 }),   '2 items');
            assert.equal(translate('foo', { count: 42 }),  '42 items');
          });
        });

        describe('with other options provided', function() {
          it('interpolates these options into the translated value', function() {
            translate.registerTranslations('en', { foo: 'Hi %(name)s! See you %(when)s!' });
            assert.equal(translate('foo', { name: 'Paul', when: 'later', where: 'home' }), 'Hi Paul! See you later!');

            translate.registerTranslations('en', { foo: 'Hello %(users[0].name)s and %(users[1].name)s!' });
            assert.equal(translate('foo', { users: [{ name: 'Molly' }, { name: 'Polly' }] }), 'Hello Molly and Polly!');
          });
        });
      });

      describe('with a translation for a prefix of the key present', function() {
        it('returns the remaining translation part', function() {
          translate.registerTranslations('en', { foo: { bar: { baz: { zero: 'no items', one: 'one item', other: '%(count)s items' } } } });
          assert.deepEqual(translate('baz', { scope: ['foo', 'bar'] }), { zero: 'no items', one: 'one item', other: '%(count)s items' });
        });
      });

      describe('with an array-type translation for the key present', function() {
        it('returns the array that key points to', function() {
          translate.registerTranslations('en', { foo: { bar: { baz: [1, 'A', 0.42] } } });
          assert.deepEqual(translate(['bar', 'baz'], { scope: 'foo' }), [1, 'A', 0.42]);
        });
      });

      describe('with a function-type translation for the key present', function() {
        it('returns the array that key points to', function() {
          var myFunc = function() {};

          translate.registerTranslations('en', { foo: { bar: { baz: myFunc } } });
          assert.equal(translate(['bar', 'baz'], { scope: 'foo' }), myFunc);
        });
      });

      describe('without a translation for the key present', function() {
        it('returns a string "missing translation: %(locale).%(scope).%(key)"', function() {
          assert.deepEqual(translate('bar', { locale: 'unknown', scope: 'foo' }), 'missing translation: unknown.foo.bar');
        });

        describe('with a `fallback` provided as option', function() {
          it('returns the fallback', function() {
            assert.equal(translate('baz', { locale: 'foo', scope: 'bar', fallback: 'boom' }), 'boom');
            assert.equal(translate('baz', { locale: 'foo', scope: 'bar', fallback: 'Hello, %(name)s!', name: 'Martin' }), 'Hello, Martin!');

            assert.equal(translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 0 }), 'no items');
            assert.equal(translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 1 }), 'one item');
            assert.equal(translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 2 }), '2 items');

            assert.deepEqual(translate('baz', { locale: 'foo', scope: 'bar', fallback: { oh: 'yeah' } }), { oh: 'yeah' });
            assert.deepEqual(translate('baz', { locale: 'foo', scope: 'bar', fallback: [1, 'A', 0.42] }), [1, 'A', 0.42]);
          });
        });
      });
    });

    describe('without a valid key as first argument', function() {
      it('throws an invalid argument error', function() {
        var keys = [undefined, null, 42, {}, new Date(), /./, function() {}, [], ''];

        for (var i = 0, ii = keys.length; i < ii; i++) {
          assert.throws(function() { translate(keys[i]); }, /invalid argument/);
        }
      });
    });
  });

  describe('in development mode', function() {
    withNodeEnv('development', function() {
      it('exposes a `__registry` object (for testing/debugging purposes)', function() {
        assert.isObject(translate.__registry);
      });
    });
  });

  describe('in production mode', function() {
    withNodeEnv('production', function() {
      delete require.cache[__dirname + '/index.js'];
      var prod = require('./');

      it('does not expose a `__registry` accessor', function() {
        assert.isUndefined(prod.__registry);
      });
    });
  });

  describe('#getLocale', function() {
    it('is a function', function() {
      assert.isFunction(translate.getLocale);
    });

    it('returns the locale stored in the registry', function() {
      assert.equal(translate.getLocale(), translate.__registry.locale);
    });

    it('returns "en" by default', function() {
      assert.equal(translate.getLocale(), 'en');
    });
  });

  describe('#setLocale', function() {
    it('is a function', function() {
      assert.isFunction(translate.setLocale);
    });

    it('sets the locale stored in the registry', function() {
      translate.setLocale('foo');
      assert.equal(translate.__registry.locale, 'foo');
    });

    it('returns the previous locale that was stored in the registry', function() {
      var current  = translate.getLocale();
      var previous = translate.setLocale(current + 'x');
      assert.equal(previous, current);
    });

    describe('when called with a locale that differs from the current one', function() {
      it('emits a "localechange" event', function(done) {
        var handler = function() { done() };
        translate.onLocaleChange(handler);
        translate.setLocale(translate.getLocale() + 'x');
        translate.offLocaleChange(handler);
      });
    });

    describe('when called with the current locale', function() {
      it('does not emit a "localechange" event', function(done) {
        var handler = function() { done('event was emitted'); };
        translate.onLocaleChange(handler);
        translate.setLocale(translate.getLocale());
        translate.offLocaleChange(handler);
        setTimeout(done, 100);
      });
    });
  });

  describe('#withLocale', function() {
    it('is a function', function() {
      assert.isFunction(translate.withLocale);
    });

    it('temporarily changes the current locale within the callback', function() {
      var locale = translate.getLocale();

      translate.withLocale(locale + 'x', function() {
        assert.equal(translate.getLocale(), locale + 'x');
      });

      assert.equal(translate.getLocale(), locale);
    });

    it('allows a custom callback context to be set', function() {
      translate.withLocale('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('does not emit a "localechange" event', function(done) {
      var handler = function() { done('event was emitted'); };
      translate.onLocaleChange(handler);
      translate.withLocale(translate.getLocale() + 'x', function() {});
      translate.offLocaleChange(handler);
      setTimeout(done, 100);
    });

    it('returns the return value of the callback', function() {
      var result = translate.withLocale('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#withScope', function() {
    it('is a function', function() {
      assert.isFunction(translate.withScope);
    });

    it('temporarily changes the current scope within the callback', function() {
      var scope = translate.__registry.scope;

      translate.withScope(scope + 'x', function() {
        assert.equal(translate.__registry.scope, scope + 'x');
      });

      assert.equal(translate.__registry.scope, scope);
    });

    it('allows a custom callback context to be set', function() {
      translate.withScope('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('returns the return value of the callback', function() {
      var result = translate.withScope('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#onLocaleChange', function() {
    it('is a function', function() {
      assert.isFunction(translate.onLocaleChange);
    });

    it('is called when the locale changes', function(done) {
      var handler = function() { done(); };
      translate.onLocaleChange(handler);
      translate.setLocale(translate.getLocale() + 'x');
      translate.offLocaleChange(handler);
    });

    it('is not called when the locale does not change', function(done) {
      var handler = function() { done('function was called'); };
      translate.onLocaleChange(handler);
      translate.setLocale(translate.getLocale());
      translate.offLocaleChange(handler);
      setTimeout(done, 100);
    });

    describe('when called', function() {
      it('exposes both the new and old locale as arguments', function(done) {
        var oldLocale = translate.getLocale();
        var newLocale = oldLocale + 'x';

        var handler = function(locale, previousLocale) {
          assert.equal(locale, newLocale);
          assert.equal(previousLocale, oldLocale);
          done();
        };

        translate.onLocaleChange(handler);
        translate.setLocale(newLocale);
        translate.offLocaleChange(handler);
      });
    });
  });

  describe('#offLocaleChange', function() {
    it('is a function', function() {
      assert.isFunction(translate.offLocaleChange);
    });

    it('stops the emission of events to the handler', function(done) {
      var count = 0;

      var handler = function() { count++; };

      translate.onLocaleChange(handler);
      translate.setLocale(translate.getLocale() + 'x');
      translate.setLocale(translate.getLocale() + 'x');
      translate.offLocaleChange(handler);
      translate.setLocale(translate.getLocale() + 'x');

      setTimeout(function() {
        assert.equal(count, 2, 'handler was called although deactivated');
        done();
      }, 100);
    });
  });

  describe('#localize', function() {
    before(function() {
      translate.setLocale('en');
    });

    it('is a function', function() {
      assert.isFunction(translate.localize);
    });

    describe('when called without a date as first argument', function() {
      it('throws an invalid argument error', function() {
        assert.throws(function() {
          translate.localize('foo');
        }, /invalid argument/);
      });
    });

    describe('when called with a date as first argument', function() {
      var date = new Date('Thu Feb 20 2014 12:37:46 GMT+0100 (CET)');

      describe('without providing options as second argument', function() {
        it('returns the default localization for that date', function() {
          var result = translate.localize(date);
          assert.equal(result, 'Thu, 20 Feb 2014 12:37:46 +01:00');
        });
      });

      describe('providing a `format` key in the options', function() {
        describe('with format = "default"', function() {
          it('returns the default localization for that date', function() {
            var result = translate.localize(date, { format: 'default' });
            assert.equal(result, 'Thu, 20 Feb 2014 12:37:46 +01:00');
          });
        });

        describe('with format = "short"', function() {
          it('returns the short localization for that date', function() {
            var result = translate.localize(date, { format: 'short' });
            assert.equal(result, '20 Feb 12:37');
          });
        });

        describe('with format = "long"', function() {
          it('returns the long localization for that date', function() {
            var result = translate.localize(date, { format: 'long' });
            assert.equal(result, 'February 20, 2014 12:37');
          });
        });

        describe('with an unknown format', function() {
          it('returns a string containing "missing translation"', function() {
            var result = translate.localize(date, { format: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('providing a `type` key in the options', function() {
        describe('with type = "datetime"', function() {
          it('returns the default localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime' });
            assert.equal(result, 'Thu, 20 Feb 2014 12:37:46 +01:00');
          });
        });

        describe('with type = "date"', function() {
          it('returns the date localization for that date', function() {
            var result = translate.localize(date, { type: 'date' });
            assert.equal(result, '2014-02-20');
          });
        });

        describe('with type = "time"', function() {
          it('returns the time localization for that date', function() {
            var result = translate.localize(date, { type: 'time' });
            assert.equal(result, '12:37:46 +01:00');
          });
        });

        describe('with an unknown type', function() {
          it('returns a string containing "missing translation"', function() {
            var result = translate.localize(date, { type: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('providing both a `type` key and a `format` key in the options', function() {
        describe('with type = "datetime" and format = "default"', function() {
          it('returns the default localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime', format: 'default' });
            assert.equal(result, 'Thu, 20 Feb 2014 12:37:46 +01:00');
          });
        });

        describe('with type = "datetime" and format = "short"', function() {
          it('returns the short datetime localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime', format: 'short' });
            assert.equal(result, '20 Feb 12:37');
          });
        });

        describe('with type = "datetime" and format = "long"', function() {
          it('returns the long datetime localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime', format: 'long' });
            assert.equal(result, 'February 20, 2014 12:37');
          });
        });

        describe('with type = "time" and format = "default"', function() {
          it('returns the default time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'default' });
            assert.equal(result, '12:37:46 +01:00');
          });
        });

        describe('with type = "time" and format = "short"', function() {
          it('returns the short time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'short' });
            assert.equal(result, '12:37');
          });
        });

        describe('with type = "time" and format = "long"', function() {
          it('returns the long time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'long' });
            assert.equal(result, '12:37');
          });
        });

        describe('with type = "date" and format = "default"', function() {
          it('returns the default date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'default' });
            assert.equal(result, '2014-02-20');
          });
        });

        describe('with type = "date" and format = "short"', function() {
          it('returns the short date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'short' });
            assert.equal(result, 'Feb 20');
          });
        });

        describe('with type = "date" and format = "long"', function() {
          it('returns the long date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'long' });
            assert.equal(result, 'February 20, 2014');
          });
        });

        describe('with unknown type and unknown format', function() {
          it('returns a string containing "missing translation"', function() {
            var result = translate.localize(date, { type: '__invalid__', format: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });
    });
  });

  describe('#registerTranslations', function() {
    it('is a function', function() {
      assert.isFunction(translate.registerTranslations);
    });

    it('returns the passed arguments as an object structure', function() {
      var locale = 'foo';
      var data   = { bar: { baz: 'bingo' } };

      var actual = translate.registerTranslations(locale, data);

      var expected = { foo: { bar: { baz: 'bingo' }}};

      assert.deepEqual(actual, expected);
    });

    it('merges the passed arguments correctly into the registry', function() {
      translate.__registry.translations = {};

      translate.registerTranslations('foo', { bar: { baz: 'bingo' } });
      var expected = { foo: { bar: { baz: 'bingo' } } };
      assert.deepEqual(translate.__registry.translations, expected);

      translate.registerTranslations('foo', { bar: { bam: 'boo' } });
      var expected = { foo: { bar: { baz: 'bingo', bam: 'boo' } } };
      assert.deepEqual(translate.__registry.translations, expected);

      translate.registerTranslations('foo', { bing: { bong: 'beng' } });
      var expected = { foo: { bar: { baz: 'bingo', bam: 'boo' }, bing: { bong: 'beng' } } };
      assert.deepEqual(translate.__registry.translations, expected);

      // clean up
      translate.__registry.translations = {};
      translate.registerTranslations('en', require('./locales/en'));
    });
  });

  describe('explicitly checking the examples of the README', function() {
    it('passes all tests', function() {
      translate.registerTranslations('en', {
        damals: {
          about_x_hours_ago: {
            one:   'about one hour ago',
            other: 'about %(count)s hours ago'
          }
        }
      });

      assert.deepEqual(translate('damals'), { about_x_hours_ago: { one: 'about one hour ago', other: 'about %(count)s hours ago' } });

      assert.equal(translate('damals.about_x_hours_ago.one'),                    'about one hour ago');
      assert.equal(translate(['damals', 'about_x_hours_ago', 'one']),            'about one hour ago');
      assert.equal(translate(['damals', 'about_x_hours_ago.one']),               'about one hour ago');
      assert.equal(translate('about_x_hours_ago.one', { scope: 'damals' }),      'about one hour ago');
      assert.equal(translate('one', { scope: 'damals.about_x_hours_ago' }),      'about one hour ago');
      assert.equal(translate('one', { scope: ['damals', 'about_x_hours_ago'] }), 'about one hour ago');

      translate.registerTranslations('en', { foo: 'foo %(bar)s' });

      assert.equal(translate('foo', { bar: 'baz' }), 'foo baz');

      translate.registerTranslations('en', {
        x_items: {
          zero:  'No items.',
          one:   'One item.',
          other: '%(count)s items.'
        }
      });

      assert.equal(translate('x_items', { count: 0  }), 'No items.');
      assert.equal(translate('x_items', { count: 1  }), 'One item.');
      assert.equal(translate('x_items', { count: 42 }), '42 items.');

      assert.equal(translate('baz', { fallback: 'default' }), 'default');

      translate.registerTranslations('de', require('./locales/de'));
      translate.registerTranslations('de', JSON.parse('{"my_project": {"greeting": "Hallo, %(name)s!","x_items": {"one": "1 Stück", "other": "%(count)s Stücke"}}}'));

      assert.equal(translate.withLocale('de', function() { return translate('greeting', { scope: 'my_project', name: 'Martin' }); }), 'Hallo, Martin!');
      assert.equal(translate.withLocale('de', function() { return translate('x_items', { scope: 'my_project', count: 1 }); }), '1 Stück');
    });
  });
});





/* Helper Functions */

assert.isString = function(value, message) {
  assert.equal(Object.prototype.toString.call(value), '[object String]', message || (value + ' is not a string'));
};

assert.isFunction = function(value, message) {
  assert.equal(Object.prototype.toString.call(value), '[object Function]', message || (value + ' is not a function'));
};

assert.isObject = function(value, message) {
  assert.equal(Object.prototype.toString.call(value), '[object Object]', message || (value + ' is not an object'));
};

assert.isUndefined = function(value, message) {
  assert.equal(Object.prototype.toString.call(value), '[object Undefined]', message || (value + ' is not undefined'));
};

assert.matches = function(actual, expected, message) {
  if (!expected.test(actual)) {
    assert.fail(actual, expected, message, '!~');
  }
};

function exposesFunction(object, name) {
  it('exposes a `' + name + '` function', function() {
    assert.isFunction(object[name]);
  });
}

function withNodeEnv(env, callback) {
  var previous = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  var result = callback();
  process.env.NODE_ENV = previous;
  return result;
}
