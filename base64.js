module.exports = {
  encode: function(str) {
    return new Buffer(str).toString('base64');
  },
  decode: function(encodedStr) {
    return new Buffer(encodedStr, 'base64').toString('utf8');
  }
}
