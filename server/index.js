import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 4001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const app = express();
app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!ADMIN_API_SECRET || token !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'admin-api', time: new Date().toISOString() });
});

// Admin: get settings (requires token)
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

// Admin: get logs (requires token)
app.get('/admin/logs', requireAdmin, async (req, res) => {
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
app.post('/admin/logs', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Admin API listening on port ${PORT}`);
});
