# EventFoundry Production Monitoring Setup

This document provides complete instructions for setting up production monitoring, error tracking, analytics, and uptime monitoring for EventFoundry.

## 📊 Overview

We use multiple services to ensure comprehensive monitoring:

1. **Sentry** - Error tracking and performance monitoring
2. **Google Analytics 4** - User analytics and behavior tracking
3. **UptimeRobot** - Uptime monitoring and alerts
4. **Supabase Dashboard** - Database health and performance

---

## 1️⃣ Sentry Error Tracking

### Why Sentry?
- Real-time error tracking
- Performance monitoring
- User session replays
- Source map support for debugging production errors
- Email alerts for critical errors

### Setup Steps:

#### Step 1: Create Sentry Account
1. Go to [sentry.io](https://sentry.io/)
2. Sign up for free account
3. Create new project → Select "Next.js"
4. Copy your DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

#### Step 2: Configure Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

#### Step 3: Deploy Configuration
The Sentry configuration files are already created:
- ✅ `sentry.client.config.ts` - Client-side error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking
- ✅ `sentry.edge.config.ts` - Edge runtime error tracking

#### Step 4: Test in Development
```bash
# Trigger a test error
# Add this to any page temporarily:
throw new Error("Sentry test error");
```

Visit the page and check Sentry dashboard for the error.

#### Step 5: Configure Alerts
In Sentry dashboard:
1. Go to **Settings** → **Alerts**
2. Create alert rule: "Send email when error count > 10 in 1 hour"
3. Create alert rule: "Send email for any new error type"
4. Add your email and team members

### Features Enabled:
- ✅ Error tracking with stack traces
- ✅ Performance monitoring (response times)
- ✅ Session replay (see what user was doing when error occurred)
- ✅ Source maps (readable error messages in production)
- ✅ Environment tagging (development vs production)

---

## 2️⃣ Google Analytics 4 (GA4)

### Why GA4?
- User behavior analytics
- Conversion tracking
- Real-time user monitoring
- Event tracking (signups, bids, contracts)

### Setup Steps:

#### Step 1: Create GA4 Property
1. Go to [analytics.google.com](https://analytics.google.com/)
2. Create new property → Select "GA4"
3. Add website details
4. Copy your Measurement ID (looks like: `G-XXXXXXXXXX`)

#### Step 2: Install GA4 Script
Add to `.env.local`:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Step 3: Create Analytics Component
Create `/src/components/GoogleAnalytics.tsx`:
```typescript
'use client';

import Script from 'next/script';

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  if (!GA_ID || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
```

#### Step 4: Add to Root Layout
Update `/src/app/layout.tsx`:
```typescript
import GoogleAnalytics from '@/components/GoogleAnalytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
```

#### Step 5: Track Key Events
Add event tracking for important actions:

```typescript
// Track event signup
gtag('event', 'sign_up', {
  method: 'email',
  user_type: 'client' // or 'vendor'
});

// Track bid submission
gtag('event', 'bid_submitted', {
  event_id: eventId,
  bid_amount: amount
});

// Track contract signing
gtag('event', 'contract_signed', {
  contract_id: contractId,
  value: totalAmount
});
```

### Key Metrics to Monitor:
- Daily active users
- Signup conversion rate
- Events created
- Bids submitted
- Contracts signed
- Revenue (if tracking payments)

---

## 3️⃣ Uptime Monitoring (UptimeRobot)

### Why UptimeRobot?
- Free 5-minute interval checks
- Email/SMS alerts when site is down
- Status page for users
- Multi-location monitoring

### Setup Steps:

#### Step 1: Create UptimeRobot Account
1. Go to [uptimerobot.com](https://uptimerobot.com/)
2. Sign up for free account (50 monitors included)

#### Step 2: Add Monitors

**Monitor 1: Homepage**
- Type: HTTP(S)
- URL: `https://eventfoundry.com`
- Monitoring Interval: 5 minutes
- Alert Contacts: Your email

**Monitor 2: API Health Check**
- Type: HTTP(S)
- URL: `https://eventfoundry.com/api/health`
- Monitoring Interval: 5 minutes
- Expected Status Code: 200

**Monitor 3: Database Connection**
- Type: Keyword
- URL: `https://eventfoundry.com/api/health`
- Keyword: `"database":"connected"`
- Monitoring Interval: 5 minutes

#### Step 3: Create API Health Endpoint
Create `/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    api: 'ok',
    database: 'unknown',
    timestamp: new Date().toISOString()
  };

  // Check database connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    checks.database = error ? 'error' : 'connected';
  } catch (err) {
    checks.database = 'error';
  }

  const allHealthy = checks.api === 'ok' && checks.database === 'connected';

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503
  });
}
```

#### Step 4: Configure Alert Contacts
1. Go to **My Settings** → **Alert Contacts**
2. Add your email
3. Add team members' emails
4. Optional: Add SMS alerts (paid feature)

#### Step 5: Create Public Status Page
1. Go to **Public Status Pages** → **Add**
2. Select all monitors
3. Customize branding
4. Get public URL (e.g., `status.eventfoundry.com`)
5. Add link to your footer

### Alert Thresholds:
- ⚠️ **Warning**: 2 failed checks (10 minutes down)
- 🚨 **Critical**: 3 failed checks (15 minutes down)
- ✅ **Recovery**: Send notification when back online

---

## 4️⃣ Supabase Monitoring

### Built-in Metrics:
Supabase dashboard already provides:
- ✅ Database CPU usage
- ✅ Database memory usage
- ✅ Active connections
- ✅ Query performance
- ✅ Storage usage
- ✅ API request rates

### Setup Steps:

#### Step 1: Enable Alerts
1. Go to Supabase Dashboard → **Settings** → **Alerts**
2. Enable email alerts for:
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - Connection pool exhaustion (>90% connections used)
   - Storage approaching limit (>80%)

#### Step 2: Review Slow Queries Weekly
1. Go to **Database** → **Query Performance**
2. Identify queries taking >1 second
3. Add indexes or optimize queries

#### Step 3: Monitor RLS Policy Performance
```sql
-- Check RLS overhead
EXPLAIN ANALYZE
SELECT * FROM events WHERE owner_user_id = 'user-id';
```

---

## 5️⃣ Custom Metrics Dashboard

### Create Internal Dashboard

Add to `/src/app/admin/metrics/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MetricsDashboard() {
  const supabase = createClientComponentClient();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalBids: 0,
    totalContracts: 0,
    activeVendors: 0
  });

  useEffect(() => {
    async function loadMetrics() {
      // Count users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Count events
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Count bids
      const { count: bidCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true });

      // Count contracts
      const { count: contractCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Count active vendors (with at least 1 bid)
      const { data: activeVendors } = await supabase
        .from('bids')
        .select('vendor_id')
        .not('vendor_id', 'is', null);

      const uniqueVendors = new Set(activeVendors?.map(b => b.vendor_id)).size;

      setMetrics({
        totalUsers: userCount || 0,
        totalEvents: eventCount || 0,
        totalBids: bidCount || 0,
        totalContracts: contractCount || 0,
        activeVendors: uniqueVendors
      });
    }

    loadMetrics();
  }, [supabase]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">EventFoundry Metrics</h1>

      <div className="grid grid-cols-3 gap-6">
        <MetricCard title="Total Users" value={metrics.totalUsers} />
        <MetricCard title="Total Events" value={metrics.totalEvents} />
        <MetricCard title="Total Bids" value={metrics.totalBids} />
        <MetricCard title="Signed Contracts" value={metrics.totalContracts} />
        <MetricCard title="Active Vendors" value={metrics.activeVendors} />
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
```

---

## 🎯 Launch Checklist

Before production launch, verify:

### Sentry:
- [ ] DSN configured in `.env.local`
- [ ] Test error sent and visible in dashboard
- [ ] Alert rules configured
- [ ] Team members added

### Google Analytics:
- [ ] GA4 property created
- [ ] Measurement ID configured
- [ ] Script added to layout
- [ ] Test event tracked successfully

### UptimeRobot:
- [ ] Homepage monitor active
- [ ] API health check monitor active
- [ ] Alert contacts configured
- [ ] Status page created

### Supabase:
- [ ] Alerts enabled for resource usage
- [ ] Query performance reviewed
- [ ] Backup schedule configured

### Custom Metrics:
- [ ] Admin metrics dashboard accessible
- [ ] Key metrics displaying correctly

---

## 📞 Support Contacts

### Emergency Contacts (Site Down):
1. Check UptimeRobot status page
2. Check Supabase status: status.supabase.com
3. Check Sentry for recent errors
4. Contact: admin@eventfoundry.com

### Non-Critical Issues:
1. Review Sentry errors
2. Check GA4 for unusual traffic patterns
3. Review Supabase slow queries

---

## 🔒 Security Notes

- **Never commit** Sentry DSN or GA ID to public repos (use .env.local)
- **Restrict access** to monitoring dashboards (IP whitelist if possible)
- **Enable 2FA** on all monitoring service accounts
- **Review access logs** monthly in each service

---

## 📈 Monthly Review Checklist

- [ ] Review Sentry error trends
- [ ] Review GA4 user behavior and conversion rates
- [ ] Review UptimeRobot uptime percentage (target: >99.9%)
- [ ] Review Supabase database performance
- [ ] Update alert thresholds if needed
- [ ] Archive old metrics data

---

**Setup Complete! Your EventFoundry platform now has comprehensive production monitoring.** 🎉
