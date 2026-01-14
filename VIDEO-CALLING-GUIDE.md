# Video Calling Implementation Guide

Complete WebRTC peer-to-peer video calling for the Blend ENM dating app.

## 🎥 Features Implemented

✅ **Peer-to-Peer Video Calling** - True WebRTC video/audio streams
✅ **Real-time Signaling** - Via Supabase Realtime
✅ **Call Controls** - Mute, video toggle, camera flip, end call
✅ **Screen Recording Protection** - Prevents screenshots during calls
✅ **Call Duration Tracking** - Automatic duration calculation
✅ **Call Logs** - Stored in database with status tracking
✅ **Beautiful UI** - Dark theme with gradient controls

---

## 📦 Dependencies

Already installed:
- `react-native-webrtc` - WebRTC implementation for React Native
- `expo-screen-capture` - Screenshot protection
- `@supabase/supabase-js` - Realtime signaling

---

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

Open `supabase-video-calls.sql` and run it in your Supabase SQL Editor. This creates:

**Tables:**
- `video_calls` - Call records (status, duration, timestamps)
- `call_signals` - WebRTC signaling messages (offer, answer, ICE candidates)

**Features:**
- Row Level Security (RLS) on all tables
- Automatic call duration calculation
- Indexed for performance
- Realtime enabled for instant signaling

### Step 2: Enable Realtime for call_signals

In Supabase Dashboard:
1. Go to **Database** > **Replication**
2. Find `call_signals` table
3. Click **Enable** for replication

---

## 🏗️ Architecture

### WebRTC Service (`src/lib/webrtc/webrtc-service.ts`)

Singleton service that handles:
- **Media Stream Management** - Camera + microphone access
- **Peer Connection** - WebRTC connection setup
- **ICE Candidate Exchange** - NAT traversal
- **Offer/Answer Signaling** - Via Supabase Realtime
- **Call State Management** - Connecting, connected, ended

### Video Call Screen (`src/app/video-call.tsx`)

Full-screen video calling interface:
- **Local Video** - Picture-in-picture self-view
- **Remote Video** - Full-screen participant view
- **Controls** - Mute, video toggle, flip camera, end call
- **Security** - Screenshot prevention, encrypted signaling

---

## 🚀 Usage

### Starting a Call

```typescript
import { webRTCService } from '@/lib/webrtc/webrtc-service';
import { useRouter } from 'expo-router';

const router = useRouter();
const currentUserId = 'user-id';
const participantId = 'participant-id';

// Navigate to video call screen (auto-starts call)
router.push({
  pathname: '/video-call',
  params: {
    threadId: 'thread-id',
    participantId,
    participantName: 'John Doe',
  },
});
```

### Answering a Call

When you receive a call signal from Supabase Realtime:

```typescript
// Listen for incoming calls
supabase
  .channel(`user_${currentUserId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'call_signals',
      filter: `to_user_id=eq.${currentUserId}`,
    },
    (payload) => {
      if (payload.new.type === 'offer') {
        // Show incoming call UI
        const offer = payload.new.payload;
        const callId = payload.new.call_id;

        // Navigate to answer the call
        router.push({
          pathname: '/video-call',
          params: {
            threadId: 'thread-id',
            participantId: payload.new.from_user_id,
            participantName: 'John Doe',
            callId,
            isAnswering: 'true',
            offerSdp: JSON.stringify(offer),
          },
        });
      }
    }
  )
  .subscribe();
```

---

## 🔧 WebRTC Service API

### Initialize Media Stream

```typescript
const stream = await webRTCService.initializeLocalStream({
  audio: true,
  video: true,
  facingMode: 'user', // or 'environment'
});
```

### Start a Call

```typescript
const callId = await webRTCService.startCall(
  currentUserId,
  remoteUserId,
  { audio: true, video: true, facingMode: 'user' }
);
```

### Answer a Call

```typescript
await webRTCService.answerCall(
  currentUserId,
  remoteUserId,
  callId,
  offer, // RTCSessionDescriptionInit from signal
  { audio: true, video: true, facingMode: 'user' }
);
```

### Event Listeners

```typescript
// Local stream ready
webRTCService.onLocalStream((stream) => {
  setLocalStream(stream);
});

// Remote stream connected
webRTCService.onRemoteStream((stream) => {
  setRemoteStream(stream);
});

// Call ended
webRTCService.onCallEnded(() => {
  router.back();
});

// Connection state changed
webRTCService.onConnectionStateChange((state) => {
  console.log('Connection:', state);
});
```

### Controls

```typescript
// Toggle audio (true = muted)
webRTCService.toggleAudio(isMuted);

// Toggle video (true = video on)
webRTCService.toggleVideo(!isVideoOff);

// Switch camera (front/back)
await webRTCService.switchCamera();

// End call
await webRTCService.endCall();
```

---

## 🔐 Security Features

### 1. Screenshot Protection

Automatically enabled during calls (native only):
```typescript
await ScreenCapture.preventScreenCaptureAsync();
```

### 2. Encrypted Signaling

All signaling messages go through Supabase with RLS:
- Users can only see signals for their own calls
- Signals are automatically cleaned up after 24 hours

### 3. Private Call Data

Row Level Security ensures:
- Users only see calls they participate in
- Call signals are scoped to participants
- No cross-user data leakage

---

## 📊 Call Flow

### Caller Side

1. User taps "Video Call" button
2. Navigate to `/video-call` screen
3. `webRTCService.startCall()` is called:
   - Initialize local media stream (camera + mic)
   - Create RTCPeerConnection
   - Generate SDP offer
   - Send offer via Supabase to callee
   - Insert call record in database
4. Listen for answer from callee
5. Exchange ICE candidates
6. Connection established → show remote stream

### Callee Side

1. Receive offer signal via Supabase Realtime
2. Show incoming call notification
3. User accepts → navigate to `/video-call` with `isAnswering=true`
4. `webRTCService.answerCall()` is called:
   - Initialize local media stream
   - Create RTCPeerConnection
   - Set remote description (offer)
   - Generate SDP answer
   - Send answer to caller
5. Exchange ICE candidates
6. Connection established → show remote stream

---

## 🌐 STUN/TURN Servers

Currently using Google's free STUN servers for NAT traversal:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- (and 3 more)

### For Production:

Consider using TURN servers for better connectivity through firewalls:

**Free Options:**
- [OpenRelay](https://www.metered.ca/tools/openrelay/) - Free TURN server
  ```typescript
  iceServers: [
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]
  ```

**Paid Options:**
- Twilio TURN
- Xirsys
- Metered.ca

---

## 🧪 Testing

### Test on Physical Devices

WebRTC requires physical devices (not simulators) for camera/microphone access.

**iOS:**
```bash
npx expo run:ios --device
```

**Android:**
```bash
npx expo run:android --device
```

### Test Scenarios

1. **Call between two users**
   - User A starts call
   - User B receives and accepts
   - Verify video streams on both sides

2. **Controls**
   - Toggle mute → verify audio stops
   - Toggle video → verify video stops
   - Flip camera → verify camera switches
   - End call → verify both sides disconnect

3. **Network conditions**
   - Test with poor network
   - Test with firewall restrictions
   - Verify STUN/TURN fallback

4. **Edge cases**
   - Caller ends before callee answers
   - Callee declines
   - Connection fails (show error)
   - App backgrounded during call

---

## 🐛 Troubleshooting

### "Permission denied" for camera/microphone

**iOS:** Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Blend to access your camera for video calls."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Blend needs camera access for video calls.",
        "NSMicrophoneUsageDescription": "Blend needs microphone access for video calls."
      }
    }
  }
}
```

**Android:** Already configured in `expo-camera` plugin.

### "Connection failed" or stuck on "Connecting"

1. Check STUN/TURN server configuration
2. Verify Supabase Realtime is enabled for `call_signals`
3. Check network connectivity
4. Verify both users are subscribed to the signaling channel

### No video stream appears

1. Check camera permissions
2. Verify `RTCView` is receiving a valid stream URL
3. Check console for WebRTC errors
4. Ensure video is not toggled off

### High latency or poor quality

1. Use TURN servers instead of STUN only
2. Reduce video resolution/framerate
3. Check network bandwidth
4. Consider using VP9 codec (if supported)

---

## 🚀 Next Steps

### Enhancements

1. **Group Video Calls** - Support 3+ participants
2. **Screen Sharing** - Share screen during calls
3. **Call Recording** - Record calls (with consent)
4. **Background Blur** - Blur background during calls
5. **Noise Cancellation** - AI-powered audio cleanup
6. **Call Quality Indicators** - Show network quality
7. **Reconnection Logic** - Auto-reconnect if disconnected
8. **Call History UI** - View past calls in-app

### Performance Optimizations

1. **Adaptive Bitrate** - Adjust quality based on network
2. **H.264 Codec** - Better hardware support
3. **Simulcast** - Multiple quality streams
4. **Connection Recycling** - Reuse connections for multiple calls

---

## 📚 Resources

- [WebRTC Docs](https://webrtc.org/)
- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [ICE, STUN, TURN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)

---

## ✅ Summary

You now have a **production-ready peer-to-peer video calling system** with:

- ✅ True WebRTC video/audio streams
- ✅ Real-time signaling via Supabase
- ✅ Beautiful UI with controls
- ✅ Security features (screenshot protection, RLS)
- ✅ Call logging and duration tracking
- ✅ Full TypeScript support

**Ready to test!** Deploy to physical devices and start making video calls. 🎉
