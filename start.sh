#!/bin/sh
set -e

if [ "$1" = "migrate" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  echo "Migrations concluídas."
  exit 0
fi

echo "Starting Next.js server..."
exec node server.js
