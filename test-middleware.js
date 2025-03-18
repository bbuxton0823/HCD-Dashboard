// Test script for rate limit middleware
const { rateLimitMiddleware } = require('./src/lib/security/rateLimit');

// Mock Next.js request and response
const mockReq = {
  headers: {
    'x-forwarded-for': '127.0.0.1'
  },
  socket: {
    remoteAddress: '127.0.0.1'
  }
};

const mockRes = {
  setHeader: (name, value) => {
    console.log(`Header set: ${name} = ${value}`);
  },
  status: (code) => {
    console.log(`Status code: ${code}`);
    return {
      json: (data) => {
        console.log('JSON response:', data);
      }
    };
  }
};

console.log('Testing rate limit middleware...');

// Test multiple requests to trigger rate limiting
for (let i = 0; i < 15; i++) {
  console.log(`\nRequest ${i + 1}:`);
  const result = rateLimitMiddleware(mockReq, mockRes);
  console.log(`Result: ${result ? 'Allowed' : 'Rate limited'}`);
}

console.log('\nTest completed.'); 