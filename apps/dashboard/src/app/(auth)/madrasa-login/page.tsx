'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Moon, Sun, GraduationCap, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantCode: z.string().min(1, 'Mahallu code is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function MadrasaLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { login } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantCode: 'JMM001' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { tokens, user } = response.data.data;
      login(user, tokens);
      toast.success(`Welcome to Madrasa Portal, ${user.name}!`);
      router.push('/madrasa-portal');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  const fillDemoRole = (email: string, pass: string) => {
    setValue('identifier', email);
    setValue('password', pass);
    setValue('tenantCode', 'JMM001');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Theme toggle & Admin Portal link */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <Link
          href="/login"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-all"
        >
          Main Admin Portal <ArrowRight size={14} />
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

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
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(20, 184, 166, 0.4)' }}
          >
            <GraduationCap size={40} className="text-white" />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <BookOpen size={13} /> Dedicated Staff Portal
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Madrasa Portal</h1>
          <p className="text-teal-400/80 text-sm font-medium arabic text-center">بوابة إدارة المدرسة الإسلامية</p>
          <p className="text-white/50 text-xs mt-1">Sadar Mualim · Principal · Ustadh Login</p>
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all uppercase"
              />
              {errors.tenantCode && (
                <p className="text-red-400 text-xs mt-1">{errors.tenantCode.message}</p>
              )}
            </div>

            {/* Email / Phone */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Staff Email or Phone
              </label>
              <input
                id="identifier"
                {...register('identifier')}
                type="text"
                placeholder="sadar@mahallu.app"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-teal-500/30"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in to Madrasa Portal...</>
              ) : (
                'Enter Madrasa Portal'
              )}
            </button>
          </form>

          {/* Quick Demo Staff Credentials */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
            <p className="text-white/60 text-xs font-semibold text-center mb-2 flex items-center justify-center gap-1">
              <ShieldCheck size={14} className="text-teal-400" /> Quick Demo Staff Logins:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoRole('madrasa.admin@mahallu.app', 'Madrasa@123456')}
                className="py-2 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 font-medium text-center truncate transition-colors"
              >
                🏫 Madrasa Admin ID
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole('sadar@mahallu.app', 'Sadar@123456')}
                className="py-2 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium text-center truncate transition-colors"
              >
                👳‍♂️ Sadar Mualim ID
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
