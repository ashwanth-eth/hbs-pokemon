# Baker Library Battle Arena

A Pokemon-style battle game set in HBS's Baker Library where **every attack triggers a real blockchain transaction** on Tempo Testnet.

**Deal damage = Stake tokens. Win = Claim the pot. Lose = Forfeit everything.**

---

## Important: Local Setup Required

This game runs **locally on your machine**. There is no hosted version. To play, you'll need to:

1. Clone this repo and run it on your computer
2. Create your own crypto wallets (just need private keys)
3. Get free testnet tokens from the Tempo Faucet

**No real money required** - this uses Tempo Testnet tokens which are free.

---

## Setup Guide

### Step 1: Clone and Install

```bash
git clone https://github.com/ashwanth-eth/hbs-pokemon.git
cd hbs-pokemon
npm install
```

### Step 2: Create Your Wallets

You need 2 private keys. Generate them at [vanity-eth.tk](https://vanity-eth.tk/):

1. Go to https://vanity-eth.tk/
2. Click "Generate" to create a random wallet
3. Save both the **Address** (starts with `0x`, 42 characters) and **Private Key** (starts with `0x`, 66 characters)
4. Generate a second wallet the same way

You'll have:
- **Wallet 1**: Your player wallet (stakes tokens in battles)
- **Wallet 2**: The escrow wallet (holds the battle pot)

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Open `.env` in a text editor and paste your private keys:

```env
# Wallet 1 - Your player wallet private key
PLAYER_WALLET=0xabc123...your_64_character_private_key_here

# Wallet 2 - Escrow wallet private key
TRAINER_1_PRIVATE_KEY=0xdef456...your_64_character_private_key_here
TRAINER_1_NAME=Chad Blackstone
```

### Step 4: Get Free Testnet Tokens

1. Go to the **Tempo Testnet Faucet**: https://faucet.tempo.xyz
2. Paste your **Wallet 1 ADDRESS** (the 42-character address, NOT the private key)
3. Request **pathUSD** tokens (you need these to play)
4. Paste your **Wallet 2 ADDRESS** and request a small amount (for gas fees)

### Step 5: Run the Game

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║   BAKER LIBRARY BATTLE ARENA                           ║
║   Server running at http://localhost:3000              ║
║   Battle Token: pathUSD                                ║
╚════════════════════════════════════════════════════════╝
```

### Step 6: Play

Open http://localhost:3000 in your browser. Use arrow keys to move, SPACE to battle trainers.

---

## How the Game Works

### Escrow Battle System

1. **Choose your persona** - PE Bro (FINANCE), Tech Founder (TECH), or Consultant (STRATEGY)
2. **Walk around Baker Library** and challenge trainers
3. **Every attack stakes real tokens** into an escrow pot
4. **Win the battle** = Claim your entire pot back (break even)
5. **Lose the battle** = Forfeit all staked tokens to escrow

### Type System

Your persona determines what damage you **TAKE**. Your move's type determines what damage you **DEAL**.

```
TECH beats FINANCE (2x damage)
FINANCE beats STRATEGY (2x damage)
STRATEGY beats TECH (2x damage)
```

| Trainer | Type | Weak To |
|---------|------|---------|
| Chad Blackstone | FINANCE | TECH moves |
| Priya Ventures | TECH | STRATEGY moves |
| François McKinsey | STRATEGY | FINANCE moves |

| Move | Type | Damage | Cost | Strong Against |
|------|------|--------|------|----------------|
| Cold Email | STRATEGY | 10 | 0.10 | Priya |
| Case Crack | STRATEGY | 25 | 0.25 | Priya |
| Network Blitz | FINANCE | 40 | 0.40 | François |
| Disrupt | TECH | 60 | 0.60 | Chad |

### Market Conditions

Random events (35% chance per turn) that debuff specific types:

- **SUPERDAY** - FINANCE types deal 50% damage
- **MARKETS KILL SAAS** - TECH types deal 50% damage
- **PLS FIX** - STRATEGY types deal 50% damage

### Budget System

| Game | Budget |
|------|--------|
| Game 1 | 2.00 tokens |
| Game 2 | 1.50 tokens |
| Game 3 | 1.00 tokens |

Run out of budget? You'll have to **forfeit** and lose all staked tokens.

### Healing

| Item | HP Restored | Cost |
|------|-------------|------|
| Energy Drink | +20 HP | 0.20 |
| Adderall | +40 HP | 0.40 |

---

## Network Details

| Setting | Value |
|---------|-------|
| Network | Tempo Testnet (Moderato) |
| RPC URL | https://rpc.moderato.tempo.xyz |
| Chain ID | 42431 |
| Explorer | https://explore.tempo.xyz |
| Faucet | https://faucet.tempo.xyz |
| Battle Token | pathUSD (`0x20c0000000000000000000000000000000000000`) |

---

## Troubleshooting

**"Transaction failed" errors:**
- Make sure your player wallet has enough pathUSD tokens
- Make sure your escrow wallet has some tokens for gas

**Game won't start:**
- Check that `.env` file exists with valid private keys
- Private keys must start with `0x` and be 66 characters long

**Can't get faucet tokens:**
- Make sure you're pasting the ADDRESS (42 chars), not the private key (66 chars)
- Try waiting a few minutes between requests

---

## Security Note

- This is a **testnet demo only** - tokens have no real value
- Private keys are stored in `.env` which is gitignored
- **Never use mainnet private keys or real funds**
- The game runs locally - your keys never leave your machine

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS with ethers.js
- **Backend:** Node.js + Express (server-side wallet signing)
- **Blockchain:** Tempo Testnet (Chain ID: 42431)
- **Token:** pathUSD (TIP-20/ERC-20)

---

Built for HBS | Powered by Tempo
