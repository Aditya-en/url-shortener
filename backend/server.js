// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "")
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// URL Schema
const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days by default
  },
  clicks: {
    type: Number,
    default: 0
  },
  isPasswordProtected: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  createdBy: {
    type: String,
    default: null // Will store user ID when we add authentication
  }
});

const Url = mongoose.model('Url', urlSchema);

// Routes
// Create short URL
app.post('/api/shorten', async (req, res) => {
  let { originalUrl, customShortId, expiresIn, password } = req.body;
  console.log("short url hit with ", { originalUrl, customShortId, expiresIn, password });
  try {
    const { originalUrl, customShortId, expiresIn, password } = req.body;
    
    // Validate URL
    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }
    
    // Generate or use custom short ID
    const shortId = customShortId || nanoid(6);
    
    // Check if custom shortId already exists
    if (customShortId) {
      const existingUrl = await Url.findOne({ shortId });
      if (existingUrl) {
        return res.status(400).json({ error: 'This custom URL is already in use' });
      }
    }
    
    // Calculate expiration date if provided
    let expiresAt = new Date(+new Date() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    if (expiresIn) {
      expiresAt = new Date(+new Date() + expiresIn * 24 * 60 * 60 * 1000);
    }
    
    // Hash password if provided
    let hashedPassword = null;
    let isPasswordProtected = false;
    
    if (password) {
      // hashedPassword = await bcrypt.hash(password, 10);
      hashedPassword = password;
      isPasswordProtected = true;
    }
    
    // Create new URL document
    const newUrl = new Url({
      originalUrl,
      shortId,
      expiresAt,
      isPasswordProtected,
      password: hashedPassword
    });
    
    await newUrl.save();
    
    return res.status(201).json({
      shortId,
      originalUrl,
      shortUrl: `${process.env.BASE_URL}/${shortId}`,
      expiresAt,
      isPasswordProtected
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get URL info (for analytics)
app.get('/api/url/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    return res.json({
      shortId: url.shortId,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      clicks: url.clicks,
      isPasswordProtected: url.isPasswordProtected
    });
  } catch (error) {
    console.error('Error getting URL info:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Redirect to original URL
app.post('/api/redirect/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const { password } = req.body;
    
    const url = await Url.findOne({ shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Check if URL has expired
    if (url.expiresAt < new Date()) {
      return res.status(410).json({ error: 'URL has expired' });
    }
    
    // Check password if protected
    if (url.isPasswordProtected) {
      if (!password) {
        return res.status(401).json({ 
          error: 'Password required', 
          isPasswordProtected: true 
        });
      }
      
      const isPasswordValid = password === url.password;
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
    
    // Increment click counter
    url.clicks += 1;
    await url.save();
    
    return res.json({ originalUrl: url.originalUrl });
  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.get('/health', (req, res) => {
  res.status(200).json({running: true, at : Date.now()})
})
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});