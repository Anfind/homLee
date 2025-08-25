const http = require('http');

console.log('🔄 Testing attendance sync...');

const data = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sync-attendance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('✅ Sync result:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('📄 Raw response:', responseData);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

req.write(data);
req.end();
