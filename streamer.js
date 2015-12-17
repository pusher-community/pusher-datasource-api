var Twit = require('twit');
var base64 = require('./base64');
var Pusher = require('pusher');
var _ = require('lodash');

var streamer = {
  keywords: [],
  twit: new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
  }),
  stream: null,
  subscribe: function(channelName) {
    var searchTerm = base64.decode(channelName);
    console.log('Subscribing to', searchTerm);
    this.startNewStream(searchTerm);
  },
  unsubscribe: function(channelName) {
    var searchTerm = base64.decode(channelName);
    console.log('Unsubcribing from', searchTerm);
    if (this.keywords.indexOf(searchTerm) === -1) return;

    if (this.keywords.length === 1) {
      this.keywords = [];
      this.stopStream();
      return;
    }

    this.keywords = this.keywords.filter(function(keyword) {
      return keyword !== searchTerm;
    });

    this.stopStream();
    if (this.keywords.length > 0) this.startNewStream();
  },
  stopStream: function() {
    this.stream && this.stream.stop();
    this.stream = null;
  },
  startNewStream: function(searchTerm) {
    // you can only ever have one stream open at once
    // TODO: open a second and let Twitter kill the first
    // such that we don't miss any events
    this.stopStream();

    if (searchTerm && this.keywords.indexOf(searchTerm) > -1) return;
    if (searchTerm) this.keywords.push(searchTerm);
    console.log('starting new stream', this.keywords);
    this.stream = this.twit.stream('statuses/filter', { track: this.keywords });
    this.bindStreamEvents();
  },
  getMatchedKeywordForTweet: function(tweet) {
    if (this.keywords.length === 1) return this.keywords[0];

    return this.keywords.filter(function(keyword) {
      return tweet.text.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
    })[0];
  },
  processTweet: function(tweet) {
    return _.pick(tweet, ['user', 'geo', 'place', 'id_str', 'created_at', 'text']);
  },
  bindStreamEvents: function() {
    this.stream.on('tweet', function(data) {
      console.log('stream got tweet');
      var tweet = this.processTweet(data);
      var matchedKeyword = this.getMatchedKeywordForTweet(tweet);

      if (!matchedKeyword) {
        console.log('Tweet', tweet.text, 'didn\'t match any keywords from', this.keywords, 'skipping');
        return;
      }

      this.pusher.trigger(base64.encode(matchedKeyword), 'new_tweet', {
        tweet: tweet,
        searchTerm: matchedKeyword
      });
    }.bind(this));
  }
};

module.exports = streamer;
