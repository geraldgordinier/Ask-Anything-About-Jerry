fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ id: '1', role: 'user', text: 'Hi' }] })
}).then(r => r.json()).then(console.log).catch(console.error);
