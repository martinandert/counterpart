// The translations in this file can be added with:
//   #registerTranslations('de', require('globalization/locales/de');

module.exports = {
  globalization: {
    names: require('date-names/de'),
    pluralize: require('pluralizers/de'),

    formats: {
      date: {
        default:  '%a, %e. %b %Y',
        long:     '%A, %e. %B %Y',
        short:    '%d.%m.%y'
      },

      time: {
        default:  '%H:%M Uhr',
        long:     '%H:%M:%S %z',
        short:    '%H:%M'
      },

      datetime: {
        default:  '%a, %e. %b %Y, %H:%M Uhr',
        long:     '%A, %e. %B %Y, %H:%M:%S %z',
        short:    '%d.%m.%y %H:%M'
      }
    }
  }
};
