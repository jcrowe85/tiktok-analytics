import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiAlertCircle, FiX } from 'react-icons/fi';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});

  const { login, register, error: authError } = useAuth();

  // Validation functions

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    // Basic validation - only check for empty required fields
    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
      isValid = false;
    }

    // Validate name for registration
    if (!isLogin && !name.trim()) {
      errors.name = 'Full name is required';
      isValid = false;
    }

    // Validate confirm password for registration
    if (!isLogin) {
      if (!confirmPassword.trim()) {
        errors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    console.log('🚀 Form submitted:', { isLogin, email, hasPassword: !!password, hasName: !!name });

    try {
      if (isLogin) {
        console.log('👤 Calling login...');
        await login(email, password);
        console.log('✅ Login completed successfully');
      } else {
        console.log('📝 Calling register...');
        await register(email, password, name);
        console.log('✅ Registration completed successfully');
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
      console.log('🏁 Form submission completed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFieldErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    // AuthContext error will be cleared on next auth attempt
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Content */}
      <div className="w-full max-w-md">
        {/* Title and Subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Sign in to your account' : 'Create Account'}
          </h1>
          <p className="text-white/60 text-sm">
            {isLogin ? 'Access your TikTok Analytics dashboard' : 'Start analyzing your TikTok videos with AI'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Global Error Message */}
          {(error || authError) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 relative animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm flex-1">{error || authError}</p>
                <button
                  onClick={() => {
                    setError('');
                    // Note: AuthContext error will be cleared on next auth attempt
                  }}
                  className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Name Field (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <FiUser className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldErrors.name ? 'text-red-400' : 'text-white/40'}`} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) clearFieldError('name');
                  }}
                  className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.name 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-slate-600 focus:ring-purple-500/50 focus:border-purple-500/50'
                  }`}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
              {fieldErrors.name && (
                <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{fieldErrors.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldErrors.email ? 'text-red-400' : 'text-white/40'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) clearFieldError('email');
                }}
                className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                    : 'border-slate-600 focus:ring-purple-500/50 focus:border-purple-500/50'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
            {fieldErrors.email && (
              <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{fieldErrors.email}</p>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldErrors.password ? 'text-red-400' : 'text-white/40'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) clearFieldError('password');
                }}
                className={`w-full pl-12 pr-12 py-3 bg-slate-800 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.password 
                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                    : 'border-slate-600 focus:ring-purple-500/50 focus:border-purple-500/50'
                }`}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{fieldErrors.password}</p>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-white/40'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) clearFieldError('confirmPassword');
                  }}
                  className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-slate-600 focus:ring-purple-500/50 focus:border-purple-500/50'
                  }`}
                  placeholder="Confirm your password"
                  required={!isLogin}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{fieldErrors.confirmPassword}</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-600/50 disabled:to-purple-700/50 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={toggleMode}
              className="text-white hover:text-white/80 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
