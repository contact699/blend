import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { Video } from 'expo-av';
import { X, Zap, Check, RotateCcw, Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@/lib/haptics';
import useSubscriptionStore from '@/lib/state/subscription-store';

const MAX_DURATION = 30; // 30 seconds

export default function RecordVideoProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const camera = useRef<Camera>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');

  const device = useCameraDevice(cameraPosition);
  const { hasPermission, requestPermission } = useCameraPermission();

  const features = useSubscriptionStore((s) => s.getFeatures());
  const tier = useSubscriptionStore((s) => s.getTier());

  // Timer for recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!camera.current) return;

    try {
      haptics.press();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start recording
      camera.current.startRecording({
        onRecordingFinished: (video) => {
          setRecordedVideo(video.path);
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          Alert.alert('Recording Error', 'Failed to record video. Please try again.');
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!camera.current || !isRecording) return;

    try {
      await camera.current.stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const retakeVideo = () => {
    haptics.tap();
    setRecordedVideo(null);
    setRecordingDuration(0);
  };

  const uploadVideo = async () => {
    if (!recordedVideo) return;

    haptics.press();
    setIsUploading(true);

    try {
      // TODO: Implement actual video upload to Supabase Storage
      // 1. Upload video file
      // 2. Generate thumbnail
      // 3. Create video_profile record
      // 4. Update user's profile

      // const formData = new FormData();
      // formData.append('video', {
      //   uri: recordedVideo,
      //   type: 'video/mp4',
      //   name: 'profile-video.mp4',
      // });
      //
      // const { data, error } = await supabase.storage
      //   .from('videos')
      //   .upload(`profiles/${userId}/${Date.now()}.mp4`, formData);

      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      haptics.success();
      Alert.alert(
        'Success!',
        'Your video profile has been uploaded and is pending moderation.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Upload failed:', error);
      haptics.warning();
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const flipCamera = () => {
    haptics.tap();
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (!hasPermission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-center px-6">
          Camera permission is required to record video profiles
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-6 bg-purple-500 px-6 py-3 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="Grant permission"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="white" size="large" />
        <Text className="text-white mt-4">Loading camera...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {recordedVideo ? (
        // Preview recorded video
        <View className="flex-1">
          <Video
            source={{ uri: recordedVideo }}
            style={{ flex: 1 }}
            resizeMode={Video.RESIZE_MODE_COVER}
            shouldPlay
            isLooping
          />

          {/* Controls overlay */}
          <View
            style={{ position: 'absolute', top: insets.top, left: 0, right: 0, paddingTop: 12 }}
          >
            <View className="px-5 flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <X size={24} color="#fff" />
              </Pressable>
              <Text className="text-white font-bold text-lg">Preview</Text>
              <View className="w-10" />
            </View>
          </View>

          {/* Bottom controls */}
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom,
              left: 0,
              right: 0,
              paddingBottom: 24,
            }}
          >
            <View className="px-5">
              <View className="flex-row items-center space-x-3">
                <Pressable
                  onPress={retakeVideo}
                  disabled={isUploading}
                  className="flex-1 bg-zinc-800 py-4 rounded-xl items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Retake video"
                >
                  <View className="flex-row items-center">
                    <RotateCcw size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Retake</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={uploadVideo}
                  disabled={isUploading}
                  className="flex-1 rounded-xl overflow-hidden"
                  accessibilityRole="button"
                  accessibilityLabel="Upload video"
                >
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      alignItems: 'center',
                      opacity: isUploading ? 0.6 : 1,
                    }}
                  >
                    {isUploading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <View className="flex-row items-center">
                        <Check size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Upload</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Camera view
        <View className="flex-1">
          <Camera
            ref={camera}
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            video={true}
            audio={true}
          />

          {/* Top controls */}
          <View
            style={{
              position: 'absolute',
              top: insets.top,
              left: 0,
              right: 0,
              paddingTop: 12,
            }}
          >
            <View className="px-5 flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <X size={24} color="#fff" />
              </Pressable>

              <View className="bg-black/50 px-4 py-2 rounded-full">
                <Text className="text-white font-bold">
                  {recordingDuration}s / {MAX_DURATION}s
                </Text>
              </View>

              <Pressable
                onPress={flipCamera}
                disabled={isRecording}
                className="w-10 h-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Flip camera"
              >
                <RotateCcw size={24} color={isRecording ? '#6b7280' : '#fff'} />
              </Pressable>
            </View>
          </View>

          {/* Instructions */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 80,
              left: 0,
              right: 0,
            }}
          >
            <View className="items-center">
              <View className="bg-black/70 px-6 py-3 rounded-full max-w-[80%]">
                <Text className="text-white text-center text-sm">
                  {isRecording
                    ? 'Recording... Tap to stop'
                    : 'Introduce yourself! Talk about your interests, relationship style, or what you are looking for.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Record button */}
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom,
              left: 0,
              right: 0,
              paddingBottom: 40,
            }}
          >
            <View className="items-center">
              <Pressable
                onPress={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full items-center justify-center ${
                  isRecording ? 'bg-red-500' : 'bg-white'
                }`}
                accessibilityRole="button"
                accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <View className="w-8 h-8 bg-white rounded" />
                ) : (
                  <View className="w-16 h-16 bg-red-500 rounded-full" />
                )}
              </Pressable>

              <Text className="text-white mt-4 font-semibold">
                {isRecording ? 'Tap to Stop' : 'Tap to Record'}
              </Text>
            </View>
          </View>

          {/* Premium badge */}
          {tier !== 'free' && (
            <View
              style={{
                position: 'absolute',
                top: insets.top + 140,
                right: 20,
              }}
            >
              <View className="bg-purple-500/90 px-3 py-2 rounded-full flex-row items-center">
                <Zap size={14} color="white" fill="white" />
                <Text className="text-white text-xs font-bold ml-1">
                  {features.video_profile_slots} slots
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
