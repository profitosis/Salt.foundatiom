#!/bin/bash
set -e

echo "⚡ Salt Epoch Morphonomics — Mainnet Ritual Start"

export NETWORK="mainnet"
export DEPLOYER="deployer"
export BACKEND_PORT=8000
export FRONTEND_PORT=3000

echo "1️⃣ Deploying Smart Contracts..."
brownie run scripts/deploy_all.py --network $NETWORK

echo "2️⃣ Starting Backend..."
nohup uvicorn backend.app:app --host 0.0.0.0 --port $BACKEND_PORT > backend.log 2>&1 &

echo "3️⃣ Building Frontend..."
cd frontend/dashboard
npm install
npm run build
nohup npm run start -- -p $FRONTEND_PORT > ../../frontend.log 2>&1 &
cd ../../

echo "✅ Deployment Complete"
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔗 Backend: http://localhost:$BACKEND_PORT/api/jokes/stream"
