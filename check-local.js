fetch('http://localhost:3000').then(r => {
  console.log('X-Frame-Options:', r.headers.get('x-frame-options'));
  console.log('Content-Security-Policy:', r.headers.get('content-security-policy'));
}).catch(console.error);
