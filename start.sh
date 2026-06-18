#!/bin/sh
npx prisma migrate deploy 2>&1 || echo "Migration failed or already applied"
node server.js
