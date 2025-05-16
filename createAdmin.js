// createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Wallet = require('./models/wallet');
const { Keypair } = require('@solana/web3.js');
require('dotenv').config();

async function createAdmin() {
  const MONGO_URI = process.env.MONGO_URI;

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('An admin already exists. Exiting...');
      process.exit(1);
    }

    // Admin details
    const name = 'Super Admin';
    const email = 'admin@example.com';
    const password = 'AdminPassword123'; // Use a strong password here or read from .env

    // Create new Solana wallet
    const newWallet = Keypair.generate();
    const publicKey = newWallet.publicKey.toString();
    const secretKey = Array.from(newWallet.secretKey);

    // Create new User with admin role
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      publicKey
    });

    // Save the admin user to the database
    await adminUser.save();

    // Save wallet details
    const wallet = new Wallet({
      email,
      publicKey,
      secretKey
    });
    await wallet.save();

    console.log('Admin user created successfully with the following details:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Public Key: ${publicKey}`);
    console.log('Keep this information safe.');

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
