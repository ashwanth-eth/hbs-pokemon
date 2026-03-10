require('dotenv').config();
const express = require('express');
const path = require('path');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper: derive address from private key
function getAddressFromKey(privateKey) {
  if (!privateKey || privateKey === '0x...') return null;
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch {
    return null;
  }
}

// API endpoint to get game config (keeps private keys server-side for trainer TXs)
app.get('/api/config', (req, res) => {
  // Derive addresses from private keys
  const trainers = [
    {
      name: process.env.TRAINER_1_NAME || 'Chad Blackstone',
      address: getAddressFromKey(process.env.TRAINER_1_PRIVATE_KEY),
    },
    {
      name: process.env.TRAINER_2_NAME || 'Priya Ventures',
      address: getAddressFromKey(process.env.TRAINER_2_PRIVATE_KEY),
    },
    {
      name: process.env.TRAINER_3_NAME || 'François McKinsey',
      address: getAddressFromKey(process.env.TRAINER_3_PRIVATE_KEY),
    },
  ];

  res.json({
    rpcUrl: process.env.RPC_URL || 'https://rpc.moderato.tempo.xyz',
    chainId: parseInt(process.env.CHAIN_ID) || 42431,
    explorerUrl: process.env.EXPLORER_URL || 'https://explore.tempo.xyz',
    trainers,
  });
});

// API endpoint for trainer attacks (server signs TX with trainer's private key)
app.post('/api/trainer-attack', express.json(), async (req, res) => {
  const { trainerIndex, playerAddress, amount } = req.body;

  // Get trainer private key based on index
  const privateKeys = [
    process.env.TRAINER_1_PRIVATE_KEY,
    process.env.TRAINER_2_PRIVATE_KEY,
    process.env.TRAINER_3_PRIVATE_KEY,
  ];

  const privateKey = privateKeys[trainerIndex];

  if (!privateKey) {
    return res.status(400).json({ error: 'Trainer not configured' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://rpc.moderato.tempo.xyz'
    );
    const wallet = new ethers.Wallet(privateKey, provider);

    // Send transaction from trainer to player
    const tx = await wallet.sendTransaction({
      to: playerAddress,
      value: ethers.parseEther(amount.toString()),
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('Trainer attack TX failed:', error);
    res.status(500).json({
      error: 'Transaction failed',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║   🏛️  BAKER LIBRARY BATTLE ARENA  🏛️                   ║
  ║                                                        ║
  ║   Server running at http://localhost:${PORT}             ║
  ║                                                        ║
  ║   Make sure you have:                                  ║
  ║   1. Copied .env.example to .env                       ║
  ║   2. Added your trainer private keys                   ║
  ║   3. Funded trainer wallets with testnet tokens        ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});
