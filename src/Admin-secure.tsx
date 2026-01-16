import React, { useState, useEffect, useRef } from 'react';
import { Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:4001';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Ld-EO0sAAAADEUcuo8jPm1u_sBsa2xwhq9t-JfX';

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(60); // minutes
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  
  const activityRef = useRef(lastActivity);
  activityRef.current = lastActivity;

  // Load reCAPTCHA script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setRecaptchaLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const expiry = localStorage.getItem('admin_token_expiry');
    
    if (token && expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate > new Date()) {
        setAdminToken(token);
        setTokenExpiry(expiryDate);
        setIsAuthenticated(true);
      } else {
        // Token expired
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
      }
    }
    setLoading(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const updateActivity = () => {
      setLastActivity(Date.now());
    };
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated]);

  // Session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated || !tokenExpiry) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeLeft = tokenExpiry.getTime() - now.getTime();
      const minutesLeft = Math.floor(timeLeft / 60000);
      
      setSessionTimeout(minutesLeft);
      
      // Auto-refresh token at 5 minutes left
      if (minutesLeft <= 5 && minutesLeft > 4) {
        refreshToken();
      }
      
      // Session expired
      if (timeLeft <= 0) {
        handleLogout();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated, tokenExpiry]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoggingIn(true);
    
    try {
      if (!recaptchaLoaded || !window.grecaptcha) {
        setError('reCAPTCHA not loaded. Please refresh the page.');
        setIsLoggingIn(false);
        return;
      }
      
      // Get reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
      
      const response = await fetch(`${ADMIN_API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, recaptchaToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          const resetTime = new Date(data.resetTime);
          setError(`Too many attempts. Try again at ${resetTime.toLocaleTimeString()}`);
        } else {
          setError(data.error || 'Login failed');
        }
        setIsLoggingIn(false);
        return;
      }
      
      // Store token
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_token_expiry', data.expiresAt);
      
      setAdminToken(data.token);
      setTokenExpiry(new Date(data.expiresAt));
      setIsAuthenticated(true);
      setSuccess('Login successful!');
      setPassword('');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const refreshToken = async () => {
    if (!adminToken) return;
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_token_expiry', data.expiresAt);
      
      setAdminToken(data.token);
      setTokenExpiry(new Date(data.expiresAt));
      setSuccess('Session refreshed!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Token refresh error:', err);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await fetch(`${ADMIN_API_BASE}/admin/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_expiry');
    setAdminToken(null);
    setTokenExpiry(null);
    setIsAuthenticated(false);
    setPassword('');
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-6">Admin Login</h1>
          
          {/* Security Indicators */}
          <div className="mb-6 p-4 bg-gray-750 rounded-lg text-sm text-gray-300 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Rate limiting active (5 attempts / 15 min)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>reCAPTCHA protection enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Secure session tokens (15 min rotation)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Audit logging active</span>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin password"
                  autoFocus
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoggingIn || !recaptchaLoaded}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
            
            {!recaptchaLoaded && (
              <p className="text-xs text-gray-400 text-center">Loading security verification...</p>
            )}
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            Protected by Google reCAPTCHA
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Session Info Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-300">
              <span className="text-gray-400">Session expires in:</span>
              <span className={`ml-2 font-mono font-semibold ${sessionTimeout <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                {sessionTimeout}:{sessionTimeout <= 5 ? '00' : '00'} min
              </span>
            </div>
            {sessionTimeout <= 5 && (
              <span className="text-xs text-yellow-400">Auto-refreshing soon...</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshToken}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              title="Refresh session token"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {success && (
        <div className="bg-green-900/20 border-b border-green-700 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        <AdminDashboard onClose={handleLogout} adminToken={adminToken || ''} />
      </div>
    </div>
  );
}

export default Admin;
