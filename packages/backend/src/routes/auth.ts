import { Router } from 'express';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/nonce', (req, res) => {
  const nonce = Math.random().toString(36).substring(2);
  res.json({ nonce });
});

router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    // Get or create user
    let [user] = await db.select().from(users).where(eq(users.walletAddress, fields.data.address.toLowerCase()));
    
    if (!user) {
      [user] = await db.insert(users).values({
        walletAddress: fields.data.address.toLowerCase(),
      }).returning();
    }

    const token = jwt.sign({ userId: user.id, wallet: user.walletAddress }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid signature' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export { router as authRouter };
