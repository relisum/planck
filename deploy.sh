#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 24

echo "=== Installing dependencies ==="
yarn install

echo "=== Building client ==="
yarn workspace client build

echo "=== Building server ==="
yarn workspace server build

echo "=== Prisma ==="
cd server
DB_PATH="./planckTrackProd.db" npx prisma generate
DB_PATH="./planckTrackProd.db" npx prisma db push
cd ..

echo "=== Restarting service ==="
sudo systemctl restart planck

echo "=== Done ==="