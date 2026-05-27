# Concrete Build — RWA Property Tokenization Platform
## Master Developer Context File v2.0
> **Platform:** Concrete Build (`concretebuild.org`)  
> **Chain:** Ethereum Mainnet  
> **Settlement Asset:** USDC (`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`)  
> **Utility Token:** CBLD — "Concrete Build" — Deployed at `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983`  
> **Deployment Model:** Option 1 — Per-Property Manual Deployment  
> **Document Purpose:** Complete agent/developer context file — hand this to Kiro, Claude Code, Cursor, or any AI agent to start building immediately  
> **Last Updated:** May 2026

---

## ⚡ QUICK START FOR AI AGENTS

If you are an AI agent reading this file, here is your build objective:

> Build a production-grade Web3 RWA (Real World Asset) property tokenization and investment marketplace on Ethereum Mainnet. The CBLD utility token is already deployed. You need to build: (1) the PropertyEscrow smart contract system (per-property manual deployment), (2) a Node.js/Next.js backend with PostgreSQL, and (3) a Next.js frontend marketplace. Full specs follow in this document. Start with the smart contracts, then backend, then frontend. All environment variables are listed in Appendix C. All DB schema is in Section 9. All contract interfaces are in Section 5.

---

## Table of Contents

1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Deployment Model — Per-Property Manual](#3-deployment-model)
4. [Open Source Reference Codebases — What to Take](#4-open-source-reference-codebases)
5. [Smart Contract Specifications](#5-smart-contract-specifications)
6. [CBLD Token — Deployed Contract Analysis](#6-cbld-token--deployed-contract-analysis)
7. [Platform Roles & Access Control](#7-platform-roles--access-control)
8. [Marketplace & Frontend Specification](#8-marketplace--frontend-specification)
9. [Database Schema (PostgreSQL)](#9-database-schema)
10. [Backend API Specification](#10-backend-api-specification)
11. [Wallet & Web3 Integration](#11-wallet--web3-integration)
12. [Phase-by-Phase Action Plan](#12-phase-by-phase-action-plan)
13. [Per-Property Deployment Workflow (Operational SOP)](#13-per-property-deployment-workflow)
14. [Security Checklist](#14-security-checklist)
15. [Tech Stack](#15-tech-stack)
16. [Project File Structure](#16-project-file-structure)
17. [Cost & Gas Estimates](#17-cost--gas-estimates)
18. [Risk Register](#18-risk-register)
19. [Appendix A — Client Decisions Checklist](#appendix-a)
20. [Appendix B — Reference Links](#appendix-b)
21. [Appendix C — Environment Variables](#appendix-c)
22. [Appendix D — Agent Build Instructions](#appendix-d)

---

## 1. Project Overview & Philosophy

### Platform Identity
- **Platform Name:** Concrete Build
- **Website:** concretebuild.org
- **Tagline:** "Tokenization-as-a-service that transforms physical real estate into digital tokens"
- **Chain:** Ethereum Mainnet

### What Is Being Built

A Web3 RWA property tokenization and marketplace platform that:
- Allows verified property owners to list real estate on a marketplace
- Enables fractional investment by multiple investors using **USDC only**
- Records proportional ownership on-chain per investor
- Automates profit distribution proportional to ownership share via smart contracts
- Issues **CBLD utility tokens** as ecosystem incentives/rewards
- Provides a secondary marketplace for investors to relist and exit positions

### Core Hybrid Architecture Philosophy

This is a **semi-trusted hybrid system**, not a fully trustless DeFi protocol.

| Layer | Handled By | Examples |
|---|---|---|
| Ownership allocation recording | On-chain (smart contract) | invest(), share mapping |
| Profit distribution math + execution | On-chain (smart contract) | distributeProfit(), claimProfit() |
| Settlement transparency | On-chain (events + Etherscan) | All USDC flows |
| CBLD reward mechanics | On-chain (CBLD contract) | Already deployed |
| Property ownership verification | Off-chain (moderators) | Title deed, valuation review |
| Rent payment verification | Off-chain (moderators) | Manual verification MVP |
| Profit accounting accuracy | Off-chain (admins) | Blockchain can't validate real-world P&L |
| KYC / investor eligibility | Off-chain (platform DB) | KYC provider integration |
| Property valuation | Off-chain (verified appraisals) | Supporting documents |

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     CONCRETE BUILD PLATFORM                          │
├──────────────────────────────────────────────────────────────────────┤
│  FRONTEND — Next.js 14 (App Router) + Tailwind + shadcn/ui           │
│   ├── /marketplace          Browse + filter all active properties     │
│   ├── /marketplace/[id]     Property detail + investment stats        │
│   ├── /invest/[id]          Investment flow (USDC approve + invest)   │
│   ├── /dashboard            Investor portfolio + claims + CBLD        │
│   ├── /dashboard/owner      Property owner panel                      │
│   └── /admin                Moderator + admin panel (protected)       │
├──────────────────────────────────────────────────────────────────────┤
│  BACKEND — Next.js API Routes (or Express.js)                        │
│   ├── /api/auth             SIWE wallet login + JWT                   │
│   ├── /api/properties       CRUD + moderation workflow                │
│   ├── /api/investments      Record + query investments                │
│   ├── /api/distributions    Profit deposit + verify + distribute      │
│   ├── /api/rewards          CBLD reward issuance                      │
│   ├── /api/users            Profile + KYC status                      │
│   └── /api/events           Webhook handler for on-chain events       │
├──────────────────────────────────────────────────────────────────────┤
│  DATABASE — PostgreSQL (Supabase)                                     │
│   ├── users, properties, property_documents, property_images         │
│   ├── investments, profit_distributions, cbld_rewards                │
│   ├── secondary_listings, audit_log                                   │
│   └── (Full schema in Section 9)                                     │
├──────────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS — Solidity ^0.8.22 — Ethereum Mainnet               │
│   ├── CBLD Token           0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983│
│   ├── PropertyEscrow.sol   Per-property, manually deployed each time  │
│   ├── CBDRewardDistributor.sol  Platform-wide reward engine           │
│   └── SecondaryMarket.sol  Phase 2 — not MVP                         │
├──────────────────────────────────────────────────────────────────────┤
│  WEB3 INTEGRATION                                                     │
│   ├── wagmi v2 + RainbowKit   Wallet connection                       │
│   ├── viem                    Contract read/write                     │
│   ├── Alchemy Webhooks        On-chain event sync                     │
│   └── ethers.js v6            Deployment scripts                      │
└──────────────────────────────────────────────────────────────────────┘

ON-CHAIN FLOW:
Investor → approve(USDC) → invest(amount) → PropertyEscrow
Owner    → depositProfit(USDC)            → PropertyEscrow
Admin    → distributeProfit()             → PropertyEscrow → claimableProfit[investor]
Investor → claimProfit()                  → USDC → investor wallet
Admin    → issueReward(CBLD)              → CBDRewardDistributor → investor wallet
```

---

## 3. Deployment Model

### Option 1 — Per-Property Manual Deployment (Confirmed by Client)

The platform infrastructure is deployed once. Every new property gets its own individually configured and deployed `PropertyEscrow.sol` contract.

```
PLATFORM INFRASTRUCTURE (deployed once):
  ✅ CBLD Token Contract          — already live on Ethereum Mainnet
  ⬜ CBDRewardDistributor.sol     — deploy once, platform-wide
  ⬜ Next.js frontend             — deploy once to Vercel
  ⬜ Backend API                  — deploy once to Railway/Render
  ⬜ PostgreSQL DB                — deploy once via Supabase

PER-PROPERTY (deployed manually for each new property, $300-$500):
  ⬜ PropertyEscrow.sol           — one new deployment per property
  ⬜ Database record linking      — register contract address in DB
  ⬜ Event listener registration  — add to Alchemy webhook config
  ⬜ Frontend activation          — set property status to 'active'
```

### Cost Structure
| Item | Cost |
|---|---|
| Core platform build (contracts + backend + frontend) | $3,000 – $4,000 |
| Per-property deployment + integration + QA | $300 – $500 |

---

## 4. Open Source Reference Codebases

Use these as **architectural reference only** — adapt patterns, do not clone directly. Take only what maps to our requirements.

---

### 4.1 Brickken Protocol — `github.com/Brickken/protocol-public`

Production-grade RWA tokenization on EVM. Brickken issues asset-backed ERC-20 security tokens with investor compliance, primary issuance, and distribution mechanics.

**Extract from Brickken:**

| Their Component | What to Extract | Apply To |
|---|---|---|
| `Offering.sol` / `SaleManager` | Investment intake, USDC transferFrom, share allocation math | PropertyEscrow.sol `invest()` |
| `DistributionManager.sol` | Claimable profit mapping pattern, rounding protection | PropertyEscrow.sol `distributeProfit()` / `claimProfit()` |
| RBAC patterns | OpenZeppelin AccessControl role setup | All contracts |
| Event emission patterns | Indexed events for off-chain indexing | All contracts |
| Fixed-point math patterns | Avoid wei/USDC decimal mismatch bugs | PropertyEscrow share math |

**Do NOT copy:**
- Factory deployment (we use per-property manual)
- BKN token specifics (we have CBLD already deployed)
- External oracle or compliance registry dependencies

---

### 4.2 eREIT — `github.com/powxconsensus/ereit`

Ethereum REIT — pooled property fund, investor share tracking, yield distributions.

**Extract from eREIT:**

| Their Component | What to Extract | Apply To |
|---|---|---|
| Share ownership model | `investor → sharePercentage` mapping logic | PropertyEscrow investor tracking |
| Pull (claimable) yield | Mapping-based claim pattern vs gas-heavy push | PropertyEscrow `claimProfit()` |
| Exit/redemption design | How shares can be transferred | Secondary market (Phase 2) planning |
| Proportional math | Yield-per-share calculation pattern | distributeProfit() math |

**Do NOT copy:**
- Multi-property fund pooling (our escrow is per-property isolated)
- On-chain governance (Phase 2+ only)

---

### 4.3 0xEstate — `github.com/ahmedali8/0xestate-contracts`

Closest architectural match — per-property fractional ownership tokens.

**Extract from 0xEstate:**

| Their Component | What to Extract | Apply To |
|---|---|---|
| Per-property investment intake | USDC → share allocation pattern | PropertyEscrow.sol core |
| Property metadata on-chain | Minimal on-chain / heavy off-chain pattern | PropertyEscrow constructor params |
| Secondary listing structure | How shares are listed for resale | SecondaryMarket.sol Phase 2 |
| ERC-20 property tokens | Future upgrade path for transferable shares | Phase 2+ architecture |

**Do NOT copy:**
- ETH-native payment logic (USDC only for us)
- Non-EVM specific features

---

### 4.4 Consolidated Reference Map

| Contract / Component Needed | Best Source |
|---|---|
| `invest()` — USDC intake + share allocation | 0xEstate + Brickken Offering.sol |
| `distributeProfit()` — proportional USDC distribution | Brickken DistributionManager + eREIT |
| `claimProfit()` — pull-based investor claims | eREIT pull pattern + Brickken mapping |
| Share percentage math (basis points) | All three — use Brickken for production precision |
| RBAC / roles | Brickken (OZ AccessControl) |
| Event indexing patterns | All three |
| Secondary market listing | 0xEstate marketplace |
| CBLD token — already done | ✅ Deployed at `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983` |

---

## 5. Smart Contract Specifications

### 5.1 PropertyEscrow.sol — Core (Per-Property)

**File:** `contracts/PropertyEscrow.sol`  
**Dependencies:** OpenZeppelin 5.x (AccessControl, ReentrancyGuard, Pausable, SafeERC20)  
**Deploy:** Once per property, manually  
**Reference:** Brickken Offering.sol + 0xEstate + eREIT

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PropertyEscrow
 * @notice One deployed per property. Handles investment intake,
 *         ownership tracking, profit deposit, and proportional distribution.
 * @dev Adapt invest() from 0xEstate + Brickken Offering.sol
 *      Adapt distributeProfit() from Brickken DistributionManager + eREIT
 */
contract PropertyEscrow is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── ROLES ───────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE     = DEFAULT_ADMIN_ROLE;
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // ─── CONSTANTS ───────────────────────────────────────────
    uint256 public constant BASIS_POINTS = 10_000; // 100% = 10000 bps
    uint256 public constant USDC_DECIMALS = 6;

    // ─── IMMUTABLES ──────────────────────────────────────────
    IERC20  public immutable usdc;           // USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    uint256 public immutable propertyId;     // Links to off-chain DB record
    uint256 public immutable totalValuation; // Total USDC to raise (6 decimals)
    uint256 public immutable totalShares;    // Total participation units (use 10000)

    // ─── STATE ───────────────────────────────────────────────
    address public propertyOwner;
    address public platformTreasury;

    uint256 public totalRaised;
    uint256 public sharesSold;

    bool public investmentOpen;
    bool public propertyActive;

    // Investor ownership
    mapping(address => uint256) public investorShares;
    mapping(address => uint256) public claimableProfit;  // USDC claimable (pull pattern)
    mapping(address => bool)    private _isInvestor;
    address[]                   private _investorList;   // For enumeration (bounded by max investors)

    // Profit tracking
    uint256 public totalProfitDeposited;
    uint256 public totalProfitDistributed;
    uint256 public maxInvestors = 500;  // Gas safety cap — admin adjustable

    // ─── EVENTS ──────────────────────────────────────────────
    event PropertyActivated(uint256 indexed propertyId, uint256 timestamp);
    event InvestmentOpen(uint256 indexed propertyId);
    event InvestmentClosed(uint256 indexed propertyId, uint256 totalRaised);
    event InvestmentMade(address indexed investor, uint256 usdcAmount, uint256 sharesAllocated, uint256 sharePercentageBps);
    event ProfitDeposited(address indexed depositor, uint256 amount, uint256 depositNumber);
    event ProfitAllocated(uint256 totalAmount, uint256 investorCount, uint256 timestamp);
    event ProfitClaimed(address indexed investor, uint256 amount);
    event PropertyOwnerUpdated(address indexed oldOwner, address indexed newOwner);
    event MaxInvestorsUpdated(uint256 newMax);

    // ─── ERRORS ──────────────────────────────────────────────
    error NotActive();
    error InvestmentNotOpen();
    error ZeroAmount();
    error ExceedsRemaining(uint256 requested, uint256 remaining);
    error NoProfit();
    error MaxInvestorsReached();
    error InvalidAddress();
    error AlreadyActive();

    // ─── CONSTRUCTOR ─────────────────────────────────────────
    constructor(
        uint256 _propertyId,
        address _propertyOwner,
        address _platformAdmin,
        address _platformTreasury,
        address _usdcAddress,
        uint256 _totalValuation,
        uint256 _totalShares        // Recommend: 10000
    ) {
        if (_propertyOwner   == address(0)) revert InvalidAddress();
        if (_platformAdmin   == address(0)) revert InvalidAddress();
        if (_usdcAddress     == address(0)) revert InvalidAddress();
        if (_totalValuation  == 0)          revert ZeroAmount();
        if (_totalShares     == 0)          revert ZeroAmount();

        propertyId       = _propertyId;
        propertyOwner    = _propertyOwner;
        platformTreasury = _platformTreasury;
        usdc             = IERC20(_usdcAddress);
        totalValuation   = _totalValuation;
        totalShares      = _totalShares;

        _grantRole(ADMIN_ROLE,     _platformAdmin);
        _grantRole(MODERATOR_ROLE, _platformAdmin);
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────

    /// @notice Step 1 — admin activates property after off-chain verification
    function activateProperty() external onlyRole(ADMIN_ROLE) {
        if (propertyActive) revert AlreadyActive();
        propertyActive  = true;
        investmentOpen  = true;
        emit PropertyActivated(propertyId, block.timestamp);
        emit InvestmentOpen(propertyId);
    }

    /// @notice Admin can close investment intake (fully funded or manual close)
    function closeInvestment() external onlyRole(ADMIN_ROLE) {
        investmentOpen = false;
        emit InvestmentClosed(propertyId, totalRaised);
    }

    function updateMaxInvestors(uint256 newMax) external onlyRole(ADMIN_ROLE) {
        maxInvestors = newMax;
        emit MaxInvestorsUpdated(newMax);
    }

    function updatePropertyOwner(address newOwner) external onlyRole(ADMIN_ROLE) {
        if (newOwner == address(0)) revert InvalidAddress();
        emit PropertyOwnerUpdated(propertyOwner, newOwner);
        propertyOwner = newOwner;
    }

    function pause()   external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    // ─── INVESTMENT ──────────────────────────────────────────

    /**
     * @notice Investor calls this after approving USDC spend
     * @param usdcAmount Amount of USDC to invest (6 decimals)
     * @dev Adapated from Brickken Offering.sol + 0xEstate invest pattern
     *      Uses basis points for share allocation: shares = (usdcAmount * totalShares) / totalValuation
     */
    function invest(uint256 usdcAmount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!propertyActive)   revert NotActive();
        if (!investmentOpen)   revert InvestmentNotOpen();
        if (usdcAmount == 0)   revert ZeroAmount();

        uint256 remaining = totalValuation - totalRaised;
        if (usdcAmount > remaining) revert ExceedsRemaining(usdcAmount, remaining);

        if (!_isInvestor[msg.sender]) {
            if (_investorList.length >= maxInvestors) revert MaxInvestorsReached();
            _investorList.push(msg.sender);
            _isInvestor[msg.sender] = true;
        }

        // Calculate shares: proportional to USDC contributed vs total valuation
        // Using BASIS_POINTS precision: sharesAllocated / totalShares * 10000 = % ownership
        uint256 sharesAllocated = (usdcAmount * totalShares) / totalValuation;

        investorShares[msg.sender] += sharesAllocated;
        sharesSold                 += sharesAllocated;
        totalRaised                += usdcAmount;

        // Pull USDC from investor (requires prior approval)
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        uint256 sharePct = (investorShares[msg.sender] * BASIS_POINTS) / totalShares;

        emit InvestmentMade(msg.sender, usdcAmount, sharesAllocated, sharePct);

        // Auto-close if fully funded
        if (totalRaised >= totalValuation) {
            investmentOpen = false;
            emit InvestmentClosed(propertyId, totalRaised);
        }
    }

    // ─── PROFIT DISTRIBUTION ─────────────────────────────────

    /**
     * @notice Property owner deposits rental/profit income
     * @dev Owner must approve USDC before calling this
     */
    function depositProfit(uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (amount == 0) revert ZeroAmount();
        // Allow both propertyOwner AND admin to deposit (for flexibility)
        require(
            msg.sender == propertyOwner || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to deposit profit"
        );

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalProfitDeposited += amount;

        uint256 depositNumber = totalProfitDeposited;
        emit ProfitDeposited(msg.sender, amount, depositNumber);
    }

    /**
     * @notice Admin triggers distribution — allocates profit to investor claimable balances
     * @param amount Amount of USDC to distribute THIS round (can be partial)
     * @dev Pull pattern: records claimable amounts, does NOT transfer automatically
     *      Adapted from Brickken DistributionManager + eREIT distribution logic
     *      IMPORTANT: Uses integer division — dust amounts (< investors) stay in contract
     */
    function distributeProfit(uint256 amount)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        if (amount == 0)     revert ZeroAmount();
        if (sharesSold == 0) revert NoProfit();

        // Verify contract has enough USDC
        require(
            usdc.balanceOf(address(this)) >= amount,
            "Insufficient USDC in contract"
        );

        uint256 investorCount = _investorList.length;

        for (uint256 i = 0; i < investorCount; i++) {
            address investor = _investorList[i];
            uint256 shares   = investorShares[investor];
            if (shares == 0) continue;

            // Proportional allocation: investor's share of total shares sold
            // amount * investorShares / sharesSold
            uint256 investorAmount = (amount * shares) / sharesSold;
            claimableProfit[investor] += investorAmount;
        }

        totalProfitDistributed += amount;

        emit ProfitAllocated(amount, investorCount, block.timestamp);
    }

    /**
     * @notice Investor calls this to withdraw their accumulated profit
     * @dev Pull pattern — investor initiates, gas-safe
     */
    function claimProfit()
        external
        nonReentrant
        whenNotPaused
    {
        uint256 amount = claimableProfit[msg.sender];
        if (amount == 0) revert NoProfit();

        claimableProfit[msg.sender] = 0; // Zero before transfer (reentrancy protection)
        usdc.safeTransfer(msg.sender, amount);

        emit ProfitClaimed(msg.sender, amount);
    }

    // ─── VIEW FUNCTIONS ──────────────────────────────────────

    function getSharePercentageBps(address investor) public view returns (uint256) {
        if (sharesSold == 0) return 0;
        return (investorShares[investor] * BASIS_POINTS) / totalShares;
    }

    function getInvestorCount()  public view returns (uint256) { return _investorList.length; }
    function getInvestorAt(uint256 index) public view returns (address) { return _investorList[index]; }

    function getRemainingInvestment() public view returns (uint256) {
        return totalValuation > totalRaised ? totalValuation - totalRaised : 0;
    }

    function getFundingProgressBps() public view returns (uint256) {
        if (totalValuation == 0) return 0;
        return (totalRaised * BASIS_POINTS) / totalValuation;
    }
}
```

---

### 5.2 CBDRewardDistributor.sol — Platform-Wide

**File:** `contracts/CBDRewardDistributor.sol`  
**Deploy:** Once, platform-wide  
**Interacts with:** Deployed CBLD at `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CBDRewardDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE     = DEFAULT_ADMIN_ROLE;
    bytes32 public constant OPERATOR_ROLE  = keccak256("OPERATOR_ROLE");

    IERC20 public immutable cbldToken;

    // Configurable reward amounts (set by admin)
    uint256 public listingRewardAmount;       // CBLD per approved property listing
    uint256 public investmentRewardPerUsdc;   // CBLD per 1 USDC invested (scaled)
    uint256 public rentPaymentRewardAmount;   // CBLD per verified rent payment

    uint256 public totalRewardsIssued;

    event RewardIssued(
        address indexed recipient,
        uint256 amount,
        string  rewardType,      // "LISTING" | "INVESTMENT" | "RENT" | "HOLDING" | "MANUAL"
        uint256 referenceId,     // propertyId or investmentId
        uint256 timestamp
    );

    event RewardConfigUpdated(string rewardType, uint256 newAmount);

    constructor(
        address _cbldToken,
        address _admin,
        uint256 _listingReward,
        uint256 _investmentRewardPerUsdc,
        uint256 _rentReward
    ) {
        cbldToken                = IERC20(_cbldToken);
        listingRewardAmount      = _listingReward;
        investmentRewardPerUsdc  = _investmentRewardPerUsdc;
        rentPaymentRewardAmount  = _rentReward;
        _grantRole(ADMIN_ROLE,    _admin);
        _grantRole(OPERATOR_ROLE, _admin);
    }

    function issueListingReward(address propertyOwner, uint256 propertyId)
        external onlyRole(OPERATOR_ROLE) nonReentrant
    {
        _issueReward(propertyOwner, listingRewardAmount, "LISTING", propertyId);
    }

    function issueInvestmentReward(address investor, uint256 usdcAmount, uint256 propertyId)
        external onlyRole(OPERATOR_ROLE) nonReentrant
    {
        uint256 reward = (usdcAmount * investmentRewardPerUsdc) / 1e6; // scale for USDC decimals
        if (reward == 0) return;
        _issueReward(investor, reward, "INVESTMENT", propertyId);
    }

    function issueRentReward(address tenant, uint256 propertyId)
        external onlyRole(OPERATOR_ROLE) nonReentrant
    {
        _issueReward(tenant, rentPaymentRewardAmount, "RENT", propertyId);
    }

    function issueManualReward(address recipient, uint256 amount, string calldata rewardType, uint256 referenceId)
        external onlyRole(ADMIN_ROLE) nonReentrant
    {
        _issueReward(recipient, amount, rewardType, referenceId);
    }

    function batchIssueRewards(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata rewardType,
        uint256 referenceId
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _issueReward(recipients[i], amounts[i], rewardType, referenceId);
        }
    }

    function _issueReward(address recipient, uint256 amount, string memory rewardType, uint256 referenceId) internal {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(cbldToken.balanceOf(address(this)) >= amount, "Insufficient CBLD in distributor");

        cbldToken.safeTransfer(recipient, amount);
        totalRewardsIssued += amount;

        emit RewardIssued(recipient, amount, rewardType, referenceId, block.timestamp);
    }

    // Admin: load CBLD into distributor
    function fundDistributor(uint256 amount) external onlyRole(ADMIN_ROLE) {
        cbldToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    // Admin: update reward amounts
    function setListingReward(uint256 amount) external onlyRole(ADMIN_ROLE) {
        listingRewardAmount = amount;
        emit RewardConfigUpdated("LISTING", amount);
    }

    function setInvestmentRewardPerUsdc(uint256 amount) external onlyRole(ADMIN_ROLE) {
        investmentRewardPerUsdc = amount;
        emit RewardConfigUpdated("INVESTMENT", amount);
    }

    function setRentReward(uint256 amount) external onlyRole(ADMIN_ROLE) {
        rentPaymentRewardAmount = amount;
        emit RewardConfigUpdated("RENT", amount);
    }

    function withdrawCBLD(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        cbldToken.safeTransfer(to, amount);
    }
}
```

---

### 5.3 Secondary Marketplace — Phase 2 (Design Only for Now)

Not MVP. Build after core platform is stable. Architecture preview:

```
SecondaryMarket.sol:
  State:
    struct Listing { address seller; address propertyContract; uint256 shares; uint256 askPriceUsdc; bool active; }
    mapping(uint256 => Listing) listings;
    uint256 platformFeeBps; // e.g. 200 = 2%

  Functions:
    createListing(propertyContract, shares, askPriceUsdc)
      → calls propertyContract.lockSharesForSale(seller, shares)
      → records listing
    
    buyListing(listingId)
      → transfers USDC from buyer to seller (minus platform fee)
      → calls propertyContract.transferShares(seller, buyer, shares)
      → deactivates listing

  PropertyEscrow additions needed for Phase 2:
    lockSharesForSale(address seller, uint256 shares) external onlySecondaryMarket
    transferShares(address from, address to, uint256 shares) external onlySecondaryMarket
    unlockShares(address seller, uint256 shares) external onlySecondaryMarket
```

---

## 6. CBLD Token — Deployed Contract Analysis

### Deployed Details

| Property | Value |
|---|---|
| **Contract Address** | `0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983` |
| **Chain** | Ethereum Mainnet |
| **Name** | Concrete Build |
| **Symbol** | CBLD |
| **Decimals** | 18 |
| **Total Supply** | 1,000,000,000 CBLD (1 Billion, all minted at deployment) |
| **Buy Tax** | 1% (configurable by owner) |
| **Sell Tax** | 5% (configurable by owner) |
| **Transfer Tax** | 0% (configurable by owner) |
| **Tax Max** | 99% (MAX_TAX_PERCENTAGE constant) |
| **DEX Detection** | `_isDex` mapping — buy/sell determined by sender/receiver being a DEX |
| **Fee Exemptions** | `_isExcludedFromFee` mapping — deployer exempt at launch |
| **Ownership** | `Ownable2Step` — 2-step ownership transfer (more secure) |
| **Reentrancy** | `ReentrancyGuard` on all transfers |
| **Verified on** | Etherscan (2024-10-18) |

### Contract Architecture (From Deployed Code)

```
CBLD inherits: Context + IERC20 + Ownable2Step + ReentrancyGuard

Key mappings:
  balances[address]                              → token balance
  allowances[address][spender]                   → ERC20 allowances
  _isExcludedFromFee[address]                    → fee exemption
  _isDex[address]                                → DEX pair tracking

Tax logic in _transfer():
  if sender is DEX    → apply buyTax  → route fee to taxReceiver
  if receiver is DEX  → apply sellTax → route fee to taxReceiver
  else                → apply transferTax (0% by default)
  if either excluded  → no tax

All supply minted to deployer in constructor:
  balances[msg.sender] = INITIAL_SUPPLY (1B * 10^18)
  deployer is excluded from fees by default
```

### How the Platform Interacts with CBLD

Since all CBLD was minted to the deployer and CBLD has no `mint()` function (fixed supply), the reward model works like this:

```
Deployer wallet holds all 1B CBLD
         ↓
Admin allocates portion to CBDRewardDistributor contract
         ↓
CBDRewardDistributor.fundDistributor(amount) called by admin
         ↓
As reward events occur, distributor.safeTransfer(recipient, amount)
         ↓
Recipients receive CBLD in their wallets
```

**Important:** Because CBLD has no `mint()`, rewards are funded from the initial supply held by the deployer. The admin must pre-fund `CBDRewardDistributor.sol` before rewards can be issued.

### CBLD Integration in CBDRewardDistributor

```javascript
// CBLD contract interface for integration
const CBLD_ADDRESS = "0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983";

const CBLD_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function buyTax() view returns (uint256)",
  "function sellTax() view returns (uint256)",
  "function transferTax() view returns (uint256)",
  "function taxReceiver() view returns (address)",
  "function isExcludedFromFee(address) view returns (bool)",
  "function addDexAddress(address) external",
  "function excludeFromFee(address) external",
  "function includeInFee(address) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TaxCollected(address indexed taxReceiver, uint256 amount)"
];
```

**Action Required:** The `CBDRewardDistributor` contract address must be added to CBLD's `_isExcludedFromFee` mapping (call `excludeFromFee(distributorAddress)` from the CBLD owner wallet) so reward transfers are not taxed.

---

## 7. Platform Roles & Access Control

### Role Matrix

| Role | On-Chain Role | DB Role | Capabilities |
|---|---|---|---|
| **Platform Admin** | `DEFAULT_ADMIN_ROLE` | `admin` | Everything — deploy contracts, set rewards, override anything, manage treasury |
| **Moderator** | `MODERATOR_ROLE` + `OPERATOR_ROLE` on distributor | `moderator` | Approve/reject properties, verify rent, trigger CBLD rewards, review docs |
| **Property Owner** | No on-chain role | `property_owner` | List properties, deposit profits, view own analytics, earn CBLD |
| **Investor** | No on-chain role (tracked by investment mapping) | `investor` | Browse marketplace, invest, claim profits, relist shares, earn CBLD |
| **Tenant** | No on-chain role | `tenant` | Receive CBLD rent rewards, view tenancy info |

### Admin Wallet Security Requirement

> **CRITICAL:** The platform admin wallet controls: PropertyEscrow `activateProperty()`, `distributeProfit()`, CBLD `excludeFromFee()`, `addDexAddress()`, and CBDRewardDistributor reward issuance.  
> **Use Gnosis Safe multisig** (`safe.global`) for the admin wallet. Require 2-of-3 or 3-of-5 signers minimum.

---

## 8. Marketplace & Frontend Specification

### Page Routes

```
/                             Landing — platform overview, featured properties, waitlist CTA
/marketplace                  Browse all active properties (filter/sort/search)
/marketplace/[propertyId]     Single property detail + investment stats
/invest/[propertyId]          Investment modal flow (or inline on detail page)
/dashboard                    Investor: portfolio, claimable profits, CBLD balance
/dashboard/owner              Property owner: listings, deposit profit, stats
/profile                      User: wallet, KYC status, settings
/admin                        Admin/Moderator protected panel
/admin/properties             Review queue + approval workflow
/admin/properties/[id]        Individual property review
/admin/rewards                CBLD reward configuration + manual issuance
/admin/contracts              Deployed contract registry
/admin/distributions          Profit deposit verification + trigger
/admin/users                  User management + KYC
```

### Component Specifications

#### Marketplace Page (`/marketplace`)
- Grid of `PropertyCard` components
- Each card shows: primary image, title, location, valuation, funded %, expected APY, investor count, CBLD reward badge
- Filters: location (country/city), asset type (residential/commercial/land), valuation range, funding status (open/closed/fully funded), expected APY range
- Sort: newest, highest APY, most funded, lowest minimum investment
- Pagination or infinite scroll (recommend: pagination for SEO)
- "Connect Wallet" CTA in header

#### Property Detail Page (`/marketplace/[propertyId]`)
- Image gallery (primary + additional images)
- Full description, location map embed
- Stats grid:
  - Total Valuation (USDC)
  - Amount Raised (USDC)
  - Funding Progress (progress bar, %)
  - Investor Count
  - Expected Annual ROI (%)
  - Expected Monthly Yield (USDC estimate)
  - Investment Status (Open / Closed / Fully Funded)
- Ownership distribution pie chart (top 5 investors + "Others")
- Documents section (viewable PDFs: title deed, valuation report, etc.)
- Investment history feed (on-chain events, most recent first)
- "Invest Now" button → investment flow

#### Investment Flow
```
Step 1: Connect wallet (skip if already connected)
Step 2: KYC check → if not approved, show "Complete KYC" CTA
Step 3: Input USDC amount
        → Show: shares you'll receive, % ownership, estimated monthly yield
        → Validate: min investment, max (remaining), user USDC balance
Step 4: USDC Approval transaction (ERC-20 approve)
        → Show pending state
Step 5: Invest transaction (PropertyEscrow.invest())
        → Show pending state
Step 6: Success screen
        → Shares allocated, % ownership
        → CBLD reward earned
        → "View in Dashboard" CTA
```

#### Investor Dashboard (`/dashboard`)
- Portfolio summary: total invested (USDC), properties count, total received (USDC), claimable now (USDC), CBLD earned
- Per-property portfolio cards:
  - Property name + image
  - Your investment (USDC)
  - Your shares / % ownership
  - Total profit received (USDC)
  - Claimable now (USDC) + "Claim" button
  - CBLD earned from this property
- CBLD wallet section: balance, reward history
- Secondary listings (Phase 2): show relisted shares

#### Admin Panel (`/admin`)
- **Properties Queue**: table of pending properties, each with: owner wallet, submission date, valuation, documents, [Approve] [Reject] [Request More Info] actions
- **Property Detail Review**: all metadata + docs, approval notes input, moderator checklist
- **Contract Registry**: list of all deployed PropertyEscrow contracts with property mapping
- **Reward Config**: input fields for listingReward, investmentRewardPerUsdc, rentReward — calls distributor admin functions
- **Distributions Panel**: pending profit deposits → [Verify] → [Distribute On-Chain] workflow
- **User Management**: KYC status, role assignment, wallet addresses

---

## 9. Database Schema

**Database:** PostgreSQL via Supabase  
**Auth:** Supabase Auth + SIWE (Sign-In With Ethereum)

```sql
-- ══════════════════════════════════════
-- USERS
-- ══════════════════════════════════════
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address    varchar(42) UNIQUE NOT NULL,
  email             varchar,
  display_name      varchar,
  kyc_status        varchar CHECK (kyc_status IN ('none','pending','approved','rejected')) DEFAULT 'none',
  kyc_provider      varchar,          -- e.g. 'sumsub', 'persona'
  kyc_reference_id  varchar,          -- external KYC provider reference
  role              varchar CHECK (role IN ('investor','property_owner','moderator','admin','tenant')) DEFAULT 'investor',
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ══════════════════════════════════════
-- PROPERTIES
-- ══════════════════════════════════════
CREATE TABLE properties (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id               uuid REFERENCES users(id) ON DELETE RESTRICT,
  title                  varchar NOT NULL,
  description            text,
  short_description      varchar(300),
  location_country       varchar NOT NULL,
  location_city          varchar NOT NULL,
  location_address       varchar,
  location_lat           decimal(10,7),
  location_lng           decimal(10,7),
  asset_type             varchar CHECK (asset_type IN ('residential','commercial','mixed','industrial','land')),
  total_valuation_usdc   numeric(30,6) NOT NULL,  -- USDC, 6 decimals
  min_investment_usdc    numeric(30,6) DEFAULT 100000000, -- $100 default
  expected_roi_annual    numeric(6,2),             -- percentage e.g. 8.50
  expected_monthly_yield numeric(30,6),            -- USDC estimate
  investment_term_months integer,
  status                 varchar CHECK (status IN ('draft','pending_review','approved','rejected','active','investment_closed','completed')) DEFAULT 'draft',
  contract_address       varchar(42),              -- deployed PropertyEscrow address
  chain_id               integer DEFAULT 1,        -- 1 = Ethereum Mainnet
  total_shares           integer DEFAULT 10000,
  moderator_id           uuid REFERENCES users(id),
  review_notes           text,
  rejection_reason       text,
  reviewed_at            timestamptz,
  deployed_at            timestamptz,
  activated_at           timestamptz,
  featured               boolean DEFAULT false,
  sort_order             integer DEFAULT 0,
  ipfs_metadata_cid      varchar,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_contract ON properties(contract_address);
CREATE INDEX idx_properties_owner ON properties(owner_id);

-- ══════════════════════════════════════
-- PROPERTY DOCUMENTS
-- ══════════════════════════════════════
CREATE TABLE property_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid REFERENCES properties(id) ON DELETE CASCADE,
  document_type varchar CHECK (document_type IN ('title_deed','valuation_report','legal_clearance','identity_proof','tax_certificate','building_permit','other')),
  display_name  varchar,
  file_url      varchar NOT NULL,    -- Supabase Storage / S3 URL
  file_size     bigint,
  mime_type     varchar,
  is_public     boolean DEFAULT false,  -- public = visible to investors
  is_verified   boolean DEFAULT false,
  verified_by   uuid REFERENCES users(id),
  verified_at   timestamptz,
  uploaded_at   timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- PROPERTY IMAGES
-- ══════════════════════════════════════
CREATE TABLE property_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid REFERENCES properties(id) ON DELETE CASCADE,
  image_url    varchar NOT NULL,
  thumbnail_url varchar,
  is_primary   boolean DEFAULT false,
  caption      varchar,
  sort_order   integer DEFAULT 0,
  uploaded_at  timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- INVESTMENTS (mirror of on-chain data)
-- ══════════════════════════════════════
CREATE TABLE investments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      uuid REFERENCES properties(id) ON DELETE RESTRICT,
  investor_id      uuid REFERENCES users(id) ON DELETE RESTRICT,
  wallet_address   varchar(42) NOT NULL,
  usdc_amount      numeric(30,6) NOT NULL,
  shares_allocated numeric(20,0) NOT NULL,
  share_pct_bps    numeric(10,4),          -- basis points e.g. 500 = 5%
  tx_hash          varchar(66) UNIQUE NOT NULL,
  block_number     bigint,
  block_timestamp  timestamptz,
  synced_at        timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_property ON investments(property_id);
CREATE INDEX idx_investments_tx ON investments(tx_hash);

-- ══════════════════════════════════════
-- PROFIT DISTRIBUTIONS
-- ══════════════════════════════════════
CREATE TABLE profit_distributions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id            uuid REFERENCES properties(id) ON DELETE RESTRICT,
  deposited_by_id        uuid REFERENCES users(id),
  total_amount_usdc      numeric(30,6) NOT NULL,
  description            text,             -- "Q1 2025 Rental Income", etc.
  deposit_tx_hash        varchar(66),
  distribution_tx_hash   varchar(66),
  status                 varchar CHECK (status IN ('deposit_pending','deposited','verified','distributing','distributed','failed')) DEFAULT 'deposit_pending',
  verified_by_id         uuid REFERENCES users(id),
  verified_at            timestamptz,
  distributed_at         timestamptz,
  failure_reason         text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
CREATE INDEX idx_distributions_property ON profit_distributions(property_id);
CREATE INDEX idx_distributions_status ON profit_distributions(status);

-- ══════════════════════════════════════
-- CBLD REWARDS
-- ══════════════════════════════════════
CREATE TABLE cbld_rewards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id   uuid REFERENCES users(id) ON DELETE RESTRICT,
  wallet_address varchar(42) NOT NULL,
  amount         numeric(36,18) NOT NULL,   -- CBLD, 18 decimals
  reward_type    varchar CHECK (reward_type IN ('listing','investment','rent','holding','manual','other')),
  reference_id   uuid,                      -- property_id, investment_id, etc.
  tx_hash        varchar(66),
  status         varchar CHECK (status IN ('pending','issued','failed')) DEFAULT 'pending',
  issued_at      timestamptz,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX idx_cbld_rewards_recipient ON cbld_rewards(recipient_id);

-- ══════════════════════════════════════
-- SECONDARY LISTINGS (Phase 2)
-- ══════════════════════════════════════
CREATE TABLE secondary_listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         uuid REFERENCES properties(id) ON DELETE RESTRICT,
  seller_id           uuid REFERENCES users(id) ON DELETE RESTRICT,
  shares_for_sale     numeric(20,0) NOT NULL,
  ask_price_usdc      numeric(30,6) NOT NULL,   -- total ask for all listed shares
  price_per_share     numeric(30,6),             -- calculated
  status              varchar CHECK (status IN ('active','sold','cancelled','expired')) DEFAULT 'active',
  buyer_id            uuid REFERENCES users(id),
  sale_tx_hash        varchar(66),
  on_chain_listing_id bigint,                    -- SecondaryMarket.sol listing ID
  expires_at          timestamptz,
  sold_at             timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- AUDIT LOG
-- ══════════════════════════════════════
CREATE TABLE audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES users(id),
  actor_wallet varchar(42),
  action       varchar NOT NULL,           -- 'PROPERTY_APPROVED', 'INVESTMENT_MADE', etc.
  entity_type  varchar,                    -- 'property', 'investment', 'distribution'
  entity_id    uuid,
  metadata     jsonb,
  ip_address   inet,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ══════════════════════════════════════
-- PLATFORM SETTINGS
-- ══════════════════════════════════════
CREATE TABLE platform_settings (
  key        varchar PRIMARY KEY,
  value      text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
  ('cbld_listing_reward', '500000000000000000000'),   -- 500 CBLD (18 decimals)
  ('cbld_investment_reward_per_usdc', '1000000000000000000'), -- 1 CBLD per 1 USDC
  ('cbld_rent_reward', '100000000000000000000'),      -- 100 CBLD
  ('min_investment_usdc', '100000000'),               -- $100 USDC (6 decimals)
  ('platform_fee_bps', '200'),                        -- 2%
  ('secondary_market_enabled', 'false'),
  ('maintenance_mode', 'false');
```

---

## 10. Backend API Specification

### Auth — SIWE (Sign-In With Ethereum)

```
POST /api/auth/nonce
  → Returns: { nonce: string }

POST /api/auth/verify
  Body: { message: string, signature: string }
  → Returns: { token: string, user: User }
  → Creates user record if first login

GET  /api/auth/me
  Headers: Authorization: Bearer <jwt>
  → Returns: { user: User }
```

### Properties API

```
GET    /api/properties
  Query: status, location, assetType, minValuation, maxValuation, minRoi, page, limit
  → Returns: { properties: Property[], total, page, limit }
  → Public endpoint (active properties only for non-admins)

POST   /api/properties
  Auth: property_owner or admin
  Body: { title, description, location*, assetType, totalValuationUsdc, expectedRoi, ... }
  → Creates property in 'draft' status
  → Returns: { property: Property }

GET    /api/properties/:id
  → Returns: { property: Property, documents, images, stats }

PATCH  /api/properties/:id
  Auth: owner (draft only) or admin
  → Update metadata

POST   /api/properties/:id/submit
  Auth: property_owner
  → Changes status draft → pending_review
  → Triggers moderator notification

POST   /api/properties/:id/approve
  Auth: moderator or admin
  Body: { reviewNotes?: string }
  → Changes status → approved
  → Triggers deploy workflow notification

POST   /api/properties/:id/reject
  Auth: moderator or admin
  Body: { rejectionReason: string }
  → Changes status → rejected

POST   /api/properties/:id/activate
  Auth: admin
  Body: { contractAddress: string }
  → Links contract address, status → active
  → Calls PropertyEscrow.activateProperty() via admin wallet

POST   /api/properties/:id/documents
  Auth: property_owner
  Body: multipart/form-data (file + documentType)
  → Uploads to Supabase Storage
  → Creates document record

GET    /api/properties/:id/stats
  → Returns: { totalRaised, investorCount, fundingPct, ... } (reads from contract + DB)
```

### Investments API

```
POST   /api/investments
  Auth: investor
  Body: { propertyId, txHash, usdcAmount, sharesAllocated, blockNumber }
  → Records confirmed on-chain investment
  → Triggers CBLD reward issuance (via distributor contract)

GET    /api/investments/me
  Auth: investor
  → Returns: { investments: Investment[] } (investor's portfolio)

GET    /api/investments/property/:propertyId
  Auth: admin or moderator
  → Returns all investments for a property
```

### Distributions API

```
POST   /api/distributions
  Auth: property_owner or admin
  Body: { propertyId, totalAmountUsdc, description, depositTxHash }
  → Creates distribution record in 'deposited' status

POST   /api/distributions/:id/verify
  Auth: moderator or admin
  Body: { verificationNotes?: string }
  → Status → verified

POST   /api/distributions/:id/distribute
  Auth: admin
  → Calls PropertyEscrow.distributeProfit(amount) on-chain via admin wallet
  → Status → distributed
  → Records distributionTxHash

GET    /api/distributions/property/:propertyId
  → Returns distribution history for a property
```

### Rewards API

```
POST   /api/rewards/issue
  Auth: admin or operator
  Body: { recipientId, rewardType, referenceId, amount? }
  → Calls CBDRewardDistributor.issue*Reward() on-chain
  → Records in cbld_rewards table

GET    /api/rewards/me
  Auth: any
  → Returns user's CBLD reward history
```

### On-Chain Event Sync (Background Worker)

```javascript
// Run as separate process or scheduled job
// Using Alchemy Webhooks or polling

// Events to listen for on each PropertyEscrow:
PropertyEscrow.on('InvestmentMade', (investor, usdcAmount, shares, sharePct, event) => {
  // 1. Upsert investment record in DB
  // 2. Issue CBLD investment reward via API
  // 3. Update property stats cache
});

PropertyEscrow.on('ProfitAllocated', (totalAmount, investorCount, timestamp, event) => {
  // 1. Update distribution record status to 'distributed'
  // 2. Notify investors (email/push)
});

PropertyEscrow.on('ProfitClaimed', (investor, amount, event) => {
  // 1. Record claim event in DB
  // 2. Update investor dashboard data
});
```

---

## 11. Wallet & Web3 Integration

### Key Addresses (Ethereum Mainnet)

```javascript
export const ADDRESSES = {
  CBLD:  "0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983",
  USDC:  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  // Set after deployment:
  CBD_REWARD_DISTRIBUTOR: process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS,
};

export const CHAIN_ID = 1; // Ethereum Mainnet
```

### wagmi Config

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { walletConnect, metaMask, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    metaMask(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
  },
});
```

### Investment Transaction Pattern

```typescript
// hooks/useInvest.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { USDC_ABI, PROPERTY_ESCROW_ABI } from '@/lib/abis';

export function useInvest(propertyContractAddress: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();

  const invest = async (usdcAmountFormatted: string) => {
    const amount = parseUnits(usdcAmountFormatted, 6); // USDC = 6 decimals

    // Step 1: Approve USDC
    const approveTxHash = await writeContractAsync({
      address: ADDRESSES.USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [propertyContractAddress, amount],
    });
    // Wait for approval confirmation...

    // Step 2: Invest
    const investTxHash = await writeContractAsync({
      address: propertyContractAddress,
      abi: PROPERTY_ESCROW_ABI,
      functionName: 'invest',
      args: [amount],
    });

    return investTxHash;
  };

  return { invest };
}
```

### PropertyEscrow ABI (Key Functions)

```typescript
export const PROPERTY_ESCROW_ABI = [
  // State reads
  { name: 'propertyId',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalValuation',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalRaised',         type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'sharesSold',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'investmentOpen',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool'    }] },
  { name: 'propertyActive',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool'    }] },
  { name: 'getInvestorCount',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getFundingProgressBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'investorShares',      type: 'function', stateMutability: 'view', inputs: [{ name: 'investor', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'claimableProfit',     type: 'function', stateMutability: 'view', inputs: [{ name: 'investor', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getSharePercentageBps', type: 'function', stateMutability: 'view', inputs: [{ name: 'investor', type: 'address' }], outputs: [{ type: 'uint256' }] },
  // Writes
  { name: 'invest',         type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'usdcAmount', type: 'uint256' }], outputs: [] },
  { name: 'claimProfit',    type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'depositProfit',  type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  // Events
  { name: 'InvestmentMade',  type: 'event', inputs: [{ indexed: true, name: 'investor', type: 'address' }, { indexed: false, name: 'usdcAmount', type: 'uint256' }, { indexed: false, name: 'sharesAllocated', type: 'uint256' }, { indexed: false, name: 'sharePercentageBps', type: 'uint256' }] },
  { name: 'ProfitClaimed',   type: 'event', inputs: [{ indexed: true, name: 'investor', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }] },
  { name: 'ProfitAllocated', type: 'event', inputs: [{ indexed: false, name: 'totalAmount', type: 'uint256' }, { indexed: false, name: 'investorCount', type: 'uint256' }, { indexed: false, name: 'timestamp', type: 'uint256' }] },
] as const;
```

---

## 12. Phase-by-Phase Action Plan

### Phase 0 — Setup & Technical Decisions (Week 1)

- [ ] Clone and study all 3 reference repos (Brickken, eREIT, 0xEstate)
- [ ] Map reference patterns to our spec (use Section 4 as guide)
- [ ] Initialize monorepo: `packages/contracts`, `packages/frontend`, `packages/backend`
- [ ] Set up Hardhat project with OZ 5.x dependencies
- [ ] Create Supabase project + apply schema from Section 9
- [ ] Initialize Next.js 14 project
- [ ] Set up Alchemy account + get mainnet + Sepolia RPC URLs
- [ ] Set up WalletConnect project ID
- [ ] Configure all env vars (see Appendix C)
- [ ] Set up GitHub repo with branch strategy: `main` (prod), `develop`, feature branches
- [ ] Confirm final decisions from Appendix A with client

---

### Phase 1 — Smart Contracts (Weeks 2–4)

**Start here — everything else depends on contract interfaces.**

- [ ] Write `PropertyEscrow.sol` using spec in Section 5.1
  - [ ] Implement `invest()` — reference Brickken + 0xEstate
  - [ ] Implement `distributeProfit()` — reference eREIT + Brickken DistributionManager
  - [ ] Implement `claimProfit()` — pull pattern
  - [ ] Implement `depositProfit()`
  - [ ] Add pausability, access control, events
- [ ] Write unit tests — Hardhat + Chai or Foundry
  - [ ] Test: normal invest flow
  - [ ] Test: exceed max investment (should revert)
  - [ ] Test: invest after close (should revert)
  - [ ] Test: distribution math with 1, 3, 10 investors
  - [ ] Test: rounding edge cases (1 wei remainder)
  - [ ] Test: claim after distribution
  - [ ] Test: pause/unpause
  - [ ] Test: role access (non-admin calls admin fn — should revert)
- [ ] Write `CBDRewardDistributor.sol` (Section 5.2)
- [ ] Write tests for distributor
- [ ] Write deployment scripts for both contracts
- [ ] Deploy to Sepolia testnet
- [ ] Verify on Sepolia Etherscan
- [ ] Run integration test: full flow on testnet with USDC mock
- [ ] Security review against Section 14 checklist
- [ ] **After approval:** Deploy to Ethereum Mainnet
- [ ] Verify on Etherscan
- [ ] Call `cbld.excludeFromFee(distributorAddress)` from CBLD owner wallet

**Test Coverage Target:** 95%+

---

### Phase 2 — Backend & Database (Weeks 3–5, overlaps contracts)

- [ ] Initialize Next.js project (or Express if preferred)
- [ ] Connect to Supabase — run schema migrations
- [ ] Implement SIWE auth (Sign-In With Ethereum)
  - [ ] Nonce generation endpoint
  - [ ] Signature verification + JWT issuance
  - [ ] Auth middleware for protected routes
- [ ] Properties API (all endpoints from Section 10)
- [ ] Investments API
- [ ] Distributions API  
- [ ] Rewards API (calls CBDRewardDistributor on-chain)
- [ ] File upload to Supabase Storage (property docs/images)
- [ ] On-chain event sync worker (Alchemy Webhooks or polling)
  - [ ] `InvestmentMade` → sync DB + issue CBLD reward
  - [ ] `ProfitAllocated` → update distribution status
  - [ ] `ProfitClaimed` → record in DB
- [ ] API rate limiting + auth guards
- [ ] Input validation (Zod)
- [ ] Error logging (Sentry)

---

### Phase 3 — Frontend (Weeks 5–8)

- [ ] Initialize Next.js 14 with Tailwind + shadcn/ui
- [ ] Set up wagmi + RainbowKit wallet connection
- [ ] Set up SIWE auth flow (connect wallet → sign → JWT)
- [ ] Build component library:
  - [ ] `PropertyCard`
  - [ ] `PropertyGrid` (with filters/sort)
  - [ ] `InvestmentModal` (multi-step)
  - [ ] `PortfolioCard`
  - [ ] `ProfitClaimButton`
  - [ ] `CBLDBalanceDisplay`
  - [ ] `FundingProgressBar`
  - [ ] `OwnershipPieChart`
  - [ ] `TransactionPendingOverlay`
- [ ] Build pages (see Section 8 for specs)
  - [ ] Landing page
  - [ ] Marketplace
  - [ ] Property detail
  - [ ] Investment flow
  - [ ] Investor dashboard
  - [ ] Property owner dashboard
  - [ ] Admin panel
- [ ] Mobile responsive
- [ ] Loading + error states for all async operations
- [ ] Toast notifications for tx confirmations/errors

---

### Phase 4 — Integration & Testing (Weeks 8–10)

- [ ] Full E2E test on testnet:my main folder i s
  - [ ] List property → moderate → approve → deploy contract → activate
  - [ ] Investor invests → CBLD reward issued
  - [ ] Multiple investors → distribution → each claims
  - [ ] Owner deposits profit → admin verifies → distribute → investors claim
- [ ] Test edge cases
- [ ] Fix bugs
- [ ] Performance testing (Lighthouse scores, API response times)
- [ ] Security review (OWASP checklist, API endpoint audit)

---

### Phase 5 �