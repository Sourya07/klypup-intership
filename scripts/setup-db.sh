#!/bin/bash
# Local Database Setup Script for AI Investment Research Dashboard

set -e

echo "=== 🚀 Starting Database Setup ==="

# Check if docker-compose is running postgres
if docker compose ps | grep -q "postgres"; then
  echo "✅ Docker Compose Postgres container is running."
else
  echo "⌛ Starting database container via docker-compose..."
  docker compose up -d postgres
  sleep 3
fi

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

echo "🔄 Generating Prisma Client..."
npm run db:generate

echo "🔄 Running database migrations..."
npm run db:migrate

echo "🌱 Seeding the database..."
npm run db:seed

echo "=== 🎉 Database Setup Completed Successfully! ==="
