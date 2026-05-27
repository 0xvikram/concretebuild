import { Router } from 'express';
import { db } from '../db';
import { properties, propertyImages, propertyDocuments, users } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

const router = Router();

// Get all properties
router.get('/', async (req, res) => {
  try {
    const { status, location, assetType } = req.query;
    
    let query = db.select().from(properties);
    
    if (status) query = query.where(eq(properties.status, status as any));
    
    const result = await query.orderBy(desc(properties.createdAt));
    res.json({ properties: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const [property] = await db.select().from(properties).where(eq(properties.id, req.params.id));
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const images = await db.select().from(propertyImages).where(eq(propertyImages.propertyId, req.params.id));
    const documents = await db.select().from(propertyDocuments).where(eq(propertyDocuments.propertyId, req.params.id));

    res.json({ property, images, documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property
router.post('/', async (req, res) => {
  try {
    const { ownerId, ownerWallet, title, description, location, totalValuation, images } = req.body;
    
    // First, ensure user exists or create one
    const { users } = await import('../db/schema');
    const [user] = await db.select().from(users).where(eq(users.walletAddress, ownerWallet.toLowerCase()));
    
    let userId = user?.id;
    if (!user) {
      const [newUser] = await db.insert(users).values({
        walletAddress: ownerWallet.toLowerCase(),
        role: 'property_owner',
      }).returning();
      userId = newUser.id;
    }
    
    // Parse location (assuming format: "City, Country")
    const [city, country] = location.split(',').map((s: string) => s.trim());
    
    // Create property
    const [property] = await db.insert(properties).values({
      ownerId: userId,
      title,
      description,
      shortDescription: description.substring(0, 300),
      locationCity: city || location,
      locationCountry: country || 'Unknown',
      totalValuationUsdc: totalValuation,
      status: 'pending_review',
    }).returning();
    
    // Save images if provided
    if (images && images.length > 0) {
      const { propertyImages } = await import('../db/schema');
      await db.insert(propertyImages).values(
        images.map((imageUrl: string, index: number) => ({
          propertyId: property.id,
          imageUrl,
          isPrimary: index === 0,
          sortOrder: index,
        }))
      );
    }
    
    res.json({ property });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({ error: 'Failed to create property', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update property
router.patch('/:id', async (req, res) => {
  try {
    const [property] = await db.update(properties)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(properties.id, req.params.id))
      .returning();
    res.json({ property });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Approve property
router.post('/:id/approve', async (req, res) => {
  try {
    const [property] = await db.update(properties)
      .set({ status: 'approved', reviewedAt: new Date() })
      .where(eq(properties.id, req.params.id))
      .returning();
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get owner wallet address
    const [owner] = await db.select().from(users).where(eq(users.id, property.ownerId));
    
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    
    // Calculate CBLD reward (9% of property value)
    const cbldAmount = (parseFloat(property.totalValuationUsdc) * 0.09).toString();
    
    // Mint CBLD tokens on-chain (optional - comment out if no operator key)
    let txHash = null;
    try {
      const { mintListingReward } = await import('../utils/contracts');
      txHash = await mintListingReward(owner.walletAddress, property.id);
    } catch (error) {
      console.error('On-chain minting failed, recording in DB only:', error);
    }
    
    // Record CBLD reward in database
    const { cbldRewards } = await import('../db/schema');
    await db.insert(cbldRewards).values({
      recipientId: property.ownerId,
      walletAddress: owner.walletAddress,
      amount: cbldAmount,
      rewardType: 'listing',
      referenceId: property.id,
      txHash,
      status: txHash ? 'issued' : 'pending',
    });
    
    res.json({ property, cbldReward: cbldAmount, txHash });
  } catch (error) {
    console.error('Property approval error:', error);
    res.status(500).json({ error: 'Failed to approve property', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Activate property
router.post('/:id/activate', async (req, res) => {
  try {
    const { contractAddress } = req.body;
    const [property] = await db.update(properties)
      .set({ status: 'active', contractAddress, activatedAt: new Date() })
      .where(eq(properties.id, req.params.id))
      .returning();
    res.json({ property });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate property' });
  }
});

export { router as propertiesRouter };
