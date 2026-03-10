# Baker Library Battle Arena

A Pokemon-style battle game set in HBS's Baker Library where each attack triggers a real blockchain transaction on Tempo Testnet.

**XP damage dealt = tokens transferred.**

## Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/ashwanth-eth/hbs-pokemon.git
   cd hbs-pokemon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your trainer wallet addresses and private keys.

4. **Fund trainer wallets**

   Each trainer wallet needs testnet tokens to attack back. Get tokens from the Tempo testnet faucet.

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open in browser**

   Navigate to `http://localhost:3000`

7. **Connect MetaMask**

   The game will prompt you to connect and switch to Tempo Testnet.

## How It Works

- Connect your MetaMask wallet
- Choose a trainer to battle
- Each attack you make sends a real TX from your wallet to the trainer
- Each trainer attack sends a real TX from the trainer wallet to you
- Battle ends when someone's HP hits 0
- All TX hashes are clickable links to the block explorer

## Battle Moves

| Move | Damage | TX Amount | Hit Chance |
|------|--------|-----------|------------|
| Cold Email | 10 HP | 0.01 USD | 100% |
| Case Crack | 25 HP | 0.025 USD | 95% |
| Networking Blitz | 40 HP | 0.04 USD | 85% |
| Disrupt | 60 HP | 0.06 USD | 70% |

## The Trainers

- **Chad Blackstone** - PE Bro: "I modeled this outcome three ways."
- **Priya Ventures** - The Founder: "My Series A closes Thursday."
- **François McKinsey** - The Consultant: "Let me framework that for you."

## Tech Stack

- Frontend: Vanilla HTML/CSS/JS with ethers.js
- Backend: Node.js + Express (serves config, signs trainer TXs)
- Blockchain: Tempo Testnet (Chain ID: 42431)

## Network Details

- **RPC URL:** https://rpc.moderato.tempo.xyz
- **Chain ID:** 42431
- **Explorer:** https://explore.tempo.xyz
- **Currency:** USD

## Security Note

This is a **testnet demo only**. Trainer private keys are stored in `.env` which is gitignored. Never use mainnet private keys.

---

Built for HBS | Powered by Tempo
