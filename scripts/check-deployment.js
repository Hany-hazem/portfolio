#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Runs pre-deployment checks to ensure all environment variables are configured
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

// Run deployment checks inline
console.log('\n🔍 Running Deployment Checks...\n');

const checks = [];
let hasErrors = false;
let hasWarnings = false;

// 1. Supabase
if (!process.env.VITE_SUPABASE_URL) {
  checks.push({ type: 'error', msg: 'VITE_SUPABASE_URL is not set' });
  hasErrors = true;
} else {
  checks.push({ type: 'info', msg: '✓ Supabase URL configured' });
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  checks.push({ type: 'error', msg: 'VITE_SUPABASE_ANON_KEY is not set' });
  hasErrors = true;
} else {
  checks.push({ type: 'info', msg: '✓ Supabase Anon Key configured' });
}

// 2. Email Service
if (!process.env.RESEND_API_KEY) {
  checks.push({ type: 'warning', msg: 'RESEND_API_KEY is not set' });
  hasWarnings = true;
} else if (!process.env.RESEND_API_KEY.startsWith('re_')) {
  checks.push({ type: 'error', msg: 'RESEND_API_KEY appears invalid' });
  hasErrors = true;
} else {
  checks.push({ type: 'info', msg: '✓ Resend API Key configured' });
}

if (!process.env.EMAIL_FROM) {
  checks.push({ type: 'warning', msg: 'EMAIL_FROM is not set' });
  hasWarnings = true;
} else {
  checks.push({ type: 'info', msg: `✓ Email sender: ${process.env.EMAIL_FROM}` });
}

// 3. reCAPTCHA
if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  checks.push({ type: 'error', msg: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set' });
  hasErrors = true;
} else {
  const isTestKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  if (isTestKey) {
    checks.push({ type: 'warning', msg: '⚠️  Using reCAPTCHA TEST key (get production keys)' });
    hasWarnings = true;
  } else {
    checks.push({ type: 'info', msg: '✓ reCAPTCHA configured' });
  }
}

if (!process.env.RECAPTCHA_SECRET_KEY) {
  checks.push({ type: 'error', msg: 'RECAPTCHA_SECRET_KEY is not set' });
  hasErrors = true;
}

// 4. OAuth2
if (process.env.GITHUB_OAUTH_ID && !process.env.GITHUB_OAUTH_ID.includes('placeholder')) {
  checks.push({ type: 'info', msg: '✓ GitHub OAuth configured' });
} else {
  checks.push({ type: 'warning', msg: 'GitHub OAuth not configured' });
  hasWarnings = true;
}

if (process.env.GOOGLE_OAUTH_ID && !process.env.GOOGLE_OAUTH_ID.includes('placeholder')) {
  checks.push({ type: 'info', msg: '✓ Google OAuth configured' });
} else {
  checks.push({ type: 'warning', msg: 'Google OAuth not configured' });
  hasWarnings = true;
}

// 5. Base URL
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  checks.push({ type: 'error', msg: 'NEXT_PUBLIC_BASE_URL is not set' });
  hasErrors = true;
} else {
  checks.push({ type: 'info', msg: `✓ Base URL: ${process.env.NEXT_PUBLIC_BASE_URL}` });
}

// 6. GitHub User
if (process.env.VITE_GITHUB_USER) {
  checks.push({ type: 'info', msg: `✓ GitHub User: ${process.env.VITE_GITHUB_USER}` });
}

// Print results
const info = checks.filter(c => c.type === 'info');
const warnings = checks.filter(c => c.type === 'warning');
const errors = checks.filter(c => c.type === 'error');

if (info.length > 0) {
  console.log('📋 Configuration Status:');
  info.forEach(c => console.log(`  ${c.msg}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(c => console.log(`  - ${c.msg}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors (Must Fix):');
  errors.forEach(c => console.log(`  - ${c.msg}`));
  console.log('');
  console.log(`❌ Deployment checks failed with ${errors.length} error(s).`);
  console.log('   Fix all errors before deploying to production.\n');
  process.exit(1);
}

if (hasWarnings) {
  console.log(`⚠️  ${warnings.length} warning(s) found. Some features may not work.\n`);
}

console.log('✅ All critical checks passed! Ready to deploy.\n');
process.exit(0);
