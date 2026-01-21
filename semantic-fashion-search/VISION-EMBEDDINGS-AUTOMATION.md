# Vision Embeddings Automation Guide

## Overview

This guide explains how to set up **automatic vision embedding generation** for new products using the cron-ready script.

---

## When to Automate

**Automate when:**
- ✅ You're regularly adding new products (daily/weekly)
- ✅ You want vision validation on all products without manual runs
- ✅ You have a server/hosting with cron capabilities

**Keep manual when:**
- ❌ Only syncing products occasionally
- ❌ Prefer to control when embeddings are generated
- ❌ Running on local development only

---

## Cron Script Features

### **Production-Ready**
- ✅ Automated batch processing (500 products per run)
- ✅ Comprehensive logging to files
- ✅ Error handling and retries (3 attempts per image)
- ✅ Exit codes for monitoring
- ✅ Optional notifications (email/Slack)
- ✅ Graceful handling of failures

### **Configuration Options**
```bash
# Environment variables (add to .env)
VISION_BATCH_SIZE=500                    # Products per run
ENABLE_VISION_NOTIFICATIONS=false        # Enable notifications
NOTIFICATION_EMAIL=admin@example.com     # Where to send alerts
```

---

## Setup Instructions

### **Step 1: Create Logs Directory**
```bash
cd semantic-fashion-search
mkdir -p logs
```

### **Step 2: Test the Cron Script**
```bash
node scripts/generate-vision-embeddings-cron.mjs
```

You should see:
```
[2026-01-04T...] INFO: ======================================================================
[2026-01-04T...] INFO: VISION EMBEDDINGS CRON JOB STARTED
[2026-01-04T...] INFO: ======================================================================
[2026-01-04T...] INFO: Configuration {"batchSize":500,"maxRetries":3,"notifications":false}
[2026-01-04T...] INFO: Total products needing embeddings: 2500
[2026-01-04T...] INFO: Processing batch of 500 products
[2026-01-04T...] INFO: Progress: 50/500 completed
...
[2026-01-04T...] INFO: SUMMARY
[2026-01-04T...] INFO: Results {"processed":500,"succeeded":495,"failed":5,"successRate":"99.0%"}
```

### **Step 3: Set Up Cron Job**

#### **On Linux/Mac (crontab)**
```bash
# Edit crontab
crontab -e

# Add one of these schedules:

# Every hour (recommended for active sites)
0 * * * * cd /path/to/semantic-fashion-search && node scripts/generate-vision-embeddings-cron.mjs >> logs/vision-cron.log 2>&1

# Every 6 hours (good for moderate traffic)
0 */6 * * * cd /path/to/semantic-fashion-search && node scripts/generate-vision-embeddings-cron.mjs >> logs/vision-cron.log 2>&1

# Every day at 2 AM (low-traffic sites)
0 2 * * * cd /path/to/semantic-fashion-search && node scripts/generate-vision-embeddings-cron.mjs >> logs/vision-cron.log 2>&1
```

#### **On Windows (Task Scheduler)**
1. Open Task Scheduler
2. Create Basic Task → "Vision Embeddings"
3. Trigger: Daily (or Custom)
4. Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\semantic-fashion-search\scripts\generate-vision-embeddings-cron.mjs`
   - Start in: `C:\path\to\semantic-fashion-search`

#### **On Netlify/Vercel (Scheduled Functions)**
Create a serverless function:
```javascript
// netlify/functions/vision-embeddings-cron.js
import { spawn } from 'child_process';

export async function handler(event, context) {
  // Run the script
  const process = spawn('node', ['scripts/generate-vision-embeddings-cron.mjs']);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Vision embeddings job triggered' })
  };
}
```

Configure in `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

  [plugins.inputs]
    [plugins.inputs.vision_embeddings]
      schedule = "0 * * * *"  # Every hour
```

---

## Monitoring

### **Check Logs**
```bash
# View today's log
tail -f logs/vision-embeddings-$(date +%Y-%m-%d).log

# View recent activity
tail -100 logs/vision-cron.log

# Search for errors
grep "ERROR" logs/vision-embeddings-*.log
```

### **Check Database Progress**
```sql
-- In Supabase SQL Editor
SELECT
  COUNT(*) as total_products,
  COUNT(image_embedding) as with_embeddings,
  COUNT(*) - COUNT(image_embedding) as remaining,
  ROUND(COUNT(image_embedding)::numeric / COUNT(*) * 100, 1) as completion_percentage
FROM products;
```

### **Exit Codes**
The script returns:
- **0** = Success (all products processed)
- **1** = Fatal error or all failed
- **2** = Partial success (some failures)

Monitor with:
```bash
# Check if last run succeeded
echo $?  # After manual run

# In cron logs
grep "exit code" logs/vision-cron.log
```

---

## Notifications (Optional)

### **Setup Email Notifications**

#### **Option 1: Using SendGrid**
```bash
# Add to .env
ENABLE_VISION_NOTIFICATIONS=true
NOTIFICATION_EMAIL=admin@example.com
SENDGRID_API_KEY=your_key
```

Then modify the `sendNotification` function in the script:
```javascript
async function sendNotification(subject, body) {
  if (!CONFIG.ENABLE_NOTIFICATIONS) return;

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: CONFIG.NOTIFICATION_EMAIL,
    from: 'noreply@yoursite.com',
    subject: `[Vision Embeddings] ${subject}`,
    text: body,
  });
}
```

#### **Option 2: Using Slack**
```javascript
async function sendNotification(subject, body) {
  if (!CONFIG.ENABLE_NOTIFICATIONS) return;

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `*${subject}*\n\`\`\`${body}\`\`\``
    })
  });
}
```

---

## Troubleshooting

### **Cron Job Not Running**

**Check cron is active:**
```bash
sudo service cron status  # Linux
```

**Check cron logs:**
```bash
# Linux
grep CRON /var/log/syslog

# Mac
log show --predicate 'process == "cron"' --last 1h
```

**Test manually:**
```bash
# Run the exact cron command
cd /path/to/semantic-fashion-search && node scripts/generate-vision-embeddings-cron.mjs
```

### **High Failure Rate**

Check logs for patterns:
```bash
grep "ERROR" logs/vision-embeddings-*.log | head -20
```

Common issues:
- **Image URLs broken** → Products from bad vendors
- **Timeout errors** → Increase `RETRY_DELAY_MS`
- **Out of memory** → Reduce `VISION_BATCH_SIZE`

### **Script Uses Too Much Memory**

Reduce batch size:
```bash
# In .env
VISION_BATCH_SIZE=250
```

### **Taking Too Long**

Current benchmark: ~500 products in ~3 minutes

Speed up:
- Reduce retry attempts
- Increase batch size (if memory allows)
- Run more frequently (smaller batches)

---

## Performance

### **Resource Usage**
- **CPU**: Moderate during processing, idle between runs
- **Memory**: ~500MB for CLIP model + ~100MB per batch
- **Disk**: Logs grow at ~1MB per 10,000 products processed
- **Network**: ~200KB per product image download

### **Timing**
- **First run**: +3 seconds for model download
- **Per product**: ~0.3-0.5 seconds average
- **500 products**: ~2-4 minutes total

### **Recommendations**
- **Low traffic**: Run daily
- **Medium traffic**: Run every 6 hours
- **High traffic**: Run hourly
- **Huge catalog**: Run continuously with smaller batches

---

## Best Practices

1. **Start Conservative**
   - Begin with daily runs
   - Monitor logs for a week
   - Increase frequency as needed

2. **Monitor Regularly**
   - Check logs weekly
   - Monitor database completion %
   - Watch for error patterns

3. **Clean Up Logs**
   ```bash
   # Delete logs older than 30 days
   find logs/ -name "vision-*.log" -mtime +30 -delete
   ```

4. **Handle Failures Gracefully**
   - Script retries 3 times automatically
   - Failed products are marked in database
   - Can manually retry later

5. **Coordinate with Product Sync**
   - Run vision embeddings AFTER product sync
   - Example schedule:
     - 1 AM: Sync products from vendors
     - 2 AM: Generate vision embeddings

---

## Migration Path

### **Phase 1: Manual (Current)**
✅ Run script manually after each product sync
✅ Good for MVP and testing

### **Phase 2: Scheduled Automation**
⏭️ Set up cron job (hourly/daily)
⏭️ Monitor logs and success rates
⏭️ Fine-tune batch sizes and schedules

### **Phase 3: Real-Time Generation**
⏭️ Add to product sync pipeline
⏭️ Generate embeddings immediately on product creation
⏭️ Background job for retry/cleanup only

---

## Cost Analysis

### **Compute Costs**
- **Self-hosted**: FREE (uses local CLIP model)
- **Serverless**: ~$0.10 per 10,000 products (Netlify/Vercel compute time)

### **Storage Costs**
- **Database**: ~2KB per product = $0.02 per 10,000 products (Supabase)
- **Logs**: ~1MB per 10,000 products = negligible

### **Total Cost**
- **10,000 products**: < $0.15 total
- **100,000 products**: < $1.50 total

**Extremely cost-effective!** ✅

---

## When You're Ready to Activate

1. Test the cron script manually
2. Choose your schedule (hourly/daily)
3. Set up cron job or scheduled function
4. Monitor for 1 week
5. Adjust as needed

**You're all set!** The script is ready to go whenever you need automated vision embeddings. 🚀
