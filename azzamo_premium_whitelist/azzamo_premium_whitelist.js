#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const readline = require('readline');

// SETTINGS
const WHITELIST_API_URL = 'https://azzamo.net/.well-known/nostr.json';
const PUBKEY_BLACKLIST_API_URL = 'https://ban-api.azzamo.net/public/blocked/pubkeys';
const BANNED_WORDS_API_URL = 'https://ban-api.azzamo.net/public/blocked/words';
const WHITELIST_REFRESH_INTERVAL = 60 * 1000; // 1 minute
const BLACKLIST_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_COUNT = 210;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes
const CACHE_DIR = path.join(__dirname, 'cache');
const WHITELIST_CACHE_FILE = path.join(CACHE_DIR, 'whitelist.json');
const BLACKLIST_CACHE_FILE = path.join(CACHE_DIR, 'blacklist.json');
const BANNED_WORDS_CACHE_FILE = path.join(CACHE_DIR, 'banned_words.json');

// ERROR MESSAGES
const NON_WHITELISTED_ERROR_MESSAGE = "You ran out of time! Please top-up your time at azzamo.net/pay";
const BLACKLISTED_PUBKEY_ERROR_MESSAGE = "Your pubkey is blacklisted from posting on this relay.";
const RATE_LIMIT_ERROR_MESSAGE = "Rate limit exceeded. Please try again later.";
const BLACKLISTED_WORD_ERROR_MESSAGE = "Your note contains a blacklisted word.";

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

// In-memory cache
let whitelistCache = new Set();
let pubkeyBlacklist = new Set();
let eventCache = new Map(); // To track events for rate limiting
let cooldownCache = new Map(); // To track cooldown periods
let bannedWordsCache = new Set();

// Load cache from files
function loadCache() {
    try {
        const whitelistData = fs.readFileSync(WHITELIST_CACHE_FILE, 'utf8');
        whitelistCache = new Set(JSON.parse(whitelistData));
        console.error('Whitelist loaded from cache.');
    } catch (error) {
        console.error('Error loading whitelist cache:', error);
    }

    try {
        const blacklistData = fs.readFileSync(BLACKLIST_CACHE_FILE, 'utf8');
        pubkeyBlacklist = new Set(JSON.parse(blacklistData));
        console.error('Blacklist loaded from cache.');
    } catch (error) {
        console.error('Error loading blacklist cache:', error);
    }
}

// Save cache to files
function saveCache() {
    try {
        fs.writeFileSync(WHITELIST_CACHE_FILE, JSON.stringify([...whitelistCache]));
        console.error('Whitelist cache saved.');
    } catch (error) {
        console.error('Error saving whitelist cache:', error);
    }

    try {
        fs.writeFileSync(BLACKLIST_CACHE_FILE, JSON.stringify([...pubkeyBlacklist]));
        console.error('Blacklist cache saved.');
    } catch (error) {
        console.error('Error saving blacklist cache:', error);
    }
}

// Function to fetch and update the whitelist
async function updateWhitelist() {
    try {
        const response = await axios.get(WHITELIST_API_URL);
        const pubkeys = Object.values(response.data.names);
        whitelistCache = new Set(pubkeys.map(pubkey => pubkey.toLowerCase()));
        saveToJsonFile(WHITELIST_CACHE_FILE, whitelistCache);
        console.log('Whitelist loaded and cached successfully from API.');
    } catch (error) {
        console.error('Error loading whitelist from API:', error);
    }
}

// Function to fetch and update the blacklist
async function updateBlacklist() {
    try {
        const response = await axios.get(PUBKEY_BLACKLIST_API_URL);
        pubkeyBlacklist = new Set(response.data.map(pubkey => pubkey.toLowerCase()));
        saveCache();
        console.error('Blacklist updated successfully.');
    } catch (error) {
        console.error('Error updating blacklist:', error);
    }
}

// Function to fetch and update the banned words list
async function updateBannedWords() {
    try {
        const response = await axios.get(BANNED_WORDS_API_URL);
        bannedWordsCache = new Set(response.data.map(word => word.toLowerCase()));
        saveBannedWordsCache();
        console.error('Banned words list updated successfully.');
    } catch (error) {
        console.error('Error updating banned words list:', error);
    }
}

// Save banned words cache to file
function saveBannedWordsCache() {
    try {
        fs.writeFileSync(BANNED_WORDS_CACHE_FILE, JSON.stringify([...bannedWordsCache]));
        console.error('Banned words cache saved.');
    } catch (error) {
        console.error('Error saving banned words cache:', error);
    }
}

// Load banned words cache from file
function loadBannedWordsCache() {
    try {
        const data = fs.readFileSync(BANNED_WORDS_CACHE_FILE, 'utf8');
        bannedWordsCache = new Set(JSON.parse(data));
        console.error('Banned words loaded from cache.');
    } catch (error) {
        console.error('Error loading banned words cache:', error);
    }
}

// Function to check if a user is whitelisted
function isUserWhitelisted(pubkey) {
    return whitelistCache.has(pubkey.toLowerCase());
}

// Function to enforce rate limiting and cooldown
function isRateLimited(pubkey) {
    const now = Date.now();

    // Check if the pubkey is in cooldown
    if (cooldownCache.has(pubkey)) {
        const cooldownEnd = cooldownCache.get(pubkey);
        if (now < cooldownEnd) {
            return true;
        } else {
            cooldownCache.delete(pubkey); // Remove from cooldown if period has ended
        }
    }

    const events = eventCache.get(pubkey) || [];
    const validEvents = events.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    eventCache.set(pubkey, validEvents);

    if (validEvents.length >= RATE_LIMIT_COUNT) {
        cooldownCache.set(pubkey, now + COOLDOWN_PERIOD); // Start cooldown
        return true;
    }

    validEvents.push(now);
    return false;
}

// Function to check if content contains banned words
function containsBannedWord(content) {
    const lowerContent = content.toLowerCase();
    for (const word of bannedWordsCache) {
        if (lowerContent.includes(word)) {
            return true;
        }
    }
    return false;
}

// Function to handle incoming events
function handleEvent(event) {
    const pubkey = event.pubkey.toLowerCase();
    let response = { id: event.id };

    if (pubkeyBlacklist.has(pubkey)) {
        response.action = 'reject';
        response.msg = BLACKLISTED_PUBKEY_ERROR_MESSAGE;
    } else if (!isUserWhitelisted(pubkey)) {
        response.action = 'reject';
        response.msg = NON_WHITELISTED_ERROR_MESSAGE;
    } else if (isRateLimited(pubkey)) {
        response.action = 'reject';
        response.msg = RATE_LIMIT_ERROR_MESSAGE;
    } else if (containsBannedWord(event.content)) {
        response.action = 'reject';
        response.msg = BLACKLISTED_WORD_ERROR_MESSAGE;
    } else {
        response.action = 'accept';
    }

    console.log(JSON.stringify(response));
}

// Load caches on startup
loadCache();
loadBannedWordsCache();

// Initial fetch
updateWhitelist();
updateBlacklist();
updateBannedWords();

// Set intervals for refreshing the lists
setInterval(updateWhitelist, WHITELIST_REFRESH_INTERVAL);
setInterval(updateBlacklist, BLACKLIST_REFRESH_INTERVAL);
setInterval(updateBannedWords, BLACKLIST_REFRESH_INTERVAL);

// Start processing incoming events
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    try {
        const req = JSON.parse(line);
        if (req.type === 'new') {
            handleEvent(req.event);
        }
    } catch (error) {
        console.error('Error processing event:', error);
    }
});
