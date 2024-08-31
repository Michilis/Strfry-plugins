#!/usr/bin/env node

const https = require('https');
const readline = require('readline');
const bech32 = require('bech32');

// URL for the Noderunners NIP-05 whitelist JSON
const WHITELIST_URL = 'https://noderunners.org/.well-known/nostr.json';

// Time interval to update whitelist (in milliseconds)
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

// The whitelist cache
let whiteList = {};

// Function to convert npub (bech32) to hex
function npubToHex(npub) {
    try {
        const { words } = bech32.decode(npub);
        const data = bech32.fromWords(words);
        return Buffer.from(data).toString('hex');
    } catch (e) {
        console.error('Error converting npub to hex:', e);
        return null;
    }
}

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
                whiteList = new Set();

                // Convert the "names" object to a set of public keys for faster lookup
                for (const pubkey of Object.values(json.names)) {
                    const lowerPubkey = pubkey.toLowerCase();
                    whiteList.add(lowerPubkey);

                    // Check if the pubkey is in bech32 format and convert it
                    if (pubkey.startsWith('npub')) {
                        const hexPubkey = npubToHex(pubkey);
                        if (hexPubkey) {
                            whiteList.add(hexPubkey.toLowerCase());
                        }
                    }
                }
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

            console.log('Processing event for pubkey:', pubkey);

            let res = { id: event.id, action: 'reject', msg: 'You are not a Noderunner yet. Please pay the fee to gain access to the Noderunners relay.' };

            if (whiteList.has(pubkey)) {
                res.action = 'accept';
                delete res.msg;  // Remove msg if accepted
                console.log(`Event accepted for pubkey: ${pubkey}`);
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
