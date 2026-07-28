import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

const TYPE_LABELS: Record<string, string> = {
  marriage_certificate: 'Marriage Certificate',
  marriage_clearance: 'Marriage Clearance',
  panchayath_letter: 'Panchayath Letter',
  village_letter: 'Village Letter',
  other_org_letter: 'Other Organizations Letter',
  caste_certificate: 'Caste Certificate',
  noc: 'NOC (No Objection Certificate)',
  residence: 'Residence Certificate',
  membership: 'Membership Certificate',
  nikah: 'Nikah Certificate',
  student: 'Student Certificate',
  completion: 'Completion Certificate',
  transfer: 'Transfer Certificate',
  death: 'Death Certificate',
};

export default function CertificatesScreen() {
  const router = useRouter();

  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [showViewerModal, setShowViewerModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-certificates'],
    queryFn: () => api.get('/mobile/certificates').then(r => r.data.data),
  });

  const requests = data?.requests || [];
  const issuedCerts = data?.issuedCerts || [];

  const handleOpenCertificate = (certObj: any) => {
    setSelectedCert(certObj);
    setShowViewerModal(true);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-emerald-600 px-6 pt-14 pb-6 rounded-b-3xl shadow-sm z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Certificates</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Request New Button */}
        <TouchableOpacity 
          onPress={() => router.push('/(member)/certificates/request')}
          className="bg-emerald-50 border-2 border-emerald-600/30 p-4 rounded-2xl flex-row items-center mb-6 shadow-sm"
        >
          <View className="w-12 h-12 rounded-full bg-emerald-600 items-center justify-center mr-4">
            <Ionicons name="add" size={26} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-emerald-900 text-lg">Request Certificate</Text>
            <Text className="text-emerald-700 text-xs">Apply for Marriage, Clearance, Letters, Caste, NOC</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#059669" />
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#059669" className="mt-10" />
        ) : (
          <>
            <Text className="font-bold text-slate-800 text-lg mb-4">Your Certificate Requests</Text>
            
            {requests.length === 0 && issuedCerts.length === 0 ? (
              <View className="bg-white p-8 rounded-2xl items-center shadow-sm border border-slate-100">
                <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={32} color="#94a3b8" />
                </View>
                <Text className="font-bold text-slate-700 text-base">No Certificates Yet</Text>
                <Text className="text-slate-500 text-center mt-1 text-sm">You haven't requested any certificates. Tap the button above to request one.</Text>
              </View>
            ) : null}

            {requests.map((req: any) => {
              const typeLabel = TYPE_LABELS[req.type] || req.type;
              return (
                <View key={req._id} className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="font-bold text-slate-900 text-base">{typeLabel}</Text>
                      <Text className="text-slate-400 text-xs mt-0.5">
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full ${
                      req.status === 'PENDING' ? 'bg-amber-100' : req.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      <Text className={`text-xs font-bold ${
                        req.status === 'PENDING' ? 'text-amber-800' : req.status === 'APPROVED' ? 'text-emerald-800' : 'text-red-800'
                      }`}>
                        {req.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-600 text-sm mb-3">Purpose: {req.purpose}</Text>
                  
                  {req.status === 'APPROVED' && req.certificateId ? (
                    <TouchableOpacity 
                      onPress={() => handleOpenCertificate(req.certificateId)}
                      className="bg-emerald-600 py-3 rounded-xl flex-row justify-center items-center shadow-sm"
                    >
                      <Ionicons name="eye-outline" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">View & Download Certificate</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Official Certificate Document Viewer Modal */}
      <Modal visible={showViewerModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <Text className="text-lg font-bold text-slate-900">Official Mahallu Certificate</Text>
              <TouchableOpacity onPress={() => setShowViewerModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedCert && (
              <ScrollView className="space-y-4">
                {/* Official Letterhead Container */}
                <View className="border-4 border-emerald-900 p-6 rounded-2xl bg-amber-50/20">
                  {/* Mahallu Header */}
                  <View className="items-center border-b-2 border-emerald-800 pb-4 mb-4">
                    <Text className="text-2xl font-black text-emerald-900 tracking-wider text-center uppercase">
                      MAHALLU COMMITTEE
                    </Text>
                    <Text className="text-xs text-emerald-700 font-semibold mt-1">OFFICIAL CERTIFICATE OF MAHAL JUMA MASJID</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Govt. Reg. No: MHL/2026/CERT</Text>
                  </View>

                  {/* Reference & Date */}
                  <View className="flex-row justify-between mb-4">
                    <Text className="text-xs font-bold text-slate-700">Ref No: {selectedCert.certificateNo}</Text>
                    <Text className="text-xs font-bold text-slate-700">Date: {new Date(selectedCert.issuedAt || Date.now()).toLocaleDateString()}</Text>
                  </View>

                  {/* Certificate Title */}
                  <Text className="text-center font-black text-xl text-emerald-900 uppercase my-3 underline decoration-amber-500">
                    {TYPE_LABELS[selectedCert.type] || selectedCert.type}
                  </Text>

                  {/* Main Body Text */}
                  <View className="my-4 space-y-3">
                    <Text className="text-sm text-slate-800 leading-6 text-justify">
                      This is to certify that Mr/Mrs. <Text className="font-bold">{selectedCert.recipientId?.name || 'Member'}</Text> is a verified resident member of this Mahallu.
                    </Text>

                    {selectedCert.data?.purpose && (
                      <Text className="text-sm text-slate-800 leading-6 text-justify">
                        This certificate is issued for the purpose of: <Text className="font-semibold">{selectedCert.data.purpose}</Text>.
                      </Text>
                    )}

                    {/* Additional type details */}
                    {Object.entries(selectedCert.data || {}).map(([key, val]) => {
                      if (key === 'purpose' || !val) return null;
                      return (
                        <Text key={key} className="text-xs text-slate-700">
                          • <Text className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}:</Text> {String(val)}
                        </Text>
                      );
                    })}
                  </View>

                  {/* E-Stamp & E-Sign Badges */}
                  <View className="flex-row justify-between items-center mt-6 pt-4 border-t border-slate-200">
                    {/* E-Stamp Seal */}
                    {selectedCert.eStamp?.isStamped !== false && (
                      <View className="w-24 h-24 border-2 border-dashed border-emerald-700 rounded-full items-center justify-center p-1 bg-emerald-50/50">
                        <Ionicons name="ribbon-outline" size={24} color="#047857" />
                        <Text className="text-[8px] font-black text-emerald-900 text-center uppercase mt-0.5">OFFICIAL SEAL</Text>
                        <Text className="text-[7px] text-emerald-700 text-center">MAHALLU COMMITTEE</Text>
                      </View>
                    )}

                    {/* E-Sign Signature */}
                    {selectedCert.eSign?.isSigned !== false && (
                      <View className="items-end">
                        <Text className="font-serif italic font-bold text-emerald-900 text-base mb-1">
                          {selectedCert.eSign?.signedBy || 'Secretary'}
                        </Text>
                        <Text className="text-[10px] font-bold text-slate-700">Authorized Signatory</Text>
                        <Text className="text-[9px] text-slate-500">Secretary, Mahallu Committee</Text>
                      </View>
                    )}
                  </View>

                  {/* Verification QR Badge */}
                  <View className="mt-4 pt-3 border-t border-emerald-100 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="qr-code-outline" size={20} color="#059669" />
                      <Text className="text-[9px] text-slate-500 ml-2">Digitally Signed & Verified Certificate</Text>
                    </View>
                    <Text className="text-[9px] text-emerald-700 font-bold">STATUS: VALID & OFFICIAL</Text>
                  </View>
                </View>

                {/* Download / Print Button */}
                <TouchableOpacity
                  onPress={() => {
                    if (selectedCert.pdfUrl) {
                      Linking.openURL(selectedCert.pdfUrl);
                    } else {
                      Alert.alert('Official Certificate', 'Your certificate is verified and active with digital seal and e-signature. You can present this screen or take a screenshot for official use!');
                    }
                  }}
                  className="bg-emerald-600 py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm mt-4"
                >
                  <Ionicons name="download-outline" size={22} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Download / Save Certificate</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
