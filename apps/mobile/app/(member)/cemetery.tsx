import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

export default function CemeteryScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [cemetery, setCemetery] = useState<any>(null);
  
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCemetery();
  }, []);

  const fetchCemetery = async () => {
    try {
      const res = await api.get('/mobile/cemetery');
      if (res.data.success && res.data.data) {
        setCemetery(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRequest = async () => {
    if (!selectedPlot) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/mobile/cemetery/request', {
        plotNo: selectedPlot.plotNo,
        notes
      });
      if (res.data.success) {
        Alert.alert(
          language === 'en' ? 'Success' : 'വിജയം', 
          language === 'en' ? 'Plot request submitted successfully. It is pending admin approval.' : 'പ്ലോട്ട് ബുക്കിംഗ് അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു. ഇത് കമ്മിറ്റിയുടെ അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു.'
        );
        setSelectedPlot(null);
        setNotes('');
        fetchCemetery(); // Refresh to show pending status visually if needed
      }
    } catch (e: any) {
      Alert.alert(
        language === 'en' ? 'Error' : 'പിശക്', 
        e.response?.data?.message || (language === 'en' ? 'Failed to submit request' : 'അപേക്ഷ സമർപ്പിക്കാൻ പരാജയപ്പെട്ടു')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const plots = cemetery?.plots || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-2 pb-4 flex-row items-center justify-between bg-white border-b border-slate-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-xl font-extrabold ml-2">{t('cemeteryPlots', language)}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(member)/cemetery-history')} className="bg-slate-100 p-2 rounded-xl">
          <Ionicons name="time-outline" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          
          <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex-row items-center">
            <Ionicons name="information-circle" size={24} color="#4f46e5" className="mr-3" />
            <Text className="text-indigo-900 text-sm flex-1 ml-3 leading-tight">
              {t('cemeteryInfo', language)}
            </Text>
          </View>

          <View className="flex-row items-center justify-around mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200">
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 mr-2" />
              <Text className="text-xs text-slate-600 font-medium">{t('available', language)}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded bg-amber-100 border border-amber-300 mr-2" />
              <Text className="text-xs text-slate-600 font-medium">{t('booked', language)}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded bg-rose-100 border border-rose-300 mr-2" />
              <Text className="text-xs text-slate-600 font-medium">{t('occupied', language)}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between pb-10">
            {(plots.length > 0 ? plots : [...Array(60)].map((_, i) => ({
              plotNo: `P-${i + 1}`,
              status: i < 30 ? 'occupied' : (i < 40 ? 'booked' : 'available'),
              section: 'A',
            }))).map((plot: any, i: number) => {
              const status = plot.status || (plot.isOccupied ? 'occupied' : 'available');
              const isAvailable = status === 'available';
              return (
                <TouchableOpacity
                  key={i}
                  disabled={!isAvailable}
                  onPress={() => setSelectedPlot({ ...plot, status })}
                  className={`w-[15%] aspect-square rounded-lg flex items-center justify-center mb-3 border ${
                    status === 'occupied' ? 'bg-rose-50 border-rose-200 opacity-60'
                    : status === 'booked' ? 'bg-amber-50 border-amber-200 opacity-80'
                    : 'bg-emerald-50 border-emerald-300 active:bg-emerald-100'
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${
                    status === 'occupied' ? 'text-rose-700'
                    : status === 'booked' ? 'text-amber-700'
                    : 'text-emerald-700'
                  }`}>{plot.plotNo}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Booking Modal */}
      <Modal visible={!!selectedPlot} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-slate-900">{t('requestPlot', language)} {selectedPlot?.plotNo}</Text>
              <TouchableOpacity onPress={() => setSelectedPlot(null)} className="p-2 bg-slate-100 rounded-full">
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-slate-600 text-sm mb-4">
              {language === 'en' 
                ? `You are requesting to book Plot ${selectedPlot?.plotNo} in Section ${selectedPlot?.section || 'A'}. This request will be sent to the Mahallu committee for approval.`
                : `സെക്ഷൻ ${selectedPlot?.section || 'A'}-ൽ പ്ലോട്ട് ${selectedPlot?.plotNo} ബുക്ക് ചെയ്യാൻ നിങ്ങൾ അപേക്ഷിക്കുകയാണ്. ഈ അപേക്ഷ മഹല്ല് കമ്മിറ്റിയുടെ അംഗീകാരത്തിനായി അയയ്ക്കുന്നതാണ്.`}
            </Text>

            <Text className="text-sm font-bold text-slate-800 mb-2">{t('additionalNotes', language)}</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 mb-6"
              placeholder={t('bookingNotesPlaceholder', language)}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleBookRequest}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl items-center flex-row justify-center ${isSubmitting ? 'bg-emerald-400' : 'bg-emerald-600'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" className="mr-2" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="white" className="mr-2" />
              )}
              <Text className="text-white font-bold text-base">{t('submitRequest', language)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
