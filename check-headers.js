fetch('https://ais-dev-jvk3z2wlq7m72a3xrzhzwd-241561346210.us-west2.run.app').then(r => {
  console.log(Object.fromEntries(r.headers.entries()));
}).catch(console.error);
