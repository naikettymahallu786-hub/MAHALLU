import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamily } from '../../lib/hooks/useFamily';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { MemberCard } from '../../components/MemberCard';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

// Keep in sync with the home screen's identity.
const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function FamilyScreen() {
  const { language } = useLanguageStore();
  const { data: family, isLoading, isError, refetch } = useFamily();

  if (isLoading) return <LoadingScreen message="Loading family details..." />;
  if (isError || !family) return <ErrorScreen message="Could not load family data." onRetry={refetch} />;

  const headMember = family.headMemberId;
  const otherMembers = family.members || [];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: CREAM }}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
          {t('household', language)}
        </Text>
        <Text className="text-slate-900 text-2xl font-extrabold mt-0.5">{t('myFamily', language)}</Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Family QR & Info */}
        <View
          className="bg-white rounded-[24px] p-4 mb-6 flex-row items-center overflow-hidden"
          style={{
            shadowColor: TEAL_DARK,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: GOLD }} />
          <View
            className="p-2.5 rounded-2xl"
            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' }}
          >
            {family.familyCode ? (
              <QRCode value={family.familyCode} size={64} color={TEAL_DARK} />
            ) : (
              <View className="w-16 h-16 items-center justify-center rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
                <Ionicons name="qr-code" size={24} color="#94a3b8" />
              </View>
            )}
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-extrabold text-lg mb-1.5" style={{ color: TEAL }}>
              {family.familyCode}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5" numberOfLines={1}>
                {t('ward', language)}: {family.wardNo || 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="home-outline" size={13} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5" numberOfLines={1}>
                {family.address?.line1}
              </Text>
            </View>
          </View>
        </View>

        {/* Head of Family */}
        <SectionLabel icon="ribbon-outline" text={t('headOfFamily', language)} />
        <View className="mb-6 mt-3">
          <MemberCard
            name={headMember.name}
            memberId={headMember.memberId || headMember._id}
            photo={headMember.photo?.url}
            phone={headMember.phone}
            role={language === 'en' ? 'Head' : 'കുടുംബനാഥൻ'}
            compact
          />
        </View>

        {/* Family Members */}
        <SectionLabel icon="people-outline" text={`${t('familyMembers', language)} (${otherMembers.length})`} />
        <View className="space-y-3 mb-8 mt-3">
          {otherMembers.map((m: any) => {
            const memberData = m.memberId;
            if (!memberData) return null;
            return (
              <MemberCard
                key={memberData._id}
                name={memberData.name}
                memberId={memberData.memberId || memberData._id}
                photo={memberData.photo?.url}
                role={m.relationship}
                compact
              />
            );
          })}
          {otherMembers.length === 0 && (
            <View className="bg-white rounded-2xl p-6 items-center justify-center border border-slate-100">
              <Ionicons name="people-outline" size={22} color="#cbd5e1" />
              <Text className="text-slate-400 text-xs mt-2">{t('noOtherMembers', language)}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ icon, text }: { icon: any; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={14} color="#0F6B5C" style={{ marginRight: 6 }} />
      <Text className="text-slate-800 text-sm font-bold uppercase tracking-wider">{text}</Text>
    </View>
  );
}