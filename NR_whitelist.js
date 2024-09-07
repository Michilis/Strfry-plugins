#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

// URL for the Noderunners NIP-05 whitelist JSON
const WHITELIST_URL = 'https://noderunners.org/.well-known/nostr.json';

// Time interval to update whitelist (in milliseconds)
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// The whitelist and blocklist caches
let whiteList = new Set();
let blockList = new Map(); // Store non-whitelisted pubkeys and their block timestamps

// Function to fetch and update the whitelist from the URL
function updateWhitelist(callback) {
    https.get(WHITELIST_URL, (res) => {
        let data = '';

        // A chunk of data has been received.
        res.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Parse it.
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                // Convert the "names" object to a set of public keys for faster lookup
                whiteList = new Set(Object.values(json.names).map(pubkey => pubkey.toLowerCase()));
                console.error('Whitelist updated successfully.');
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

// Helper function to clean up expired entries in the blocklist
function cleanupBlocklist() {
    const now = Date.now();
    for (let [pubkey, blockTime] of blockList.entries()) {
        if (now - blockTime > BLOCK_DURATION) {
            blockList.delete(pubkey);
        }
    }
}

// Ensure the whitelist is populated before processing events
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
            const actionType = req.type; // Can be "new" for write actions or "req" for read actions

            // Clean up old blocklist entries before processing the event
            cleanupBlocklist();

            // Check if pubkey is blocked
            if (blockList.has(pubkey)) {
                console.error(`Blocked pubkey trying to reconnect: ${pubkey}`);
                const res = {
                    id: event.id,
                    action: 'reject',
                    msg: 'You are not Noderunners verified!'
                };
                console.log(JSON.stringify(res));
                return; // Immediately reject the connection if the user is blocked
            }

            // Default response is reject with a message
            let res = { id: event.id, action: 'reject', msg: 'You are not Noderunners verified!' };

            // Check if the pubkey is in the whitelist
            if (whiteList.has(pubkey)) {
                res.action = 'accept';
                delete res.msg;  // Remove msg if accepted
                console.error(`Access granted for pubkey: ${pubkey}`);
            } else {
                console.error(`Pubkey not whitelisted: ${pubkey}`);

                // Add the non-whitelisted pubkey to the blocklist with a timestamp
                blockList.set(pubkey, Date.now());

                // Reject the connection and inform the user they are blocked
                res.action = 'reject';
                res.msg = 'You are not Noderunners verified! You are blocked for 5 minutes.';
            }

            // Output the result in JSON format
            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Update whitelist on startup and then start processing events
updateWhitelist((err) => {
    if (!err) {
        // Start processing events after the whitelist is fetched
        startProcessingEvents();

        // Periodically update the whitelist
        setInterval(() => {
            updateWhitelist();
        }, UPDATE_INTERVAL);
    } else {
        console.error('Failed to fetch initial whitelist, cannot start processing events.');
    }
});
