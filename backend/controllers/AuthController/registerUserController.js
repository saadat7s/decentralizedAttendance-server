const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../../models/user');
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const Wallet = require('../../models/wallet');

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists');
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Generate a new wallet
        const newWallet = Keypair.generate();
        const publicKey = newWallet.publicKey.toString();
        const secretKey = Array.from(newWallet.secretKey);

        // Create the wallets directory if it doesn't exist
        const walletsDir = path.join(__dirname, '../../wallets');
        if (!fs.existsSync(walletsDir)) {
            fs.mkdirSync(walletsDir, { recursive: true });
        }

        // Save the secret key securely, e.g., encrypted or in a secure store
        const walletPath = path.join(walletsDir, `${email}.json`);
        fs.writeFileSync(walletPath, JSON.stringify(secretKey));

        console.log(`Wallet created and saved locally at ${walletPath}`);

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            publicKey // Store the public key in the user document
        });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user to the database
        await user.save();

        console.log('User saved to the database');

        // Save wallet to the database

        const wallet = new Wallet({
            email,
            publicKey,
            secretKey
        })

        await wallet.save();

        res.status(201).json({ msg: 'User registered successfully', publicKey });
    } catch (err) {
        console.error('Error in registration process:', err.message);
        res.status(500).send('Server error');
    }
};
