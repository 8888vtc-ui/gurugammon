// Test direct de la function pour voir l'erreur exacte
const https = require('https');

async function testDirectFunction() {
  console.log('🔍 TEST DIRECT FUNCTION NETLIFY');
  console.log('==================================');

  const urls = [
    'https://gammonguru.netlify.app/.netlify/functions/debug-env',
    'https://gammonguru.netlify.app/debug',
    'https://gammonguru.netlify.app/api/auth/login'
  ];

  for (const url of urls) {
    console.log(`\n📡 Testing: ${url}`);
    
    try {
      const response = await makeRequest(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      console.log(`Status: ${response.statusCode}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log(`Content-Length: ${response.headers['content-length'] || 'unknown'}`);
      
      if (response.body.length > 0) {
        const preview = response.body.substring(0, 200);
        console.log(`Body preview: "${preview}"`);
        
        if (response.body.includes('<!DOCTYPE html>')) {
          console.log('❌ HTML 404 Page - Function not found');
        } else if (response.body.includes('"success"')) {
          console.log('✅ JSON Response - Function working!');
        } else {
          console.log('⚠️ Unknown response format');
        }
      } else {
        console.log('❌ Empty response');
      }

    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

testDirectFunction();
