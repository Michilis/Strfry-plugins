#!/usr/bin/env node

const readline = require('readline');

// Spam filter configuration
const MAX_LINKS = 3;
const SPAM_KEYWORDS = ['free', 'click', 'subscribe', 'promo'];

// Function to check if an event contains spammy content
function isSpam(eventContent) {
    // Check for excessive links
    const linkCount = (eventContent.match(/https?:\/\//g) || []).length;
    if (linkCount > MAX_LINKS) return true;

    // Check for spammy keywords
    const loweredContent = eventContent.toLowerCase();
    for (let keyword of SPAM_KEYWORDS) {
        if (loweredContent.includes(keyword)) return true;
    }

    return false;
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
            const content = event.content || '';

            let res = { id: event.id, action: 'reject', msg: 'Event appears to be spam.' };

            if (!isSpam(content)) {
                res.action = 'accept';
                delete res.msg;
                console.error(`Event accepted for pubkey: ${event.pubkey}`);
            } else {
                console.error(`Event rejected as spam: ${event.pubkey}`);
            }

            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Start processing events
startProcessingEvents();
