// server.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { Block, Blockchain } = require("./blockchain");

// ✅ create express app first
const app = express();
const PORT = 3000;

// ✅ middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// In-memory blockchain + election data
let voteChain = new Blockchain();
let election = { title: "", candidates: [] };
let votes = {};

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Admin creates election
app.post("/create-election", (req, res) => {
  const { title, candidate1, candidate2 } = req.body;

  if (!title || !candidate1 || !candidate2) {
    return res.send("Please fill all fields. <a href='/'>Go Back</a>");
  }

  election = { title, candidates: [candidate1, candidate2] };
  votes = { [candidate1]: 0, [candidate2]: 0 };

  res.send("Election created successfully! <a href='/'>Go Back</a>");
});

// Voter casts vote
app.post("/cast-vote", (req, res) => {
  const { voterId, candidate } = req.body;

  if (!election.title) {
    return res.send("No active election. <a href='/'>Go Back</a>");
  }

  if (!election.candidates.includes(candidate)) {
    return res.send("Invalid candidate. <a href='/'>Go Back</a>");
  }

  votes[candidate]++;

  const newBlock = new Block(
    voteChain.chain.length,
    Date.now().toString(),
    { voterId: voterId, candidate: candidate },
    voteChain.getLatestBlock().hash
  );

  voteChain.addBlock(newBlock);

  res.send("Vote cast successfully! <a href='/'>Go Back</a>");
});

// View results
app.get("/results", (req, res) => {
  res.send(`
    <h1>Election Results: ${election.title || "No election created yet"}</h1>
    ${
      election.candidates.length
        ? election.candidates
            .map((c) => `<p>${c}: ${votes[c]}</p>`)
            .join("")
        : "<p>No candidates</p>"
    }
    <h2>Blockchain Ledger:</h2>
    <pre>${JSON.stringify(voteChain.chain, null, 2)}</pre>
    <a href='/'>Go Back</a>
  `);
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
