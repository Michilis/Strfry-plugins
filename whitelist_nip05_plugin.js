#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

// URL for the NIP-05 whitelist JSON (replace with your URL)
const WHITELIST_URL = 'https://example.com/.well-known/nostr.json';

// Time interval to update whitelist (in milliseconds)
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

// The whitelist cache
let whiteList = new Set();

// Function to fetch and update the whitelist from the URL
function updateWhitelist(callback) {
    https.get(WHITELIST_URL, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                // Convert the "names" object to a set of public keys
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

// Process incoming events
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

            let res = { id: event.id, action: 'reject', msg: 'User not whitelisted.' };

            // Check if pubkey is in the whitelist
            if (whiteList.has(pubkey)) {
                res.action = 'accept';
                delete res.msg;
                console.error(`Access granted for pubkey: ${pubkey}`);
            } else {
                console.error(`Pubkey not whitelisted: ${pubkey}`);
            }

            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Update whitelist on startup
updateWhitelist((err) => {
    if (!err) {
        startProcessingEvents();
        setInterval(() => {
            updateWhitelist();
        }, UPDATE_INTERVAL);
    } else {
        console.error('Failed to fetch initial whitelist.');
    }
});
