# Quick Start Guide

## What Was Fixed

1. ✅ Landing page Hero now has "List Property" and "Explore Marketplace" buttons
2. ✅ Property creation API properly saves to database with user creation
3. ✅ Investment API creates users and records investments with CBLD rewards
4. ✅ Property approval automatically calculates 9% CBLD tokens
5. ✅ Investment recording issues 9% CBLD rewards to investors

## Running the Platform

### 1. Start Backend (Terminal 1)
```bash
cd packages/backend
pnpm dev
```
Backend will run on http://localhost:3001

### 2. Start Frontend (Terminal 2)
```bash
cd apps/web
pnpm dev
```
Frontend will run on http://localhost:3000

## Testing the Flow

### Property Owner Flow
1. Go to http://localhost:3000
2. Click "List Property" button
3. Connect wallet
4. Fill property details and upload images
5. Submit - property goes to "pending_review" status

### Admin Approval Flow
1. Go to http://localhost:3000/admin
2. Connect wallet
3. View pending properties
4. Approve property - automatically mints 9% CBLD tokens

### Investor Flow
1. Go to http://localhost:3000/marketplace
2. Browse properties
3. Click on a property
4. Click "Invest Now"
5. Enter amount and approve USDC
6. Confirm investment - automatically receives 9% CBLD tokens

## Database Verification

Check if entries are being created:
```bash
cd packages/backend
pnpm db:studio
```
This opens Drizzle Studio to view database tables.

## Troubleshooting

### Backend not connecting to database
- Check `packages/backend/.env` has correct `DATABASE_URL`
- Run migrations: `cd packages/backend && pnpm db:migrate`

### Frontend can't reach backend
- Ensure backend is running on port 3001
- Check `apps/web/.env.local` has `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`

### Investment not working
- Ensure you have Sepolia ETH for gas
- Get test USDC from faucet: `0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D`
- Check wallet is connected to Sepolia network
