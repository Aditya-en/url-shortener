import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './authMiddleware.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Public Routes ---

app.post('/api/redirect/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const { password } = req.body;

    const url = await prisma.url.findUnique({ where: { shortId } });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (url.expiresAt < new Date()) {
      return res.status(410).json({ error: 'URL has expired' });
    }

    if (url.isPasswordProtected) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', isPasswordProtected: true });
      }
      if (password !== url.password) { // In a real app, use bcrypt to compare hashes
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    await prisma.url.update({
      where: { shortId },
      data: { clicks: { increment: 1 } },
    });

    return res.json({ originalUrl: url.originalUrl });
  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/shorten', authMiddleware, async (req, res) => {
  try {
    // FIX #1: Use req.user, which is defined by your middleware.
    const authenticatedUser = req.user; 

    // Find or create the user in your local database
    let localUser = await prisma.user.findUnique({
      where: {
        authId: authenticatedUser.id,
      },
    });

    if (!localUser) {
      localUser = await prisma.user.create({
        data: {
          authId: authenticatedUser.id,
          email: authenticatedUser.email,
        },
      });
    }

    const { originalUrl, customShortId, expiresIn, password } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // You are already correctly generating the shortId here
    const shortId = customShortId || nanoid(6);

    if (customShortId) {
      const existingUrl = await prisma.url.findUnique({ where: { shortId } });
      if (existingUrl) {
        return res.status(400).json({ error: 'This custom alias is already in use' });
      }
    }
    
    const expiresAt = new Date(Date.now() + (expiresIn || 30) * 24 * 60 * 60 * 1000);
    
    const newUrl = await prisma.url.create({
      data: {
        originalUrl,
        shortId: shortId, // FIX #2: Use the 'shortId' variable you already created
        userId: localUser.id, // This is correct!
        expiresAt,
        isPasswordProtected: !!password,
        password, // Remember to hash this in a real app
      },
    });

    return res.status(201).json(newUrl);
  } catch (error) {
    console.error('Error creating short URL:', error);
    if (error.code === 'P2003') {
        return res.status(400).json({ error: 'Database user synchronization error.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/urls', authMiddleware, async (req, res) => {
    try {
        const authenticatedUser = req.user;

        // 1. Find the user in your local database using the Supabase authId
        const localUser = await prisma.user.findUnique({
            where: { authId: authenticatedUser.id },
        });

        // If for some reason the user isn't in your DB, they have no URLs.
        if (!localUser) {
            return res.json([]);
        }

        // 2. Use the local user's primary key to find their URLs
        const userUrls = await prisma.url.findMany({
            where: { userId: localUser.id }, // This is the correct query
            orderBy: { createdAt: 'desc' },
        });

        res.json(userUrls);
    } catch (error) {
        console.error('Error fetching dashboard URLs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/urls/:shortId', authMiddleware, async (req, res) => {
    try {
        const { shortId } = req.params;
        const authenticatedUser = req.user;

        // 1. Find the local user
        const localUser = await prisma.user.findUnique({
            where: { authId: authenticatedUser.id },
        });

        if (!localUser) {
            // If there's no local user, they can't be authorized
            return res.status(403).json({ error: 'You are not authorized.' });
        }

        const urlToDelete = await prisma.url.findUnique({
            where: { shortId },
        });

        if (!urlToDelete) {
            return res.status(404).json({ error: 'URL not found.' });
        }

        // 2. Compare the URL's userId with the local user's primary key
        if (urlToDelete.userId !== localUser.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this URL.' });
        }

        await prisma.url.delete({ where: { id: urlToDelete.id } });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/api/health', (req, res) => {
  res.status(200).json({ running: true, at: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});