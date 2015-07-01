var provider = require('./provider');

module.exports = {
  activate: function() {},
  getProvider: function() {
    return provider;
  },
  provide: function() {
    return {
      provider: this.getProvider()
    };
  }
};
