#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_EVENTS_PER_WINDOW = 15; // Maximum 15 events per minute
const MAX_LINKS = 10; // Allow up to 10 links per event

// Paths to external files
const BLACKLIST_FILE = '/path/to/azzamo_blacklist.txt'; // Update this path
const SPAM_KEYWORDS_FILE = '/path/to/azzamo_spam_keywords.txt'; // Update this path

// Cache for tracking event counts per pubkey, blacklist, and spam keywords
let eventCache = new Map();
let blackList = new Set();
let spamKeywords = new Set();

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

// Function to load spam keywords from a file
function loadSpamKeywords() {
    try {
        const data = fs.readFileSync(SPAM_KEYWORDS_FILE, 'utf8');
        spamKeywords = new Set(data.split('\n').map(keyword => keyword.trim()).filter(keyword => keyword));
        console.error('Spam keywords loaded successfully.');
    } catch (e) {
        console.error('Error loading spam keywords:', e);
    }
}

// Function to clean up old events from the rate limit cache
function cleanupOldEvents(pubkey) {
    const now = Date.now();
    const events = eventCache.get(pubkey) || [];
    const validEvents = events.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    eventCache.set(pubkey, validEvents);
    return validEvents;
}

// Function to check for spammy content
function isSpam(content) {
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > MAX_LINKS) return true;

    // Check for spam keywords
    const lowerContent = content.toLowerCase();
    for (let keyword of spamKeywords) {
        if (lowerContent.includes(keyword)) return true;
    }

    return false;
}

// Function to delete content by returning a special "delete" action
function deleteContent(eventId) {
    return { id: eventId, action: 'delete', msg: 'Content deleted.' };
}

// Start processing events
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
            const content = event.content || '';
            let res;

            // Check if the pubkey is blacklisted
            if (blackList.has(pubkey)) {
                console.error(`Pubkey blacklisted: ${pubkey}. Deleting content.`);
                res = deleteContent(event.id);
                console.log(JSON.stringify(res));
                return;
            }

            // Clean up old events for rate limiting
            const validEvents = cleanupOldEvents(pubkey);
            if (validEvents.length >= MAX_EVENTS_PER_WINDOW) {
                console.error(`Rate limit exceeded for pubkey: ${pubkey}.`);
                res = { id: event.id, action: 'reject', msg: 'Rate limit exceeded. Please slow down.' };
                console.log(JSON.stringify(res));
                return;
            }

            // Check if the event content is spam
            if (isSpam(content)) {
                console.error(`Spam detected from pubkey: ${pubkey}. Deleting content.`);
                res = deleteContent(event.id);
                console.log(JSON.stringify(res));
                return;
            }

            // If no issues, accept the event
            validEvents.push(Date.now());
            eventCache.set(pubkey, validEvents);
            res = { id: event.id, action: 'accept' };
            console.error(`Event accepted for pubkey: ${pubkey}`);
            console.log(JSON.stringify(res));

        } catch (e) {
            console.error('Error processing event:', e);
        }
    });
}

// Load blacklist, spam keywords, and start processing events
loadBlacklist();
loadSpamKeywords();
startProcessingEvents();
