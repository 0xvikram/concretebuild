# Concrete Build - Setup Guide

## Project Overview

Concrete Build is a Web3 RWA (Real World Asset) property tokenization platform on Ethereum Mainnet. This guide will help you set up the development environment and understand the project structure.

## Prerequisites

- Node.js 18+ and pnpm
- Git
- A code editor (VS Code recommended)
- MetaMask or another Web3 wallet
- Alchemy account (for RPC endpoints)
- Etherscan API key (for contract verification)

## Project Structure

```
concretebuild/
├── apps/
│   ├── web/              # Main Next.js frontend application
│   └── docs/             # Documentation site
├── packages/
│   ├── contracts/        # Smart contracts (Hardhat)
│   ├── ui/               # Shared UI components
│   ├── eslint-config/    # Shared ESLint config
│   └── typescript-config/# Shared TypeScript config
└── action-plan.md        # Complete project specification
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

#### Contracts Package

```bash
cd packages/contracts
cp .env.example .env
```

Edit `.env` and add:
- `ALCHEMY_MAINNET_RPC_URL` - Your Alchemy Ethereum Mainnet RPC URL
- `ALCHEMY_SEPOLIA_RPC_URL` - Your Alchemy Sepolia testnet RPC URL
- `DEPLOYER_PRIVATE_KEY` - Private key for contract deployment (NEVER commit this!)
- `ETHERSCAN_API_KEY` - Your Etherscan API key for contract verification

### 3. Compile Smart Contracts

```bash
cd packages/contracts
pnpm compile
```

### 4. Run Tests

```bash
cd packages/contracts
pnpm test
```

## Architecture Overview

### Smart Contracts

**PropertyEscrow.sol** (Per-Property)
- Handles USDC investment intake
- Tracks proportional ownership
- Manages profit distribution
- Pull-based profit claiming

**CBDRewardDistributor.sol** (Platform-Wide)
- Issues CBLD rewards for platform activities
- Configurable reward amounts
- Batch reward operations

### Key Addresses (Ethereum Mainnet)

- **CBLD Token:** `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983` (already deployed)
- **USDC:** `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

## Development Workflow

### Phase 1: Smart Contracts (Current)

1. ✅ Set up Hardhat project
2. ✅ Write PropertyEscrow.sol
3. ✅ Write CBDRewardDistributor.sol
4. ⏳ Write comprehensive unit tests
5. ⏳ Deploy to Sepolia testnet
6. ⏳ Integration testing
7. ⏳ Deploy to Ethereum Mainnet

### Phase 2: Backend (Next)

1. Set up Supabase database
2. Implement SIWE authentication
3. Build API endpoints
4. Set up event sync worker

### Phase 3: Frontend (After Backend)

1. Build marketplace UI
2. Implement investment flow
3. Create investor dashboard
4. Build admin panel

## Next Steps

### For Smart Contract Development

1. **Write Unit Tests** - Create comprehensive tests in `packages/contracts/test/`
   - Test all PropertyEscrow functions
   - Test CBDRewardDistributor functions
   - Test edge cases and access control
   - Target: 95%+ code coverage

2. **Deploy to Sepolia** - Test on testnet before mainnet
   ```bash
   cd packages/contracts
   pnpm deploy:sepolia
   ```

3. **Verify Contracts** - Verify on Etherscan
   ```bash
   pnpm verify:sepolia
   ```

### For Database Setup

1. Create a Supabase project at https://supabase.com
2. Apply the database schema from `action-plan.md` Section 9
3. Configure environment variables with Supabase credentials

### For Frontend Development

1. Set up wagmi + RainbowKit for wallet connection
2. Configure Next.js with Tailwind CSS
3. Build component library
4. Implement pages according to `action-plan.md` Section 8

## Important Security Notes

⚠️ **NEVER commit private keys or sensitive credentials to Git**

- Use `.env` files (already in `.gitignore`)
- Use environment variables for all sensitive data
- For production, use a multisig wallet (Gnosis Safe) for admin operations
- Always test on testnet before deploying to mainnet

## Resources

- **Action Plan:** See `action-plan.md` for complete specifications
- **Contracts README:** See `packages/contracts/README.md` for contract details
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/5.x/
- **Hardhat Docs:** https://hardhat.org/docs
- **Supabase Docs:** https://supabase.com/docs

## Getting Help

If you encounter issues:

1. Check the action plan for detailed specifications
2. Review contract comments and documentation
3. Check Hardhat/OpenZeppelin documentation
4. Ensure all environment variables are set correctly

## Current Status

✅ **Completed:**
- Project structure setup
- Hardhat configuration
- PropertyEscrow.sol contract
- CBDRewardDistributor.sol contract
- Dependencies installed

⏳ **Next Tasks:**
- Write unit tests for contracts
- Set up Supabase database
- Deploy to Sepolia testnet

---

**Last Updated:** May 27, 2026
