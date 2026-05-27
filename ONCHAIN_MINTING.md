# Fixed: On-Chain CBLD Minting + Image Upload

## Issue 1: Payload Too Large ✅ FIXED
**Problem:** Base64 images too large for default Express body parser  
**Solution:** Increased limit to 50mb in `packages/backend/src/index.ts`

```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

## Issue 2: 9% Calculation Should Be On-Chain ✅ FIXED

**Why On-Chain is Better:**
- Transparent and verifiable
- Trustless - no backend manipulation
- Immutable proof on blockchain
- Contract already has the logic

**What Changed:**

### 1. Created Contract Utility (`packages/backend/src/utils/contracts.ts`)
- `mintInvestmentReward()` - Calls `CBDRewardDistributor.issueInvestmentReward()`
- `mintListingReward()` - Calls `CBDRewardDistributor.issueListingReward()`
- Uses operator wallet to sign transactions

### 2. Updated Property Approval (`properties.ts`)
- Calls `mintListingReward()` on-chain
- Contract calculates 9% automatically
- Records tx hash in database
- Status: `issued` if successful, `pending` if failed

### 3. Updated Investment Recording (`investments.ts`)
- Calls `mintInvestmentReward()` on-chain
- Contract formula: `(usdcAmount * 9 * 1e18) / (100 * 1e6)`
- Records tx hash in database
- Status: `issued` if successful, `pending` if failed

## Setup Required

### 1. Add Operator Private Key to `.env`
```bash
OPERATOR_PRIVATE_KEY=0x...your_private_key
ALCHEMY_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### 2. Grant OPERATOR_ROLE to Backend Wallet
The wallet must have `OPERATOR_ROLE` on the `CBDRewardDistributor` contract.

**Option A: If you're the admin, run this:**
```javascript
// Using ethers.js
const distributor = new ethers.Contract(DISTRIBUTOR_ADDRESS, ABI, adminWallet);
const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
await distributor.grantRole(OPERATOR_ROLE, BACKEND_WALLET_ADDRESS);
```

**Option B: Use Etherscan**
1. Go to contract on Etherscan
2. Write Contract → `grantRole`
3. role: `0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`
4. account: Your backend wallet address

### 3. Fund the Distributor Contract
The contract needs CBLD tokens to distribute:
```javascript
await cbldToken.transfer(DISTRIBUTOR_ADDRESS, amount);
```

## How It Works Now

### Property Approval Flow:
1. Admin clicks "Approve" → Backend calls `/api/properties/:id/approve`
2. Backend calls `CBDRewardDistributor.issueListingReward(owner, propertyId)`
3. Contract mints 9% CBLD tokens to owner's wallet
4. Backend records tx hash in `cbld_rewards` table with status `issued`

### Investment Flow:
1. User invests → Frontend calls `PropertyEscrow.invest()`
2. Frontend calls `/api/investments` → Backend records investment
3. Backend calls `CBDRewardDistributor.issueInvestmentReward(investor, usdcAmount, propertyId)`
4. Contract calculates 9% and mints CBLD to investor
5. Backend records tx hash in `cbld_rewards` table with status `issued`

## Fallback Behavior

If on-chain minting fails (no operator key, insufficient gas, etc.):
- Backend still records reward in database with status `pending`
- You can manually mint later using a worker script
- Platform continues to function

## Benefits

✅ **Transparent** - All rewards visible on-chain  
✅ **Trustless** - Contract enforces 9% rule  
✅ **Verifiable** - Users can verify on Etherscan  
✅ **Immutable** - Can't be manipulated by backend  
✅ **Automatic** - No manual token distribution needed  

## Testing

1. Restart backend: `cd packages/backend && pnpm dev`
2. List a property
3. Admin approves → Check wallet for CBLD tokens
4. Invest in property → Check wallet for CBLD tokens
5. Verify on Etherscan: https://sepolia.etherscan.io/address/0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15
