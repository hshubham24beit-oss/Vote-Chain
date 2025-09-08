# Security Improvements for VoteChain

## 1. Add Authentication Middleware
```javascript
// middleware/auth.js
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

## 2. Input Sanitization
```javascript
const validator = require('validator');
const xss = require('xss');

// Sanitize all inputs
const sanitizeInput = (input) => {
  return xss(validator.escape(input.trim()));
};
```

## 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const voteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1, // 1 vote per IP per window
  message: 'Too many vote attempts'
});
```

## 4. Stronger Voter Verification
- Implement cryptographic voter IDs
- Add voter registration system
- Use digital signatures for vote validation

## 5. Environment Variables
```bash
# .env file
ADMIN_KEY=your-secure-admin-key-here
PORT=3000
NODE_ENV=production
```