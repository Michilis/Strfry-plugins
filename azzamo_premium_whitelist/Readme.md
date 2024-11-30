# Azzamo Premium Whitelist Plugin

The **Azzamo Premium Whitelist Plugin** is designed for use with the Strfry relay server. It provides a comprehensive filtering mechanism to manage event posting based on a whitelist of public keys, a blacklist of public keys, and a list of banned words. Additionally, it enforces rate limiting and cooldown periods to prevent abuse.

## Features

- **Whitelist Enforcement**: Only public keys listed in the whitelist are allowed to post events.
- **Blacklist Enforcement**: Public keys in the blacklist are prevented from posting events.
- **Banned Words Filtering**: Events containing banned words are rejected.
- **Rate Limiting**: Limits the number of events a public key can post within a specified time window.
- **Cooldown Period**: After exceeding the rate limit, a cooldown period is enforced before the public key can post again.
- **Automatic Updates**: The whitelist, blacklist, and banned words list are periodically updated from specified APIs.

## Configuration

- **Whitelist API URL**: Can be any NIP-05 JSON list.
- **Blacklist API URL**: `https://ban-api.azzamo.net/public/blocked/pubkeys`
- **Banned Words API URL**: `https://ban-api.azzamo.net/public/blocked/words`
- **Whitelist Refresh Interval**: 1 minute
- **Blacklist Refresh Interval**: 15 minutes
- **Rate Limit**: 210 events per 5 minutes
- **Cooldown Period**: 10 minutes

## Installation

1. Clone the plugin to your local machine.
2. Ensure Node.js is installed on your system.
3. Make the script executable:
   ```bash
   chmod +x azzamo_premium_whitelist.js
   ```
4. Configure your Strfry relay to use this plugin by editing the `strfry.conf` file:
   ```toml
   relay.writePolicy.plugin = ./azzamo_premium_whitelist.js
   ```

## Usage

The plugin listens for incoming events and processes them based on the following criteria:

1. **Whitelist Check**: If the public key is not in the whitelist, the event is rejected with a message prompting the user to top-up their time.
2. **Blacklist Check**: If the public key is in the blacklist, the event is rejected with a message indicating the public key is blacklisted.
3. **Rate Limiting**: If the public key exceeds the rate limit, the event is rejected with a rate limit exceeded message.
4. **Banned Words Check**: If the event content contains banned words, the event is rejected with a message indicating the presence of blacklisted words.
5. **Acceptance**: If none of the above conditions are met, the event is accepted.

## Error Handling

- The plugin logs errors encountered during the loading of caches and API updates.
- If an error occurs while processing an event, it logs the error and continues processing subsequent events.

## Dependencies

- `fs` module for file system operations.
- `axios` for making HTTP requests to fetch the whitelist, blacklist, and banned words.
- `readline` for processing input and output events.

## Logging

- The plugin logs when caches are loaded and saved, and when lists are updated successfully.
- It also logs the results of event processing, including acceptance and rejection reasons.

## Code Structure

- **Cache Management**: Loads and saves whitelist, blacklist, and banned words caches to files.
- **API Fetching**: Periodically fetches and updates the whitelist, blacklist, and banned words from specified APIs.
- **Event Handling**: Processes incoming events and applies filtering logic based on the configured rules.


## License

This plugin is open-source and available under the MIT License. You are free to use, modify, and distribute the code, provided you include the original copyright and license notice.
