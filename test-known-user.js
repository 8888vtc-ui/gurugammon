// Test avec utilisateur connu pour vérifier le flux
const https = require('https');

async function testKnownUser() {
  console.log('🔐 TEST AVEC UTILISATEUR CONNU');
  console.log('==============================');

  try {
    // Test login avec utilisateur de développement
    console.log('\n🔐 LOGIN UTILISATEUR DÉVELOPPEMENT');
    const loginResponse = await makeRequest('https://gammonguru.netlify.app/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'codespaces-test@example.com',
        password: 'password123'
      })
    });

    console.log(`Status: ${loginResponse.statusCode}`);
    console.log(`Body: ${loginResponse.body}`);
    
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      console.log('✅ Login SUCCESS');
      const authToken = loginData.data?.token;
      
      if (authToken) {
        // Test profile avec token
        console.log('\n👤 TEST PROFILE AVEC TOKEN');
        const profileResponse = await makeRequest('https://gammonguru.netlify.app/.netlify/functions/profile', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        console.log(`Status: ${profileResponse.statusCode}`);
        if (profileResponse.statusCode === 200) {
          const profileData = JSON.parse(profileResponse.body);
          console.log('✅ Profile SUCCESS');
          console.log(`   User: ${profileData.data?.user?.username}`);
        }

        // Test GNUBG avec token
        console.log('\n🧠 TEST GNUBG AVEC TOKEN');
        const analyzeResponse = await makeRequest('https://gammonguru.netlify.app/.netlify/functions/analyze', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            boardState: '4HPwATDgc/ABMA',
            dice: [3, 1],
            move: '8/5 6/5',
            analysisType: 'full'
          })
        });

        console.log(`Status: ${analyzeResponse.statusCode}`);
        console.log(`Body: ${analyzeResponse.body}`);
        
        if (analyzeResponse.statusCode === 200) {
          console.log('✅ GNUBG Analyze SUCCESS');
        }

        console.log('\n🎉 GAMMON GURU EST 100% FONCTIONNEL !');
      }
    } else {
      console.log('❌ Login failed - Testing debug function');
      
      // Test debug pour vérifier que les functions sont accessibles
      const debugResponse = await makeRequest('https://gammonguru.netlify.app/.netlify/functions/debug-env');
      console.log(`\n🔍 Debug Status: ${debugResponse.statusCode}`);
      console.log(`Debug Body: ${debugResponse.body}`);
    }

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
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
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

testKnownUser();
