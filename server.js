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

// Use TRAINER_1 wallet as the escrow/pot holder
function getEscrowAddress() {
  return getAddressFromKey(process.env.TRAINER_1_PRIVATE_KEY);
}

function getEscrowPrivateKey() {
  return process.env.TRAINER_1_PRIVATE_KEY;
}

// API endpoint to get game config
app.get('/api/config', (req, res) => {
  const trainers = [
    { name: process.env.TRAINER_1_NAME || 'Chad Blackstone' },
    { name: process.env.TRAINER_2_NAME || 'Priya Ventures' },
    { name: process.env.TRAINER_3_NAME || 'François McKinsey' },
  ];

  res.json({
    rpcUrl: process.env.RPC_URL || 'https://rpc.moderato.tempo.xyz',
    chainId: parseInt(process.env.CHAIN_ID) || 42431,
    explorerUrl: process.env.EXPLORER_URL || 'https://explore.tempo.xyz',
    playerAddress: getAddressFromKey(process.env.PLAYER_WALLET),
    escrowAddress: getEscrowAddress(),
    battleToken: BATTLE_TOKEN,
    trainers,
  });
});

// ============================================
// ESCROW-BASED BATTLE SYSTEM
// ============================================

// Player stakes tokens into escrow (for attacks or heals)
// Player wallet → Escrow wallet
app.post('/api/stake', express.json(), async (req, res) => {
  const { amount, reason } = req.body; // reason: 'attack' or 'heal'

  const playerPrivateKey = process.env.PLAYER_WALLET;
  const escrowAddress = getEscrowAddress();

  if (!playerPrivateKey) {
    return res.status(400).json({ error: 'Player wallet not configured' });
  }

  if (!escrowAddress) {
    return res.status(400).json({ error: 'Escrow wallet not configured' });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(playerPrivateKey, provider);
    const token = new ethers.Contract(BATTLE_TOKEN, ERC20_ABI, wallet);

    let decimals;
    try {
      decimals = await token.decimals();
    } catch {
      decimals = 18;
    }

    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

    console.log(`Player stakes ${amount} pathUSD into escrow (${reason})`);

    const tx = await token.transfer(escrowAddress, tokenAmount);
    const receipt = await tx.wait();

    console.log(`Stake TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('Stake TX failed:', error);
    res.status(500).json({
      error: 'Transaction failed',
      message: error.message,
    });
  }
});

// Player claims pot from escrow (on victory)
// Escrow wallet → Player wallet
app.post('/api/claim-pot', express.json(), async (req, res) => {
  const { amount } = req.body;

  const escrowPrivateKey = getEscrowPrivateKey();
  const playerAddress = getAddressFromKey(process.env.PLAYER_WALLET);

  if (!escrowPrivateKey) {
    return res.status(400).json({ error: 'Escrow wallet not configured' });
  }

  if (!playerAddress) {
    return res.status(400).json({ error: 'Player wallet not configured' });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(escrowPrivateKey, provider);
    const token = new ethers.Contract(BATTLE_TOKEN, ERC20_ABI, wallet);

    let decimals;
    try {
      decimals = await token.decimals();
    } catch {
      decimals = 18;
    }

    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

    console.log(`Player claims ${amount} pathUSD from escrow (VICTORY!)`);

    const tx = await token.transfer(playerAddress, tokenAmount);
    const receipt = await tx.wait();

    console.log(`Claim TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('Claim TX failed:', error);
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
  ║   ESCROW MODEL: Stakes go to pot, winner claims all   ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});
