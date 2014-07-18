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

      describe('with options provided', function() {
        it('does not mutate these options', function() {
          var options = { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } };
          translate('boing', options);
          assert.deepEqual(options, { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } });
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

        describe('with a `separator` provided as option', function() {
          it('correctly returns single array with key', function() {
            translate.registerTranslations('en', {
              'long.key.with.dots.in.name': 'Key with dots doesn\'t get split and returns correctly',
              another: {
                key: 'bar'
              },
              mixed: {
                'dots.and': {
                  separator: 'bingo'
                }
              }
            });

            assert.equal(translate('long.key.with.dots.in.name', { separator: '-' }), 'Key with dots doesn\'t get split and returns correctly');
            assert.equal(translate('long.key.with.dots.in.name.not-found', { separator: '-' }), 'missing translation: en-long.key.with.dots.in.name.not-found');
            assert.equal(translate('another-key', { separator: '-' }), 'bar');
            assert.equal(translate('mixed-dots.and-separator', { separator: '-' }), 'bingo');
          });

          it('correctly returns nested key when using `*` as seperator', function() {
            translate.registerTranslations('en', { "long": { key: { "with": { dots: { "in": { name: 'boo'  }  } } }}  });

            assert.equal(translate('long*key*with*dots*in*name', { separator: '*' }), 'boo');
          });
        });

        describe('with other options provided', function() {
          describe('by default', function() {
            it('interpolates these options into the translated value', function() {
              translate.registerTranslations('en', { foo: 'Hi %(name)s! See you %(when)s!' });
              assert.equal(translate('foo', { name: 'Paul', when: 'later', where: 'home' }), 'Hi Paul! See you later!');

              translate.registerTranslations('en', { foo: 'Hello %(users[0].name)s and %(users[1].name)s!' });
              assert.equal(translate('foo', { users: [{ name: 'Molly' }, { name: 'Polly' }] }), 'Hello Molly and Polly!');
            });

            it('interpolates the registered interpolations into the translated value', function() {
              var current = translate.__registry.interpolations;

              translate.registerTranslations('en', {'hello':'Hello from %(brand)s!'});
              translate.registerInterpolations({brand:'Z'});
              assert.equal(translate('hello'), 'Hello from Z!');

              translate.__registry.interpolations = current;

              translate.registerInterpolations({ app_name: 'My Cool App', question: 'How are you today?' });
              translate.registerTranslations('en', { greeting: 'Welcome to %(app_name)s, %(name)s! %(question)s' });

              assert.equal(translate('greeting', { name: 'Martin' }), 'Welcome to My Cool App, Martin! How are you today?');
              assert.equal(translate('greeting', { name: 'Martin', app_name: 'The Foo App' }), 'Welcome to The Foo App, Martin! How are you today?');

              translate.__registry.interpolations = current;
            });
          });

          describe('with the `interpolate` options set to `false`', function() {
            it('interpolates these options into the translated value', function() {
              translate.registerTranslations('en', { foo: 'Hi %(name)s! See you %(when)s!' });
              assert.equal(translate('foo', { interpolate: false, name: 'Paul', when: 'later', where: 'home' }), 'Hi %(name)s! See you %(when)s!');
            });
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

      describe('with a function-type fallback present', function() {
        it('returns the array that key points to', function() {
          var myFunc = function() { return 'Here I am!'; };
          var myFunc2 = function(x) { return 'Here ' + x + ' are!'; };
          var fallbacks = [':i_dont_exist_either', myFunc, 'Should not be returned'];

          assert.equal(translate('i_dont_exist', { fallback: myFunc }), 'Here I am!');
          assert.equal(translate('i_dont_exist', { fallback: myFunc2, object: 'you' }), 'Here you are!');
          assert.equal(translate('i_dont_exist', { fallback: myFunc2 }), 'Here i_dont_exist are!');
          assert.equal(translate('i_dont_exist', { fallback: fallbacks }), 'Here I am!');
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
            assert.deepEqual(translate('baz', { locale: 'foo', scope: 'bar', fallback: [1, 'A', 0.42] }), 1);
          });

          it('translates the fallback if given as "symbol" or array', function() {
            translate.registerTranslations('en', { foo: { bar: 'bar', baz: 'baz' } });

            assert.equal(translate('missing', { fallback: 'default' }), 'default');
            assert.equal(translate('missing', { fallback: ':foo.bar' }), 'bar');
            assert.equal(translate('missing', { fallback: ':bar', scope: 'foo' }), 'bar');
            assert.equal(translate('missing', { fallback: [':also_missing', ':foo.bar'] }), 'bar');
            assert.matches(translate('missing', { fallback: [':also_missing', ':foo.missed'] }), /missing translation/);
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

  describe('#translate', function() {
    it('maps to the exported function', function() {
      assert.strictEqual(translate.translate, translate);
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

    describe('when called more than 10 times', function() {
      it('does not let Node issue a warning about a possible memory leak', function() {
        var oldConsoleError = console.error;

        console.error = function(message) {
          if (/EventEmitter memory leak/.test(message)) {
            assert.fail(null, null, 'Node issues a warning about a possible memory leak', null);
          } else {
            oldConsoleError.apply(console, arguments);
          }
        };

        var handlers = [], handler, i;

        for (i = 0; i < 11; i++) {
          handler = function() {};
          translate.onLocaleChange(handler);
          handlers.push(handler);
        }

        for (i = 0; i < 11; i++) {
          translate.offLocaleChange(handlers[i]);
        }

        console.error = oldConsoleError
      });
    })
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

  describe('#getSeparator', function() {
    it('is a function', function() {
      assert.isFunction(translate.getSeparator);
    });

    it('returns the separator stored in the registry', function() {
      assert.equal(translate.getSeparator(), translate.__registry.separator);
    });

    it('returns "." by default', function() {
      assert.equal(translate.getSeparator(), '.');
    });
  });

  describe('#setSeparator', function() {
    it('is a function', function() {
      assert.isFunction(translate.setSeparator);
    });

    it('sets the separator stored in the registry', function() {
      var prev = translate.__registry.separator;

      translate.setSeparator('*');
      assert.equal(translate.__registry.separator, '*');

      translate.__registry.separator = prev;
    });

    it('returns the previous separator that was stored in the registry', function() {
      var current  = translate.getSeparator();
      var previous = translate.setSeparator(current + 'x');
      assert.equal(previous, current);
      translate.setSeparator(current);
    });
  });

  describe('#withSeparator', function() {
    it('is a function', function() {
      assert.isFunction(translate.withSeparator);
    });

    it('temporarily changes the current separator within the callback', function() {
      var separator = translate.getSeparator();

      translate.withSeparator(separator + 'x', function() {
        assert.equal(translate.getSeparator(), separator + 'x');
      });

      assert.equal(translate.getSeparator(), separator);
    });

    it('allows a custom callback context to be set', function() {
      translate.withSeparator('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('returns the return value of the callback', function() {
      var result = translate.withSeparator('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#localize', function() {
    before(function() {
      translate.setLocale('en');
    });

    it('is a function', function() {
      assert.isFunction(translate.localize);
    });

    it('does not mutate these options', function() {
      var options = { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } };
      translate.localize(new Date(), options);
      assert.deepEqual(options, { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } });
    });

    describe('when called without a date as first argument', function() {
      it('throws an invalid argument error', function() {
        assert.throws(function() {
          translate.localize('foo');
        }, /invalid argument/);
      });
    });

    describe('when called with a date as first argument', function() {
      var date = new Date('Thu Feb 6 2014 07:09:04 GMT+0100 (CET)');

      describe('without providing options as second argument', function() {
        it('returns the default localization for that date', function() {
          var result = translate.localize(date);
          assert.equal(result, 'Thu, 6 Feb 2014 07:09');
        });
      });

      describe('providing a `format` key in the options', function() {
        describe('with format = "default"', function() {
          it('returns the default localization for that date', function() {
            var result = translate.localize(date, { format: 'default' });
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with format = "short"', function() {
          it('returns the short localization for that date', function() {
            var result = translate.localize(date, { format: 'short' });
            assert.equal(result, '6 Feb 07:09');
          });
        });

        describe('with format = "long"', function() {
          it('returns the long localization for that date', function() {
            var result = translate.localize(date, { format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014 07:09:04 +01:00');
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
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with type = "date"', function() {
          it('returns the date localization for that date', function() {
            var result = translate.localize(date, { type: 'date' });
            assert.equal(result, 'Thu, 6 Feb 2014');
          });
        });

        describe('with type = "time"', function() {
          it('returns the time localization for that date', function() {
            var result = translate.localize(date, { type: 'time' });
            assert.equal(result, '07:09');
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
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with type = "datetime" and format = "short"', function() {
          it('returns the short datetime localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime', format: 'short' });
            assert.equal(result, '6 Feb 07:09');
          });
        });

        describe('with type = "datetime" and format = "long"', function() {
          it('returns the long datetime localization for that date', function() {
            var result = translate.localize(date, { type: 'datetime', format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014 07:09:04 +01:00');
          });
        });

        describe('with type = "time" and format = "default"', function() {
          it('returns the default time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'default' });
            assert.equal(result, '07:09');
          });
        });

        describe('with type = "time" and format = "short"', function() {
          it('returns the short time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'short' });
            assert.equal(result, '07:09');
          });
        });

        describe('with type = "time" and format = "long"', function() {
          it('returns the long time localization for that date', function() {
            var result = translate.localize(date, { type: 'time', format: 'long' });
            assert.equal(result, '07:09:04 +01:00');
          });
        });

        describe('with type = "date" and format = "default"', function() {
          it('returns the default date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'default' });
            assert.equal(result, 'Thu, 6 Feb 2014');
          });
        });

        describe('with type = "date" and format = "short"', function() {
          it('returns the short date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'short' });
            assert.equal(result, 'Feb 6');
          });
        });

        describe('with type = "date" and format = "long"', function() {
          it('returns the long date localization for that date', function() {
            var result = translate.localize(date, { type: 'date', format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014');
          });
        });

        describe('with unknown type and unknown format', function() {
          it('returns a string containing "missing translation"', function() {
            var result = translate.localize(date, { type: '__invalid__', format: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('with locale set to "de"', function() {
        var prev;

        before(function() { translate.registerTranslations('de', require('./locales/de')); prev = translate.setLocale('de'); });
        after(function() { translate.setLocale(prev); });

        describe('without providing options as second argument', function() {
          it('returns the default localization for that date', function() {
            var result = translate.localize(date);
            assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
          });
        });

        describe('providing a `format` key in the options', function() {
          describe('with format = "default"', function() {
            it('returns the default localization for that date', function() {
              var result = translate.localize(date, { format: 'default' });
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with format = "short"', function() {
            it('returns the short localization for that date', function() {
              var result = translate.localize(date, { format: 'short' });
              assert.equal(result, '06.02.14 07:09');
            });
          });

          describe('with format = "long"', function() {
            it('returns the long localization for that date', function() {
              var result = translate.localize(date, { format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014, 07:09:04 +01:00');
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
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with type = "date"', function() {
            it('returns the date localization for that date', function() {
              var result = translate.localize(date, { type: 'date' });
              assert.equal(result, 'Do, 6. Feb 2014');
            });
          });

          describe('with type = "time"', function() {
            it('returns the time localization for that date', function() {
              var result = translate.localize(date, { type: 'time' });
              assert.equal(result, '07:09 Uhr');
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
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with type = "datetime" and format = "short"', function() {
            it('returns the short datetime localization for that date', function() {
              var result = translate.localize(date, { type: 'datetime', format: 'short' });
              assert.equal(result, '06.02.14 07:09');
            });
          });

          describe('with type = "datetime" and format = "long"', function() {
            it('returns the long datetime localization for that date', function() {
              var result = translate.localize(date, { type: 'datetime', format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014, 07:09:04 +01:00');
            });
          });

          describe('with type = "time" and format = "default"', function() {
            it('returns the default time localization for that date', function() {
              var result = translate.localize(date, { type: 'time', format: 'default' });
              assert.equal(result, '07:09 Uhr');
            });
          });

          describe('with type = "time" and format = "short"', function() {
            it('returns the short time localization for that date', function() {
              var result = translate.localize(date, { type: 'time', format: 'short' });
              assert.equal(result, '07:09');
            });
          });

          describe('with type = "time" and format = "long"', function() {
            it('returns the long time localization for that date', function() {
              var result = translate.localize(date, { type: 'time', format: 'long' });
              assert.equal(result, '07:09:04 +01:00');
            });
          });

          describe('with type = "date" and format = "default"', function() {
            it('returns the default date localization for that date', function() {
              var result = translate.localize(date, { type: 'date', format: 'default' });
              assert.equal(result, 'Do, 6. Feb 2014');
            });
          });

          describe('with type = "date" and format = "short"', function() {
            it('returns the short date localization for that date', function() {
              var result = translate.localize(date, { type: 'date', format: 'short' });
              assert.equal(result, '06.02.14');
            });
          });

          describe('with type = "date" and format = "long"', function() {
            it('returns the long date localization for that date', function() {
              var result = translate.localize(date, { type: 'date', format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014');
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

  describe('#registerInterpolations', function() {
    it('is a function', function() {
      assert.isFunction(translate.registerInterpolations);
    });

    it('merges the passed arguments correctly into the registry', function() {
      translate.__registry.interpolations = {};

      translate.registerInterpolations({ foo: 'yes', bar: 'no' });
      assert.deepEqual(translate.__registry.interpolations, { foo: 'yes', bar: 'no' });

      translate.registerInterpolations({ baz: 'hey' });
      assert.deepEqual(translate.__registry.interpolations, { foo: 'yes', bar: 'no', baz: 'hey' });

      // clean up
      translate.__registry.interpolations = {};
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

      assert.equal(translate('damals.about_x_hours_ago.one', { separator: '*' }), 'missing translation: en*damals.about_x_hours_ago.one');

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

      var date = new Date('Fri Feb 21 2014 13:46:24 GMT+0100 (CET)');

      assert.equal(translate.localize(date)                       , 'Fri, 21 Feb 2014 13:46');
      assert.equal(translate.localize(date, { format: 'short' })  , '21 Feb 13:46');
      assert.equal(translate.localize(date, { format: 'long' })   , 'Friday, February 21st, 2014 13:46:24 +01:00');

      assert.equal(translate.localize(date, { type: 'date' })                  , 'Fri, 21 Feb 2014');
      assert.equal(translate.localize(date, { type: 'date', format: 'short' }) , 'Feb 21');
      assert.equal(translate.localize(date, { type: 'date', format: 'long' })  , 'Friday, February 21st, 2014');

      assert.equal(translate.localize(date, { type: 'time' })                  , '13:46');
      assert.equal(translate.localize(date, { type: 'time', format: 'short' }) , '13:46');
      assert.equal(translate.localize(date, { type: 'time', format: 'long' })  , '13:46:24 +01:00');

      assert.equal(translate.localize(date, { locale: 'de' })  , 'Fr, 21. Feb 2014, 13:46 Uhr');

      translate.registerTranslations('en', {
        my_namespace: {
          greeting: 'Welcome to %(app_name)s, %(visitor)s!'
        }
      });

      translate.registerInterpolations({ app_name: 'My Cool App' });

      assert.equal(translate('my_namespace.greeting', { visitor: 'Martin' }), 'Welcome to My Cool App, Martin!');
      assert.equal(translate('my_namespace.greeting', { visitor: 'Martin', app_name: 'The Foo App' }), 'Welcome to The Foo App, Martin!');
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
