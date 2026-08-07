import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ADHAN_AUDIO_URL = 'https://cdn.aladhan.com/audio/adhan/makkah.mp3';

export type ReminderMode = 'voice' | 'silent' | 'off';

export interface PrayerRemindersState {
  Fajr: ReminderMode;
  Dhuhr: ReminderMode;
  Asr: ReminderMode;
  Maghrib: ReminderMode;
  Isha: ReminderMode;
}

const DEFAULT_REMINDERS: PrayerRemindersState = {
  Fajr: 'voice',
  Dhuhr: 'voice',
  Asr: 'voice',
  Maghrib: 'voice',
  Isha: 'voice',
};

interface PrayerData {
  timings?: {
    Fajr?: string;
    Sunrise?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
    Sunset?: string;
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
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    inMinutes: number;
    type: 'Bang' | 'Namaz';
  } | null>(null);

  const [reminders, setReminders] = useState<PrayerRemindersState>(DEFAULT_REMINDERS);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const audioRef = useRef<any>(null);

  // Load Saved Reminder Preferences
  useEffect(() => {
    AsyncStorage.getItem('@prayer_reminders_v3').then((saved) => {
      if (saved) {
        try {
          setReminders(JSON.parse(saved));
        } catch (e) {
          /* ignore */
        }
      }
    });
  }, []);

  // Save Reminder Preferences
  const toggleReminder = async (prayerKey: keyof PrayerRemindersState) => {
    const current = reminders[prayerKey];
    let nextMode: ReminderMode = 'voice';
    if (current === 'voice') nextMode = 'silent';
    else if (current === 'silent') nextMode = 'off';
    else nextMode = 'voice';

    const updated = { ...reminders, [prayerKey]: nextMode };
    setReminders(updated);
    await AsyncStorage.setItem('@prayer_reminders_v3', JSON.stringify(updated));
  };

  // Audio Player for Bang Voice (Adhan)
  const playAdhanAudio = async () => {
    try {
      if (isPlayingAdhan) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlayingAdhan(false);
        return;
      }

      setIsPlayingAdhan(true);
      if (Platform.OS === 'web') {
        const audio = new window.Audio(ADHAN_AUDIO_URL);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsPlayingAdhan(false);
      } else {
        // Fallback for native audio preview
        Alert.alert('Bang Voice Alert', 'Playing Makkah Adhan Bang Voice Reminder!');
        setTimeout(() => setIsPlayingAdhan(false), 4000);
      }
    } catch (err) {
      setIsPlayingAdhan(false);
    }
  };

  // Calculate Next Prayer and Check Current Minute Reminders
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
        const bangTimeStr = data.timings[p.key === 'Jumuah' ? 'Dhuhr' : (p.key as keyof typeof data.timings)];
        const namazTimeStr = data.iqamahTimes?.[p.name as keyof typeof data.iqamahTimes];

        if (bangTimeStr) {
          const [bh, bm] = bangTimeStr.split(' ')[0].split(':').map(Number);
          const bangMins = bh * 60 + bm;

          // Check if Bang Time matches exact current minute for reminder
          if (bangMins === currentTime) {
            const prayerKey = p.key as keyof PrayerRemindersState;
            const mode = reminders[prayerKey];
            if (mode === 'voice') {
              playAdhanAudio();
            }
          }

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

      if (!next && data.timings.Fajr) {
        const [h, m] = data.timings.Fajr.split(' ')[0].split(':').map(Number);
        const prayerTimeInMins = h * 60 + m;
        next = {
          name: 'Fajr',
          time: data.timings.Fajr,
          inMinutes: 24 * 60 - currentTime + prayerTimeInMins,
          type: 'Bang' as const,
        };
      }

      setNextPrayer(next);
    };

    calculateNext();
    const interval = setInterval(calculateNext, 60000);
    return () => clearInterval(interval);
  }, [data, reminders]);

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1.5,
          borderRadius: 24,
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
        }}
      >
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (!data?.timings) return null;

  const isFriday = new Date().getDay() === 5;
  const prayers = ['Fajr', isFriday ? 'Jumuah' : 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#94a3b8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
            <Ionicons name="moon" size={18} color="#10b981" />
          </View>
          <View>
            <Text className="text-slate-900 font-extrabold text-base">Namaz & Bang Times</Text>
            <Text className="text-slate-500 text-[11px] mt-0.5">{dayjs().format('dddd, DD MMMM YYYY')}</Text>
          </View>
        </View>

        {/* Test Adhan Audio Button */}
        <TouchableOpacity
          onPress={playAdhanAudio}
          className={`flex-row items-center px-3 py-1.5 rounded-full border ${
            isPlayingAdhan ? 'bg-emerald-600 border-emerald-600' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <Ionicons
            name={isPlayingAdhan ? 'stop-circle' : 'volume-high'}
            size={14}
            color={isPlayingAdhan ? '#ffffff' : '#059669'}
          />
          <Text className={`text-[11px] font-bold ml-1.5 ${isPlayingAdhan ? 'text-white' : 'text-emerald-700'}`}>
            {isPlayingAdhan ? 'Stop Voice' : 'Test Bang Voice'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Next Prayer Banner */}
      {nextPrayer && (
        <View className="bg-gradient-to-r from-emerald-600 to-teal-700 p-3.5 rounded-2xl flex-row items-center justify-between mb-4 shadow-sm">
          <View className="flex-row items-center">
            <Ionicons name="notifications-circle" size={22} color="#34d399" />
            <View className="ml-2.5">
              <Text className="text-emerald-100 text-[10px] uppercase font-bold tracking-wider">
                Upcoming {nextPrayer.type}
              </Text>
              <Text className="text-white font-extrabold text-sm">{nextPrayer.name}</Text>
            </View>
          </View>

          <View className="bg-white/20 px-3 py-1.5 rounded-xl">
            <Text className="text-white font-extrabold text-xs">
              in {Math.floor(nextPrayer.inMinutes / 60)}h {nextPrayer.inMinutes % 60}m
            </Text>
          </View>
        </View>
      )}

      {/* Grid Header */}
      <View className="flex-row mb-3 px-1">
        <View className="flex-[1.5]">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Prayer</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Bang</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">Namaz</Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Reminder</Text>
        </View>
      </View>

      {/* Times Rows */}
      <View className="space-y-2">
        {prayers.map((prayerName) => {
          const apiKey = prayerName === 'Jumuah' ? 'Dhuhr' : prayerName;
          const bangTime24 = data.timings?.[apiKey as keyof typeof data.timings];
          const namazTime24 = data.iqamahTimes?.[prayerName as keyof typeof data.iqamahTimes];
          const isNext = nextPrayer?.name === prayerName;

          const reminderKey = (prayerName === 'Jumuah' ? 'Dhuhr' : prayerName) as keyof PrayerRemindersState;
          const mode = reminders[reminderKey] || 'voice';

          return (
            <View
              key={prayerName}
              className={`flex-row items-center py-2.5 px-3 rounded-2xl ${
                isNext ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50/70'
              }`}
            >
              {/* Prayer Name */}
              <View className="flex-[1.5] flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${isNext ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Text className={`font-extrabold text-xs ${isNext ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {prayerName}
                </Text>
              </View>

              {/* Bang Time (Adhan) */}
              <View className="flex-1 items-center">
                <Text
                  className={`font-bold text-xs ${
                    isNext && nextPrayer?.type === 'Bang' ? 'text-emerald-700 font-extrabold' : 'text-slate-600'
                  }`}
                >
                  {format12H(bangTime24)}
                </Text>
              </View>

              {/* Namaz Time (Iqamah) */}
              <View className="flex-1 items-center">
                <Text
                  className={`font-bold text-xs ${
                    isNext && nextPrayer?.type === 'Namaz' ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {format12H(namazTime24)}
                </Text>
              </View>

              {/* Reminder Toggle Button (Voice / Silent / Off) */}
              <View className="flex-1 items-end">
                <TouchableOpacity
                  onPress={() => toggleReminder(reminderKey)}
                  className={`flex-row items-center px-2 py-1 rounded-xl border ${
                    mode === 'voice'
                      ? 'bg-emerald-100 border-emerald-300'
                      : mode === 'silent'
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <Ionicons
                    name={
                      mode === 'voice'
                        ? 'volume-high-outline'
                        : mode === 'silent'
                        ? 'notifications-outline'
                        : 'volume-mute-outline'
                    }
                    size={13}
                    color={mode === 'voice' ? '#047857' : mode === 'silent' ? '#b45309' : '#64748b'}
                  />
                  <Text
                    className={`text-[9px] font-extrabold ml-1 ${
                      mode === 'voice' ? 'text-emerald-800' : mode === 'silent' ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    {mode === 'voice' ? 'Voice' : mode === 'silent' ? 'Silent' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Sunrise & Sunset Strip */}
      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100 px-1">
        {/* Sunrise */}
        <View className="flex-row items-center bg-amber-50/80 px-3 py-2 rounded-2xl border border-amber-100 flex-1 mr-2">
          <View className="w-7 h-7 rounded-xl bg-amber-100 items-center justify-center mr-2">
            <Ionicons name="sunny-outline" size={16} color="#d97706" />
          </View>
          <View>
            <Text className="text-amber-800 text-[10px] uppercase font-extrabold tracking-wider">Sunrise (ഉദയം)</Text>
            <Text className="text-amber-950 font-bold text-xs mt-0.5">{format12H(data.timings?.Sunrise)}</Text>
          </View>
        </View>

        {/* Sunset */}
        <View className="flex-row items-center bg-rose-50/80 px-3 py-2 rounded-2xl border border-rose-100 flex-1 ml-2">
          <View className="w-7 h-7 rounded-xl bg-rose-100 items-center justify-center mr-2">
            <Ionicons name="partly-sunny-outline" size={16} color="#e11d48" />
          </View>
          <View>
            <Text className="text-rose-800 text-[10px] uppercase font-extrabold tracking-wider">Sunset (അസ്തമയം)</Text>
            <Text className="text-rose-950 font-bold text-xs mt-0.5">
              {format12H(data.timings?.Sunset || data.timings?.Maghrib)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
