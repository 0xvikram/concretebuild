# Quick Deployment Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] Alchemy account with API key
- [ ] Etherscan API key
- [ ] NeonDB account
- [ ] Wallet with Sepolia ETH for testnet (or mainnet ETH for production)

## Step 1: Environment Setup

### Contracts Package
```bash
cd packages/contracts
cp .env.example .env
```

Edit `.env`:
```env
ALCHEMY_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key
```

### Backend Package
```bash
cd packages/backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-random-secret-key
PORT=3001
```

## Step 2: Deploy to Sepolia Testnet

```bash
cd packages/contracts

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Sepolia
pnpm deploy:sepolia
```

**Expected Output:**
```
Mock USDC deployed to: 0x...
Mock CBLD deployed to: 0x...
CBDRewardDistributor deployed to: 0x...
PropertyEscrow (Example) deployed to: 0x...
```

**Save these addresses!**

## Step 3: Verify Contracts on Etherscan

```bash
# Verify Mock USDC
npx hardhat verify --network sepolia <USDC_ADDRESS> "USD Coin" "USDC" 6

# Verify Mock CBLD
npx hardhat verify --network sepolia <CBLD_ADDRESS> "Concrete Build" "CBLD" 18

# Verify CBDRewardDistributor
npx hardhat verify --network sepolia <DISTRIBUTOR_ADDRESS> \
  <CBLD_ADDRESS> <ADMIN_ADDRESS> 500000000000000000000 0 100000000000000000000
```

## Step 4: Set Up Database

### Create NeonDB Project
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

### Run Migrations
```bash
cd packages/backend

# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

## Step 5: Start Backend Server

```bash
cd packages/backend
pnpm dev
```

Server should start on http://localhost:3001

Test health endpoint:
```bash
curl http://localhost:3001/health
```

## Step 6: Test the System

### Test Investment Flow

1. **Activate Property** (from admin wallet):
```javascript
const propertyEscrow = await ethers.getContractAt("PropertyEscrow", ESCROW_ADDRESS);
await propertyEscrow.activateProperty();
```

2. **Approve USDC**:
```javascript
const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
await usdc.approve(ESCROW_ADDRESS, ethers.parseUnits("1000", 6));
```

3. **Invest**:
```javascript
await propertyEscrow.invest(ethers.parseUnits("1000", 6));
```

4. **Issue CBLD Reward** (9% = 90 CBLD for $1000):
```javascript
const distributor = await ethers.getContractAt("CBDRewardDistributor", DISTRIBUTOR_ADDRESS);
await distributor.issueInvestmentReward(
  investorAddress,
  ethers.parseUnits("1000", 6),
  1 // propertyId
);
```

## Step 7: Deploy to Mainnet (Production)

⚠️ **ONLY AFTER THOROUGH TESTING ON SEPOLIA**

```bash
cd packages/contracts

# Deploy to mainnet
pnpm deploy:mainnet
```

**Post-Deployment Checklist:**
- [ ] Verify contracts on Etherscan
- [ ] Exclude CBDRewardDistributor from CBLD fees
- [ ] Fund distributor with CBLD tokens
- [ ] Transfer admin role to multisig wallet
- [ ] Update backend .env with mainnet addresses
- [ ] Set up Alchemy webhooks for event sync

## Common Commands

### Contracts
```bash
# Compile
pnpm --filter @repo/contracts compile

# Test
pnpm --filter @repo/contracts test

# Test with coverage
pnpm --filter @repo/contracts test:coverage

# Deploy to Sepolia
pnpm --filter @repo/contracts deploy:sepolia

# Deploy to Mainnet
pnpm --filter @repo/contracts deploy:mainnet
```

### Backend
```bash
# Development
pnpm --filter @repo/backend dev

# Build
pnpm --filter @repo/backend build

# Start production
pnpm --filter @repo/backend start

# Database
pnpm --filter @repo/backend db:generate
pnpm --filter @repo/backend db:migrate
pnpm --filter @repo/backend db:studio
```

## Troubleshooting

### "Insufficient funds" error
- Ensure wallet has enough ETH for gas
- For Sepolia: Get testnet ETH from faucet

### "Invalid nonce" error
- Reset MetaMask account or use different wallet

### Database connection error
- Check DATABASE_URL format
- Ensure NeonDB project is active
- Verify SSL mode is set

### Contract verification fails
- Double-check constructor arguments
- Ensure Etherscan API key is valid
- Wait a few minutes and retry

## Security Reminders

⚠️ **NEVER commit private keys to Git**
⚠️ **Use multisig wallet for production admin**
⚠️ **Test thoroughly on Sepolia before mainnet**
⚠️ **Keep backup of all deployment addresses**

---

**Need Help?** Check `PROGRESS.md` and `action-plan.md` for details.
