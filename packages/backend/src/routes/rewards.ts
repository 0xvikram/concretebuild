import { Router } from 'express';
import { db } from '../db';
import { cbldRewards } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Issue reward
router.post('/issue', async (req, res) => {
  try {
    const [reward] = await db.insert(cbldRewards).values(req.body).returning();
    res.json({ reward });
  } catch (error) {
    res.status(500).json({ error: 'Failed to issue reward' });
  }
});

// Get user rewards
router.get('/me', async (req, res) => {
  try {
    const { recipientId } = req.query;
    const result = await db.select().from(cbldRewards)
      .where(eq(cbldRewards.recipientId, recipientId as string))
      .orderBy(desc(cbldRewards.createdAt));
    res.json({ rewards: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

export { router as rewardsRouter };
