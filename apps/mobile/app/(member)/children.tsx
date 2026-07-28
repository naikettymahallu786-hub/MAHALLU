import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChildren } from '../../lib/hooks/useChildren';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';

export default function ChildrenScreen() {
  const router = useRouter();
  const { data: children, isLoading, refetch } = useChildren();

  if (isLoading) return <LoadingScreen message="Loading student records..." />;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CREAM }} edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={TEAL_DARK} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: TEAL_DARK }}>My Children</Text>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
      >
        {!children || children.length === 0 ? (
          <EmptyState 
            icon="school-outline" 
            title="No Students Found" 
            message="There are no Madrasa students registered under your guardianship." 
          />
        ) : (
          <View className="space-y-4 mb-8">
            {children.map((child: any, idx: number) => (
              <Animated.View 
                key={child._id}
                entering={FadeInDown.delay(50 + (idx * 50)).springify()}
                className="bg-white rounded-[24px] overflow-hidden"
                style={{ shadowColor: TEAL_DARK, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
              >
                {/* Header Profile */}
                <View className="p-4 flex-row items-center border-b border-slate-100">
                  <Avatar uri={child.memberId?.photo?.url} name={child.memberId?.name} size={48} />
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-900 font-extrabold text-base">{child.memberId?.name}</Text>
                    <Text className="text-emerald-600 text-xs font-semibold">{child.admissionNo}</Text>
                  </View>
                  <Badge label={child.status} variant={child.status === 'active' ? 'success' : 'neutral'} />
                </View>

                {/* Stats Row */}
                <View className="flex-row divide-x divide-slate-100 border-b border-slate-100">
                  <View className="flex-1 p-3 items-center justify-center bg-slate-50/50">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Class</Text>
                    <Text className="text-slate-800 font-extrabold text-sm">{child.classId?.name || 'N/A'}</Text>
                  </View>
                  <View className="flex-1 p-3 items-center justify-center bg-slate-50/50">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Attendance</Text>
                    <Text className="text-blue-600 font-extrabold text-sm">{child.attendancePercent}%</Text>
                  </View>
                  <View className="flex-1 p-3 items-center justify-center bg-slate-50/50">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Homework</Text>
                    <View className="flex-row items-center">
                      <Text className={`font-extrabold text-sm ${child.pendingHomework > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {child.pendingHomework} 
                      </Text>
                      <Text className="text-slate-400 text-[10px] font-bold ml-1">due</Text>
                    </View>
                  </View>
                </View>

                {/* Timetable Section */}
                {child.classId?.schedule && child.classId.schedule.length > 0 && (
                  <View className="p-4 bg-slate-50">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold mb-3 tracking-wider">Class Timetable</Text>
                    <View className="space-y-2">
                      {child.classId.schedule.map((sch: any, sIdx: number) => (
                        <View key={sIdx} className="flex-row items-center bg-white p-2.5 rounded-xl border border-slate-200">
                          <View className="w-14">
                            <Text className="text-slate-800 font-extrabold text-xs">{sch.day.substring(0, 3)}</Text>
                          </View>
                          <View className="flex-1 px-2 border-l border-slate-100">
                            <Text className="text-emerald-700 font-bold text-xs">{sch.subject}</Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-slate-500 font-medium text-[10px]">{sch.startTime}</Text>
                            <Text className="text-slate-500 font-medium text-[10px]">{sch.endTime}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
