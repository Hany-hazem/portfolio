import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const PORT = process.env.PORT || 4001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'portfolio2026';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'admin@notworthy.vip';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const app = express();
app.use(cors());
app.use(express.json());

// ===== RATE LIMITING =====
const rateLimitStore = new Map();

function checkRateLimit(ip, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `ratelimit:${ip}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (record.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.attempts++;
  return { allowed: true, remaining: maxAttempts - record.attempts };
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.socket.remoteAddress || 
         'unknown';
}

// ===== reCAPTCHA VALIDATION =====
async function validateRecaptcha(token) {
  if (!RECAPTCHA_SECRET) return true; // Skip if not configured
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`
    });
    const data = await response.json();
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    return false;
  }
}

// ===== EMAIL NOTIFICATIONS =====
async function sendLoginNotification(ip, userAgent, success) {
  if (!resend) return;
  
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_FROM, // Send to admin
      subject: success ? '✅ Admin Login Successful' : '⚠️ Failed Login Attempt',
      html: `
        <h2>Admin Login ${success ? 'Successful' : 'Failed'}</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
        ${!success ? '<p style="color: red;"><strong>Status:</strong> Failed attempt - wrong password</p>' : ''}
      `
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

// ===== TOKEN GENERATION =====
function generateAdminToken() {
  return crypto.randomBytes(32).toString('hex') + '_' + Date.now();
}

// ===== MIDDLEWARE =====
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!ADMIN_API_SECRET || token !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function requireSessionToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || 
                req.cookies?.admin_session;
  
  if (!token) {
    return res.status(401).json({ error: 'No session token' });
  }
  
  try {
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      await supabase
        .from('admin_sessions')
        .update({ is_active: false })
        .eq('token', token);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Update last activity
    await supabase
      .from('admin_sessions')
      .update({ last_activity: now.toISOString() })
      .eq('token', token);
    
    req.session = data;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Session validation error' });
  }
}

// ===== AUDIT LOGGING =====
async function logAudit(action, details, ip, success = true) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      details,
      ip_address: ip,
      success,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ===== PAGE VIEW TRACKING =====
function detectBot(userAgent) {
  const botPatterns = /bot|crawler|spider|scraper|facebook|twitter|linkedin|pinterest|whatsapp|telegram/i;
  return botPatterns.test(userAgent || '');
}

app.post('/analytics/page-view', async (req, res) => {
  try {
    const { path } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const isBot = detectBot(userAgent);
    
    await supabase.from('page_views').insert({
      path,
      is_bot: isBot,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });
    
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN LOGIN =====
app.post('/admin/login', async (req, res) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  // Rate limiting: 5 attempts per 15 minutes
  const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    await logAudit('admin_login', { reason: 'rate_limited' }, ip, false);
    return res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.',
      resetTime: rateLimit.resetTime
    });
  }
  
  const { password, recaptchaToken } = req.body;
  
  // Validate reCAPTCHA
  if (RECAPTCHA_SECRET && recaptchaToken) {
    const captchaValid = await validateRecaptcha(recaptchaToken);
    if (!captchaValid) {
      await logAudit('admin_login', { reason: 'invalid_captcha' }, ip, false);
      return res.status(400).json({ error: 'reCAPTCHA validation failed' });
    }
  }
  
  // Check password
  if (password !== ADMIN_PASSWORD) {
    await logAudit('admin_login', { reason: 'wrong_password' }, ip, false);
    await sendLoginNotification(ip, userAgent, false);
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Generate session token
  const token = generateAdminToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  await supabase.from('admin_sessions').insert({
    token,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    last_activity: new Date().toISOString(),
    is_active: true
  });
  
  await logAudit('admin_login', { success: true }, ip, true);
  await sendLoginNotification(ip, userAgent, true);
  
  res.json({
    token,
    expiresIn: 900, // 15 minutes in seconds
    expiresAt: expiresAt.toISOString()
  });
});

// ===== TOKEN REFRESH =====
app.post('/admin/refresh-token', requireSessionToken, async (req, res) => {
  const oldToken = req.session.token;
  const newToken = generateAdminToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  // Deactivate old token
  await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('token', oldToken);
  
  // Create new token
  await supabase.from('admin_sessions').insert({
    token: newToken,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    last_activity: new Date().toISOString(),
    is_active: true
  });
  
  await logAudit('token_refresh', { old_token: oldToken.substring(0, 10) }, ip, true);
  
  res.json({
    token: newToken,
    expiresIn: 900,
    expiresAt: expiresAt.toISOString()
  });
});

// ===== LOGOUT =====
app.post('/admin/logout', requireSessionToken, async (req, res) => {
  const token = req.session.token;
  const ip = getClientIP(req);
  
  await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('token', token);
  
  await logAudit('admin_logout', {}, ip, true);
  
  res.json({ ok: true });
});

// ===== ANALYTICS & LOGS =====
app.get('/admin/logs', requireSessionToken, async (req, res) => {
  const { type = 'audit', days = 7 } = req.query;
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    if (type === 'audit') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', daysAgo)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      
      const successfulLogins = data.filter(log => 
        log.action === 'admin_login' && log.success
      ).length;
      
      const failedLogins = data.filter(log => 
        log.action === 'admin_login' && !log.success
      ).length;
      
      res.json({ logs: data, successfulLogins, failedLogins });
    } else if (type === 'analytics') {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', daysAgo)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const realViews = data.filter(v => !v.is_bot).length;
      const botViews = data.filter(v => v.is_bot).length;
      
      const viewsByPath = data.reduce((acc, view) => {
        acc[view.path] = (acc[view.path] || 0) + 1;
        return acc;
      }, {});
      
      const topPages = Object.entries(viewsByPath)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));
      
      res.json({ 
        views: data, 
        realViews, 
        botViews,
        viewsByPath,
        topPages
      });
    } else {
      res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EXISTING ENDPOINTS =====

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'admin-api', time: new Date().toISOString() });
});

// Admin: get settings (requires old token for backward compatibility)
app.get('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: update settings
app.put('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('activity_logs').insert({
      user_id: null,
      event_type: 'settings_update',
      event_data: {
        github_username: payload.github_username,
        repo_filter: payload.repo_filter,
        max_repos: payload.max_repos,
        bio_override: Boolean(payload.bio_override),
      },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: get old activity logs (backward compatibility)
app.get('/admin/activity-logs', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Public: post limited logs (no secret required)
app.post('/admin/logs-public', async (req, res) => {
  try {
    const { event_type, event_data, error_message } = req.body || {};
    const allowed = ['fetch_profile', 'fetch_repos', 'error'];
    if (!allowed.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event_type' });
    }
    const { error } = await supabase.from('activity_logs').insert({
      user_id: null,
      event_type,
      event_data,
      error_message,
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ===== GITHUB API PROXY =====
app.all('/github/*', async (req, res) => {
  try {
    const pathParts = req.params[0].split('/').filter(Boolean);
    const githubPath = pathParts.join('/');
    const url = new URL(`https://api.github.com/${githubPath}`);
    
    // Forward query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, String(value));
      }
    });
    
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-App',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('GitHub proxy error:', error);
    res.status(500).json({ error: error.message || 'GitHub API error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API listening on port ${PORT}`);
  console.log(`✅ Rate limiting: Enabled`);
  console.log(`✅ reCAPTCHA: ${RECAPTCHA_SECRET ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Email notifications: ${resend ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Audit logging: Enabled`);
  console.log(`✅ Session tokens: Enabled (15 min expiry)`);
  console.log(`✅ GitHub proxy: Enabled`);
});
