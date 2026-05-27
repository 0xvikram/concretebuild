import { Router } from 'express';
import { db } from '../db';
import { profitDistributions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Create distribution
router.post('/', async (req, res) => {
  try {
    const [distribution] = await db.insert(profitDistributions).values(req.body).returning();
    res.json({ distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create distribution' });
  }
});

// Verify distribution
router.post('/:id/verify', async (req, res) => {
  try {
    const [distribution] = await db.update(profitDistributions)
      .set({ status: 'verified', verifiedAt: new Date(), verifiedById: req.body.verifiedById })
      .where(eq(profitDistributions.id, req.params.id))
      .returning();
    res.json({ distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify distribution' });
  }
});

// Mark as distributed
router.post('/:id/distribute', async (req, res) => {
  try {
    const [distribution] = await db.update(profitDistributions)
      .set({ status: 'distributed', distributedAt: new Date(), distributionTxHash: req.body.txHash })
      .where(eq(profitDistributions.id, req.params.id))
      .returning();
    res.json({ distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as distributed' });
  }
});

// Get property distributions
router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await db.select().from(profitDistributions)
      .where(eq(profitDistributions.propertyId, req.params.propertyId))
      .orderBy(desc(profitDistributions.createdAt));
    res.json({ distributions: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

export { router as distributionsRouter };
