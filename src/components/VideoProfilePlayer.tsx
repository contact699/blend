import { View, Pressable, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@/lib/haptics';

interface VideoProfilePlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  autoPlay?: boolean;
  className?: string;
  onPress?: () => void;
}

export default function VideoProfilePlayer({
  videoUrl,
  thumbnailUrl,
  autoPlay = false,
  className = '',
  onPress,
}: VideoProfilePlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (autoPlay) {
      playVideo();
    }
  }, [autoPlay]);

  const playVideo = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play video:', error);
      setHasError(true);
    }
  };

  const pauseVideo = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to pause video:', error);
    }
  };

  const togglePlayPause = () => {
    haptics.tap();
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  const toggleMute = () => {
    haptics.tap();
    setIsMuted(!isMuted);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Video error:', status.error);
        setHasError(true);
      }
      return;
    }

    setIsLoading(false);
    setIsPlaying(status.isPlaying);

    // Loop video
    if (status.didJustFinish && !status.isLooping) {
      videoRef.current?.replayAsync();
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      togglePlayPause();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`relative rounded-2xl overflow-hidden bg-zinc-900 ${className}`}
      accessibilityRole="button"
      accessibilityLabel="Video profile"
      accessibilityHint="Tap to play or pause"
    >
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        posterSource={{ uri: thumbnailUrl }}
        usePoster
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={isMuted}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay={autoPlay}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View
          style={{ position: 'absolute', inset: 0 }}
          className="items-center justify-center bg-black/50"
        >
          <ActivityIndicator color="white" size="large" />
        </View>
      )}

      {/* Error overlay */}
      {hasError && (
        <View
          style={{ position: 'absolute', inset: 0 }}
          className="items-center justify-center bg-black/70"
        >
          <Text className="text-white text-center px-4">Failed to load video</Text>
        </View>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && !isLoading && (
        <View style={{ position: 'absolute', inset: 0 }} className="items-center justify-center">
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={{ position: 'absolute', inset: 0 }}
          />
          <View className="w-16 h-16 bg-white/30 rounded-full items-center justify-center">
            <Play size={32} color="white" fill="white" />
          </View>
        </View>
      )}

      {/* Mute/Unmute button */}
      {isPlaying && (
        <Pressable
          onPress={toggleMute}
          style={{ position: 'absolute', top: 12, right: 12 }}
          className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX size={18} color="white" />
          ) : (
            <Volume2 size={18} color="white" />
          )}
        </Pressable>
      )}

      {/* Gradient overlay for better text visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%' }}
        pointerEvents="none"
      />
    </Pressable>
  );
}
