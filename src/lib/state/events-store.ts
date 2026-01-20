import { create } from 'zustand';
import {
  Event,
  EventAttendee,
  EventDraft,
  EventFilter,
  EventNotification,
  RSVPStatus,
  EventChatThread,
  EventChatMessage,
  Profile,
} from '../types';

interface EventsStore {
  // State
  events: Event[];
  eventDrafts: EventDraft[];
  eventChats: EventChatThread[];
  eventNotifications: EventNotification[];
  userRSVPs: Record<string, RSVPStatus>;

  // Event CRUD actions
  createEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'waitlist_count' | 'attendees'>) => Event;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  cancelEvent: (eventId: string, reason: string) => void;
  duplicateEvent: (eventId: string) => Event | null;
  publishEvent: (eventId: string) => void;

  // RSVP actions
  rsvpToEvent: (currentUserId: string, currentProfile: Profile, eventId: string, status: RSVPStatus, message?: string) => void;
  cancelRSVP: (currentUserId: string, eventId: string) => void;
  approveAttendee: (eventId: string, userId: string) => void;
  declineAttendee: (eventId: string, userId: string) => void;
  promoteFromWaitlist: (eventId: string) => void;
  checkInAttendee: (eventId: string, userId: string) => void;
  removeAttendee: (eventId: string, userId: string) => void;

  // Event chat actions
  sendEventMessage: (currentUserId: string, currentProfile: Profile, eventId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'gif') => void;
  getEventChat: (eventId: string) => EventChatThread | null;

  // Event draft actions
  saveEventDraft: (currentUserId: string, draft: Omit<EventDraft, 'id' | 'user_id' | 'saved_at'>) => void;
  deleteEventDraft: (draftId: string) => void;
  loadEventDraft: (draftId: string) => EventDraft | null;

  // Event notification actions
  markEventNotificationRead: (notificationId: string) => void;
  getUnreadEventNotifications: (currentUserId: string) => EventNotification[];

  // Event helpers
  getMyHostedEvents: (currentUserId: string) => Event[];
  getMyAttendingEvents: (currentUserId: string) => Event[];
  getEventsByFilter: (filter: EventFilter) => Event[];
  getUserRSVPStatus: (eventId: string) => RSVPStatus | null;
  canHostPublicEvents: () => boolean;

  // Admin
  reset: () => void;
}

const useEventsStore = create<EventsStore>()((set, get) => ({
  events: [],
  eventDrafts: [],
  eventChats: [],
  eventNotifications: [],
  userRSVPs: {},

  createEvent: (eventData) => {
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}`,
      current_attendees: 0,
      waitlist_count: 0,
      attendees: [],
      created_at: now,
      updated_at: now,
    };

    set((state) => ({ events: [...state.events, newEvent] }));

    // Create event chat thread
    const newChatThread: EventChatThread = {
      id: `event-chat-${newEvent.id}`,
      event_id: newEvent.id,
      is_active: true,
      messages: [],
      created_at: now,
    };
    set((state) => ({ eventChats: [...state.eventChats, newChatThread] }));

    return newEvent;
  },

  updateEvent: (eventId, updates) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
      ),
    }));
  },

  deleteEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
      eventChats: state.eventChats.filter((c) => c.event_id !== eventId),
    }));
  },

  cancelEvent: (eventId, reason) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    // Notify all attendees
    const notifications: EventNotification[] = event.attendees
      .filter((a) => a.rsvp_status === 'going' || a.rsvp_status === 'maybe')
      .map((attendee) => ({
        id: `notif-${Date.now()}-${attendee.user_id}`,
        user_id: attendee.user_id,
        event_id: eventId,
        type: 'event_cancelled' as const,
        title: 'Event Cancelled',
        body: `${event.title} has been cancelled: ${reason}`,
        read: false,
        created_at: new Date().toISOString(),
      }));

    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'cancelled' as const,
              cancelled_at: new Date().toISOString(),
              cancellation_reason: reason,
            }
          : e
      ),
      eventNotifications: [...state.eventNotifications, ...notifications],
    }));
  },

  duplicateEvent: (eventId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return null;

    const now = new Date().toISOString();
    const duplicatedEvent: Event = {
      ...event,
      id: `event-${Date.now()}`,
      title: `${event.title} (Copy)`,
      status: 'draft',
      current_attendees: 0,
      waitlist_count: 0,
      attendees: [],
      created_at: now,
      updated_at: now,
      cancelled_at: undefined,
      cancellation_reason: undefined,
    };

    set((state) => ({ events: [...state.events, duplicatedEvent] }));
    return duplicatedEvent;
  },

  publishEvent: (eventId) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId
          ? { ...e, status: 'published' as const, updated_at: new Date().toISOString() }
          : e
      ),
    }));
  },

  rsvpToEvent: (currentUserId, currentProfile, eventId, status, message) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    const now = new Date().toISOString();
    let finalStatus = status;

    // Check if waitlist needed
    if (
      status === 'going' &&
      event.max_attendees &&
      event.current_attendees >= event.max_attendees
    ) {
      finalStatus = 'waitlist';
    }

    // Check if approval needed
    if (status === 'going' && event.requires_approval) {
      finalStatus = 'pending_approval';
    }

    const newAttendee: EventAttendee = {
      id: `attendee-${Date.now()}`,
      user_id: currentUserId,
      display_name: currentProfile.display_name,
      photo: currentProfile.photos[0],
      rsvp_status: finalStatus,
      rsvp_at: now,
      waitlist_position: finalStatus === 'waitlist' ? event.waitlist_count + 1 : undefined,
      notes: message,
    };

    // Update userRSVPs
    set((state) => ({
      userRSVPs: { ...state.userRSVPs, [eventId]: finalStatus },
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        const existingAttendeeIndex = e.attendees.findIndex((a) => a.user_id === currentUserId);
        let updatedAttendees: EventAttendee[];
        if (existingAttendeeIndex >= 0) {
          updatedAttendees = e.attendees.map((a, i) => (i === existingAttendeeIndex ? newAttendee : a));
        } else {
          updatedAttendees = [...e.attendees, newAttendee];
        }
        return {
          ...e,
          attendees: updatedAttendees,
          current_attendees: finalStatus === 'going' ? e.current_attendees + 1 : e.current_attendees,
          waitlist_count: finalStatus === 'waitlist' ? e.waitlist_count + 1 : e.waitlist_count,
        };
      }),
    }));

    // Notify host
    if (finalStatus === 'going' || finalStatus === 'pending_approval') {
      const notification: EventNotification = {
        id: `notif-${Date.now()}`,
        user_id: event.host_id,
        event_id: eventId,
        type: 'attendee_joined',
        title: 'New RSVP',
        body: `${currentProfile.display_name} wants to join ${event.title}`,
        read: false,
        created_at: now,
      };
      set((state) => ({
        eventNotifications: [...state.eventNotifications, notification],
      }));
    }
  },

  cancelRSVP: (currentUserId, eventId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    const attendee = event.attendees.find((a) => a.user_id === currentUserId);
    if (!attendee) return;

    const wasGoing = attendee.rsvp_status === 'going';

    const { [eventId]: _, ...remainingRSVPs } = state.userRSVPs;

    set((state) => ({
      userRSVPs: remainingRSVPs,
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.filter((a) => a.user_id !== currentUserId),
          current_attendees: wasGoing ? e.current_attendees - 1 : e.current_attendees,
        };
      }),
    }));

    // Promote from waitlist if there was a spot
    if (wasGoing) {
      get().promoteFromWaitlist(eventId);
    }
  },

  approveAttendee: (eventId, userId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    const now = new Date().toISOString();

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.map((a) =>
            a.user_id === userId ? { ...a, rsvp_status: 'going' as const, approved_at: now } : a
          ),
          current_attendees: e.current_attendees + 1,
        };
      }),
    }));

    // Notify user
    const notification: EventNotification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      event_id: eventId,
      type: 'rsvp_approved',
      title: 'RSVP Approved',
      body: `You've been approved to attend ${event.title}!`,
      read: false,
      created_at: now,
    };
    set((state) => ({
      eventNotifications: [...state.eventNotifications, notification],
    }));
  },

  declineAttendee: (eventId, userId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.filter((a) => a.user_id !== userId),
        };
      }),
    }));

    // Notify user
    const notification: EventNotification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      event_id: eventId,
      type: 'rsvp_declined',
      title: 'RSVP Declined',
      body: `Your request to attend ${event.title} was not approved.`,
      read: false,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      eventNotifications: [...state.eventNotifications, notification],
    }));
  },

  promoteFromWaitlist: (eventId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    // Find first person on waitlist
    const waitlistAttendee = event.attendees
      .filter((a) => a.rsvp_status === 'waitlist')
      .sort((a, b) => (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0))[0];

    if (!waitlistAttendee) return;

    const now = new Date().toISOString();

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.map((a) =>
            a.user_id === waitlistAttendee.user_id
              ? { ...a, rsvp_status: 'going' as const, waitlist_position: undefined }
              : a
          ),
          current_attendees: e.current_attendees + 1,
          waitlist_count: e.waitlist_count - 1,
        };
      }),
    }));

    // Notify promoted user
    const notification: EventNotification = {
      id: `notif-${Date.now()}`,
      user_id: waitlistAttendee.user_id,
      event_id: eventId,
      type: 'waitlist_spot_open',
      title: 'Spot Available!',
      body: `A spot opened up for ${event.title}. You're now on the guest list!`,
      read: false,
      created_at: now,
    };
    set((state) => ({
      eventNotifications: [...state.eventNotifications, notification],
    }));
  },

  checkInAttendee: (eventId, userId) => {
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.map((a) =>
            a.user_id === userId ? { ...a, checked_in_at: new Date().toISOString() } : a
          ),
        };
      }),
    }));
  },

  removeAttendee: (eventId, userId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event) return;

    const attendee = event.attendees.find((a) => a.user_id === userId);
    if (!attendee) return;

    const wasGoing = attendee.rsvp_status === 'going';

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          attendees: e.attendees.filter((a) => a.user_id !== userId),
          current_attendees: wasGoing ? e.current_attendees - 1 : e.current_attendees,
        };
      }),
    }));

    // Notify removed user
    const notification: EventNotification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      event_id: eventId,
      type: 'attendee_left',
      title: 'Removed from Event',
      body: `You've been removed from ${event.title}.`,
      read: false,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      eventNotifications: [...state.eventNotifications, notification],
    }));

    // Promote from waitlist
    if (wasGoing) {
      get().promoteFromWaitlist(eventId);
    }
  },

  sendEventMessage: (currentUserId, currentProfile, eventId, content, mediaUrl, mediaType) => {
    const now = new Date().toISOString();
    const newMessage: EventChatMessage = {
      id: `event-msg-${Date.now()}`,
      thread_id: `event-chat-${eventId}`,
      sender_id: currentUserId,
      sender_name: currentProfile.display_name,
      sender_photo: currentProfile.photos[0],
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      created_at: now,
      read_by: [currentUserId],
    };

    set((state) => ({
      eventChats: state.eventChats.map((c) => {
        if (c.event_id !== eventId) return c;
        return {
          ...c,
          messages: [...c.messages, newMessage],
          last_message_at: now,
        };
      }),
    }));
  },

  getEventChat: (eventId) => {
    const state = get();
    return state.eventChats.find((c) => c.event_id === eventId) ?? null;
  },

  saveEventDraft: (currentUserId, draftData) => {
    const now = new Date().toISOString();
    const newDraft: EventDraft = {
      ...draftData,
      id: `draft-${Date.now()}`,
      user_id: currentUserId,
      saved_at: now,
    };

    set((state) => ({ eventDrafts: [...state.eventDrafts, newDraft] }));
  },

  deleteEventDraft: (draftId) => {
    set((state) => ({
      eventDrafts: state.eventDrafts.filter((d) => d.id !== draftId),
    }));
  },

  loadEventDraft: (draftId) => {
    const state = get();
    return state.eventDrafts.find((d) => d.id === draftId) ?? null;
  },

  markEventNotificationRead: (notificationId) => {
    set((state) => ({
      eventNotifications: state.eventNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  },

  getUnreadEventNotifications: (currentUserId) => {
    const state = get();
    return state.eventNotifications.filter((n) => !n.read && n.user_id === currentUserId);
  },

  getMyHostedEvents: (currentUserId) => {
    const state = get();
    return state.events.filter((e) => e.host_id === currentUserId);
  },

  getMyAttendingEvents: (currentUserId) => {
    const state = get();
    return state.events.filter((e) =>
      e.attendees.some(
        (a) =>
          a.user_id === currentUserId &&
          (a.rsvp_status === 'going' || a.rsvp_status === 'maybe')
      )
    );
  },

  getEventsByFilter: (filter) => {
    const state = get();
    return state.events.filter((e) => {
      if (e.status !== 'published') return false;

      if (filter.category && e.category !== filter.category) return false;

      if (filter.visibility && e.visibility !== filter.visibility) return false;

      if (filter.is_virtual !== undefined) {
        if (filter.is_virtual && !e.location.is_virtual) return false;
        if (!filter.is_virtual && e.location.is_virtual) return false;
      }

      if (filter.has_spots) {
        if (e.max_attendees && e.current_attendees >= e.max_attendees) return false;
      }

      if (filter.date_range) {
        const eventDate = new Date(e.start_date);
        const startDate = new Date(filter.date_range.start);
        const endDate = new Date(filter.date_range.end);
        if (eventDate < startDate || eventDate > endDate) return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some((tag) => e.tags.includes(tag))) return false;
      }

      if (filter.host_id && e.host_id !== filter.host_id) return false;

      return true;
    });
  },

  getUserRSVPStatus: (eventId) => {
    const state = get();
    return state.userRSVPs[eventId] ?? null;
  },

  canHostPublicEvents: () => {
    // Require 2+ reputation stars to host public events
    // For now, return true since reputation system is not fully implemented
    return true;
  },

  reset: () =>
    set({
      events: [],
      eventDrafts: [],
      eventChats: [],
      eventNotifications: [],
      userRSVPs: {},
    }),
}));

export default useEventsStore;
