import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  warning: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  error: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  info: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  neutral: { bg: 'bg-zinc-700/40', text: 'text-zinc-400' },
};

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const { bg, text } = VARIANTS[variant];
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View className={`${bg} rounded-full ${padding} self-start`}>
      <Text className={`${text} ${fontSize} font-bold uppercase tracking-wider`}>{label}</Text>
    </View>
  );
}

export function getPaymentStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'success': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'error';
    case 'refunded': return 'info';
    default: return 'neutral';
  }
}

export function getAttendanceVariant(status: string): BadgeVariant {
  switch (status) {
    case 'present': return 'success';
    case 'absent': return 'error';
    case 'late': return 'warning';
    case 'excused': return 'info';
    default: return 'neutral';
  }
}
