import { ethers } from 'ethers';
import { db } from '../db';
import { investments, cbldRewards } from '../db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

const PROPERTY_ESCROW_ADDRESS = process.env.PROPERTY_ESCROW_ADDRESS || '0xD8c19CdddCc98cAcFb5a48Ed9f59BaCbAB61Cb33';
const DISTRIBUTOR_ADDRESS = process.env.CBD_REWARD_DISTRIBUTOR_ADDRESS || '0xfa47C887098559DdE9D17eA8a5F7Cb9e391E0F15';
const RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY';

const PROPERTY_ESCROW_ABI = [
  'event InvestmentMade(address indexed investor, uint256 usdcAmount, uint256 sharesAllocated, uint256 sharePercentageBps)',
  'event ProfitClaimed(address indexed investor, uint256 amount)',
  'event ProfitAllocated(uint256 totalAmount, uint256 investorCount, uint256 timestamp)',
];

const DISTRIBUTOR_ABI = [
  'event RewardIssued(address indexed recipient, uint256 amount, string rewardType, uint256 referenceId, uint256 timestamp)',
];

export async function startEventSync() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const propertyEscrow = new ethers.Contract(PROPERTY_ESCROW_ADDRESS, PROPERTY_ESCROW_ABI, provider);
  const distributor = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);

  console.log('🔄 Event sync worker started');
  console.log('Listening to:', PROPERTY_ESCROW_ADDRESS);

  // Listen for InvestmentMade events
  propertyEscrow.on('InvestmentMade', async (investor, usdcAmount, sharesAllocated, sharePercentageBps, event) => {
    console.log('💰 Investment detected:', investor, ethers.formatUnits(usdcAmount, 6));
    
    try {
      // Record investment in database
      await db.insert(investments).values({
        propertyId: '1', // Update with actual property ID
        investorId: investor, // Should map to user ID
        walletAddress: investor.toLowerCase(),
        usdcAmount: ethers.formatUnits(usdcAmount, 6),
        sharesAllocated: sharesAllocated.toString(),
        sharePctBps: ethers.formatUnits(sharePercentageBps, 0),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber.toString(),
        blockTimestamp: new Date(),
      });

      console.log('✅ Investment recorded in database');
    } catch (error) {
      console.error('❌ Error recording investment:', error);
    }
  });

  // Listen for RewardIssued events
  distributor.on('RewardIssued', async (recipient, amount, rewardType, referenceId, timestamp, event) => {
    console.log('🎁 Reward issued:', recipient, ethers.formatEther(amount), 'CBLD');
    
    try {
      await db.insert(cbldRewards).values({
        recipientId: recipient, // Should map to user ID
        walletAddress: recipient.toLowerCase(),
        amount: ethers.formatEther(amount),
        rewardType: rewardType.toLowerCase(),
        referenceId: referenceId.toString(),
        txHash: event.log.transactionHash,
        status: 'issued',
        issuedAt: new Date(),
      });

      console.log('✅ Reward recorded in database');
    } catch (error) {
      console.error('❌ Error recording reward:', error);
    }
  });

  // Listen for ProfitClaimed events
  propertyEscrow.on('ProfitClaimed', async (investor, amount, event) => {
    console.log('💵 Profit claimed:', investor, ethers.formatUnits(amount, 6), 'USDC');
    // Could update investment records or create claim history
  });

  console.log('✅ Event listeners active');
}

// Run if executed directly
if (require.main === module) {
  startEventSync().catch(console.error);
}
