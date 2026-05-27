import { ethers } from 'ethers';

const DISTRIBUTOR_ABI = [
  'function issueInvestmentReward(address investor, uint256 usdcAmount, uint256 propertyId) external',
  'function issueListingReward(address propertyOwner, uint256 propertyId) external',
];

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY || '', provider);

const distributorContract = new ethers.Contract(
  process.env.CBD_REWARD_DISTRIBUTOR_ADDRESS || '',
  DISTRIBUTOR_ABI,
  wallet
);

export async function mintInvestmentReward(investorAddress: string, usdcAmount: string, propertyId: string) {
  try {
    const tx = await distributorContract.issueInvestmentReward(
      investorAddress,
      usdcAmount, // Already in USDC decimals (6)
      propertyId
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Failed to mint investment reward:', error);
    throw error;
  }
}

export async function mintListingReward(ownerAddress: string, propertyId: string) {
  try {
    const tx = await distributorContract.issueListingReward(ownerAddress, propertyId);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Failed to mint listing reward:', error);
    throw error;
  }
}
