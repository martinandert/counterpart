var extend = require("extend");

module.exports = {
  globalization: {
    names: require('date-names/en'),

    formats: {
      date: {
        default:  '%Y-%m-%d',
        long:     '%B %d, %Y',
        short:    '%b %d'
      },

      time: {
        default:  '%H:%M:%S %z',
        long:     '%H:%M',
        short:    '%H:%M'
      },

      datetime: {
        default:  '%a, %d %b %Y %H:%M:%S %z',
        long:     '%B %d, %Y %H:%M',
        short:    '%d %b %H:%M'
      }
    }
  }
};
