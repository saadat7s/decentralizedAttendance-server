// vercel-solana-adapter.js
const fs = require('fs');
const path = require('path');

function getWalletKeyFromEnv() {
  try {
    // Check if we're running on Vercel
    if (process.env.VERCEL) {
      // Use content from environment variable
      return Uint8Array.from(JSON.parse(process.env.ANCHOR_WALLET_CONTENT));
    } else {
      // Local development - use file
      return Uint8Array.from(JSON.parse(
        fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8')
      ));
    }
  } catch (err) {
    console.error('Error loading wallet key:', err);
    throw err;
  }
}

module.exports = { getWalletKeyFromEnv };