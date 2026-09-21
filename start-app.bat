@echo off
title BALAJI CONVEYORS ERP
echo Launching Balaji Conveyors ERP...
if not exist .next (
  call npm run build
)
start "" "http://localhost:3000"
npm start
