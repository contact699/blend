import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface VerificationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export default function VerifySetup() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, warnings: 0 });

  const verifyTables = async () => {
    const results: VerificationResult[] = [];

    const tables = [
      'users',
      'profiles',
      'photos',
      'likes',
      'matches',
      'chat_threads',
      'messages',
      'partner_links',
      'sti_records',
      'events',
      'event_rsvps',
      'trust_scores',
      'blocked_users',
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);

        if (error) {
          results.push({
            category: 'Tables',
            item: table,
            status: 'fail',
            message: error.message,
          });
        } else {
          results.push({
            category: 'Tables',
            item: table,
            status: 'pass',
            message: 'Exists',
          });
        }
      } catch (err) {
        results.push({
          category: 'Tables',
          item: table,
          status: 'fail',
          message: 'Error checking',
        });
      }
    }

    return results;
  };

  const verifyStorage = async () => {
    const results: VerificationResult[] = [];

    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        results.push({
          category: 'Storage',
          item: 'photos bucket',
          status: 'fail',
          message: error.message,
        });
      } else {
        const photosBucket = buckets?.find(b => b.name === 'photos');

        if (!photosBucket) {
          results.push({
            category: 'Storage',
            item: 'photos bucket',
            status: 'fail',
            message: 'Bucket not found',
          });
        } else {
          results.push({
            category: 'Storage',
            item: 'photos bucket',
            status: 'pass',
            message: `Exists (${photosBucket.public ? 'PUBLIC' : 'PRIVATE'})`,
          });

          if (photosBucket.public) {
            results.push({
              category: 'Storage',
              item: 'bucket privacy',
              status: 'warn',
              message: 'Should be PRIVATE',
            });
          }
        }
      }
    } catch (err) {
      results.push({
        category: 'Storage',
        item: 'photos bucket',
        status: 'fail',
        message: 'Error checking',
      });
    }

    return results;
  };

  const verifyPushNotifications = async () => {
    const results: VerificationResult[] = [];

    try {
      const { error } = await supabase.from('users').select('push_token').limit(1);

      if (error) {
        results.push({
          category: 'Push Notifications',
          item: 'push_token column',
          status: 'fail',
          message: 'Column missing',
        });
      } else {
        results.push({
          category: 'Push Notifications',
          item: 'push_token column',
          status: 'pass',
          message: 'Column exists',
        });
      }

      const { error: prefError } = await supabase
        .from('notification_preferences')
        .select('id')
        .limit(1);

      if (prefError) {
        results.push({
          category: 'Push Notifications',
          item: 'notification_preferences',
          status: 'fail',
          message: 'Table missing',
        });
      } else {
        results.push({
          category: 'Push Notifications',
          item: 'notification_preferences',
          status: 'pass',
          message: 'Table exists',
        });
      }
    } catch (err) {
      results.push({
        category: 'Push Notifications',
        item: 'configuration',
        status: 'fail',
        message: 'Error checking',
      });
    }

    return results;
  };

  const runVerification = async () => {
    setIsVerifying(true);
    setResults([]);

    const allResults: VerificationResult[] = [];

    const tableResults = await verifyTables();
    allResults.push(...tableResults);

    const storageResults = await verifyStorage();
    allResults.push(...storageResults);

    const pushResults = await verifyPushNotifications();
    allResults.push(...pushResults);

    setResults(allResults);

    const passed = allResults.filter(r => r.status === 'pass').length;
    const failed = allResults.filter(r => r.status === 'fail').length;
    const warnings = allResults.filter(r => r.status === 'warn').length;

    setSummary({ passed, failed, warnings });
    setIsVerifying(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'fail':
        return <XCircle size={20} color="#ef4444" />;
      case 'warn':
        return <AlertCircle size={20} color="#eab308" />;
      default:
        return null;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, VerificationResult[]>);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-xl">Setup Verification</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Instructions */}
        <View className="py-6">
          <Text className="text-white text-lg font-semibold mb-2">
            Verify Supabase Configuration
          </Text>
          <Text className="text-zinc-400 text-sm leading-6">
            This will check if all database tables and storage buckets are properly configured.
            Run this after deploying your schema files to Supabase.
          </Text>
        </View>

        {/* Run Verification Button */}
        {!isVerifying && results.length === 0 && (
          <Pressable
            onPress={runVerification}
            className="bg-purple-500 rounded-xl py-4 items-center mb-6"
          >
            <Text className="text-white font-semibold text-lg">Run Verification</Text>
          </Pressable>
        )}

        {/* Loading */}
        {isVerifying && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="text-zinc-400 mt-4">Verifying setup...</Text>
          </View>
        )}

        {/* Results */}
        {!isVerifying && results.length > 0 && (
          <>
            {/* Summary */}
            <View className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
              <Text className="text-white font-semibold text-lg mb-4">Summary</Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-green-500 text-3xl font-bold">{summary.passed}</Text>
                  <Text className="text-zinc-400 text-sm mt-1">Passed</Text>
                </View>
                <View className="items-center">
                  <Text className="text-red-500 text-3xl font-bold">{summary.failed}</Text>
                  <Text className="text-zinc-400 text-sm mt-1">Failed</Text>
                </View>
                <View className="items-center">
                  <Text className="text-yellow-500 text-3xl font-bold">{summary.warnings}</Text>
                  <Text className="text-zinc-400 text-sm mt-1">Warnings</Text>
                </View>
              </View>
            </View>

            {/* Grouped Results */}
            {Object.entries(groupedResults).map(([category, items]) => (
              <View key={category} className="mb-6">
                <Text className="text-white font-semibold text-lg mb-3">{category}</Text>
                <View className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  {items.map((result, index) => (
                    <View
                      key={`${result.item}-${index}`}
                      className={`flex-row items-center p-4 ${
                        index < items.length - 1 ? 'border-b border-zinc-800' : ''
                      }`}
                    >
                      <View className="mr-3">{getStatusIcon(result.status)}</View>
                      <View className="flex-1">
                        <Text className="text-white font-medium">{result.item}</Text>
                        <Text className="text-zinc-400 text-sm mt-1">{result.message}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Actions */}
            <View className="pb-6">
              <Pressable
                onPress={runVerification}
                className="bg-zinc-800 rounded-xl py-4 items-center mb-3"
              >
                <Text className="text-white font-semibold">Run Again</Text>
              </Pressable>

              {summary.failed > 0 && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <Text className="text-red-500 font-semibold mb-2">⚠️ Setup Incomplete</Text>
                  <Text className="text-red-400 text-sm leading-6">
                    Some checks failed. Please run the schema files in Supabase SQL Editor:
                    {'\n\n'}
                    1. schema.sql (core tables)
                    {'\n'}
                    2. events-schema.sql (events)
                    {'\n'}
                    3. push-notifications-schema.sql (push)
                    {'\n\n'}
                    And create "photos" storage bucket (PRIVATE).
                  </Text>
                </View>
              )}

              {summary.failed === 0 && summary.warnings === 0 && (
                <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <Text className="text-green-500 font-semibold mb-2">✅ All Checks Passed!</Text>
                  <Text className="text-green-400 text-sm">
                    Your Supabase setup is complete. All features should work properly.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
