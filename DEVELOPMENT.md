# Concrete Build - Complete Development Documentation

## 📚 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Timeline](#development-timeline)
4. [Smart Contracts](#smart-contracts)
5. [Backend API](#backend-api)
6. [Frontend](#frontend)
7. [Deployment](#deployment)
8. [Testing](#testing)

---

## Project Overview

**Concrete Build** is a Web3 RWA (Real World Asset) property tokenization platform that enables:
- Fractional property investment using USDC
- Automated profit distribution to investors
- 9% CBLD token rewards on investments
- Transparent on-chain ownership tracking

### Tech Stack
- **Blockchain:** Ethereum (Sepolia testnet → Mainnet)
- **Smart Contracts:** Solidity 0.8.22 + OpenZeppelin 5.x
- **Backend:** Express.js + NeonDB (PostgreSQL) + Drizzle ORM
- **Frontend:** Next.js 16 + Tailwind CSS 4 + wagmi + RainbowKit
- **Testing:** Hardhat + Chai (40 tests, 100% passing)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONCRETE BUILD PLATFORM                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16)                                       │
│  ├── Landing Page (Black theme + Indigo accents)            │
│  ├── Marketplace (Browse properties)                         │
│  ├── Investment Flow (Connect wallet → Invest → Get CBLD)   │
│  ├── Investor Dashboard (Portfolio + Claims)                │
│  └── Admin Panel (Property management)                      │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Express + NeonDB)                             │
│  ├── /api/auth - SIWE authentication                        │
│  ├── /api/properties - Property CRUD + approval             │
│  ├── /api/investments - Investment tracking                 │
│  ├── /api/distributions - Profit management                 │
│  └── /api/rewards - CBLD reward issuance                    │
├─────────────────────────────────────────────────────────────┤
│  Smart Contracts (Ethereum)                                 │
│  ├── PropertyEscrow.sol (Per-property)                      │
│  │   ├── invest() - USDC investment intake                  │
│  │   ├── distributeProfit() - Proportional allocation       │
│  │   └── claimProfit() - Pull-based claiming                │
│  └── CBDRewardDistributor.sol (Platform-wide)               │
│      └── issueInvestmentReward() - 9% CBLD rewards          │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Timeline

### Phase 0: Setup (Completed ✅)
**Duration:** 1 hour  
**Date:** May 26, 2026

- ✅ Created Turborepo monorepo structure
- ✅ Set up Hardhat with TypeScript
- ✅ Configured OpenZeppelin 5.x dependencies
- ✅ Created environment variable templates

### Phase 1: Smart Contracts (Completed ✅)
**Duration:** 3 hours  
**Date:** May 26-27, 2026

#### PropertyEscrow.sol
- **Lines of Code:** 281
- **Functions:** 15
- **Features:**
  - USDC-only investment system
  - Proportional share allocation (basis points)
  - Pull-based profit distribution
  - Role-based access control (Admin, Moderator)
  - Emergency pause functionality
  - Reentrancy protection

#### CBDRewardDistributor.sol
- **Lines of Code:** 131
- **Functions:** 11
- **Key Feature:** 9% CBLD reward calculation
  - Formula: `(usdcAmount * 9 * 1e18) / (100 * 1e6)`
  - Example: $1,000 USDC → 90 CBLD
  - Example: $10,000 USDC → 900 CBLD

#### Testing
- **Total Tests:** 40
- **Pass Rate:** 100%
- **Coverage:** 95%+
- **Test Categories:**
  - Deployment & initialization
  - Investment flow
  - Profit distribution
  - Access control
  - Edge cases & rounding

### Phase 2: Backend API (Completed ✅)
**Duration:** 2 hours  
**Date:** May 27, 2026

#### Database Schema (NeonDB + Drizzle ORM)
**Tables:** 9
1. `users` - User accounts with KYC status
2. `properties` - Property listings with metadata
3. `property_documents` - Legal documents
4. `property_images` - Property photos
5. `investments` - On-chain investment records
6. `profit_distributions` - Profit deposit & distribution
7. `cbld_rewards` - CBLD reward tracking
8. `audit_log` - System audit trail
9. `platform_settings` - Configuration

#### API Routes
- **POST /api/auth/nonce** - Generate SIWE nonce
- **POST /api/auth/verify** - Verify signature & issue JWT
- **GET /api/auth/me** - Get current user
- **GET /api/properties** - List properties
- **POST /api/properties** - Create property
- **PATCH /api/properties/:id** - Update property
- **POST /api/properties/:id/approve** - Approve property
- **POST /api/properties/:id/activate** - Activate with contract
- **POST /api/investments** - Record investment
- **GET /api/investments/me** - Get user investments
- **POST /api/distributions** - Create distribution
- **POST /api/distributions/:id/verify** - Verify distribution
- **POST /api/distributions/:id/distribute** - Execute distribution
- **POST /api/rewards/issue** - Issue CBLD reward
- **GET /api/rewards/me** - Get user rewards

### Phase 3: Deployment (Completed ✅)
**Duration:** 1 hour  
**Date:** May 27, 2026

#### Sepolia Testnet Deployment
- **Mock USDC:** `0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D`
- **Mock CBLD:** `0x5e697416159400fA7299457c1D0F4Efe5a3E6344`
- **CBDRewardDistributor:** `0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15`
- **PropertyEscrow (Example):** `0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33`

#### E2E Test Results
```
✅ Minted 15,000 USDC
✅ Investment of $10,000 successful
✅ 900 CBLD reward issued (9% of $10,000)
✅ $1,000 profit deposited
✅ Profit distributed proportionally
✅ Profit claimed successfully
```

---

## Smart Contracts

### PropertyEscrow.sol

#### Key Functions

**invest(uint256 usdcAmount)**
- Accepts USDC investment
- Calculates proportional shares
- Auto-closes when fully funded
- Emits `InvestmentMade` event

**depositProfit(uint256 amount)**
- Property owner deposits rental income
- Requires USDC approval
- Emits `ProfitDeposited` event

**distributeProfit(uint256 amount)**
- Admin allocates profit to investors
- Proportional to ownership shares
- Pull pattern (gas-efficient)
- Emits `ProfitAllocated` event

**claimProfit()**
- Investor withdraws accumulated profit
- Reentrancy protected
- Emits `ProfitClaimed` event

#### Security Features
- ✅ OpenZeppelin AccessControl
- ✅ ReentrancyGuard on all state changes
- ✅ Pausable for emergencies
- ✅ SafeERC20 for token transfers
- ✅ Custom errors for gas efficiency

### CBDRewardDistributor.sol

#### 9% CBLD Reward Calculation

```solidity
function issueInvestmentReward(
    address investor,
    uint256 usdcAmount,
    uint256 propertyId
) external onlyRole(OPERATOR_ROLE) {
    // 9% of USDC amount in CBLD
    uint256 reward = (usdcAmount * 9 * 1e18) / (100 * 1e6);
    _issueReward(investor, reward, "INVESTMENT", propertyId);
}
```

**Examples:**
- $100 → 9 CBLD
- $1,000 → 90 CBLD
- $10,000 → 900 CBLD
- $50,000 → 4,500 CBLD

---

## Backend API

### Authentication Flow (SIWE)

```
1. Frontend requests nonce
   POST /api/auth/nonce → { nonce: "abc123" }

2. User signs message with wallet
   message = "Sign in to Concrete Build\nNonce: abc123"

3. Frontend sends signature
   POST /api/auth/verify
   { message, signature }

4. Backend verifies & issues JWT
   → { token: "jwt...", user: {...} }

5. Frontend stores JWT
   localStorage.setItem('token', jwt)

6. Subsequent requests include JWT
   Authorization: Bearer <jwt>
```

### Database Connection

```typescript
// NeonDB with Drizzle ORM
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
export const db = drizzle(pool, { schema });
```

---

## Frontend

### Design System

**Theme:** Dark mode with indigo accents (matching landing page)

**Colors:**
- Background: `#000000` (black)
- Primary: `#6366f1` (indigo-500)
- Secondary: `#818cf8` (indigo-400)
- Text: `#ffffff` (white)
- Muted: `#9ca3af` (gray-400)

**Typography:**
- Font: Geist Sans
- Headings: Bold, large
- Body: Regular, readable

**Components:**
- Buttons: Indigo gradient with hover effects
- Cards: Dark with subtle borders
- Inputs: Dark with indigo focus rings
- Modals: Centered with backdrop blur

### Pages Structure

```
/                    Landing page (existing)
/marketplace         Browse all properties
/marketplace/[id]    Property details
/invest/[id]         Investment flow
/dashboard           Investor portfolio
/dashboard/owner     Property owner panel
/admin               Admin panel
```

---

## Deployment

### Environment Variables

#### Contracts (.env)
```env
ALCHEMY_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
ALCHEMY_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
DEPLOYER_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3001
CBD_REWARD_DISTRIBUTOR_ADDRESS=0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15
CBLD_TOKEN_ADDRESS=0x5e697416159400fA7299457c1D0F4Efe5a3E6344
USDC_ADDRESS=0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D
```

### Deployment Commands

```bash
# Compile contracts
cd packages/contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Sepolia
pnpm deploy:sepolia

# Deploy to Mainnet (after testing)
pnpm deploy:mainnet

# Start backend
cd packages/backend
pnpm dev

# Start frontend
cd apps/web
pnpm dev
```

---

## Testing

### Unit Tests (40 tests)

**PropertyEscrow (22 tests)**
- Deployment & initialization
- Property activation
- Investment flow
- Multiple investors
- Auto-close when funded
- Profit deposit & distribution
- Profit claiming
- Access control
- Pause/unpause
- View functions

**CBDRewardDistributor (18 tests)**
- Deployment
- 9% CBLD calculation ($100, $1k, $10k, $50k)
- Listing rewards
- Rent rewards
- Manual rewards
- Batch operations
- Access control
- Total rewards tracking

### E2E Test

```bash
npx hardhat run scripts/e2e-test.ts --network sepolia
```

**Test Flow:**
1. Mint USDC to investor
2. Invest $10,000
3. Issue 900 CBLD reward (9%)
4. Deposit $1,000 profit
5. Distribute profit
6. Claim profit

---

## Next Steps

### Phase 4: Frontend Development (In Progress)
- [ ] Set up wagmi + RainbowKit
- [ ] Create marketplace UI
- [ ] Build investment flow
- [ ] Create investor dashboard
- [ ] Build admin panel

### Phase 5: Production Deployment
- [ ] Deploy to Ethereum Mainnet
- [ ] Verify contracts on Etherscan
- [ ] Set up Alchemy webhooks
- [ ] Configure monitoring & alerts

---

## Key Achievements

✅ **40/40 tests passing** (100%)  
✅ **Deployed on Sepolia testnet**  
✅ **Backend API fully functional**  
✅ **9% CBLD rewards working**  
✅ **E2E test successful**  
✅ **14/23 tasks complete** (61%)

---

**Last Updated:** May 27, 2026, 2:00 AM IST  
**Status:** Phase 3 Complete, Starting Phase 4 (Frontend)
