@echo off
title BALAJI CONVEYORS ERP
echo ===================================================
echo     Launching Balaji Conveyors ERP Application...
echo ===================================================
echo.
if not exist .next (
  echo Pre-building application for super-fast instant startup...
  call npm run build
)
echo Starting server at http://localhost:3000
echo.
start "" "http://localhost:3000"
npm start
