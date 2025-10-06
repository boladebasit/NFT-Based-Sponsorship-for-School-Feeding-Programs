# 🍎 NFT-Based Sponsorship for School Feeding Programs

Welcome to a revolutionary Web3 project that tackles global hunger in schools! This initiative uses NFTs on the Stacks blockchain to enable transparent, verifiable sponsorship of school feeding programs. Donors mint NFTs representing their contributions, with proceeds directly funding meals for children in need. Blockchain ensures every donation is tracked, immutable, and auditable, solving issues like lack of transparency in traditional charities, donor trust, and inefficient fund allocation.

## ✨ Features

🌍 Sponsor real-world meals: Each NFT represents a specific number of school meals sponsored.
🔒 Transparent fund tracking: All donations and distributions are on-chain for public verification.
🎨 Customizable NFTs: Donors get unique, collectible NFTs with metadata tied to their impact (e.g., number of meals, school location).
📊 Governance for donors: NFT holders can vote on program expansions or partnerships.
✅ Oracle-verified impact: Real-world meal distributions confirmed via oracles.
💰 Reward system: Stakers of NFTs earn tokens from a community pool.
🚫 Fraud prevention: Smart contracts enforce rules to avoid duplicates or misuse.
📈 Scalable for multiple programs: Register and manage various school feeding initiatives globally.

## 🛠 How It Works

**For Donors/Sponsors**

- Choose a sponsorship level (e.g., 10 meals, 100 meals) and mint an NFT by sending STX (Stacks token) to the donation pool.
- The NFT is generated with metadata including your sponsorship details, a unique ID, and impact stats.
- Track your contribution's use via on-chain queries—see when meals are distributed and verified.

**For Program Administrators (Schools/Charities)**

- Register your school feeding program in the registry contract.
- Request fund releases from the treasury, providing oracle-verified proof of meal distributions.
- Use the verification contract to confirm and record deliveries, updating NFT metadata for donors.

**For Verifiers/Community**

- Query any NFT or program to view donation flows, distributions, and impact metrics.
- Participate in governance votes if holding NFTs or governance tokens.
- Stake NFTs to earn rewards from a portion of future donations.

This project leverages Clarity smart contracts on Stacks for security and Bitcoin-anchored immutability. Funds are held in escrow until verified, ensuring accountability.

## 📑 Smart Contracts Overview

The project is built with 8 interconnected Clarity smart contracts for modularity, security, and scalability:

1. **NFT-Minter.clar**: Handles minting of sponsorship NFTs. Defines traits for NFTs, mint function with payment validation, and metadata storage (title, meals sponsored, image URI).
   
2. **Donation-Pool.clar**: A treasury contract that collects STX donations from NFT mints. Includes deposit functions, balance queries, and withdrawal rules tied to governance approvals.

3. **Program-Registry.clar**: Registers school feeding programs with details like location, admin principal, and capacity. Prevents duplicates and allows updates only by verified admins.

4. **Impact-Oracle.clar**: Integrates with external oracles to verify real-world data (e.g., number of meals delivered). Stores verified events on-chain for transparency.

5. **Verification-Engine.clar**: Allows admins to submit proofs of distribution, cross-checked against oracle data. Updates NFT metadata and releases funds from the pool.

6. **Governance-Token.clar**: Issues a fungible token (e.g., FEED-TOKEN) for governance. Minted as rewards or airdropped to NFT holders.

7. **Staking-Vault.clar**: Enables NFT staking for rewards. Locks NFTs, distributes governance tokens based on stake duration and donation pool yields.

8. **Voting-Mechanism.clar**: Facilitates DAO-style voting for NFT and token holders. Proposals for fund allocation, new programs, or parameter changes; enforces quorum and execution.

These contracts interact via traits (e.g., SIP-010 for tokens, SIP-009 for NFTs) for composability. For example, minting an NFT in NFT-Minter triggers a deposit to Donation-Pool and registers impact in Verification-Engine.

## 🚀 Getting Started

1. Set up a Stacks wallet (e.g., Hiro Wallet).
2. Deploy the contracts using Clarity tools on the Stacks testnet.
3. Interact via the Stacks Explorer or custom frontend: Call `mint-sponsorship` in NFT-Minter with your payment.
4. Verify via `get-program-details` in Program-Registry or `check-impact` in Verification-Engine.

Join the fight against child hunger—one NFT at a time! For full code, check the repo's `contracts/` directory. Contributions welcome!