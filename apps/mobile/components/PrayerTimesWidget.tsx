import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface PrayerData {
  timings?: {
    Fajr?: string;
    Sunrise?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
  };
  iqamahTimes?: {
    Fajr?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
    Jumuah?: string;
  };
}

interface PrayerTimesProps {
  data?: PrayerData;
  isLoading?: boolean;
}

const format12H = (time24?: string) => {
  if (!time24) return '--:--';
  const cleanTime = time24.split(' ')[0];
  const [hStr, mStr] = cleanTime.split(':');
  if (!hStr || !mStr) return '--:--';
  
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
};

export function PrayerTimesWidget({ data, isLoading = false }: PrayerTimesProps) {
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; inMinutes: number; type: 'Bang' | 'Namaz' } | null>(null);

  useEffect(() => {
    if (!data?.timings) return;

    const calculateNext = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTime = currentHour * 60 + currentMin;
      const isFriday = now.getDay() === 5;

      const prayerOrder = [
        { name: 'Fajr', key: 'Fajr' },
        { name: isFriday ? 'Jumuah' : 'Dhuhr', key: 'Dhuhr' },
        { name: 'Asr', key: 'Asr' },
        { name: 'Maghrib', key: 'Maghrib' },
        { name: 'Isha', key: 'Isha' },
      ];

      let next = null;

      for (const p of prayerOrder) {
        // Find Bang Time (Adhan)
        const bangTimeStr = data.timings[p.key === 'Jumuah' ? 'Dhuhr' : p.key as keyof typeof data.timings];
        // Find Namaz Time (Iqamah)
        const namazTimeStr = data.iqamahTimes?.[p.name as keyof typeof data.iqamahTimes];

        if (bangTimeStr) {
          const [bh, bm] = bangTimeStr.split(' ')[0].split(':').map(Number);
          const bangMins = bh * 60 + bm;
          
          if (bangMins > currentTime) {
            next = { name: p.name, time: bangTimeStr, inMinutes: bangMins - currentTime, type: 'Bang' as const };
            break;
          }
        }

        if (namazTimeStr) {
          const [nh, nm] = namazTimeStr.split(':').map(Number);
          const namazMins = nh * 60 + nm;
          
          if (namazMins > currentTime) {
            next = { name: p.name, time: namazTimeStr, inMinutes: namazMins - currentTime, type: 'Namaz' as const };
            break;
          }
        }
      }

      // If all passed, next is Fajr Bang tomorrow
      if (!next && data.timings.Fajr) {
        const [h, m] = data.timings.Fajr.split(' ')[0].split(':').map(Number);
        const prayerTimeInMins = h * 60 + m;
        next = {
          name: 'Fajr',
          time: data.timings.Fajr,
          inMinutes: (24 * 60 - currentTime) + prayerTimeInMins,
          type: 'Bang' as const
        };
      }

      setNextPrayer(next);
    };

    calculateNext();
    const interval = setInterval(calculateNext, 60000);
    return () => clearInterval(interval);
  }, [data]);

  if (isLoading) {
    return (
      <View style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 160, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (!data?.timings) return null;

  const isFriday = new Date().getDay() === 5;
  const prayers = ['Fajr', isFriday ? 'Jumuah' : 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  return (
    <View style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 24, padding: 20, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
            <Ionicons name="moon" size={18} color="#10b981" />
          </View>
          <View>
            <Text className="text-slate-900 font-extrabold text-base">Prayer Times</Text>
            <Text className="text-slate-500 text-[11px] mt-0.5">{dayjs().format('dddd, DD MMMM YYYY')}</Text>
          </View>
        </View>
        
        {nextPrayer && (
          <View className="bg-emerald-500 px-4 py-2 rounded-[14px] items-center justify-center">
            <Text className="text-emerald-50 font-medium text-[10px] uppercase tracking-wider mb-0.5">Next {nextPrayer.type}</Text>
            <Text className="text-white font-extrabold text-xs">
              {nextPrayer.name} in {Math.floor(nextPrayer.inMinutes / 60)}h {nextPrayer.inMinutes % 60}m
            </Text>
          </View>
        )}
      </View>

      {/* Grid Header */}
      <View className="flex-row mb-3">
        <View className="flex-[1.5]" />
        <View className="flex-1 items-center">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bang</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">Namaz</Text>
        </View>
      </View>

      {/* Times Rows */}
      <View className="space-y-2">
        {prayers.map((prayerName) => {
          const apiKey = prayerName === 'Jumuah' ? 'Dhuhr' : prayerName;
          const bangTime24 = data.timings?.[apiKey as keyof typeof data.timings];
          const namazTime24 = data.iqamahTimes?.[prayerName as keyof typeof data.iqamahTimes];
          
          const isNext = nextPrayer?.name === prayerName;
          
          return (
            <View 
              key={prayerName} 
              className={`flex-row items-center py-2.5 px-3 rounded-2xl ${isNext ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50/50'}`}
            >
              {/* Prayer Name */}
              <View className="flex-[1.5] flex-row items-center">
                <View className={`w-1.5 h-1.5 rounded-full mr-2 ${isNext ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Text className={`font-extrabold ${isNext ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {prayerName}
                </Text>
              </View>

              {/* Bang Time (Adhan) */}
              <View className="flex-1 items-center">
                <Text className={`font-bold text-xs ${isNext && nextPrayer?.type === 'Bang' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {format12H(bangTime24)}
                </Text>
              </View>

              {/* Namaz Time (Iqamah) */}
              <View className="flex-1 items-center">
                <Text className={`font-bold text-xs ${isNext && nextPrayer?.type === 'Namaz' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {format12H(namazTime24)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
