#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

// Path to the local blacklist file (replace with your path)
const BLACKLIST_FILE = './blacklist.txt';

// The blacklist cache
let blackList = new Set();

// Function to load the blacklist from a file
function loadBlacklist() {
    try {
        const data = fs.readFileSync(BLACKLIST_FILE, 'utf8');
        blackList = new Set(data.split('\n').map(pubkey => pubkey.trim()).filter(pubkey => pubkey));
        console.error('Blacklist loaded successfully.');
    } catch (e) {
        console.error('Error loading blacklist:', e);
    }
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

            let res = { id: event.id, action: 'reject', msg: 'User is blacklisted.' };

            // Check if pubkey is in the blacklist
            if (blackList.has(pubkey)) {
                console.error(`Pubkey blacklisted: ${pubkey}`);
            } else {
                res.action = 'accept';
                delete res.msg;
                console.error(`Access granted for pubkey: ${pubkey}`);
            }

            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Load blacklist on startup
loadBlacklist();
startProcessingEvents();
