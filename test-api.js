const https = require('https');

const url = 'https://www.uniqlo.com/de/api/commerce/v5/en/products?path=37609%2C%2C%2C&flagCodes=discount&storeId=120126&inventoryCondition=1&genderId=37609&offset=0&limit=36&imageRatio=3x4&httpFailure=true';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('\nResponse preview:');
        console.log('Status:', json.status);
        console.log('Items count:', json.result?.items?.length || 0);
        console.log('First item:', json.result?.items?.[0]?.name || 'N/A');
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
        console.log('Raw response (first 500 chars):', data.substring(0, 500));
      }
    } else {
      console.log('Error response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
});
