/**
 * Deployment Checks
 * Validates all required environment variables and configurations
 * Run this before deployment to ensure everything is properly configured
 */

interface CheckResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface DeploymentCheckResults {
  allPassed: boolean;
  errors: CheckResult[];
  warnings: CheckResult[];
  info: CheckResult[];
}

export function runDeploymentChecks(): DeploymentCheckResults {
  const results: CheckResult[] = [];

  // 1. Supabase Configuration
  if (!process.env.VITE_SUPABASE_URL) {
    results.push({
      passed: false,
      message: 'VITE_SUPABASE_URL is not set',
      severity: 'error'
    });
  } else if (!process.env.VITE_SUPABASE_URL.startsWith('http')) {
    results.push({
      passed: false,
      message: 'VITE_SUPABASE_URL must be a valid URL',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: '✓ Supabase URL configured',
      severity: 'info'
    });
  }

  if (!process.env.VITE_SUPABASE_ANON_KEY) {
    results.push({
      passed: false,
      message: 'VITE_SUPABASE_ANON_KEY is not set',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: '✓ Supabase Anon Key configured',
      severity: 'info'
    });
  }

  // 2. Email Service (Resend)
  if (!process.env.RESEND_API_KEY) {
    results.push({
      passed: false,
      message: 'RESEND_API_KEY is not set - Email notifications will not work',
      severity: 'warning'
    });
  } else if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    results.push({
      passed: false,
      message: 'RESEND_API_KEY appears invalid (should start with re_)',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: '✓ Resend API Key configured',
      severity: 'info'
    });
  }

  if (!process.env.EMAIL_FROM) {
    results.push({
      passed: false,
      message: 'EMAIL_FROM is not set',
      severity: 'warning'
    });
  } else if (!process.env.EMAIL_FROM.includes('@')) {
    results.push({
      passed: false,
      message: 'EMAIL_FROM must be a valid email address',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: `✓ Email sender configured: ${process.env.EMAIL_FROM}`,
      severity: 'info'
    });
  }

  // 3. reCAPTCHA
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    results.push({
      passed: false,
      message: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set',
      severity: 'error'
    });
  } else {
    const isTestKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    if (isTestKey && process.env.NODE_ENV === 'production') {
      results.push({
        passed: false,
        message: 'Using reCAPTCHA TEST key in production - get real keys from https://www.google.com/recaptcha/admin',
        severity: 'warning'
      });
    } else {
      results.push({
        passed: true,
        message: isTestKey ? '✓ reCAPTCHA (Test Key)' : '✓ reCAPTCHA configured',
        severity: 'info'
      });
    }
  }

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    results.push({
      passed: false,
      message: 'RECAPTCHA_SECRET_KEY is not set',
      severity: 'error'
    });
  }

  // 4. OAuth2 - GitHub
  if (!process.env.GITHUB_OAUTH_ID) {
    results.push({
      passed: false,
      message: 'GITHUB_OAUTH_ID is not set - GitHub OAuth login will not work',
      severity: 'warning'
    });
  } else if (process.env.GITHUB_OAUTH_ID.includes('your_') || process.env.GITHUB_OAUTH_ID === 'placeholder') {
    results.push({
      passed: false,
      message: 'GITHUB_OAUTH_ID is using placeholder value',
      severity: 'warning'
    });
  } else {
    results.push({
      passed: true,
      message: '✓ GitHub OAuth configured',
      severity: 'info'
    });
  }

  if (!process.env.GITHUB_OAUTH_SECRET) {
    results.push({
      passed: false,
      message: 'GITHUB_OAUTH_SECRET is not set',
      severity: 'warning'
    });
  }

  // 5. OAuth2 - Google
  if (!process.env.GOOGLE_OAUTH_ID) {
    results.push({
      passed: false,
      message: 'GOOGLE_OAUTH_ID is not set - Google OAuth login will not work',
      severity: 'warning'
    });
  } else if (process.env.GOOGLE_OAUTH_ID.includes('your_') || process.env.GOOGLE_OAUTH_ID === 'placeholder') {
    results.push({
      passed: false,
      message: 'GOOGLE_OAUTH_ID is using placeholder value',
      severity: 'warning'
    });
  } else if (!process.env.GOOGLE_OAUTH_ID.endsWith('.apps.googleusercontent.com')) {
    results.push({
      passed: false,
      message: 'GOOGLE_OAUTH_ID format appears invalid',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: '✓ Google OAuth configured',
      severity: 'info'
    });
  }

  if (!process.env.GOOGLE_OAUTH_SECRET) {
    results.push({
      passed: false,
      message: 'GOOGLE_OAUTH_SECRET is not set',
      severity: 'warning'
    });
  }

  // 6. Base URL
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    results.push({
      passed: false,
      message: 'NEXT_PUBLIC_BASE_URL is not set',
      severity: 'error'
    });
  } else if (!process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')) {
    results.push({
      passed: false,
      message: 'NEXT_PUBLIC_BASE_URL must be a valid URL',
      severity: 'error'
    });
  } else {
    results.push({
      passed: true,
      message: `✓ Base URL: ${process.env.NEXT_PUBLIC_BASE_URL}`,
      severity: 'info'
    });
  }

  // 7. GitHub User (for portfolio)
  if (!process.env.VITE_GITHUB_USER) {
    results.push({
      passed: false,
      message: 'VITE_GITHUB_USER is not set - Portfolio may not display GitHub data',
      severity: 'warning'
    });
  } else {
    results.push({
      passed: true,
      message: `✓ GitHub User: ${process.env.VITE_GITHUB_USER}`,
      severity: 'info'
    });
  }

  // 8. Security Checks
  const adminPassword = 'portfolio2026'; // This should match your actual password
  results.push({
    passed: true,
    message: `✓ Admin password is hardcoded as: ${adminPassword}`,
    severity: 'info'
  });

  // Categorize results
  const errors = results.filter(r => r.severity === 'error' && !r.passed);
  const warnings = results.filter(r => r.severity === 'warning' && !r.passed);
  const info = results.filter(r => r.severity === 'info' && r.passed);

  return {
    allPassed: errors.length === 0,
    errors,
    warnings,
    info
  };
}

export function printDeploymentChecks(): void {
  console.log('\n🔍 Running Deployment Checks...\n');
  
  const results = runDeploymentChecks();
  
  // Print info messages
  if (results.info.length > 0) {
    console.log('📋 Configuration Status:');
    results.info.forEach(item => {
      console.log(`  ${item.message}`);
    });
    console.log('');
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    results.warnings.forEach(item => {
      console.log(`  - ${item.message}`);
    });
    console.log('');
  }
  
  // Print errors
  if (results.errors.length > 0) {
    console.log('❌ Errors (Must Fix):');
    results.errors.forEach(item => {
      console.log(`  - ${item.message}`);
    });
    console.log('');
  }
  
  // Summary
  if (results.allPassed) {
    console.log('✅ All deployment checks passed! Ready to deploy.\n');
  } else {
    console.log(`❌ Deployment checks failed with ${results.errors.length} error(s) and ${results.warnings.length} warning(s).`);
    console.log('   Fix all errors before deploying to production.\n');
    process.exit(1);
  }
}

// Run checks if executed directly
if (require.main === module) {
  printDeploymentChecks();
}
