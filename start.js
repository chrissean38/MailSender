const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, name) {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });

  proc.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });

  proc.on('error', (error) => {
    console.error(`${name} failed:`, error);
  });

  return proc;
}

console.log('Starting MailSender_dev server and worker...');

const nextProc = runCommand('next', ['dev'], 'Next.js');
const workerProc = runCommand('node', ['worker.js'], 'Worker');

process.on('SIGINT', () => {
  console.log('\nStopping all processes...');
  nextProc.kill('SIGINT');
  workerProc.kill('SIGINT');
  process.exit(0);
});
