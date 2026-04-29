#!/usr/bin/env node

const { exec } = require('child_process');

console.log('Starting email worker...');

const workerProcess = exec('node dist/worker.js');

workerProcess.stdout.on('data', (data) => {
  console.log(`Worker: ${data}`);
});

workerProcess.stderr.on('data', (data) => {
  console.error(`Worker Error: ${data}`);
});

workerProcess.on('close', (code) => {
  console.log(`Worker exited with code ${code}`);
  if (code !== 0) {
    console.log('Restarting worker...');
    setTimeout(() => require('./worker'), 5000);
  }
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
