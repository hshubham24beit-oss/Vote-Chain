// improved-server.js
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Block, Blockchain } = require("./blockchain");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const voteLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 vote per minute per IP
  message: { error: 'Too many vote attempts. Please wait.' }
});

app.use(generalLimit);

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, "public")));

// In-memory data (consider using a database for production)
let voteChain = new Blockchain();
let election = { title: "", candidates: [], created: null, active: true };
let votes = {};
let votedVoters = new Set();

// Input validation and sanitization
const validateInput = (input, maxLength = 100) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed.replace(/[<>\"'&]/g, ''); // Basic XSS prevention
};

// Admin authentication middleware (simple version)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/candidates", (req, res) => {
  res.json({ 
    title: election.title, 
    candidates: election.candidates,
    active: election.active 
  });
});

// Admin creates election (with authentication)
app.post("/create-election", adminAuth, (req, res) => {
  try {
    const title = validateInput(req.body.title, 200);
    const candidate1 = validateInput(req.body.candidate1);
    const candidate2 = validateInput(req.body.candidate2);

    if (!title || !candidate1 || !candidate2) {
      return res.status(400).json({ 
        error: "Please provide valid title and two candidate names" 
      });
    }

    if (candidate1 === candidate2) {
      return res.status(400).json({ 
        error: "Candidates must be different" 
      });
    }

    // Reset election data
    election = { 
      title, 
      candidates: [candidate1, candidate2], 
      created: new Date().toISOString(),
      active: true 
    };
    votes = { [candidate1]: 0, [candidate2]: 0 };
    votedVoters.clear();
    voteChain = new Blockchain();

    res.json({ message: "Election created successfully", election });
  } catch (error) {
    console.error('Election creation error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Voter casts vote (with rate limiting)
app.post("/cast-vote", voteLimit, (req, res) => {
  try {
    if (!election.active || !election.title) {
      return res.status(400).json({ error: "No active election" });
    }

    const voterId = validateInput(req.body.voterId, 50);
    const candidate = validateInput(req.body.candidate);

    if (!voterId || !candidate) {
      return res.status(400).json({ 
        error: "Please provide valid voter ID and candidate" 
      });
    }

    if (!election.candidates.includes(candidate)) {
      return res.status(400).json({ error: "Invalid candidate" });
    }

    if (votedVoters.has(voterId)) {
      return res.status(403).json({ error: "You have already voted" });
    }

    // Verify blockchain integrity
    if (!voteChain.isChainValid()) {
      console.error('Blockchain integrity compromised');
      return res.status(500).json({ error: "System integrity error" });
    }

    // Record vote
    votes[candidate] = (votes[candidate] || 0) + 1;
    votedVoters.add(voterId);

    const newBlock = new Block(
      voteChain.chain.length,
      new Date().toISOString(),
      { voterId: voterId.substring(0, 3) + '*'.repeat(voterId.length - 3), candidate },
      voteChain.getLatestBlock().hash
    );

    voteChain.addBlock(newBlock);

    res.json({ 
      message: "Vote cast successfully", 
      blockIndex: newBlock.index,
      timestamp: newBlock.timestamp 
    });
  } catch (error) {
    console.error('Vote casting error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// View results
app.get("/results", (req, res) => {
  const resultsData = {
    election: {
      title: election.title || "No election created",
      active: election.active,
      created: election.created
    },
    results: election.candidates.map(candidate => ({
      candidate,
      votes: votes[candidate] || 0
    })),
    totalVotes: Object.values(votes).reduce((sum, count) => sum + count, 0),
    blockchain: {
      totalBlocks: voteChain.chain.length,
      isValid: voteChain.isChainValid(),
      blocks: voteChain.chain.map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        data: block.data,
        hash: block.hash.substring(0, 16) + '...',
        previousHash: block.previousHash.substring(0, 16) + '...'
      }))
    }
  };

  res.json(resultsData);
});

// End election (admin only)
app.post("/end-election", adminAuth, (req, res) => {
  election.active = false;
  res.json({ message: "Election ended", election });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    blockchain: voteChain.isChainValid() ? "Valid" : "Invalid"
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`VoteChain server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});