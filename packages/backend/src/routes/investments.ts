import { Router } from 'express';
import { db } from '../db';
import { investments, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Record investment
router.post('/', async (req, res) => {
  try {
    const { propertyId, investorId, walletAddress, usdcAmount, sharesAllocated, sharePctBps, txHash, blockNumber } = req.body;
    
    // Ensure user exists or create one
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase()));
    
    let userId = user?.id;
    if (!user) {
      const [newUser] = await db.insert(users).values({
        walletAddress: walletAddress.toLowerCase(),
        role: 'investor',
      }).returning();
      userId = newUser.id;
    }
    
    // Record investment
    const [investment] = await db.insert(investments).values({
      propertyId,
      investorId: userId,
      walletAddress: walletAddress.toLowerCase(),
      usdcAmount,
      sharesAllocated,
      sharePctBps,
      txHash,
      blockNumber,
    }).returning();
    
    // Mint CBLD tokens on-chain (9% calculated in contract)
    let rewardTxHash = null;
    try {
      const { mintInvestmentReward } = await import('../utils/contracts');
      rewardTxHash = await mintInvestmentReward(walletAddress, usdcAmount, propertyId);
    } catch (error) {
      console.error('On-chain minting failed, recording in DB only:', error);
    }
    
    // Calculate and record CBLD reward
    const cbldAmount = (parseFloat(usdcAmount) * 0.09).toString();
    const { cbldRewards } = await import('../db/schema');
    await db.insert(cbldRewards).values({
      recipientId: userId,
      walletAddress: walletAddress.toLowerCase(),
      amount: cbldAmount,
      rewardType: 'investment',
      referenceId: investment.id,
      txHash: rewardTxHash,
      status: rewardTxHash ? 'issued' : 'pending',
    });
    
    res.json({ investment, cbldReward: cbldAmount, rewardTxHash });
  } catch (error) {
    console.error('Investment recording error:', error);
    res.status(500).json({ error: 'Failed to record investment', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get investor's investments
router.get('/me', async (req, res) => {
  try {
    const { investorId } = req.query;
    const result = await db.select().from(investments)
      .where(eq(investments.investorId, investorId as string))
      .orderBy(desc(investments.createdAt));
    res.json({ investments: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get property investments
router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await db.select().from(investments)
      .where(eq(investments.propertyId, req.params.propertyId))
      .orderBy(desc(investments.createdAt));
    res.json({ investments: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

export { router as investmentsRouter };
