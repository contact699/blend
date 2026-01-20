/**
 * Verification Script - Run this to check if Supabase is properly configured
 *
 * Usage: bun run verify-setup.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  const lines = envFile.split('\n');

  for (const line of lines) {
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
      SUPABASE_ANON_KEY = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('❌ Could not read .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface VerificationResult {
  category: string;
  item: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
}

const results: VerificationResult[] = [];

async function verifyTables() {
  console.log('\n📊 Verifying Database Tables...\n');

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
    'date_reviews',
    'community_vouches',
    'blocked_users',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);

      if (error) {
        results.push({
          category: 'Tables',
          item: table,
          status: '❌',
          message: error.message,
        });
      } else {
        results.push({
          category: 'Tables',
          item: table,
          status: '✅',
          message: 'Table exists and accessible',
        });
      }
    } catch (err) {
      results.push({
        category: 'Tables',
        item: table,
        status: '❌',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}

async function verifyStorageBucket() {
  console.log('\n📦 Verifying Storage Bucket...\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      results.push({
        category: 'Storage',
        item: 'photos bucket',
        status: '❌',
        message: error.message,
      });
      return;
    }

    const photosBucket = buckets?.find(b => b.name === 'photos');

    if (!photosBucket) {
      results.push({
        category: 'Storage',
        item: 'photos bucket',
        status: '❌',
        message: 'Bucket does not exist - create it in Supabase Dashboard',
      });
    } else {
      results.push({
        category: 'Storage',
        item: 'photos bucket',
        status: '✅',
        message: `Bucket exists (${photosBucket.public ? 'PUBLIC' : 'PRIVATE'})`,
      });

      // Check if bucket is properly configured as private
      if (photosBucket.public) {
        results.push({
          category: 'Storage',
          item: 'bucket privacy',
          status: '⚠️',
          message: 'Bucket should be PRIVATE for security',
        });
      }
    }
  } catch (err) {
    results.push({
      category: 'Storage',
      item: 'photos bucket',
      status: '❌',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

async function verifyPushNotificationColumns() {
  console.log('\n🔔 Verifying Push Notification Setup...\n');

  try {
    // Try to query push_token column
    const { error } = await supabase
      .from('users')
      .select('push_token')
      .limit(1);

    if (error) {
      results.push({
        category: 'Push Notifications',
        item: 'push_token column',
        status: '❌',
        message: 'Column does not exist - run push-notifications-schema.sql',
      });
    } else {
      results.push({
        category: 'Push Notifications',
        item: 'push_token column',
        status: '✅',
        message: 'Column exists in users table',
      });
    }

    // Check notification_preferences table
    const { error: prefError } = await supabase
      .from('notification_preferences')
      .select('id')
      .limit(1);

    if (prefError) {
      results.push({
        category: 'Push Notifications',
        item: 'notification_preferences table',
        status: '❌',
        message: 'Table does not exist',
      });
    } else {
      results.push({
        category: 'Push Notifications',
        item: 'notification_preferences table',
        status: '✅',
        message: 'Table exists',
      });
    }
  } catch (err) {
    results.push({
      category: 'Push Notifications',
      item: 'configuration',
      status: '❌',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SUPABASE SETUP VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const grouped = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, VerificationResult[]>);

  for (const [category, items] of Object.entries(grouped)) {
    console.log(`\n📁 ${category}`);
    console.log('-'.repeat(80));

    for (const item of items) {
      console.log(`  ${item.status} ${item.item.padEnd(30)} ${item.message}`);
    }
  }

  // Summary
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  const warnings = results.filter(r => r.status === '⚠️').length;

  console.log('\n' + '='.repeat(80));
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    console.log('❌ Some checks failed. Please fix the issues above.\n');
    console.log('Common fixes:');
    console.log('  1. Run schema.sql in Supabase SQL Editor');
    console.log('  2. Run events-schema.sql in Supabase SQL Editor');
    console.log('  3. Run push-notifications-schema.sql in Supabase SQL Editor');
    console.log('  4. Create "photos" bucket in Supabase Storage (set to PRIVATE)');
    console.log('');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Setup complete with warnings. Review the warnings above.\n');
    process.exit(0);
  } else {
    console.log('✅ All checks passed! Your Supabase setup is complete.\n');
    process.exit(0);
  }
}

async function main() {
  console.log('🚀 Starting Supabase setup verification...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  await verifyTables();
  await verifyStorageBucket();
  await verifyPushNotificationColumns();
  await printResults();
}

main();
