export const CONTRACTS = {
  USDC: '0xC562066d4FB39C26Fe5C20EFc3E3C19188Fe578D',
  CBLD: '0x5e697416159400fA7299457c1D0F4Efe5a3E6344',
  DISTRIBUTOR: '0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15',
  PROPERTY_ESCROW: '0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33',
} as const;

export const PROPERTY_ESCROW_ABI = [
  'function propertyId() view returns (uint256)',
  'function totalValuation() view returns (uint256)',
  'function totalRaised() view returns (uint256)',
  'function sharesSold() view returns (uint256)',
  'function totalProfitDeposited() view returns (uint256)',
  'function totalProfitDistributed() view returns (uint256)',
  'function investmentOpen() view returns (bool)',
  'function propertyActive() view returns (bool)',
  'function investorShares(address) view returns (uint256)',
  'function claimableProfit(address) view returns (uint256)',
  'function getSharePercentageBps(address) view returns (uint256)',
  'function getInvestorCount() view returns (uint256)',
  'function getRemainingInvestment() view returns (uint256)',
  'function getFundingProgressBps() view returns (uint256)',
  'function invest(uint256 usdcAmount)',
  'function claimProfit()',
  'function distributeProfit(uint256 amount)',
  'event InvestmentMade(address indexed investor, uint256 usdcAmount, uint256 sharesAllocated, uint256 sharePercentageBps)',
  'event ProfitClaimed(address indexed investor, uint256 amount)',
  'event ProfitAllocated(uint256 totalAmount, uint256 investorCount, uint256 timestamp)',
] as const;

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;
