'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Moon, Sun, Star } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantCode: z.string().min(1, 'Mahallu code is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantCode: 'JMM001' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { tokens, user } = response.data.data;
      login(user, tokens);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/3 rounded-full blur-3xl" />
        {/* Islamic star pattern */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-500/10"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 60}%`,
            }}
            animate={{ rotate: 360, opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
          >
            <Star size={40 + i * 8} />
          </motion.div>
        ))}
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-4 shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(5, 150, 105, 0.4)' }}
          >
            <span className="text-white text-4xl font-bold arabic">م</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">Mahallu ERP</h1>
          <p className="text-emerald-400/80 text-sm font-medium arabic text-center">نظام إدارة المحلة</p>
          <p className="text-white/50 text-sm mt-1">Islamic Community Management System</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Mahallu Code */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Mahallu Code
              </label>
              <input
                id="tenantCode"
                {...register('tenantCode')}
                placeholder="e.g. JMM001"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase"
              />
              {errors.tenantCode && (
                <p className="text-red-400 text-xs mt-1">{errors.tenantCode.message}</p>
              )}
            </div>

            {/* Email / Phone */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email or Phone
              </label>
              <input
                id="identifier"
                {...register('identifier')}
                type="text"
                placeholder="admin@mahallu.app"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              {errors.identifier && (
                <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-semibold text-white gradient-brand transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 mt-2"
              style={{ boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
            <Link
              href="/madrasa-login"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <span>🏫 Go to Madrasa Staff Portal (Sadar Mualim / Ustadh)</span>
            </Link>
            <p className="text-center text-white/40 text-xs">
              Mahallu ERP v1.0 · Secure Login
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 rounded-2xl border border-white/10 text-white/50 text-xs text-center"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <p className="font-medium text-white/70 mb-1">Demo Credentials</p>
          <p>Code: JMM001 · admin@mahallu.app · Admin@123456</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
