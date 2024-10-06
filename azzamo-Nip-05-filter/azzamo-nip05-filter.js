#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

// URL for the Noderunners NIP-05 whitelist JSON
const WHITELIST_URL = 'https://noderunners.org/.well-known/nostr.json';

// Time interval to update whitelist (in milliseconds)
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

// The whitelist cache
let whiteList = {};

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
            const actionType = req.type; // "new" for write actions, other types for reads

            console.log(`Processing ${actionType} event for pubkey: ${pubkey}`);

            // Default response is reject with message
            let res = { id: event.id, action: 'reject', msg: 'You are not authorized to access this relay.' };

            // Check if the pubkey is in the whitelist
            if (whiteList.has(pubkey)) {
                res.action = 'accept';
                delete res.msg;  // Remove msg if accepted
                console.log(`Access granted for pubkey: ${pubkey}`);
            } else {
                console.log(`Pubkey not whitelisted: ${pubkey}`);
            }

            // Output the result
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
