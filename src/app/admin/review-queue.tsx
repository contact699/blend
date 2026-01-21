import { View, Text, Pressable, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Check,
  Ban,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  TrendingUp,
} from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import { SuspiciousAccountReport } from '@/lib/types/trust-signals';

export default function ReviewQueueScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'high' | 'critical'>('pending');
  const [reports, setReports] = useState<SuspiciousAccountReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<SuspiciousAccountReport | null>(null);

  useEffect(() => {
    loadReports();
  }, [activeFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase query
      // const query = supabase
      //   .from('suspicious_account_reports')
      //   .select('*, reported_user:users!suspicious_account_reports_reported_user_id_fkey(id, profile:profiles(*))')
      //   .order('created_at', { ascending: false });
      //
      // if (activeFilter !== 'all') {
      //   if (activeFilter === 'pending') {
      //     query.eq('status', 'pending');
      //   } else {
      //     query.eq('severity', activeFilter);
      //   }
      // }
      //
      // const { data } = await query;

      // Mock data
      const mockReports: SuspiciousAccountReport[] = [
        {
          id: '1',
          reported_user_id: 'user1',
          report_type: 'ai_flagged',
          severity: 'critical',
          reason: 'Photo consistency check failed',
          details: {
            confidence: 95,
            same_person: false,
            faces_detected: 3,
            suspicious_patterns: ['Different people in photos', 'AI-generated images detected'],
          },
          status: 'pending',
          assigned_to: null,
          resolution: null,
          resolved_at: null,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          reported_user_id: 'user2',
          report_type: 'pattern_detected',
          severity: 'high',
          reason: 'Bot-like messaging patterns detected',
          details: {
            bot_probability: 85,
            messages_analyzed: 45,
            suspicious_patterns: [
              'Identical message sent 8 times',
              'Suspiciously fast response times (avg < 10 seconds)',
            ],
          },
          status: 'pending',
          assigned_to: null,
          resolution: null,
          resolved_at: null,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          reported_user_id: 'user3',
          report_type: 'ai_flagged',
          severity: 'medium',
          reason: 'Profile text contains scam indicators',
          details: {
            scam_probability: 70,
            flagged_phrases: ['send money', 'bitcoin', 'investment opportunity'],
          },
          status: 'pending',
          assigned_to: null,
          resolution: null,
          resolved_at: null,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reportId: string) => {
    haptics.success();

    Alert.alert('Approve Account?', 'Mark this account as safe and dismiss the report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          try {
            // TODO: Update database
            // await supabase
            //   .from('suspicious_account_reports')
            //   .update({
            //     status: 'resolved',
            //     resolution: 'Reviewed by moderator - account is legitimate',
            //     resolved_at: new Date().toISOString(),
            //   })
            //   .eq('id', reportId);

            loadReports();
          } catch (error) {
            console.error('Failed to approve:', error);
            Alert.alert('Error', 'Failed to approve account');
          }
        },
      },
    ]);
  };

  const handleBan = async (reportId: string) => {
    haptics.warning();

    Alert.alert(
      'Ban Account?',
      'This will permanently ban the user and remove their profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Ban user and update report
              // 1. Mark user as banned
              // 2. Delete profile
              // 3. Update report status

              loadReports();
            } catch (error) {
              console.error('Failed to ban:', error);
              Alert.alert('Error', 'Failed to ban account');
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (reportId: string) => {
    haptics.tap();
    // TODO: Navigate to user profile for review
    console.log('View profile:', reportId);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'ai_flagged':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'pattern_detected':
        return <TrendingUp size={20} color="#ef4444" />;
      case 'user_reported':
        return <MessageSquare size={20} color="#3b82f6" />;
      default:
        return <AlertTriangle size={20} color="#6b7280" />;
    }
  };

  const renderReportCard = (report: SuspiciousAccountReport) => {
    const severityColor = getSeverityColor(report.severity);

    return (
      <View
        key={report.id}
        className="bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            {getReportIcon(report.report_type)}
            <View
              className="px-3 py-1 rounded-full ml-2"
              style={{ backgroundColor: `${severityColor}20` }}
            >
              <Text className="font-bold text-xs uppercase" style={{ color: severityColor }}>
                {report.severity}
              </Text>
            </View>
          </View>

          <Text className="text-gray-500 text-xs">
            {new Date(report.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* User Info */}
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
            className="w-12 h-12 rounded-full"
          />
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold">User Name</Text>
            <Text className="text-gray-400 text-sm">User ID: {report.reported_user_id.substring(0, 8)}</Text>
          </View>
        </View>

        {/* Reason */}
        <View className="bg-zinc-800/50 rounded-xl p-3 mb-3">
          <Text className="text-white font-semibold mb-1">{report.reason}</Text>
          {report.details && (
            <View className="mt-2">
              {Array.isArray(report.details.suspicious_patterns) && (
                <View className="space-y-1">
                  {report.details.suspicious_patterns.map((pattern: string, index: number) => (
                    <Text key={index} className="text-gray-400 text-sm">
                      • {pattern}
                    </Text>
                  ))}
                </View>
              )}
              {report.details.confidence && (
                <Text className="text-purple-400 text-sm mt-2">
                  Confidence: {report.details.confidence}%
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => handleViewProfile(report.id)}
            className="flex-1 bg-zinc-800 py-3 rounded-xl items-center"
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <View className="flex-row items-center">
              <Eye size={18} color="#9ca3af" />
              <Text className="text-gray-300 font-semibold ml-2">View</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleApprove(report.id)}
            className="flex-1 rounded-xl overflow-hidden"
            accessibilityRole="button"
            accessibilityLabel="Approve account"
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <View className="flex-row items-center">
                <Check size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Approve</Text>
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => handleBan(report.id)}
            className="flex-1 bg-red-500 py-3 rounded-xl items-center"
            accessibilityRole="button"
            accessibilityLabel="Ban account"
          >
            <View className="flex-row items-center">
              <Ban size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Ban</Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-zinc-800">
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Review Queue</Text>
              <Text className="text-gray-400 text-sm mt-0.5">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} pending
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <X size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Filters */}
          <View className="px-5 py-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row space-x-2">
                {[
                  { key: 'pending' as const, label: 'Pending' },
                  { key: 'critical' as const, label: 'Critical' },
                  { key: 'high' as const, label: 'High' },
                  { key: 'all' as const, label: 'All' },
                ].map((filter) => (
                  <Pressable
                    key={filter.key}
                    onPress={() => {
                      haptics.tap();
                      setActiveFilter(filter.key);
                    }}
                    className={`px-4 py-2 rounded-full ${
                      activeFilter === filter.key
                        ? 'bg-purple-500'
                        : 'bg-zinc-900/50 border border-zinc-800'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}`}
                  >
                    <Text
                      className={`font-semibold ${
                        activeFilter === filter.key ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Reports List */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator color="white" size="large" />
              </View>
            ) : reports.length === 0 ? (
              <View className="py-20 items-center">
                <Check size={48} color="#10b981" />
                <Text className="text-gray-400 text-center mt-4">
                  No reports to review
                </Text>
                <Text className="text-gray-500 text-sm text-center mt-2 px-8">
                  All clear! Check back later.
                </Text>
              </View>
            ) : (
              reports.map(renderReportCard)
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
