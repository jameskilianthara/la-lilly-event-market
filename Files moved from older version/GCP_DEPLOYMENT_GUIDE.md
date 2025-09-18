# 🌩️ Complete GCP Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **Week 1: GCP Account Setup**
- [ ] Create GCP account with billing enabled
- [ ] Enable required APIs
- [ ] Setup service accounts
- [ ] Configure IAM roles
- [ ] Choose region (asia-south1 for India)

### **Week 2: Domain & DNS**
- [ ] Purchase domain name (₹500-1000/year)
- [ ] Setup Cloud DNS
- [ ] Configure SSL certificate
- [ ] Setup custom domain mapping

## 🔧 **Step-by-Step Deployment**

### **Step 1: GCP Project Setup**

```bash
# Create new project
gcloud projects create event-marketplace-prod --name="Event Marketplace"

# Set project as default
gcloud config set project event-marketplace-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sql-component.googleapis.com \
  storage-component.googleapis.com \
  aiplatform.googleapis.com \
  dns.googleapis.com
```

### **Step 2: Database Setup (Cloud SQL)**

```bash
# Create PostgreSQL instance
gcloud sql instances create event-marketplace-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --storage-size=20GB \
  --storage-type=SSD

# Create database
gcloud sql databases create eventmarketplace \
  --instance=event-marketplace-db

# Create user
gcloud sql users create appuser \
  --instance=event-marketplace-db \
  --password=your_secure_password
```

### **Step 3: Storage Setup**

```bash
# Create storage bucket for uploads
gsutil mb -p event-marketplace-prod -c STANDARD -l asia-south1 gs://event-marketplace-uploads

# Create bucket for static assets
gsutil mb -p event-marketplace-prod -c STANDARD -l asia-south1 gs://event-marketplace-static

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://event-marketplace-static
```

### **Step 4: Environment Configuration**

Create `app.yaml` for Cloud Run:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: event-marketplace
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "4Gi"
        run.googleapis.com/cpu: "2"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/event-marketplace-prod/app
        ports:
        - name: http1
          containerPort: 8080
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
        - name: GOOGLE_CLOUD_PROJECT
          value: event-marketplace-prod
        - name: LEONARDO_API_KEY
          valueFrom:
            secretKeyRef:
              name: leonardo-key
              key: key
        resources:
          limits:
            cpu: 2000m
            memory: 4Gi
```

### **Step 5: Dockerfile for Production**

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080
ENV PORT 8080
ENV NODE_ENV production

CMD ["node", "server.js"]
```

### **Step 6: Deploy Script**

Create `deploy.sh`:
```bash
#!/bin/bash

# Build and deploy to Cloud Run
echo "🚀 Starting deployment to GCP..."

# Build container
gcloud builds submit --tag gcr.io/event-marketplace-prod/app

# Deploy to Cloud Run
gcloud run deploy event-marketplace \
  --image gcr.io/event-marketplace-prod/app \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --concurrency 80 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,GOOGLE_CLOUD_PROJECT=event-marketplace-prod

echo "✅ Deployment complete!"
gcloud run services describe event-marketplace --region asia-south1 --format 'value(status.url)'
```

## 🔐 **Security & Secrets Management**

### **Store API Keys Securely:**
```bash
# Store Leonardo API key
echo -n "your_leonardo_api_key" | gcloud secrets create leonardo-key --data-file=-

# Store database URL
echo -n "postgresql://appuser:password@/eventmarketplace?host=/cloudsql/event-marketplace-prod:asia-south1:event-marketplace-db" | gcloud secrets create database-url --data-file=-

# Store JWT secret
echo -n "your_super_secret_jwt_key" | gcloud secrets create jwt-secret --data-file=-
```

## 📊 **Monitoring & Logging Setup**

### **Cloud Monitoring Dashboard:**
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud alpha monitoring uptime create-config uptime-config.yaml
```

### **Error Reporting:**
```javascript
// Add to your server.js
const { ErrorReporting } = require('@google-cloud/error-reporting');
const errors = new ErrorReporting({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  reportMode: 'production'
});

// Catch unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  errors.report(reason);
});
```

## 🌐 **Custom Domain Setup**

### **Step 1: Configure Cloud DNS**
```bash
# Create DNS zone
gcloud dns managed-zones create event-marketplace-zone \
  --description="Event Marketplace DNS Zone" \
  --dns-name="yourdomain.com"

# Get name servers
gcloud dns managed-zones describe event-marketplace-zone
```

### **Step 2: SSL Certificate**
```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create event-marketplace-ssl \
  --domains="yourdomain.com,www.yourdomain.com" \
  --global
```

### **Step 3: Load Balancer**
```bash
# Create backend service
gcloud compute backend-services create event-marketplace-backend \
  --global \
  --load-balancing-scheme=EXTERNAL

# Create URL map
gcloud compute url-maps create event-marketplace-map \
  --default-service=event-marketplace-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create event-marketplace-proxy \
  --url-map=event-marketplace-map \
  --ssl-certificates=event-marketplace-ssl

# Create forwarding rule
gcloud compute forwarding-rules create event-marketplace-rule \
  --global \
  --target-https-proxy=event-marketplace-proxy \
  --ports=443
```

## 💰 **Cost Optimization**

### **Auto-scaling Configuration:**
```yaml
# In your Cloud Run service
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "true"
```

### **Database Cost Optimization:**
```bash
# Use shared CPU for small workloads
gcloud sql instances patch event-marketplace-db \
  --tier=db-f1-micro \
  --storage-auto-increase
```

## 📈 **Scaling Strategy**

### **Phase 1: Launch (Month 1-3)**
- **Cloud Run**: 1-2 instances
- **Database**: db-f1-micro
- **Storage**: 50GB
- **Cost**: ~₹2,000/month

### **Phase 2: Growth (Month 3-6)**
- **Cloud Run**: 2-5 instances  
- **Database**: db-n1-standard-1
- **Storage**: 200GB
- **Cost**: ~₹4,000/month

### **Phase 3: Scale (Month 6+)**
- **Cloud Run**: 5-20 instances
- **Database**: db-n1-standard-2
- **Storage**: 500GB+ 
- **Cost**: ~₹8,000/month

## 🔄 **CI/CD Pipeline**

### **Cloud Build Configuration** (`cloudbuild.yaml`):
```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['ci']

  # Run tests
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['test']

  # Build container
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/app:$COMMIT_SHA', '.']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'event-marketplace'
    - '--image'
    - 'gcr.io/$PROJECT_ID/app:$COMMIT_SHA'
    - '--region'
    - 'asia-south1'
    - '--platform'
    - 'managed'

images:
  - 'gcr.io/$PROJECT_ID/app:$COMMIT_SHA'
```

## 🎯 **Go-Live Checklist**

### **Pre-Launch:**
- [ ] All services deployed and tested
- [ ] Custom domain configured with SSL
- [ ] Database migrated with test data
- [ ] API keys stored in Secret Manager
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented

### **Launch Day:**
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] Load testing completed
- [ ] Error reporting verified
- [ ] Performance monitoring active

### **Post-Launch:**
- [ ] Monitor costs daily first week
- [ ] Check error logs regularly  
- [ ] Monitor AI service usage
- [ ] Collect user feedback
- [ ] Plan first optimizations

## 🚨 **Emergency Procedures**

### **Rollback Strategy:**
```bash
# Quick rollback to previous version
gcloud run services replace-traffic event-marketplace \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=asia-south1
```

### **Cost Alerts:**
```bash
# Set budget alert at ₹3,000/month
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Event Marketplace Budget" \
  --budget-amount=3000 \
  --threshold-rules=percent=80 \
  --threshold-rules=percent=100
```

## 🎉 **Success Metrics**

### **Technical KPIs:**
- **Uptime**: >99.5%
- **Response time**: <500ms
- **Error rate**: <1%
- **AI service latency**: <2s

### **Business KPIs:**
- **Break-even**: 40 visuals/month
- **Target**: 200 visuals/month = ₹10,000 revenue
- **Profit margin**: 95%+ after costs

**You're ready to launch a professional, scalable event marketplace platform!** 🚀