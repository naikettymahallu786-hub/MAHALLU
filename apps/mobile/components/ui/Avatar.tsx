import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  bgColor?: string;
}

export function Avatar({ uri, name, size = 44, bgColor = 'bg-emerald-600' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fontSize = size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-lg';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-zinc-800"
      />
    );
  }

  return (
    <View
      className={`${bgColor} items-center justify-center`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text className={`text-white font-bold ${fontSize}`}>{initials}</Text>
    </View>
  );
}
