# Azzamo NIP-05 Filter

The **Azzamo NIP-05 Filter** is a plugin designed for use with the [strfry relay server](https://github.com/fiatjaf/strfry). It enforces access control on the relay by using a whitelist of authorized public keys obtained from a NIP-05 compliant JSON file hosted at a specific URL. This plugin ensures that only authorized pubkeys are permitted to interact with the relay.

## Features

- **NIP-05 Whitelist Enforcement**: Only public keys listed in the NIP-05 JSON file are allowed to connect to and use the relay.
- **Automatic Whitelist Updates**: The whitelist is updated every 10 minutes to ensure the latest authorized public keys are used.
- **Real-time Event Processing**: The plugin reads incoming events, checks the pubkey against the whitelist, and either accepts or rejects the event.
- **Lightweight and Efficient**: Uses in-memory storage of the whitelist for fast access and decision making.

## Installation

1. Clone the `Azzamo NIP-05 Filter` into your strfry `plugins/` directory:

```bash
cd /path/to/strfry/plugins/
git clone https://github.com/azzamo/azzamo-nip05-filter.git
