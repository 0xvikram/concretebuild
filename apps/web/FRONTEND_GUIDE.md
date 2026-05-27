# Frontend Development - Quick Start

## 🎨 Design System (Matching Landing Page)

**Theme:** Dark mode with indigo accents
- Background: Black (#000000)
- Primary: Indigo-500 (#6366f1)
- Accent: Indigo-400 (#818cf8)
- Text: White (#ffffff)

## 📦 Dependencies Added

```json
"wagmi": "^2.12.0",              // Ethereum React hooks
"@rainbow-me/rainbowkit": "^2.1.0",  // Wallet connection UI
"viem": "^2.21.0",               // Ethereum utilities
"@tanstack/react-query": "^5.56.0",  // Data fetching
"siwe": "^2.3.0"                 // Sign-In With Ethereum
```

## 🚀 Next Steps

### 1. Install Dependencies
```bash
cd apps/web
pnpm install
```

### 2. Configure Environment Variables
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=11155111

# Sepolia Contract Addresses
NEXT_PUBLIC_USDC_ADDRESS=0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D
NEXT_PUBLIC_CBLD_ADDRESS=0x5e697416159400fA7299457c1D0F4Efe5a3E6344
NEXT_PUBLIC_DISTRIBUTOR_ADDRESS=0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15
NEXT_PUBLIC_PROPERTY_ESCROW_ADDRESS=0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33
```

### 3. Pages to Build

**Marketplace** (`/marketplace`)
- Grid of property cards
- Filters (location, price, status)
- Search functionality

**Property Detail** (`/marketplace/[id]`)
- Property info & images
- Investment stats
- "Invest Now" button

**Investment Flow** (`/invest/[id]`)
- Connect wallet
- Enter amount
- Approve USDC
- Invest transaction
- Success screen with CBLD reward

**Dashboard** (`/dashboard`)
- Portfolio overview
- Claimable profits
- CBLD rewards
- Investment history

**Admin Panel** (`/admin`)
- Property approval queue
- Distribution management
- User management

## 🎯 Implementation Order

1. ✅ Add Web3 dependencies
2. ⏳ Set up wagmi + RainbowKit providers
3. ⏳ Create marketplace page
4. ⏳ Build property detail page
5. ⏳ Implement investment flow
6. ⏳ Create investor dashboard
7. ⏳ Build admin panel

## 📝 Component Structure

```
app/
├── (marketing)/
│   └── page.tsx              # Landing page (existing)
├── marketplace/
│   ├── page.tsx              # Property grid
│   └── [id]/
│       └── page.tsx          # Property detail
├── invest/
│   └── [id]/
│       └── page.tsx          # Investment flow
├── dashboard/
│   ├── page.tsx              # Investor dashboard
│   └── owner/
│       └── page.tsx          # Owner dashboard
├── admin/
│   └── page.tsx              # Admin panel
└── providers/
    └── Web3Provider.tsx      # wagmi + RainbowKit setup
```

## 🔗 Contract Integration

```typescript
// Example: Reading property data
import { useReadContract } from 'wagmi';

const { data: totalRaised } = useReadContract({
  address: PROPERTY_ESCROW_ADDRESS,
  abi: PropertyEscrowABI,
  functionName: 'totalRaised',
});

// Example: Investing
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

await writeContract({
  address: PROPERTY_ESCROW_ADDRESS,
  abi: PropertyEscrowABI,
  functionName: 'invest',
  args: [parseUnits('1000', 6)], // $1000 USDC
});
```

## 🎨 UI Components Needed

- PropertyCard
- InvestmentModal
- WalletButton
- ProfitClaimButton
- CBLDRewardDisplay
- FundingProgressBar
- TransactionStatus

---

**Ready to start?** Run `pnpm install` in `apps/web` and let me know when it's done!
