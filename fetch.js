import fs from 'fs';
fetch('https://docs.google.com/document/d/1d1CPG6nWy6mSpjVfna1qbZuCg3uf5Z11i0ulpmgMofM/export?format=txt').then(r=>r.text()).then(t => fs.writeFileSync('portfolio.txt', t));
