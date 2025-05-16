// models/wallet.js

const mongoose = require('mongoose');

// Define the wallet schema
const walletSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    publicKey: {
        type: String,
        required: true
    },
    secretKey: {
        type: [Number], // Use an array of numbers to store the secret key
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Wallet', walletSchema);
