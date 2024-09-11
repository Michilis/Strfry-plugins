
# Azzamo-Blacklist-Filter

This plugin is designed for Strfry to filter out events based on spam keywords, bot-like behavior, and blacklisted public keys or IP addresses. The plugin loads multiple lists (whitelists, blacklists, spam keywords) from files and processes events, rejecting or accepting them based on specific conditions.

## How it Works

1. The plugin checks if the public key or IP address of the event is present in the whitelist. If so, the event is accepted.
2. If the public key or IP is found in the blacklist, the event is rejected with an appropriate message.
3. The plugin scans the content of each event for spam keywords. If a match is found, the public key is automatically added to the blacklist, and the event is rejected.
4. The plugin can be extended to include rate-limiting logic.

## File Paths

The plugin reads the following files to load its filtering lists:

- **Blacklist Path**: `/home/strfry/strfry/plugins/azzamo_blacklist.txt`
- **Whitelist Path**: `/home/strfry/strfry/plugins/azzamo_whitelist.txt`
- **IP Blacklist Path**: `/home/strfry/strfry/plugins/azzamo_ip_blacklist.txt`
- **IP Whitelist Path**: `/home/strfry/strfry/plugins/azzamo_ip_whitelist.txt`
- **Spam Keywords Path**: `/home/strfry/strfry/plugins/azzamo_spam_keywords.txt`
- **Temporary Ban List Path**: `/home/strfry/strfry/plugins/tempban_list.txt`

Each file should contain one entry per line.

## Features

- **Whitelist and Blacklist Filtering**: The plugin filters events based on both public keys and IP addresses. It accepts events from whitelisted entities and rejects those from blacklisted ones.
- **Spam Keyword Detection**: The plugin scans event content for spam keywords and automatically blacklists public keys that post events containing those keywords.
- **Rate-Limiting**: Placeholder logic is included for rate-limiting behavior.
  
## Code Breakdown

### 1. Loading the Lists

The `loadList` function reads data from a file and returns an array of entries (one per line).

```javascript
function loadList(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error(`Error loading file: ${filePath}, ${error}`);
        return [];
    }
}
```

This function is used to load blacklists, whitelists, and spam keywords.

### 2. Processing Events

The plugin listens for incoming events, checks them against the whitelists, blacklists, and spam keywords, and decides whether to accept or reject them.

```javascript
rl.on('line', (line) => {
    try {
        const req = JSON.parse(line); // Parse the incoming event
        const event = req.event;
        const pubkey = event.pubkey;
        const content = (event.content || '').toLowerCase();
        const ip = req.sourceInfo || '';
        const eventId = event.id;

        let response = { id: eventId };

        if (whitelist.includes(pubkey) || ipWhitelist.includes(ip)) {
            response.action = 'accept';
            console.log(JSON.stringify(response));
            return;
        }

        if (blacklist.includes(pubkey)) {
            response.action = 'reject';
            response.msg = 'Your account is blacklisted due to repeated spam.';
            console.log(JSON.stringify(response));
            return;
        }

        if (ipBlacklist.includes(ip)) {
            response.action = 'reject';
            response.msg = 'Your IP is blacklisted.';
            console.log(JSON.stringify(response));
            return;
        }

        for (const keyword of spamKeywords) {
            if (content.includes(keyword)) {
                blacklist.push(pubkey);
                fs.appendFileSync(blacklistPath, pubkey + '\n');

                response.action = 'reject';
                response.msg = `Spam detected: The word "{keyword}" is not allowed.`;
                console.log(JSON.stringify(response));
                return;
            }
        }

        // Placeholder for rate-limiting logic
        const isRateLimited = false;
        if (isRateLimited) {
            response.action = 'reject';
            response.msg = 'Rate limit exceeded. Please slow down.';
            console.log(JSON.stringify(response));
            return;
        }

        response.action = 'accept';
        console.log(JSON.stringify(response));
    } catch (error) {
        console.error('Error processing event:', error);
        const response = {
            id: req && req.event ? req.event.id : 'unknown',
            action: 'reject',
            msg: 'internal error'
        };
        console.log(JSON.stringify(response));
    }
});
```

### 3. Spam Detection

The plugin checks event content for spam keywords and adds the public key to the blacklist if a match is found. The blacklist is updated by appending the public key to the `azzamo_blacklist.txt` file.

```javascript
for (const keyword of spamKeywords) {
    if (content.includes(keyword)) {
        blacklist.push(pubkey);
        fs.appendFileSync(blacklistPath, pubkey + '\n');

        response.action = 'reject';
        response.msg = `Spam detected: The word "{keyword}" is not allowed.`;
        console.log(JSON.stringify(response));
        return;
    }
}
```

## Installation

1. Clone this repository to your local machine.
2. Ensure the paths to the blacklist, whitelist, IP blacklist, IP whitelist, spam keywords, and temp ban list files are correct and accessible.
3. Make the script executable:
   ```bash
   chmod a+x azzamo_blacklist_filter.js
   ```
4. In your `strfry.conf` file, configure the plugin:
   ```conf
   relay.writePolicy.plugin = ./azzamo_blacklist_filter.js
   ```

## Dependencies

- `fs` module for reading and writing files.
- `readline` module for processing input and output events.

## Logging

- The plugin logs whenever an event is accepted, rejected, or when a public key is added to the blacklist for spam.
