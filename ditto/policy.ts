import { NPolicy, NostrEvent, NostrRelayOK } from '@nostrify/nostrify';

// Define a list of blacklisted words
const blacklistedWords: string[] = [
  'airdrop',
  'Gm, from wss://',
  'ReplyGuy',
  'eth',
  'ethereum'
];

export default class AppPolicy implements NPolicy {
  async call(event: NostrEvent): Promise<NostrRelayOK> {
    // Check the event content for blacklisted words
    if (blacklistedWords.some(word => event.content.includes(word))) {
      console.log(`Event rejected due to blacklisted content: ${event.content}`);
      return ['OK', event.id, true, 'blocked: content contains prohibited words'];
    }

    // Check the user's metadata (e.g., username or bio) for blacklisted words
    const usernameTag = event.tags.find(tag => tag[0] === 'p');  // 'p' tag for pubkey-related metadata
    if (usernameTag && blacklistedWords.some(word => usernameTag.includes(word))) {
      console.log(`Event rejected due to blacklisted metadata: ${usernameTag}`);
      return ['OK', event.id, true, 'blocked: user metadata contains prohibited words'];
    }

    // Allow the event to pass through if no blacklisted words are found
    return ['OK', event.id, true, ''];
  }
}
