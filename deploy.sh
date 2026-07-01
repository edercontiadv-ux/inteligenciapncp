#!/bin/bash
set -e

PROJECT_ID="${GCP_PROJECT_ID:-inteligencia-pncp}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-inteligencia-pncp}"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "==> Build Docker image..."
docker build -t $IMAGE .

echo "==> Push to Google Container Registry..."
docker push $IMAGE

echo "==> Deploy to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL,RESEND_API_KEY=$RESEND_API_KEY,EMAIL_FROM=$EMAIL_FROM" \
  --memory 512Mi \
  --timeout 300

echo "==> Deploy Firebase Hosting..."
firebase deploy --only hosting

echo "==> Prisma migrate..."
gcloud run jobs execute $SERVICE_NAME-migrate --region $REGION --wait

echo "✅ Deploy concluído!"
echo "URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')"
