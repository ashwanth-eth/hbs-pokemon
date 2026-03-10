require('dotenv').config();
const express = require('express');
const path = require('path');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

// TIP-20/ERC-20 Token Addresses on Tempo Testnet
const TOKENS = {
  pathUSD: '0x20c0000000000000000000000000000000000000',
  AlphaUSD: '0x20c0000000000000000000000000000000000001',
  BetaUSD: '0x20c0000000000000000000000000000000000002',
  ThetaUSD: '0x20c0000000000000000000000000000000000003',
};

// Use pathUSD as the battle token
const BATTLE_TOKEN = TOKENS.pathUSD;

// ERC-20 ABI (just the functions we need)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

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

// Helper: get provider
function getProvider() {
  return new ethers.JsonRpcProvider(
    process.env.RPC_URL || 'https://rpc.moderato.tempo.xyz'
  );
}

// API endpoint to get game config
app.get('/api/config', (req, res) => {
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
    playerAddress: getAddressFromKey(process.env.PLAYER_WALLET),
    battleToken: BATTLE_TOKEN,
    trainers,
  });
});

// API endpoint for player attacks (ERC-20 token transfer)
// Player deals damage → Trainer loses money → Trainer sends to Player
app.post('/api/player-attack', express.json(), async (req, res) => {
  const { trainerIndex, amount } = req.body;

  // Get the trainer's private key (they're the one losing money)
  const privateKeys = [
    process.env.TRAINER_1_PRIVATE_KEY,
    process.env.TRAINER_2_PRIVATE_KEY,
    process.env.TRAINER_3_PRIVATE_KEY,
  ];

  const privateKey = privateKeys[trainerIndex];
  const playerAddress = getAddressFromKey(process.env.PLAYER_WALLET);

  if (!privateKey) {
    return res.status(400).json({ error: 'Trainer wallet not configured' });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create token contract instance
    const token = new ethers.Contract(BATTLE_TOKEN, ERC20_ABI, wallet);

    // Get decimals (cache this in production)
    let decimals;
    try {
      decimals = await token.decimals();
    } catch {
      decimals = 18; // Default to 18 if decimals() fails
    }

    // Parse amount with correct decimals
    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

    console.log(`Player attacks! Trainer loses ${amount} pathUSD → sent to player`);

    // Transfer tokens FROM trainer TO player (trainer loses money)
    const tx = await token.transfer(playerAddress, tokenAmount);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`Player attack TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('Player attack TX failed:', error);
    res.status(500).json({
      error: 'Transaction failed',
      message: error.message,
    });
  }
});

// API endpoint for trainer attacks (ERC-20 token transfer)
// Trainer deals damage → Player loses money → Player sends to Trainer
app.post('/api/trainer-attack', express.json(), async (req, res) => {
  const { trainerIndex, amount } = req.body;

  // Get trainer address (they receive the money)
  const trainerAddresses = [
    getAddressFromKey(process.env.TRAINER_1_PRIVATE_KEY),
    getAddressFromKey(process.env.TRAINER_2_PRIVATE_KEY),
    getAddressFromKey(process.env.TRAINER_3_PRIVATE_KEY),
  ];

  const trainerAddress = trainerAddresses[trainerIndex];
  const playerPrivateKey = process.env.PLAYER_WALLET;

  if (!playerPrivateKey) {
    return res.status(400).json({ error: 'Player wallet not configured' });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(playerPrivateKey, provider);

    // Create token contract instance
    const token = new ethers.Contract(BATTLE_TOKEN, ERC20_ABI, wallet);

    // Get decimals
    let decimals;
    try {
      decimals = await token.decimals();
    } catch {
      decimals = 18;
    }

    // Parse amount with correct decimals
    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

    console.log(`Trainer attacks! Player loses ${amount} pathUSD → sent to trainer`);

    // Transfer tokens FROM player TO trainer (player loses money)
    const tx = await token.transfer(trainerAddress, tokenAmount);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`Trainer attack TX confirmed: ${tx.hash}`);

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

// Null address for burning tokens (healing)
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

// API endpoint for player healing (burns tokens to null address)
app.post('/api/player-heal', express.json(), async (req, res) => {
  const { amount } = req.body;

  const playerPrivateKey = process.env.PLAYER_WALLET;

  if (!playerPrivateKey) {
    return res.status(400).json({ error: 'Player wallet not configured' });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(playerPrivateKey, provider);

    // Create token contract instance
    const token = new ethers.Contract(BATTLE_TOKEN, ERC20_ABI, wallet);

    // Get decimals
    let decimals;
    try {
      decimals = await token.decimals();
    } catch {
      decimals = 18;
    }

    // Parse amount with correct decimals
    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

    console.log(`Player heals! Burning ${amount} pathUSD to null address`);

    // Transfer tokens to null address (burn)
    const tx = await token.transfer(NULL_ADDRESS, tokenAmount);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`Heal TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('Heal TX failed:', error);
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
  ║   Battle Token: pathUSD                                ║
  ║   ${BATTLE_TOKEN}       ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});
