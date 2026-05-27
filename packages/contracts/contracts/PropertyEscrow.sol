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
 * @dev Adapted from Brickken Offering.sol + 0xEstate + eREIT patterns
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
     * @dev Adapted from Brickken Offering.sol + 0xEstate invest pattern
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
