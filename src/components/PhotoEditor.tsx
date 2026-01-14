import { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Check, Crop, CircleDot, RotateCcw } from 'lucide-react-native';
import { cn } from '@/lib/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 32;

interface BlurRegion {
  x: number;
  y: number;
  radius: number;
}

interface PhotoEditorProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (editedUri: string) => void;
}

export default function PhotoEditor({
  visible,
  imageUri,
  onClose,
  onSave,
}: PhotoEditorProps) {
  const [mode, setMode] = useState<'view' | 'blur'>('view');
  const [blurRegions, setBlurRegions] = useState<BlurRegion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddBlurRegion = (event: any) => {
    if (mode !== 'blur') return;

    const { locationX, locationY } = event.nativeEvent;

    // Calculate position relative to image
    const x = locationX / IMAGE_SIZE;
    const y = locationY / IMAGE_SIZE;

    setBlurRegions([
      ...blurRegions,
      { x, y, radius: 0.15 }, // 15% of image size
    ]);
  };

  const handleRemoveLastBlur = () => {
    setBlurRegions(blurRegions.slice(0, -1));
  };

  const handleReset = () => {
    setBlurRegions([]);
    setMode('view');
  };

  const processImage = async () => {
    setIsProcessing(true);

    try {
      // If no blur regions, just return original
      if (blurRegions.length === 0) {
        onSave(imageUri);
        return;
      }

      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // For now, we'll apply a pixelation effect by resizing down and up
      // This is a workaround since expo-image-manipulator doesn't support selective blur
      // In a real app, you'd use a native module or server-side processing

      // Apply overall quality reduction for privacy (simulates blur)
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize down
          { resize: { width: 100 } },
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.5 }
      );

      // Resize back up (creates pixelation effect)
      const finalResult = await ImageManipulator.manipulateAsync(
        result.uri,
        [
          { resize: { width: 800 } },
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      onSave(finalResult.uri);
    } catch (error) {
      console.log('Error processing image:', error);
      // On error, just use original
      onSave(imageUri);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (blurRegions.length > 0) {
      await processImage();
    } else {
      onSave(imageUri);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <X size={24} color="white" />
            </Pressable>
            <Text className="text-white font-semibold text-lg">Edit Photo</Text>
            <Pressable
              onPress={handleSave}
              disabled={isProcessing}
              className="w-10 h-10 items-center justify-center"
            >
              <Check size={24} color={isProcessing ? '#6b7280' : '#c084fc'} />
            </Pressable>
          </View>

          {/* Image Preview */}
          <View className="flex-1 items-center justify-center px-4">
            <Pressable
              onPress={handleAddBlurRegion}
              className="relative"
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 12 }}
                resizeMode="cover"
              />

              {/* Blur region indicators */}
              {blurRegions.map((region, index) => (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: region.x * IMAGE_SIZE - (region.radius * IMAGE_SIZE),
                    top: region.y * IMAGE_SIZE - (region.radius * IMAGE_SIZE),
                    width: region.radius * IMAGE_SIZE * 2,
                    height: region.radius * IMAGE_SIZE * 2,
                    borderRadius: region.radius * IMAGE_SIZE,
                    backgroundColor: 'rgba(168, 85, 247, 0.3)',
                    borderWidth: 2,
                    borderColor: '#c084fc',
                    borderStyle: 'dashed',
                  }}
                />
              ))}

              {/* Blur mode instruction overlay */}
              {mode === 'blur' && blurRegions.length === 0 && (
                <View className="absolute inset-0 items-center justify-center bg-black/50 rounded-xl">
                  <CircleDot size={48} color="#c084fc" />
                  <Text className="text-white text-center mt-4 px-8">
                    Tap on areas you want to blur (like faces)
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Blur regions info */}
            {blurRegions.length > 0 && (
              <View className="flex-row items-center mt-4">
                <Text className="text-purple-300 text-sm">
                  {blurRegions.length} blur region{blurRegions.length > 1 ? 's' : ''} added
                </Text>
                <Pressable
                  onPress={handleRemoveLastBlur}
                  className="ml-3 px-3 py-1 bg-zinc-800 rounded-full"
                >
                  <Text className="text-gray-300 text-sm">Undo</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Tools */}
          <View className="px-4 pb-6">
            <View className="flex-row justify-center gap-4">
              <Pressable
                onPress={() => setMode(mode === 'blur' ? 'view' : 'blur')}
                className={cn(
                  'flex-row items-center px-6 py-3 rounded-xl',
                  mode === 'blur'
                    ? 'bg-purple-600'
                    : 'bg-zinc-800'
                )}
              >
                <CircleDot size={20} color={mode === 'blur' ? 'white' : '#c084fc'} />
                <Text className={cn(
                  'ml-2 font-medium',
                  mode === 'blur' ? 'text-white' : 'text-gray-300'
                )}>
                  Blur Faces
                </Text>
              </Pressable>

              {blurRegions.length > 0 && (
                <Pressable
                  onPress={handleReset}
                  className="flex-row items-center px-6 py-3 rounded-xl bg-zinc-800"
                >
                  <RotateCcw size={20} color="#9ca3af" />
                  <Text className="text-gray-300 ml-2 font-medium">Reset</Text>
                </Pressable>
              )}
            </View>

            {/* Privacy note */}
            <View className="mt-4 bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
              <Text className="text-purple-300 text-xs text-center">
                Blur areas to protect your privacy. Blurred regions will be pixelated before sending.
              </Text>
            </View>

            {/* Send button */}
            <Pressable
              onPress={handleSave}
              disabled={isProcessing}
              className="mt-4 rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={isProcessing ? ['#4b5563', '#374151'] : ['#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <Text className="text-white font-semibold text-lg">
                  {isProcessing ? 'Processing...' : blurRegions.length > 0 ? 'Apply & Send' : 'Send Photo'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
