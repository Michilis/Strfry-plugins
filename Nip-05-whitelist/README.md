
# Noderunners-Whitelist

This plugin is designed for Strfry to enforce a whitelist of public keys, fetched from the Noderunners NIP-05 whitelist JSON file, which determines whether events should be accepted or rejected. The plugin fetches the whitelist periodically and processes new events, allowing or rejecting them based on whether the public key is included in the whitelist.

## How it Works

- The plugin fetches a NIP-05 whitelist from the [Noderunners](https://noderunners.org/.well-known/nostr.json) URL.
- It processes new events as they arrive, accepting them only if the event's public key is present in the whitelist.
- If the public key is not whitelisted, the event is rejected.
- The whitelist is periodically refreshed every 10 minutes to ensure up-to-date data.

## Features

- **Whitelist Fetching**: The whitelist is fetched from the Noderunners NIP-05 JSON URL.
- **Event Filtering**: Only events from whitelisted public keys are accepted.
- **Automatic Whitelist Refreshing**: The whitelist is refreshed every 10 minutes.
- **Reject Message**: Non-whitelisted public keys receive a rejection message.
  
## Code Breakdown

### 1. Whitelist URL

The whitelist URL is defined in the code:

```javascript
const WHITELIST_URL = 'https://noderunners.org/.well-known/nostr.json';
```

This is where the whitelist data is fetched from. The fetched data is a JSON object containing the authorized public keys.

### 2. Whitelist Refresh Interval

The whitelist is refreshed every 10 minutes (600,000 milliseconds):

```javascript
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

### 3. Fetching and Updating the Whitelist

The `updateWhitelist` function is responsible for fetching the whitelist and converting it into a set of lowercased public keys for fast lookup.

```javascript
function updateWhitelist(callback) {
    https.get(WHITELIST_URL, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                whiteList = new Set(Object.values(json.names).map(pubkey => pubkey.toLowerCase()));
                console.log('Whitelist updated successfully.');
                if (callback) callback();
            } catch (e) {
                console.error('Error parsing JSON:', e);
                if (callback) callback(e);
            }
        });
    }).on('error', (e) => {
        console.error('Error fetching whitelist:', e);
        if (callback) callback(e);
    });
}
```

The whitelist is stored as a `Set` for fast access when checking if a public key is included.

### 4. Processing Events

Events are processed through the `startProcessingEvents` function. It listens for incoming events, checks the public key against the whitelist, and decides to accept or reject the event.

```javascript
function startProcessingEvents() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        try {
            const req = JSON.parse(line);
            const event = req.event || {};
            const pubkey = (event.pubkey || '').toLowerCase();
            const actionType = req.type;

            console.log(`Processing {actionType} event for pubkey: {pubkey}`);

            let res = { id: event.id, action: 'reject', msg: 'You are not authorized to access this relay.' };

            if (whiteList.has(pubkey)) {
                res.action = 'accept';
                delete res.msg;
                console.log(`Access granted for pubkey: {pubkey}`);
            } else {
                console.log(`Pubkey not whitelisted: {pubkey}`);
            }

            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}
```

### 5. Running the Plugin

When the plugin starts:
- It fetches the whitelist and ensures it is up to date before processing events.
- After the initial whitelist is fetched, it begins processing incoming events.
- It also continues to update the whitelist every 10 minutes to ensure that the public keys are always current.

### 6. Handling Errors

- The plugin will handle any errors encountered while fetching or parsing the whitelist. If an error occurs, it will log the error and skip processing until the next update cycle.

```javascript
updateWhitelist((err) => {
    if (!err) {
        startProcessingEvents();
        setInterval(() => {
            updateWhitelist();
        }, UPDATE_INTERVAL);
    } else {
        console.error('Failed to fetch initial whitelist, cannot start processing events.');
    }
});
```

## Installation

1. Clone this repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make the script executable:
   ```bash
   chmod a+x whitelist.js
   ```
4. In your `strfry.conf` file, configure the plugin:
   ```conf
   relay.writePolicy.plugin = ./whitelist.js
   ```

## Dependencies

- `https` module for fetching the whitelist from the provided URL.
- `readline` module for processing input and output events.

## Logging

- The plugin logs when the whitelist is updated successfully and also logs the results of event processing (whether accepted or rejected).

