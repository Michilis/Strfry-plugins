#!/usr/bin/env node

const readline = require('readline');

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_EVENTS_PER_WINDOW = 5;

// Cache for tracking event counts per pubkey
const eventCache = new Map();

function cleanupOldEvents(pubkey) {
    const now = Date.now();
    const events = eventCache.get(pubkey) || [];
    const validEvents = events.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    eventCache.set(pubkey, validEvents);
    return validEvents;
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

            let res = { id: event.id, action: 'reject', msg: 'Rate limit exceeded.' };

            const validEvents = cleanupOldEvents(pubkey);
            if (validEvents.length < MAX_EVENTS_PER_WINDOW) {
                res.action = 'accept';
                delete res.msg;
                validEvents.push(Date.now());
                eventCache.set(pubkey, validEvents);
                console.error(`Event accepted for pubkey: ${pubkey}`);
            } else {
                console.error(`Rate limit exceeded for pubkey: ${pubkey}`);
            }

            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Start processing events
startProcessingEvents();
