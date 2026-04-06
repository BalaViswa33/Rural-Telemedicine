# Deployment Guide - Health System v2.0

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Web server (Nginx, Apache, or cloud platform)
- [ ] SSL certificate (required for notifications & service workers)
- [ ] Backend API endpoints ready (for sync functionality)

---

## 📋 Pre-Deployment Steps

### 1. Environment Configuration

Create `.env.production`:
```bash
VITE_API_URL=https://api.yourapp.com
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
```

Update `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['./src/utils/db', './src/utils/notifications']
        }
      }
    }
  }
})
```

### 2. Backend API Integration

Replace simulated sync in `ASHADashboard.jsx`:

**Before (Demo):**
```javascript
const handleSyncData = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated
  console.log('Syncing to server:', { patients, vitals });
};
```

**After (Production):**
```javascript
const handleSyncData = async () => {
  const unsyncedPatients = await db.getUnsynced(STORES.PATIENTS);
  const unsyncedVitals = await db.getUnsynced(STORES.VITALS);
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        patients: unsyncedPatients,
        vitals: unsyncedVitals
      })
    });
    
    if (!response.ok) throw new Error('Sync failed');
    
    const result = await response.json();
    
    // Mark as synced
    for (const id of result.syncedPatients) {
      await db.markAsSynced(STORES.PATIENTS, id);
    }
    for (const id of result.syncedVitals) {
      await db.markAsSynced(STORES.VITALS, id);
    }
    
    await loadData();
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
};
```

### 3. Authentication Enhancement

Update `AuthContext.jsx` for real JWT:

```javascript
const login = async (credentials) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const { token, user } = await response.json();
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

---

## 🔨 Build Process

### 1. Install Dependencies
```bash
npm ci --production
```

### 2. Build for Production
```bash
npm run build
```

This creates an optimized build in `dist/`:
```
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # React + dependencies
│   ├── utils-[hash].js      # Utilities
│   └── index-[hash].css     # Styles
├── index.html
└── vite.svg
```

### 3. Test Production Build
```bash
npm run preview
```

Visit `http://localhost:4173` to test production build locally.

---

## 🌐 Deployment Options

### Option 1: Static Hosting (Vercel/Netlify)

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 2: Traditional Web Server

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name healthsystem.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/health-system/dist;
    index index.html;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name healthsystem.example.com;
    return 301 https://$server_name$request_uri;
}
```

**Apache Configuration (.htaccess):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

# Security headers
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
```

### Option 3: Docker

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and Run:**
```bash
docker build -t health-system:v2 .
docker run -d -p 80:80 --name health-system health-system:v2
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs:ro
    environment:
      - VITE_API_URL=https://api.example.com
    restart: unless-stopped
```

---

## 🔐 Security Hardening

### 1. Enable HTTPS (Required for Notifications)

**Using Let's Encrypt (Free):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d healthsystem.example.com
sudo certbot renew --dry-run  # Test auto-renewal
```

### 2. Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://api.example.com;">
```

### 3. Encrypt IndexedDB Data

Create `src/utils/encryption.js`:
```javascript
export const encrypt = async (data) => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  return {
    data: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv)
  };
};

export const decrypt = async (encrypted, iv) => {
  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encrypted.data)
  );
  
  const decoded = new TextDecoder().decode(decrypted);
  return JSON.parse(decoded);
};
```

Update `db.js` to use encryption:
```javascript
import { encrypt, decrypt } from './encryption';

async add(storeName, data) {
  const encryptedData = await encrypt(data);
  // ... rest of add logic
}

async get(storeName, id) {
  const encryptedData = await super.get(storeName, id);
  return await decrypt(encryptedData);
}
```

### 4. Rate Limiting

Add to API endpoints:
```javascript
// Backend (Node.js/Express)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📊 Monitoring & Analytics

### 1. Error Tracking

**Using Sentry:**
```bash
npm install @sentry/react
```

```javascript
// main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. Analytics

**Google Analytics 4:**
```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Performance Monitoring

```javascript
// App.jsx
import { useEffect } from 'react';

useEffect(() => {
  // Report Web Vitals
  if ('web-vital' in window) {
    const reportWebVitals = (metric) => {
      console.log(metric);
      // Send to analytics
      gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_delta: metric.delta,
      });
    };
    
    // Measure FCP, LCP, FID, CLS, TTFB
  }
}, []);
```

---

## 🧪 Testing

### 1. E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

**tests/e2e/offline.spec.js:**
```javascript
import { test, expect } from '@playwright/test';

test('offline mode works', async ({ page, context }) => {
  await page.goto('/');
  
  // Login
  await page.fill('input[type="text"]', 'asha');
  await page.fill('input[type="password"]', 'test');
  await page.click('button[type="submit"]');
  
  // Go offline
  await context.setOffline(true);
  
  // Register patient
  await page.click('text=Patient Registration');
  await page.fill('input[name="name"]', 'Test Patient');
  await page.fill('input[name="age"]', '30');
  await page.selectOption('select[name="gender"]', 'male');
  await page.fill('input[name="phone"]', '9876543210');
  await page.fill('input[name="village"]', 'Test Village');
  await page.click('button[type="submit"]');
  
  // Verify saved
  await expect(page.locator('text=Patient registered successfully')).toBeVisible();
  
  // Go online
  await context.setOffline(false);
  
  // Sync
  await page.click('button:has-text("Sync Data")');
  await expect(page.locator('text=Successfully synced')).toBeVisible();
});
```

### 2. Unit Tests (Vitest)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**tests/unit/prescriptionParser.test.js:**
```javascript
import { describe, it, expect } from 'vitest';
import { parsePrescription } from '../../src/utils/prescriptionParser';

describe('Prescription Parser', () => {
  it('parses simple prescription', () => {
    const result = parsePrescription('Paracetamol 500mg twice daily for 5 days');
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Paracetamol');
    expect(result[0].dosage).toBe('500mg');
    expect(result[0].frequency).toBe('Twice daily');
    expect(result[0].timing).toContain('Morning');
    expect(result[0].timing).toContain('Evening');
    expect(result[0].duration).toBe('5 days');
  });
});
```

---

## 🔄 Backup & Recovery

### 1. IndexedDB Backup

Create `src/utils/backup.js`:
```javascript
export const exportData = async () => {
  const patients = await db.getAll(STORES.PATIENTS);
  const vitals = await db.getAll(STORES.VITALS);
  const prescriptions = await db.getAll(STORES.PRESCRIPTIONS);
  
  const backup = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    data: { patients, vitals, prescriptions }
  };
  
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-system-backup-${Date.now()}.json`;
  a.click();
};

export const importData = async (file) => {
  const text = await file.text();
  const backup = JSON.parse(text);
  
  for (const patient of backup.data.patients) {
    await db.add(STORES.PATIENTS, patient);
  }
  // ... repeat for vitals and prescriptions
};
```

### 2. Automated Backups

```javascript
// Schedule daily backups
setInterval(() => {
  exportData();
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

---

## 📈 Scaling Considerations

### 1. Service Worker (PWA)

Create `public/sw.js`:
```javascript
const CACHE_NAME = 'health-system-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Register in `main.jsx`:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 2. Code Splitting

```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const ASHADashboard = lazy(() => import('./pages/ASHADashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/patient" element={<PatientDashboard />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

---

## ✅ Go-Live Checklist

- [ ] Environment variables configured
- [ ] Backend API endpoints connected
- [ ] Real authentication implemented
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Backup system in place
- [ ] Monitoring dashboards ready
- [ ] Documentation updated
- [ ] User training completed
- [ ] Support team briefed
- [ ] Rollback plan documented

---

## 🆘 Troubleshooting

### Issue: Notifications not working

**Possible causes:**
1. Not using HTTPS
2. Permissions denied
3. Browser doesn't support

**Solutions:**
```bash
# Check if HTTPS
location.protocol === 'https:' // should be true

# Check permission
Notification.permission // should be 'granted'

# Check support
'Notification' in window // should be true
```

### Issue: IndexedDB quota exceeded

**Solution:**
```javascript
// Check quota
navigator.storage.estimate().then(estimate => {
  console.log(`Used: ${estimate.usage} / ${estimate.quota}`);
});

// Clear old data
await db.clear(STORES.VITALS); // Clear after sync
```

### Issue: Speech not working on Safari

**Solution:**
```javascript
// Safari requires user interaction first
button.addEventListener('click', () => {
  speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  // Now it will work for subsequent calls
});
```

---

## 📞 Support

- **Documentation**: See README.md, FEATURES.md
- **Issues**: GitHub Issues
- **Email**: support@yourapp.com
- **Phone**: +1-XXX-XXX-XXXX

---

**Ready for production!** 🚀
