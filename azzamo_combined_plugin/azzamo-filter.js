#!/usr/bin/env node

// This plugin filters events for spam, bot behavior, and blacklisted pubkeys/IPs in Strfry
const fs = require('fs');
const readline = require('readline');

// File paths for lists
const blacklistPath = '/home/strfryazzamo/strfry/plugins/azzamo_blacklist.txt';
const whitelistPath = '/home/strfryazzamo/strfry/plugins/azzamo_whitelist.txt';
const ipBlacklistPath = '/home/strfryazzamo/strfry/plugins/azzamo_ip_blacklist.txt';
const ipWhitelistPath = '/home/strfryazzamo/strfry/plugins/azzamo_ip_whitelist.txt';
const spamKeywordsPath = '/home/strfryazzamo/strfry/plugins/azzamo_spam_keywords.txt';
const tempBanListPath = '/home/strfryazzamo/strfry/plugins/tempban_list.txt';

// Load lists from files
function loadList(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error(`Error loading file: ${filePath}, ${error}`);
        return [];
    }
}

const blacklist = loadList(blacklistPath);
const whitelist = loadList(whitelistPath);
const ipBlacklist = loadList(ipBlacklistPath);
const ipWhitelist = loadList(ipWhitelistPath);
const spamKeywords = loadList(spamKeywordsPath).map(word => word.toLowerCase());
const tempBanList = loadList(tempBanListPath);

// Readline interface for incoming events
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    try {
        const req = JSON.parse(line); // Parse the incoming event
        const event = req.event;
        const pubkey = event.pubkey;
        const content = (event.content || '').toLowerCase(); // Convert content to lowercase
        const ip = req.sourceInfo || ''; // Extract IP from sourceInfo
        const eventId = event.id;

        let response = { id: eventId }; // Prepare response

        // Check if pubkey or IP is whitelisted
        if (whitelist.includes(pubkey) || ipWhitelist.includes(ip)) {
            response.action = 'accept';
            console.log(JSON.stringify(response));
            return;
        }

        // Check if pubkey or IP is blacklisted
        if (blacklist.includes(pubkey)) {
            response.action = 'reject';
            response.msg = 'Your account is blacklisted due to repeated spam.';
            console.log(JSON.stringify(response));
            return;
        }

        if (ipBlacklist.includes(ip)) {
            response.action = 'reject';
            response.msg = 'Your IP is blacklisted.';
            console.log(JSON.stringify(response));
            return;
        }

        // Check for spam keywords in the content
        for (const keyword of spamKeywords) {
            if (content.includes(keyword)) {
                // Add pubkey to the blacklist
                blacklist.push(pubkey);
                fs.appendFileSync(blacklistPath, pubkey + '\n');

                response.action = 'reject';
                response.msg = `Spam detected: The word "${keyword}" is not allowed.`;
                console.log(JSON.stringify(response));
                return;
            }
        }

        // Basic rate-limiting logic (expand as needed)
        const isRateLimited = false; // Placeholder for rate-limiting logic
        if (isRateLimited) {
            response.action = 'reject';
            response.msg = 'Rate limit exceeded. Please slow down.';
            console.log(JSON.stringify(response));
            return;
        }

        // Accept the event if all checks pass
        response.action = 'accept';
        console.log(JSON.stringify(response));
    } catch (error) {
        console.error('Error processing event:', error);
        const response = {
            id: req && req.event ? req.event.id : 'unknown',
            action: 'reject',
            msg: 'internal error'
        };
        console.log(JSON.stringify(response));
    }
});
