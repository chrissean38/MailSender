const next = require('next');
const app = next({ dev: true });

app.prepare().then(() => {
  console.log('Next.js is ready');
});
