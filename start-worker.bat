@echo off
echo Starting email worker...
cd /d "%~dp0"
node worker.js
