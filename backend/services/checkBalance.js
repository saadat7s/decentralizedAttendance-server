const { Connection, PublicKey } = require('@solana/web3.js');

async function checkBalance() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletPublicKey = new PublicKey("EbyCTYWLBs5wWLFmnrevDEc5fTrGm2ezrpXf5VwRMXCM"); 
  const balance = await connection.getBalance(walletPublicKey);
  console.log(`Wallet Balance: ${balance / 1e9} SOL`); 
}

checkBalance();
