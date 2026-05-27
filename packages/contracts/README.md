# Concrete Build Smart Contracts

Smart contracts for the Concrete Build RWA property tokenization platform.

## Contracts

### PropertyEscrow.sol
Per-property escrow contract that handles:
- Investment intake (USDC only)
- Proportional ownership tracking
- Profit distribution to investors
- Pull-based profit claiming

**Deployment:** One contract deployed per property

### CBDRewardDistributor.sol
Platform-wide CBLD reward distribution system:
- Issues CBLD rewards for listings, investments, rent payments
- Configurable reward amounts
- Batch reward operations

**Deployment:** One contract for entire platform

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

3. Compile contracts:
```bash
pnpm compile
```

4. Run tests:
```bash
pnpm test
```

5. Run tests with coverage:
```bash
pnpm test:coverage
```

## Deployment

### Sepolia Testnet
```bash
pnpm deploy:sepolia
```

### Ethereum Mainnet
```bash
pnpm deploy:mainnet
```

## Contract Addresses

### Mainnet
- **CBLD Token:** `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983` (already deployed)
- **USDC:** `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **CBDRewardDistributor:** TBD

### Sepolia Testnet
- **USDC (Mock):** TBD
- **CBDRewardDistributor:** TBD

## Architecture

```
PropertyEscrow (per property)
├── invest() - Investors deposit USDC
├── depositProfit() - Owner deposits rental income
├── distributeProfit() - Admin allocates profits
└── claimProfit() - Investors withdraw profits

CBDRewardDistributor (platform-wide)
├── issueListingReward()
├── issueInvestmentReward()
├── issueRentReward()
└── issueManualReward()
```

## Security

- OpenZeppelin 5.x contracts for battle-tested security
- ReentrancyGuard on all state-changing functions
- AccessControl for role-based permissions
- Pausable for emergency stops
- Pull pattern for profit distribution (gas-safe)

## Testing

Target: 95%+ code coverage

Test categories:
- Unit tests for all functions
- Edge case testing (rounding, overflow, etc.)
- Access control testing
- Integration tests
- Gas optimization tests
