
# Rate-Limit-Filter

This plugin is designed for Strfry to implement rate limiting based on public keys. It tracks the number of events each public key posts within a certain time window and rejects any events that exceed the rate limit.

## How it Works

1. The plugin keeps track of the number of events posted by each public key within a sliding time window (1 minute by default).
2. If a public key posts more than the allowed number of events within the window, the event is rejected with a message indicating that the rate limit has been exceeded.
3. Otherwise, the event is accepted, and the public key's event count is updated.

## Features

- **Rate Limiting**: The plugin enforces a maximum number of events per public key in a given time window.
- **Sliding Window**: The rate limit is calculated using a sliding window to ensure that only recent events are counted.

## Rate Limit Configuration

- **Rate Limit Window**: The time window is set to 1 minute (60,000 milliseconds).
- **Max Events per Window**: Each public key is allowed to post up to 5 events within the 1-minute window.

You can adjust these settings in the code:

```javascript
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_EVENTS_PER_WINDOW = 5;
```

## Code Breakdown

### 1. Event Cache

The plugin uses a `Map` called `eventCache` to store timestamps for events posted by each public key:

```javascript
const eventCache = new Map();
```

Each entry in the map stores an array of timestamps representing when events were posted by the corresponding public key.

### 2. Cleanup Old Events

The `cleanupOldEvents` function filters out events that occurred outside the time window:

```javascript
function cleanupOldEvents(pubkey) {
    const now = Date.now();
    const events = eventCache.get(pubkey) || [];
    const validEvents = events.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    eventCache.set(pubkey, validEvents);
    return validEvents;
}
```

It ensures that only recent events (within the last minute) are considered when checking if the rate limit has been exceeded.

### 3. Processing Events

The plugin processes incoming events by checking the number of valid (recent) events for the public key. If the number of valid events is below the maximum allowed, the event is accepted. Otherwise, it is rejected:

```javascript
rl.on('line', (line) => {
    try {
        const req = JSON.parse(line);
        const event = req.event || {};
        const pubkey = (event.pubkey || '').toLowerCase();

        let res = { id: event.id, action: 'reject', msg: 'Rate limit exceeded.' };

        const validEvents = cleanupOldEvents(pubkey);
        if (validEvents.length < MAX_EVENTS_PER_WINDOW) {
            res.action = 'accept';
            delete res.msg;
            validEvents.push(Date.now());
            eventCache.set(pubkey, validEvents);
            console.error(`Event accepted for pubkey: {pubkey}`);
        } else {
            console.error(`Rate limit exceeded for pubkey: {pubkey}`);
        }

        console.log(JSON.stringify(res));

    } catch (e) {
        console.error('Error processing event:', e);
    }
});
```

### 4. Running the Plugin

When the plugin starts, it immediately begins processing incoming events and enforces the rate limit for each public key:

```javascript
startProcessingEvents();
```

## Installation

1. Clone this repository to your local machine.
2. Make the script executable:
   ```bash
   chmod a+x rate_limit_filter.js
   ```
3. In your `strfry.conf` file, configure the plugin:
   ```conf
   relay.writePolicy.plugin = ./rate_limit_filter.js
   ```

## Dependencies

- `readline` module for processing input and output events.

## Logging

- The plugin logs whenever an event is accepted or rejected due to rate limits, including the public key involved.
