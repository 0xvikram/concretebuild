// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CBDRewardDistributor
 * @notice Platform-wide CBLD reward distribution system
 * @dev Interacts with deployed CBLD token at 0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983
 */
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

    error InvalidRecipient();
    error ZeroAmount();
    error InsufficientCBLD();

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

    /**
     * @notice Issue 9% CBLD reward based on USDC investment amount
     * @dev Calculation: (usdcAmount * 9 * 1e18) / (100 * 1e6)
     *      Example: $1000 USDC = 1000 * 1e6 = 1,000,000,000
     *      Reward = (1,000,000,000 * 9 * 1e18) / (100 * 1e6) = 90 * 1e18 = 90 CBLD
     */
    function issueInvestmentReward(address investor, uint256 usdcAmount, uint256 propertyId)
        external onlyRole(OPERATOR_ROLE) nonReentrant
    {
        // 9% of USDC amount in CBLD (USDC has 6 decimals, CBLD has 18)
        uint256 reward = (usdcAmount * 9 * 1e18) / (100 * 1e6);
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
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert ZeroAmount();
        if (cbldToken.balanceOf(address(this)) < amount) revert InsufficientCBLD();

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
