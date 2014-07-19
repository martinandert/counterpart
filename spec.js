var assert      = require('assert');
var Counterpart = require('./');
var Instance = Counterpart.Instance;

describe('translate', function() {
  var instance;

  beforeEach(function() {
    instance = new Instance();
  });

  it('is a function', function() {
    var type = Object.prototype.toString.call(instance.translate);
    assert.equal(type, '[object Function]');
  });

  it('is backward-compatible', function() {
    var translate = require('./');
    assert.equal(Object.prototype.toString.call(translate), '[object Function]');
    assert.equal(Object.prototype.toString.call(translate.translate), '[object Function]');
  });

  describe('when called', function() {
    describe('with a non-empty string or an array as first argument', function() {
      it('does not throw an invalid argument error', function() {
        assert.doesNotThrow(function() { instance.translate('foo'); },   /invalid argument/);
        assert.doesNotThrow(function() { instance.translate(['foo']); }, /invalid argument/);
      });

      describe('with the default locale present', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(instance.translate('foo'), 'missing translation: en.foo');
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            instance.withScope('other', function() {
              assert.equal(instance.translate('foo'), 'missing translation: en.other.foo');
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(instance.translate('foo', { scope: 'other' }), 'missing translation: en.other.foo');
          });
        });
      });

      describe('with a different locale present', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            instance.withLocale('de', function() {
              assert.equal(instance.translate('foo'), 'missing translation: de.foo');
            });
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            instance.withLocale('de', function() {
              instance.withScope('other', function() {
                assert.equal(instance.translate('foo'), 'missing translation: de.other.foo');
              });
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            instance.withLocale('de', function() {
              assert.equal(instance.translate('foo', { scope: 'other' }), 'missing translation: de.other.foo');
            });
          });
        });
      });

      describe('with a locale provided as option', function() {
        describe('without a current scope or provided scope option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(instance.translate('foo', { locale: 'de' }), 'missing translation: de.foo');
          });
        });

        describe('with a current scope present', function() {
          it('generates the correct normalized keys', function() {
            instance.withScope('other', function() {
              assert.equal(instance.translate('foo', { locale: 'de' }), 'missing translation: de.other.foo');
            });
          });
        });

        describe('with a scope provided as option', function() {
          it('generates the correct normalized keys', function() {
            assert.equal(instance.translate('foo', { locale: 'de', scope: 'other' }), 'missing translation: de.other.foo');
          });
        });
      });

      describe('with options provided', function() {
        it('does not mutate these options', function() {
          var options = { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } };
          instance.translate('boing', options);
          assert.deepEqual(options, { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } });
        });
      });

      describe('with a translation for the key present', function() {
        it('returns that translation', function() {
          instance.registerTranslations('en', { foo: { bar: { baz: { bam: 'boo' } } } });

          // strings
          assert.equal(instance.translate('foo.bar.baz.bam'),                                'boo');
          assert.equal(instance.translate('bar.baz.bam',         { scope: 'foo' }),          'boo');
          assert.equal(instance.translate('baz.bam',             { scope: 'foo.bar' }),      'boo');
          assert.equal(instance.translate('bam',                 { scope: 'foo.bar.baz' }),  'boo');

          // arrays
          assert.equal(instance.translate(['foo', 'bar', 'baz', 'bam']),                                     'boo');
          assert.equal(instance.translate(['bar', 'baz', 'bam'],         { scope: ['foo'] }),                'boo');
          assert.equal(instance.translate(['baz', 'bam'],                { scope: ['foo', 'bar'] }),         'boo');
          assert.equal(instance.translate(['bam'],                       { scope: ['foo', 'bar', 'baz'] }),  'boo');

          // mixed
          assert.equal(instance.translate(['foo.bar', 'baz', 'bam']),                                 'boo');
          assert.equal(instance.translate(['bar', 'baz.bam'],         { scope: 'foo' }),              'boo');
          assert.equal(instance.translate(['baz', 'bam'],             { scope: 'foo.bar' }),          'boo');
          assert.equal(instance.translate('bam',                      { scope: ['foo.bar', 'baz'] }), 'boo');

          // strange looking
          assert.equal(instance.translate(['..foo.bar', 'baz', '', 'bam']),                                            'boo');
          assert.equal(instance.translate(['bar', 'baz..bam.'],             { scope: '.foo' }),                        'boo');
          assert.equal(instance.translate(['baz', null, 'bam'],             { scope: 'foo.bar.' }),                    'boo');
          assert.equal(instance.translate('bam...',                         { scope: [null, 'foo..bar', '', 'baz'] }), 'boo');
        });

        describe('with a `count` provided as option', function() {
          it('correctly pluralizes the translated value', function() {
            instance.registerTranslations('en', { foo: { zero: 'no items', one: 'one item', other: '%(count)s items' } });

            assert.equal(instance.translate('foo', { count: 0 }),   'no items');
            assert.equal(instance.translate('foo', { count: 1 }),   'one item');
            assert.equal(instance.translate('foo', { count: 2 }),   '2 items');
            assert.equal(instance.translate('foo', { count: 42 }),  '42 items');
          });
        });

        describe('with a `separator` provided as option', function() {
          it('correctly returns single array with key', function() {
            instance.registerTranslations('en', {
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

            assert.equal(instance.translate('long.key.with.dots.in.name', { separator: '-' }), 'Key with dots doesn\'t get split and returns correctly');
            assert.equal(instance.translate('long.key.with.dots.in.name.not-found', { separator: '-' }), 'missing translation: en-long.key.with.dots.in.name.not-found');
            assert.equal(instance.translate('another-key', { separator: '-' }), 'bar');
            assert.equal(instance.translate('mixed-dots.and-separator', { separator: '-' }), 'bingo');
          });

          it('correctly returns nested key when using `*` as seperator', function() {
            instance.registerTranslations('en', { "long": { key: { "with": { dots: { "in": { name: 'boo'  }  } } }}  });

            assert.equal(instance.translate('long*key*with*dots*in*name', { separator: '*' }), 'boo');
          });
        });

        describe('with other options provided', function() {
          describe('by default', function() {
            it('interpolates these options into the translated value', function() {
              instance.registerTranslations('en', { foo: 'Hi %(name)s! See you %(when)s!' });
              assert.equal(instance.translate('foo', { name: 'Paul', when: 'later', where: 'home' }), 'Hi Paul! See you later!');

              instance.registerTranslations('en', { foo: 'Hello %(users[0].name)s and %(users[1].name)s!' });
              assert.equal(instance.translate('foo', { users: [{ name: 'Molly' }, { name: 'Polly' }] }), 'Hello Molly and Polly!');
            });

            it('interpolates the registered interpolations into the translated value', function() {
              var current = instance._registry.interpolations;

              instance.registerTranslations('en', {'hello':'Hello from %(brand)s!'});
              instance.registerInterpolations({brand:'Z'});
              assert.equal(instance.translate('hello'), 'Hello from Z!');

              instance._registry.interpolations = current;

              instance.registerInterpolations({ app_name: 'My Cool App', question: 'How are you today?' });
              instance.registerTranslations('en', { greeting: 'Welcome to %(app_name)s, %(name)s! %(question)s' });

              assert.equal(instance.translate('greeting', { name: 'Martin' }), 'Welcome to My Cool App, Martin! How are you today?');
              assert.equal(instance.translate('greeting', { name: 'Martin', app_name: 'The Foo App' }), 'Welcome to The Foo App, Martin! How are you today?');

              instance._registry.interpolations = current;
            });
          });

          describe('with the `interpolate` options set to `false`', function() {
            it('interpolates these options into the translated value', function() {
              instance.registerTranslations('en', { foo: 'Hi %(name)s! See you %(when)s!' });
              assert.equal(instance.translate('foo', { interpolate: false, name: 'Paul', when: 'later', where: 'home' }), 'Hi %(name)s! See you %(when)s!');
            });
          });
        });
      });

      describe('with a translation for a prefix of the key present', function() {
        it('returns the remaining translation part', function() {
          instance.registerTranslations('en', { foo: { bar: { baz: { zero: 'no items', one: 'one item', other: '%(count)s items' } } } });
          assert.deepEqual(instance.translate('baz', { scope: ['foo', 'bar'] }), { zero: 'no items', one: 'one item', other: '%(count)s items' });
        });
      });

      describe('with an array-type translation for the key present', function() {
        it('returns the array that key points to', function() {
          instance.registerTranslations('en', { foo: { bar: { baz: [1, 'A', 0.42] } } });
          assert.deepEqual(instance.translate(['bar', 'baz'], { scope: 'foo' }), [1, 'A', 0.42]);
        });
      });

      describe('with a function-type translation for the key present', function() {
        it('returns the array that key points to', function() {
          var myFunc = function() {};

          instance.registerTranslations('en', { foo: { bar: { baz: myFunc } } });
          assert.equal(instance.translate(['bar', 'baz'], { scope: 'foo' }), myFunc);
        });
      });

      describe('with a function-type fallback present', function() {
        it('returns the array that key points to', function() {
          var myFunc = function() { return 'Here I am!'; };
          var myFunc2 = function(x) { return 'Here ' + x + ' are!'; };
          var fallbacks = [':i_dont_exist_either', myFunc, 'Should not be returned'];

          assert.equal(instance.translate('i_dont_exist', { fallback: myFunc }), 'Here I am!');
          assert.equal(instance.translate('i_dont_exist', { fallback: myFunc2, object: 'you' }), 'Here you are!');
          assert.equal(instance.translate('i_dont_exist', { fallback: myFunc2 }), 'Here i_dont_exist are!');
          assert.equal(instance.translate('i_dont_exist', { fallback: fallbacks }), 'Here I am!');
        });
      });

      describe('without a translation for the key present', function() {
        it('returns a string "missing translation: %(locale).%(scope).%(key)"', function() {
          assert.deepEqual(instance.translate('bar', { locale: 'unknown', scope: 'foo' }), 'missing translation: unknown.foo.bar');
        });

        describe('with a `fallback` provided as option', function() {
          it('returns the fallback', function() {
            assert.equal(instance.translate('baz', { locale: 'foo', scope: 'bar', fallback: 'boom' }), 'boom');
            assert.equal(instance.translate('baz', { locale: 'foo', scope: 'bar', fallback: 'Hello, %(name)s!', name: 'Martin' }), 'Hello, Martin!');

            assert.equal(instance.translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 0 }), 'no items');
            assert.equal(instance.translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 1 }), 'one item');
            assert.equal(instance.translate('bazz', { locale: 'en', scope: 'bar', fallback: { zero: 'no items', one: 'one item', other: '%(count)s items' }, count: 2 }), '2 items');

            assert.deepEqual(instance.translate('baz', { locale: 'foo', scope: 'bar', fallback: { oh: 'yeah' } }), { oh: 'yeah' });
            assert.deepEqual(instance.translate('baz', { locale: 'foo', scope: 'bar', fallback: [1, 'A', 0.42] }), 1);
          });

          it('translates the fallback if given as "symbol" or array', function() {
            instance.registerTranslations('en', { foo: { bar: 'bar', baz: 'baz' } });

            assert.equal(instance.translate('missing', { fallback: 'default' }), 'default');
            assert.equal(instance.translate('missing', { fallback: ':foo.bar' }), 'bar');
            assert.equal(instance.translate('missing', { fallback: ':bar', scope: 'foo' }), 'bar');
            assert.equal(instance.translate('missing', { fallback: [':also_missing', ':foo.bar'] }), 'bar');
            assert.matches(instance.translate('missing', { fallback: [':also_missing', ':foo.missed'] }), /missing translation/);
          });
        });
      });
    });

    describe('without a valid key as first argument', function() {
      it('throws an invalid argument error', function() {
        var keys = [undefined, null, 42, {}, new Date(), /./, function() {}, [], ''];

        for (var i = 0, ii = keys.length; i < ii; i++) {
          assert.throws(function() { instance.translate(keys[i]); }, /invalid argument/);
        }
      });
    });
  });

  describe('#translate', function() {
    it('is a function', function() {
      assert.isFunction(instance.translate);
    });
  });

  describe('#getLocale', function() {
    it('is a function', function() {
      assert.isFunction(instance.getLocale);
    });

    it('returns the locale stored in the registry', function() {
      assert.equal(instance.getLocale(), instance._registry.locale);
    });

    it('returns "en" by default', function() {
      assert.equal(instance.getLocale(), 'en');
    });
  });

  describe('#setLocale', function() {
    it('is a function', function() {
      assert.isFunction(instance.setLocale);
    });

    it('sets the locale stored in the registry', function() {
      instance.setLocale('foo');
      assert.equal(instance._registry.locale, 'foo');
    });

    it('returns the previous locale that was stored in the registry', function() {
      var current  = instance.getLocale();
      var previous = instance.setLocale(current + 'x');
      assert.equal(previous, current);
    });

    describe('when called with a locale that differs from the current one', function() {
      it('emits a "localechange" event', function(done) {
        var handler = function() { done() };
        instance.onLocaleChange(handler);
        instance.setLocale(instance.getLocale() + 'x');
        instance.offLocaleChange(handler);
      });
    });

    describe('when called with the current locale', function() {
      it('does not emit a "localechange" event', function(done) {
        var handler = function() { done('event was emitted'); };
        instance.onLocaleChange(handler);
        instance.setLocale(instance.getLocale());
        instance.offLocaleChange(handler);
        setTimeout(done, 100);
      });
    });
  });

  describe('#withLocale', function() {
    it('is a function', function() {
      assert.isFunction(instance.withLocale);
    });

    it('temporarily changes the current locale within the callback', function() {
      var locale = instance.getLocale();

      instance.withLocale(locale + 'x', function() {
        assert.equal(instance.getLocale(), locale + 'x');
      });

      assert.equal(instance.getLocale(), locale);
    });

    it('allows a custom callback context to be set', function() {
      instance.withLocale('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('does not emit a "localechange" event', function(done) {
      var handler = function() { done('event was emitted'); };
      instance.onLocaleChange(handler);
      instance.withLocale(instance.getLocale() + 'x', function() {});
      instance.offLocaleChange(handler);
      setTimeout(done, 100);
    });

    it('returns the return value of the callback', function() {
      var result = instance.withLocale('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#withScope', function() {
    it('is a function', function() {
      assert.isFunction(instance.withScope);
    });

    it('temporarily changes the current scope within the callback', function() {
      var scope = instance._registry.scope;

      instance.withScope(scope + 'x', function() {
        assert.equal(instance._registry.scope, scope + 'x');
      });

      assert.equal(instance._registry.scope, scope);
    });

    it('allows a custom callback context to be set', function() {
      instance.withScope('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('returns the return value of the callback', function() {
      var result = instance.withScope('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#onLocaleChange', function() {
    it('is a function', function() {
      assert.isFunction(instance.onLocaleChange);
    });

    it('is called when the locale changes', function(done) {
      var handler = function() { done(); };
      instance.onLocaleChange(handler);
      instance.setLocale(instance.getLocale() + 'x');
      instance.offLocaleChange(handler);
    });

    it('is not called when the locale does not change', function(done) {
      var handler = function() { done('function was called'); };
      instance.onLocaleChange(handler);
      instance.setLocale(instance.getLocale());
      instance.offLocaleChange(handler);
      setTimeout(done, 100);
    });

    describe('when called', function() {
      it('exposes both the new and old locale as arguments', function(done) {
        var oldLocale = instance.getLocale();
        var newLocale = oldLocale + 'x';

        var handler = function(locale, previousLocale) {
          assert.equal(locale, newLocale);
          assert.equal(previousLocale, oldLocale);
          done();
        };

        instance.onLocaleChange(handler);
        instance.setLocale(newLocale);
        instance.offLocaleChange(handler);
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
          instance.onLocaleChange(handler);
          handlers.push(handler);
        }

        for (i = 0; i < 11; i++) {
          instance.offLocaleChange(handlers[i]);
        }

        console.error = oldConsoleError
      });
    })
  });

  describe('#offLocaleChange', function() {
    it('is a function', function() {
      assert.isFunction(instance.offLocaleChange);
    });

    it('stops the emission of events to the handler', function(done) {
      var count = 0;

      var handler = function() { count++; };

      instance.onLocaleChange(handler);
      instance.setLocale(instance.getLocale() + 'x');
      instance.setLocale(instance.getLocale() + 'x');
      instance.offLocaleChange(handler);
      instance.setLocale(instance.getLocale() + 'x');

      setTimeout(function() {
        assert.equal(count, 2, 'handler was called although deactivated');
        done();
      }, 100);
    });
  });

  describe('#getSeparator', function() {
    it('is a function', function() {
      assert.isFunction(instance.getSeparator);
    });

    it('returns the separator stored in the registry', function() {
      assert.equal(instance.getSeparator(), instance._registry.separator);
    });

    it('returns "." by default', function() {
      assert.equal(instance.getSeparator(), '.');
    });
  });

  describe('#setSeparator', function() {
    it('is a function', function() {
      assert.isFunction(instance.setSeparator);
    });

    it('sets the separator stored in the registry', function() {
      var prev = instance._registry.separator;

      instance.setSeparator('*');
      assert.equal(instance._registry.separator, '*');

      instance._registry.separator = prev;
    });

    it('returns the previous separator that was stored in the registry', function() {
      var current  = instance.getSeparator();
      var previous = instance.setSeparator(current + 'x');
      assert.equal(previous, current);
      instance.setSeparator(current);
    });
  });

  describe('#withSeparator', function() {
    it('is a function', function() {
      assert.isFunction(instance.withSeparator);
    });

    it('temporarily changes the current separator within the callback', function() {
      var separator = instance.getSeparator();

      instance.withSeparator(separator + 'x', function() {
        assert.equal(instance.getSeparator(), separator + 'x');
      });

      assert.equal(instance.getSeparator(), separator);
    });

    it('allows a custom callback context to be set', function() {
      instance.withSeparator('foo', function() {
        assert.equal(this.bar, 'baz');
      }, { bar: 'baz' })
    });

    it('returns the return value of the callback', function() {
      var result = instance.withSeparator('foo', function() { return 'bar'; });
      assert.equal(result, 'bar');
    });
  });

  describe('#localize', function() {
    before(function() {
      instance.setLocale('en');
    });

    it('is a function', function() {
      assert.isFunction(instance.localize);
    });

    it('does not mutate these options', function() {
      var options = { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } };
      instance.localize(new Date(), options);
      assert.deepEqual(options, { locale: 'en', scope: ['foo1', 'foo2'], count: 3, bar: { baz: 'bum' } });
    });

    describe('when called without a date as first argument', function() {
      it('throws an invalid argument error', function() {
        assert.throws(function() {
          instance.localize('foo');
        }, /invalid argument/);
      });
    });

    describe('when called with a date as first argument', function() {
      var date = new Date('Thu Feb 6 2014 07:09:04 GMT+0100 (CET)');

      describe('without providing options as second argument', function() {
        it('returns the default localization for that date', function() {
          var result = instance.localize(date);
          assert.equal(result, 'Thu, 6 Feb 2014 07:09');
        });
      });

      describe('providing a `format` key in the options', function() {
        describe('with format = "default"', function() {
          it('returns the default localization for that date', function() {
            var result = instance.localize(date, { format: 'default' });
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with format = "short"', function() {
          it('returns the short localization for that date', function() {
            var result = instance.localize(date, { format: 'short' });
            assert.equal(result, '6 Feb 07:09');
          });
        });

        describe('with format = "long"', function() {
          it('returns the long localization for that date', function() {
            var result = instance.localize(date, { format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014 07:09:04 +01:00');
          });
        });

        describe('with an unknown format', function() {
          it('returns a string containing "missing translation"', function() {
            var result = instance.localize(date, { format: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('providing a `type` key in the options', function() {
        describe('with type = "datetime"', function() {
          it('returns the default localization for that date', function() {
            var result = instance.localize(date, { type: 'datetime' });
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with type = "date"', function() {
          it('returns the date localization for that date', function() {
            var result = instance.localize(date, { type: 'date' });
            assert.equal(result, 'Thu, 6 Feb 2014');
          });
        });

        describe('with type = "time"', function() {
          it('returns the time localization for that date', function() {
            var result = instance.localize(date, { type: 'time' });
            assert.equal(result, '07:09');
          });
        });

        describe('with an unknown type', function() {
          it('returns a string containing "missing translation"', function() {
            var result = instance.localize(date, { type: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('providing both a `type` key and a `format` key in the options', function() {
        describe('with type = "datetime" and format = "default"', function() {
          it('returns the default localization for that date', function() {
            var result = instance.localize(date, { type: 'datetime', format: 'default' });
            assert.equal(result, 'Thu, 6 Feb 2014 07:09');
          });
        });

        describe('with type = "datetime" and format = "short"', function() {
          it('returns the short datetime localization for that date', function() {
            var result = instance.localize(date, { type: 'datetime', format: 'short' });
            assert.equal(result, '6 Feb 07:09');
          });
        });

        describe('with type = "datetime" and format = "long"', function() {
          it('returns the long datetime localization for that date', function() {
            var result = instance.localize(date, { type: 'datetime', format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014 07:09:04 +01:00');
          });
        });

        describe('with type = "time" and format = "default"', function() {
          it('returns the default time localization for that date', function() {
            var result = instance.localize(date, { type: 'time', format: 'default' });
            assert.equal(result, '07:09');
          });
        });

        describe('with type = "time" and format = "short"', function() {
          it('returns the short time localization for that date', function() {
            var result = instance.localize(date, { type: 'time', format: 'short' });
            assert.equal(result, '07:09');
          });
        });

        describe('with type = "time" and format = "long"', function() {
          it('returns the long time localization for that date', function() {
            var result = instance.localize(date, { type: 'time', format: 'long' });
            assert.equal(result, '07:09:04 +01:00');
          });
        });

        describe('with type = "date" and format = "default"', function() {
          it('returns the default date localization for that date', function() {
            var result = instance.localize(date, { type: 'date', format: 'default' });
            assert.equal(result, 'Thu, 6 Feb 2014');
          });
        });

        describe('with type = "date" and format = "short"', function() {
          it('returns the short date localization for that date', function() {
            var result = instance.localize(date, { type: 'date', format: 'short' });
            assert.equal(result, 'Feb 6');
          });
        });

        describe('with type = "date" and format = "long"', function() {
          it('returns the long date localization for that date', function() {
            var result = instance.localize(date, { type: 'date', format: 'long' });
            assert.equal(result, 'Thursday, February 6th, 2014');
          });
        });

        describe('with unknown type and unknown format', function() {
          it('returns a string containing "missing translation"', function() {
            var result = instance.localize(date, { type: '__invalid__', format: '__invalid__' });
            assert.matches(result, /missing translation/);
          });
        });
      });

      describe('with locale set to "de"', function() {
        var prev;

        before(function() { instance.registerTranslations('de', require('./locales/de')); prev = instance.setLocale('de'); });
        after(function() { instance.setLocale(prev); });

        describe('without providing options as second argument', function() {
          it('returns the default localization for that date', function() {
            var result = instance.localize(date);
            assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
          });
        });

        describe('providing a `format` key in the options', function() {
          describe('with format = "default"', function() {
            it('returns the default localization for that date', function() {
              var result = instance.localize(date, { format: 'default' });
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with format = "short"', function() {
            it('returns the short localization for that date', function() {
              var result = instance.localize(date, { format: 'short' });
              assert.equal(result, '06.02.14 07:09');
            });
          });

          describe('with format = "long"', function() {
            it('returns the long localization for that date', function() {
              var result = instance.localize(date, { format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014, 07:09:04 +01:00');
            });
          });

          describe('with an unknown format', function() {
            it('returns a string containing "missing translation"', function() {
              var result = instance.localize(date, { format: '__invalid__' });
              assert.matches(result, /missing translation/);
            });
          });
        });

        describe('providing a `type` key in the options', function() {
          describe('with type = "datetime"', function() {
            it('returns the default localization for that date', function() {
              var result = instance.localize(date, { type: 'datetime' });
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with type = "date"', function() {
            it('returns the date localization for that date', function() {
              var result = instance.localize(date, { type: 'date' });
              assert.equal(result, 'Do, 6. Feb 2014');
            });
          });

          describe('with type = "time"', function() {
            it('returns the time localization for that date', function() {
              var result = instance.localize(date, { type: 'time' });
              assert.equal(result, '07:09 Uhr');
            });
          });

          describe('with an unknown type', function() {
            it('returns a string containing "missing translation"', function() {
              var result = instance.localize(date, { type: '__invalid__' });
              assert.matches(result, /missing translation/);
            });
          });
        });

        describe('providing both a `type` key and a `format` key in the options', function() {
          describe('with type = "datetime" and format = "default"', function() {
            it('returns the default localization for that date', function() {
              var result = instance.localize(date, { type: 'datetime', format: 'default' });
              assert.equal(result, 'Do, 6. Feb 2014, 07:09 Uhr');
            });
          });

          describe('with type = "datetime" and format = "short"', function() {
            it('returns the short datetime localization for that date', function() {
              var result = instance.localize(date, { type: 'datetime', format: 'short' });
              assert.equal(result, '06.02.14 07:09');
            });
          });

          describe('with type = "datetime" and format = "long"', function() {
            it('returns the long datetime localization for that date', function() {
              var result = instance.localize(date, { type: 'datetime', format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014, 07:09:04 +01:00');
            });
          });

          describe('with type = "time" and format = "default"', function() {
            it('returns the default time localization for that date', function() {
              var result = instance.localize(date, { type: 'time', format: 'default' });
              assert.equal(result, '07:09 Uhr');
            });
          });

          describe('with type = "time" and format = "short"', function() {
            it('returns the short time localization for that date', function() {
              var result = instance.localize(date, { type: 'time', format: 'short' });
              assert.equal(result, '07:09');
            });
          });

          describe('with type = "time" and format = "long"', function() {
            it('returns the long time localization for that date', function() {
              var result = instance.localize(date, { type: 'time', format: 'long' });
              assert.equal(result, '07:09:04 +01:00');
            });
          });

          describe('with type = "date" and format = "default"', function() {
            it('returns the default date localization for that date', function() {
              var result = instance.localize(date, { type: 'date', format: 'default' });
              assert.equal(result, 'Do, 6. Feb 2014');
            });
          });

          describe('with type = "date" and format = "short"', function() {
            it('returns the short date localization for that date', function() {
              var result = instance.localize(date, { type: 'date', format: 'short' });
              assert.equal(result, '06.02.14');
            });
          });

          describe('with type = "date" and format = "long"', function() {
            it('returns the long date localization for that date', function() {
              var result = instance.localize(date, { type: 'date', format: 'long' });
              assert.equal(result, 'Donnerstag, 6. Februar 2014');
            });
          });

          describe('with unknown type and unknown format', function() {
            it('returns a string containing "missing translation"', function() {
              var result = instance.localize(date, { type: '__invalid__', format: '__invalid__' });
              assert.matches(result, /missing translation/);
            });
          });
        });
      });
    });
  });

  describe('#registerTranslations', function() {
    it('is a function', function() {
      assert.isFunction(instance.registerTranslations);
    });

    it('returns the passed arguments as an object structure', function() {
      var locale = 'foo';
      var data   = { bar: { baz: 'bingo' } };

      var actual = instance.registerTranslations(locale, data);

      var expected = { foo: { bar: { baz: 'bingo' }}};

      assert.deepEqual(actual, expected);
    });

    it('merges the passed arguments correctly into the registry', function() {
      instance._registry.translations = {};

      instance.registerTranslations('foo', { bar: { baz: 'bingo' } });
      var expected = { foo: { bar: { baz: 'bingo' } } };
      assert.deepEqual(instance._registry.translations, expected);

      instance.registerTranslations('foo', { bar: { bam: 'boo' } });
      var expected = { foo: { bar: { baz: 'bingo', bam: 'boo' } } };
      assert.deepEqual(instance._registry.translations, expected);

      instance.registerTranslations('foo', { bing: { bong: 'beng' } });
      var expected = { foo: { bar: { baz: 'bingo', bam: 'boo' }, bing: { bong: 'beng' } } };
      assert.deepEqual(instance._registry.translations, expected);

      // clean up
      instance._registry.translations = {};
      instance.registerTranslations('en', require('./locales/en'));
    });
  });

  describe('#registerInterpolations', function() {
    it('is a function', function() {
      assert.isFunction(instance.registerInterpolations);
    });

    it('merges the passed arguments correctly into the registry', function() {
      instance._registry.interpolations = {};

      instance.registerInterpolations({ foo: 'yes', bar: 'no' });
      assert.deepEqual(instance._registry.interpolations, { foo: 'yes', bar: 'no' });

      instance.registerInterpolations({ baz: 'hey' });
      assert.deepEqual(instance._registry.interpolations, { foo: 'yes', bar: 'no', baz: 'hey' });

      // clean up
      instance._registry.interpolations = {};
    });
  });

  describe('explicitly checking the examples of the README', function() {
    it('passes all tests', function() {
      instance.registerTranslations('en', {
        damals: {
          about_x_hours_ago: {
            one:   'about one hour ago',
            other: 'about %(count)s hours ago'
          }
        }
      });

      assert.deepEqual(instance.translate('damals'), { about_x_hours_ago: { one: 'about one hour ago', other: 'about %(count)s hours ago' } });

      assert.equal(instance.translate('damals.about_x_hours_ago.one'),                    'about one hour ago');
      assert.equal(instance.translate(['damals', 'about_x_hours_ago', 'one']),            'about one hour ago');
      assert.equal(instance.translate(['damals', 'about_x_hours_ago.one']),               'about one hour ago');
      assert.equal(instance.translate('about_x_hours_ago.one', { scope: 'damals' }),      'about one hour ago');
      assert.equal(instance.translate('one', { scope: 'damals.about_x_hours_ago' }),      'about one hour ago');
      assert.equal(instance.translate('one', { scope: ['damals', 'about_x_hours_ago'] }), 'about one hour ago');

      assert.equal(instance.translate('damals.about_x_hours_ago.one', { separator: '*' }), 'missing translation: en*damals.about_x_hours_ago.one');

      instance.registerTranslations('en', { foo: 'foo %(bar)s' });

      assert.equal(instance.translate('foo', { bar: 'baz' }), 'foo baz');

      instance.registerTranslations('en', {
        x_items: {
          zero:  'No items.',
          one:   'One item.',
          other: '%(count)s items.'
        }
      });

      assert.equal(instance.translate('x_items', { count: 0  }), 'No items.');
      assert.equal(instance.translate('x_items', { count: 1  }), 'One item.');
      assert.equal(instance.translate('x_items', { count: 42 }), '42 items.');

      assert.equal(instance.translate('baz', { fallback: 'default' }), 'default');

      instance.registerTranslations('de', require('./locales/de'));
      instance.registerTranslations('de', JSON.parse('{"my_project": {"greeting": "Hallo, %(name)s!","x_items": {"one": "1 Stück", "other": "%(count)s Stücke"}}}'));

      assert.equal(instance.withLocale('de', function() { return instance.translate('greeting', { scope: 'my_project', name: 'Martin' }); }), 'Hallo, Martin!');
      assert.equal(instance.withLocale('de', function() { return instance.translate('x_items', { scope: 'my_project', count: 1 }); }), '1 Stück');

      var date = new Date('Fri Feb 21 2014 13:46:24 GMT+0100 (CET)');

      assert.equal(instance.localize(date)                       , 'Fri, 21 Feb 2014 13:46');
      assert.equal(instance.localize(date, { format: 'short' })  , '21 Feb 13:46');
      assert.equal(instance.localize(date, { format: 'long' })   , 'Friday, February 21st, 2014 13:46:24 +01:00');

      assert.equal(instance.localize(date, { type: 'date' })                  , 'Fri, 21 Feb 2014');
      assert.equal(instance.localize(date, { type: 'date', format: 'short' }) , 'Feb 21');
      assert.equal(instance.localize(date, { type: 'date', format: 'long' })  , 'Friday, February 21st, 2014');

      assert.equal(instance.localize(date, { type: 'time' })                  , '13:46');
      assert.equal(instance.localize(date, { type: 'time', format: 'short' }) , '13:46');
      assert.equal(instance.localize(date, { type: 'time', format: 'long' })  , '13:46:24 +01:00');

      assert.equal(instance.localize(date, { locale: 'de' })  , 'Fr, 21. Feb 2014, 13:46 Uhr');

      instance.registerTranslations('en', {
        my_namespace: {
          greeting: 'Welcome to %(app_name)s, %(visitor)s!'
        }
      });

      instance.registerInterpolations({ app_name: 'My Cool App' });

      assert.equal(instance.translate('my_namespace.greeting', { visitor: 'Martin' }), 'Welcome to My Cool App, Martin!');
      assert.equal(instance.translate('my_namespace.greeting', { visitor: 'Martin', app_name: 'The Foo App' }), 'Welcome to The Foo App, Martin!');
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
