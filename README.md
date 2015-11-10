# Pusher Data Stream

A service that lets users search the Twitter stream for search terms using [Pusher](http://www.pusher.com).

# How it Works

- The server listens to [channel existence webhooks](https://pusher.com/docs/webhooks#channel-existence) from Pusher.
- When it receives a `channel_occupied` event, it creates a new search on Twitter using that channel name.
- When it receives a `channel_vacated` event, it stops searching for that term on Twitter.
- When a new tweet is found, the server triggers a Pusher event to the channel that corresponds to the search term the tweet matched.

# Client Usage

Using the [Pusher JS](https://github.com/pusher/pusher-js) library, the client should subscribe to a channel name, where the channel name is the search term. Because of restrictions on Pusher channel names, this name should be Base64 encoded:

```js
// Client
var pusher = new Pusher(YOUR_APP_KEY);
var channelName = 'javascript';
var channel = pusher.subscribe(btoa(channelName));

channel.bind('new_tweet', function(data) {
  console.log('got tweet', data.tweet);
  console.log('matched search term', data.searchTerm);
});
```

# Configuring the server

You'll need to configure your Pusher app to send [channel existence webhooks](https://pusher.com/docs/webhooks#channel-existence) to this server, which accepts `POST /webhook`. The server will then start the Twitter stream and trigger events when new tweets are found.

The server supports searching for multiple keywords at once and will stop searching once all users vacate a given channel.

To run the server you'll need to make sure you've set the following environment variables. If you place them in a `.env` file, they will be loaded automatically by Dotenv.

```
TWITTER_CONSUMER_KEY="..."
TWITTER_CONSUMER_SECRET="..."
TWITTER_ACCESS_TOKEN="..."
TWITTER_ACCESS_SECRET="..."

PUSHER_APP_ID="..."
PUSHER_APP_KEY="..."
PUSHER_APP_SECRET="..."
```


