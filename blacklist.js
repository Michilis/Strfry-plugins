#!/usr/bin/env node

// Define your whitelist and blacklist as objects
const whiteList = {}; // Start with an empty whitelist, meaning whitelist is disabled
const blackList = {
    'npub1exampleblacklistpubkey1': true,
    'npub1exampleblacklistpubkey2': true,
    'npub1exampleblacklistpubkey3': true,
};

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
    let req;

    try {
        req = JSON.parse(line);
    } catch (e) {
        console.error("Failed to parse input line as JSON:", e);
        return;
    }

    if (req.type !== 'new') {
        console.error("Unexpected request type");
        return;
    }

    const pubkey = req.event.pubkey;
    let res = { id: req.event.id, action: 'reject', msg: 'You are not allowed to post to this relay.' };

    // Check if the pubkey is on the blacklist
    if (blackList[pubkey]) {
        res.msg = 'You are blacklisted from posting to this relay.';
    }
    // If the whitelist is not empty, check the pubkey against the whitelist
    else if (Object.keys(whiteList).length > 0 && whiteList[pubkey]) {
        res.action = 'accept';
        delete res.msg; // Remove the msg if the event is accepted
    }
    // If the whitelist is not empty and the pubkey is not in the whitelist, reject the event
    else if (Object.keys(whiteList).length > 0) {
        res.msg = 'You are not whitelisted to post to this relay.';
    }
    // If the whitelist is empty, accept all events not blacklisted
    else {
        res.action = 'accept';
        delete res.msg; // Remove the msg if the event is accepted
    }

    console.log(JSON.stringify(res));
});
