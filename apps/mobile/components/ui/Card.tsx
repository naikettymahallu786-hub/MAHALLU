import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const baseStyle = 'rounded-2xl p-5';
  const variantStyles = {
    default: 'bg-white border border-slate-100',
    elevated: 'bg-white border border-slate-100 shadow-xl shadow-slate-200/60',
    outlined: 'bg-transparent border border-slate-200',
  };

  return (
    <View className={`${baseStyle} ${variantStyles[variant]}`} style={style} {...props}>
      {children}
    </View>
  );
}
