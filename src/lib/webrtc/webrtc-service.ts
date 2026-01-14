// WebRTC Service for Peer-to-Peer Video Calling
// Handles ICE candidates, offer/answer signaling, and media streams

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
  RTCView,
} from 'react-native-webrtc';
import { supabase } from '@/lib/supabase';

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export interface CallConfig {
  audio: boolean;
  video: boolean;
  facingMode: 'user' | 'environment';
}

export type CallEventType = 'offer' | 'answer' | 'ice-candidate' | 'end-call';

export interface CallEvent {
  type: CallEventType;
  from_user_id: string;
  to_user_id: string;
  call_id: string;
  payload: any;
  created_at: string;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private currentUserId: string | null = null;
  private remoteUserId: string | null = null;
  private realtimeChannel: any = null;

  // Event listeners
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;
  private onConnectionStateChangeCallback: ((state: string) => void) | null = null;

  constructor() {}

  /**
   * Initialize local media stream (camera + microphone)
   */
  async initializeLocalStream(config: CallConfig = { audio: true, video: true, facingMode: 'user' }): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: config.audio,
        video: config.video ? {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 20, ideal: 30, max: 30 },
          facingMode: config.facingMode,
        } : false,
      });

      this.localStream = stream;
      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(stream);
      }

      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  /**
   * Initialize peer connection
   */
  private async initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    (this.peerConnection as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(event.streams[0]);
        }
      }
    };

    // Handle ICE candidates
    (this.peerConnection as any).onicecandidate = async (event: any) => {
      if (event.candidate && this.callId && this.remoteUserId) {
        await this.sendSignal({
          type: 'ice-candidate',
          from_user_id: this.currentUserId!,
          to_user_id: this.remoteUserId,
          call_id: this.callId,
          payload: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
          created_at: new Date().toISOString(),
        });
      }
    };

    // Handle connection state changes
    (this.peerConnection as any).onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state:', state);

      if (this.onConnectionStateChangeCallback && state) {
        this.onConnectionStateChangeCallback(state);
      }

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.handleCallEnd();
      }
    };
  }

  /**
   * Start a call (caller side)
   */
  async startCall(
    currentUserId: string,
    remoteUserId: string,
    config: CallConfig = { audio: true, video: true, facingMode: 'user' }
  ): Promise<string> {
    try {
      this.currentUserId = currentUserId;
      this.remoteUserId = remoteUserId;

      // Generate call ID
      this.callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize local stream
      await this.initializeLocalStream(config);

      // Initialize peer connection
      await this.initializePeerConnection();

      // Subscribe to signaling events
      await this.subscribeToSignaling(this.callId);

      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection!.setLocalDescription(offer);

      // Send offer to remote peer
      await this.sendSignal({
        type: 'offer',
        from_user_id: currentUserId,
        to_user_id: remoteUserId,
        call_id: this.callId,
        payload: {
          sdp: offer.sdp,
          type: offer.type,
        },
        created_at: new Date().toISOString(),
      });

      // Insert call record in database
      await supabase.from('video_calls').insert({
        id: this.callId,
        caller_id: currentUserId,
        callee_id: remoteUserId,
        status: 'ringing',
        started_at: new Date().toISOString(),
      });

      return this.callId;
    } catch (error) {
      console.error('Error starting call:', error);
      await this.endCall();
      throw error;
    }
  }

  /**
   * Answer incoming call (callee side)
   */
  async answerCall(
    currentUserId: string,
    remoteUserId: string,
    callId: string,
    offer: RTCSessionDescriptionInit,
    config: CallConfig = { audio: true, video: true, facingMode: 'user' }
  ): Promise<void> {
    try {
      this.currentUserId = currentUserId;
      this.remoteUserId = remoteUserId;
      this.callId = callId;

      // Initialize local stream
      await this.initializeLocalStream(config);

      // Initialize peer connection
      await this.initializePeerConnection();

      // Subscribe to signaling events
      await this.subscribeToSignaling(callId);

      // Set remote description (offer)
      if (!offer.sdp) {
        throw new Error('Invalid offer: missing SDP');
      }
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer as any));

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer to caller
      await this.sendSignal({
        type: 'answer',
        from_user_id: currentUserId,
        to_user_id: remoteUserId,
        call_id: callId,
        payload: {
          sdp: answer.sdp,
          type: answer.type,
        },
        created_at: new Date().toISOString(),
      });

      // Update call status
      await supabase.from('video_calls').update({
        status: 'active',
        answered_at: new Date().toISOString(),
      }).eq('id', callId);
    } catch (error) {
      console.error('Error answering call:', error);
      await this.endCall();
      throw error;
    }
  }

  /**
   * Subscribe to signaling events via Supabase Realtime
   */
  private async subscribeToSignaling(callId: string) {
    this.realtimeChannel = supabase
      .channel(`call_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `call_id=eq.${callId}`,
        },
        async (payload) => {
          const signal = payload.new as CallEvent;

          // Ignore our own signals
          if (signal.from_user_id === this.currentUserId) return;

          await this.handleSignal(signal);
        }
      )
      .subscribe();
  }

  /**
   * Send signaling message via Supabase
   */
  private async sendSignal(signal: CallEvent) {
    try {
      await supabase.from('call_signals').insert({
        type: signal.type,
        from_user_id: signal.from_user_id,
        to_user_id: signal.to_user_id,
        call_id: signal.call_id,
        payload: signal.payload,
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }

  /**
   * Handle incoming signaling messages
   */
  private async handleSignal(signal: CallEvent) {
    try {
      switch (signal.type) {
        case 'answer':
          // Caller receives answer from callee
          await this.peerConnection?.setRemoteDescription(
            new RTCSessionDescription(signal.payload)
          );
          break;

        case 'ice-candidate':
          // Both sides receive ICE candidates
          if (signal.payload) {
            await this.peerConnection?.addIceCandidate(
              new RTCIceCandidate(signal.payload)
            );
          }
          break;

        case 'end-call':
          // Call ended by remote peer
          this.handleCallEnd();
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  /**
   * End the call
   */
  async endCall() {
    try {
      // Send end-call signal
      if (this.callId && this.currentUserId && this.remoteUserId) {
        await this.sendSignal({
          type: 'end-call',
          from_user_id: this.currentUserId,
          to_user_id: this.remoteUserId,
          call_id: this.callId,
          payload: null,
          created_at: new Date().toISOString(),
        });

        // Update call status in database
        await supabase.from('video_calls').update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        }).eq('id', this.callId);
      }

      this.handleCallEnd();
    } catch (error) {
      console.error('Error ending call:', error);
      this.handleCallEnd();
    }
  }

  /**
   * Clean up resources
   */
  private handleCallEnd() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Unsubscribe from realtime
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }

    // Call callback
    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }

    // Reset state
    this.callId = null;
    this.currentUserId = null;
    this.remoteUserId = null;
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - _switchCamera is available on react-native-webrtc
        videoTrack._switchCamera();
      }
    }
  }

  // Event listener setters
  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback;
  }

  onConnectionStateChange(callback: (state: string) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  // Getters
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getCallId(): string | null {
    return this.callId;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export { RTCView };
