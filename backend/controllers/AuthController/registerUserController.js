const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Keypair, LAMPORTS_PER_SOL, Connection, clusterApiUrl, Transaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const User = require('../../models/user');
const Wallet = require('../../models/wallet');
const { decode } = require('bs58');

// Load environment variables
require('dotenv').config();

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

        // Generate a new wallet for the user
        const newWallet = Keypair.generate();
        const publicKey = newWallet.publicKey.toString();
        const secretKey = Array.from(newWallet.secretKey);

        // Load the funding wallet (ANCHOR_WALLET) from the file specified in the environment variable
        const fundingWalletPath = process.env.ANCHOR_WALLET;
        const fundingWalletSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(fundingWalletPath)));
        const fundingWallet = Keypair.fromSecretKey(fundingWalletSecretKey);

        // Establish a connection to the Solana cluster
        const connection = new Connection(process.env.ANCHOR_PROVIDER_URL, 'confirmed');

        // Transfer SOL from the funding wallet to the new wallet
        const transferTransaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fundingWallet.publicKey,
                toPubkey: newWallet.publicKey,
                lamports: 1 * LAMPORTS_PER_SOL // Transfer 1 SOL
            })
        );

        // Send the transaction
        const signature = await connection.sendTransaction(transferTransaction, [fundingWallet]);
        await connection.confirmTransaction(signature);

        console.log(`1 SOL transferred to new wallet with public key ${publicKey}`);

        // Save the secret key securely
        const walletsDir = path.join(__dirname, '../../wallets');
        if (!fs.existsSync(walletsDir)) {
            fs.mkdirSync(walletsDir, { recursive: true });
        }

        const walletPath = path.join(walletsDir, `${email}.json`);
        fs.writeFileSync(walletPath, JSON.stringify(secretKey));

        console.log(`Wallet created and saved locally at ${walletPath}`);

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            publicKey // Correctly refer to the publicKey field
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
        });

        await wallet.save();

        res.status(201).json({ msg: 'User registered successfully', publicKey });
    } catch (err) {
        console.error('Error in registration process:', err.message);
        res.status(500).send('Server error');
    }
};
