# Strfry Plugins Directory

Welcome to the Strfry Plugins Directory! This repository is a collection of plugins designed to enhance and extend the functionality of the [Strfry](https://github.com/hoytech/strfry) Nostr relay implementation. The plugins in this repository include a variety of filters, blacklists, and whitelists to help you manage the events on your Strfry relay according to your specific needs.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Using a Plugin](#using-a-plugin)
- [Plugin Categories](#plugin-categories)
  - [1. Whitelists](#1-whitelists)
  - [2. Blacklists](#2-blacklists)
  - [3. Filters](#3-filters)
- [Available Plugins](#available-plugins)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Strfry is a high-performance Nostr relay designed to handle a large number of events and connections. One of the key features of Strfry is its support for custom policy plugins, which allow you to implement specific rules for accepting or rejecting events based on various criteria. This repository contains a variety of such plugins, organized into categories like whitelists, blacklists, and filters.

## Getting Started

### Using a Plugin

1. Choose a plugin from the appropriate category in the `plugins/` directory.
2. Make the plugin executable:
   ```bash
   chmod +x /path/to/plugin.js
   ```
3. Edit your Strfry configuration (`strfry.conf`) to point to the plugin:
   ```toml
   writePolicy {
       plugin = "/path/to/plugin.js"
   }
   ```
4. Restart your Strfry service to apply the changes.

## Plugin Categories

### 1. Whitelists

Whitelists allow only specific users to post events to your relay. These plugins are ideal for creating a curated or restricted environment where only authorized users can contribute. Whitelists are particularly useful for private communities, organizational relays, or event-specific relays.

### 2. Blacklists

Blacklists are used to prevent specific users from posting events to your relay. These plugins can block known spammers, malicious users, or unwanted content, helping maintain the quality and integrity of the events on your relay.

### 3. Filters

Filters provide more complex logic for deciding which events are accepted or rejected. These can be based on event content, metadata, or even rate-limiting. Filters are useful for enforcing rules such as content moderation, spam detection, or throttling event submissions.

## Available Plugins

Here is a list of available plugins organized by category:

### Whitelists

#### 1. NIP-05 Whitelist Plugin

**File**: `plugins/whitelist_nip05_plugin.js`

**Description**: This plugin allows only users listed in a NIP-05 compliant JSON file to post events to your relay. The whitelist is fetched from a specified URL and is periodically updated. Events from non-whitelisted users are rejected with a custom error message.

**Usage**: Ideal for relays that want to restrict posting to members of a specific community or organization that maintains a NIP-05 list.

### Blacklists

#### 1. Simple Blacklist Plugin

**File**: `plugins/blacklist_simple_plugin.js`

**Description**: This plugin blocks events from users whose public keys are listed in a simple blacklist file. The blacklist is managed locally and can be updated as needed. Events from blacklisted users are rejected with a custom error message.

**Usage**: Useful for blocking known spammers or unwanted users from posting to your relay.

### Filters

#### 1. Rate Limiter Plugin

**File**: `plugins/rate_limiter_plugin.js`

**Description**: This plugin implements a rate-limiting mechanism to prevent abuse of your relay. It limits the number of events a user can post within a specific timeframe. If the rate limit is exceeded, further events from the user are rejected with a rate limit exceeded message.

**Usage**: Ideal for preventing flooding or excessive posting by users.

#### 2. Spam Filter Plugin

**File**: `plugins/spam_filter_plugin.js`

**Description**: This plugin uses simple heuristics to filter out spammy events. It checks event content for common spam indicators (e.g., certain keywords or excessive links) and rejects events that appear to be spam.

**Usage**: Useful for relays that want to maintain a clean and relevant event stream by filtering out obvious spam.

## Contributing

We welcome contributions to this repository! If you have a plugin you would like to share or improvements to existing plugins, please feel free to submit a pull request.

### How to Contribute

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Create a new Pull Request.

## License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
```

---

This `README.md` is structured to be clear and user-friendly, making it easy for others to understand how to use and contribute to your `strfry` plugins repository. Simply copy and paste this content into your `README.md` file on GitHub.
