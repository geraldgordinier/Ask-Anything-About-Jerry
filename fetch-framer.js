import fs from 'fs';
fetch('https://jerrygordinier.framer.website/').then(r => r.text()).then(t => {
  fs.writeFileSync('framer.html', t);
  console.log('Saved to framer.html');
}).catch(console.error);
