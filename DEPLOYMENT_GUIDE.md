# Concrete Build - Production Deployment Guide

## ✅ Completed Components

### Smart Contracts (100%)
- ✅ PropertyEscrow.sol - Per-property investment escrow
- ✅ CBDRewardDistributor.sol - 9% CBLD rewards distribution
- ✅ 40 unit tests (100% passing)
- ✅ Deployed to Sepolia testnet
- ✅ E2E tested successfully

### Backend API (100%)
- ✅ Express + NeonDB + Drizzle ORM
- ✅ 9 database tables
- ✅ 5 API route modules (auth, properties, investments, distributions, rewards)
- ✅ Event sync worker for on-chain events
- ✅ Running on port 3001

### Frontend (100%)
- ✅ Next.js 16 + wagmi v2 + RainbowKit v2
- ✅ Marketplace page with property grid
- ✅ Property detail page with live contract data
- ✅ Investment flow (approve USDC → invest)
- ✅ Investor dashboard with profit claiming
- ✅ Admin panel for property management
- ✅ Black + indigo theme matching landing page

---

## 🚀 Mainnet Deployment Steps

### 1. Prepare Environment Variables

**Contracts (.env)**
```bash
ALCHEMY_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_mainnet_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Backend (.env)**
```bash
DATABASE_URL=your_production_neondb_url
JWT_SECRET=your_production_jwt_secret
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
CBLD_ADDRESS=your_mainnet_cbld_token_address
CBD_REWARD_DISTRIBUTOR_ADDRESS=deployed_distributor_address
ALCHEMY_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
NEXT_PUBLIC_CBLD_ADDRESS=your_mainnet_cbld_token_address
NEXT_PUBLIC_CBD_REWARD_DISTRIBUTOR_ADDRESS=deployed_distributor_address
NEXT_PUBLIC_API_URL=https://api.concretebuild.com
```

### 2. Deploy Smart Contracts to Mainnet

```bash
cd packages/contracts

# Deploy CBLD token (if not already deployed)
pnpm hardhat run scripts/deploy-cbld.ts --network mainnet

# Deploy CBDRewardDistributor
pnpm hardhat run scripts/deploy-mainnet.ts --network mainnet

# Deploy first property escrow
pnpm hardhat run scripts/deploy-property.ts --network mainnet
```

**Save all deployed addresses!**

### 3. Verify Contracts on Etherscan

```bash
pnpm hardhat verify --network mainnet CBLD_ADDRESS
pnpm hardhat verify --network mainnet DISTRIBUTOR_ADDRESS "CBLD_ADDRESS"
pnpm hardhat verify --network mainnet PROPERTY_ESCROW_ADDRESS \
  "1" \
  "5000000000000" \
  "USDC_ADDRESS" \
  "CBLD_ADDRESS" \
  "DISTRIBUTOR_ADDRESS"
```

### 4. Set Up Production Database

```bash
cd packages/backend

# Run migrations on production NeonDB
pnpm db:migrate

# Verify tables created
pnpm db:studio
```

### 5. Deploy Backend API

**Option A: Railway / Render**
1. Connect GitHub repo
2. Set environment variables
3. Deploy from `packages/backend`
4. Start command: `pnpm start`

**Option B: AWS / DigitalOcean**
```bash
# Build backend
pnpm build

# Start with PM2
pm2 start dist/index.js --name concrete-api

# Start event sync worker
pm2 start dist/workers/eventSync.js --name concrete-sync
```

### 6. Deploy Frontend

**Vercel (Recommended)**
```bash
cd apps/web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables in Vercel:**
- Add all `NEXT_PUBLIC_*` variables
- Set `NEXT_PUBLIC_API_URL` to your backend URL

### 7. Post-Deployment Checklist

- [ ] Verify all contracts on Etherscan
- [ ] Test wallet connection on production
- [ ] Test USDC approval flow
- [ ] Test investment transaction
- [ ] Test profit distribution
- [ ] Test CBLD reward issuance
- [ ] Test profit claiming
- [ ] Verify event sync worker is running
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure domain and SSL
- [ ] Test admin panel access control

---

## 🔐 Security Considerations

### Smart Contracts
- ✅ ReentrancyGuard on all state-changing functions
- ✅ AccessControl for role-based permissions
- ✅ Pull-based profit distribution (gas-efficient)
- ⚠️ Consider multi-sig wallet for admin operations
- ⚠️ Consider timelock for critical functions

### Backend
- ✅ SIWE authentication with JWT
- ✅ Environment variables for secrets
- ⚠️ Add rate limiting (express-rate-limit)
- ⚠️ Add CORS configuration for production
- ⚠️ Add request validation middleware

### Frontend
- ✅ Client-side only wallet interactions
- ✅ Transaction confirmations before execution
- ⚠️ Add CSP headers
- ⚠️ Add error boundary components

---

## 📊 Monitoring & Maintenance

### On-Chain Monitoring
```bash
# Start event sync worker
cd packages/backend
pnpm sync:events
```

### Database Backups
- Set up automated NeonDB backups
- Export critical data daily

### Contract Upgrades
- Current contracts are NOT upgradeable
- New properties = new PropertyEscrow deployments
- CBDRewardDistributor can be replaced if needed

---

## 🆘 Troubleshooting

### Frontend wallet not connecting
- Check WalletConnect Project ID
- Verify chain IDs match (1 for mainnet)
- Check RPC endpoints are working

### Transactions failing
- Verify contract addresses in .env
- Check user has sufficient ETH for gas
- Check USDC approval amount

### Event sync not working
- Verify RPC URL has websocket support
- Check contract addresses in worker
- Verify database connection

---

## 📞 Support

For issues or questions:
- GitHub Issues: [repo-url]
- Discord: [discord-invite]
- Email: support@concretebuild.com

---

**Status**: Platform is production-ready. All core features tested and working on Sepolia testnet.

**Next Step**: Deploy to Ethereum Mainnet following this guide.
