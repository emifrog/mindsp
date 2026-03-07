import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { ChatMessage, PresenceStatus } from "@/types/chat";

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (data: { userId: string; channelId: string }) => void;
type PresenceCallback = (data: { userId: string; status: PresenceStatus }) => void;

interface RealtimeState {
  userId: string | null;
  tenantId: string | null;
  channels: Map<string, RealtimeChannel>;
  callbacks: {
    onMessage: MessageCallback[];
    onTyping: TypingCallback[];
    onStopTyping: TypingCallback[];
    onPresence: PresenceCallback[];
  };
}

const state: RealtimeState = {
  userId: null,
  tenantId: null,
  channels: new Map(),
  callbacks: {
    onMessage: [],
    onTyping: [],
    onStopTyping: [],
    onPresence: [],
  },
};

export function initRealtime(userId: string, tenantId: string) {
  state.userId = userId;
  state.tenantId = tenantId;

  // Subscribe to tenant-wide presence channel
  const presenceChannel = supabase.channel(`tenant:${tenantId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  presenceChannel
    .on("presence", { event: "sync" }, () => {
      const presenceState = presenceChannel.presenceState();
      console.log("Presence sync:", presenceState);
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("User joined:", key, newPresences);
      state.callbacks.onPresence.forEach((cb) =>
        cb({ userId: key, status: "ONLINE" })
      );
    })
    .on("presence", { event: "leave" }, ({ key }) => {
      console.log("User left:", key);
      state.callbacks.onPresence.forEach((cb) =>
        cb({ userId: key, status: "OFFLINE" })
      );
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track({ online_at: new Date().toISOString() });
        console.log("✅ Connected to realtime");
      }
    });

  state.channels.set(`tenant:${tenantId}`, presenceChannel);
}

export function joinChannel(channelId: string) {
  if (state.channels.has(`channel:${channelId}`)) {
    return;
  }

  const channel = supabase.channel(`channel:${channelId}`);

  channel
    .on(
      "broadcast",
      { event: "new-message" },
      ({ payload }: { payload: ChatMessage }) => {
        state.callbacks.onMessage.forEach((cb) => cb(payload));
      }
    )
    .on(
      "broadcast",
      { event: "typing-start" },
      ({ payload }: { payload: { userId: string; channelId: string } }) => {
        if (payload.userId !== state.userId) {
          state.callbacks.onTyping.forEach((cb) => cb(payload));
        }
      }
    )
    .on(
      "broadcast",
      { event: "typing-stop" },
      ({ payload }: { payload: { userId: string; channelId: string } }) => {
        if (payload.userId !== state.userId) {
          state.callbacks.onStopTyping.forEach((cb) => cb(payload));
        }
      }
    )
    .subscribe();

  state.channels.set(`channel:${channelId}`, channel);
  console.log(`📨 Joined channel ${channelId}`);
}

export function leaveChannel(channelId: string) {
  const channel = state.channels.get(`channel:${channelId}`);
  if (channel) {
    supabase.removeChannel(channel);
    state.channels.delete(`channel:${channelId}`);
    console.log(`👋 Left channel ${channelId}`);
  }
}

export async function sendMessage(channelId: string, message: ChatMessage) {
  const channel = state.channels.get(`channel:${channelId}`);
  if (channel) {
    await channel.send({
      type: "broadcast",
      event: "new-message",
      payload: message,
    });
  }
}

export async function sendTypingStart(channelId: string) {
  const channel = state.channels.get(`channel:${channelId}`);
  if (channel && state.userId) {
    await channel.send({
      type: "broadcast",
      event: "typing-start",
      payload: { userId: state.userId, channelId },
    });
  }
}

export async function sendTypingStop(channelId: string) {
  const channel = state.channels.get(`channel:${channelId}`);
  if (channel && state.userId) {
    await channel.send({
      type: "broadcast",
      event: "typing-stop",
      payload: { userId: state.userId, channelId },
    });
  }
}

export function onMessage(callback: MessageCallback) {
  state.callbacks.onMessage.push(callback);
  return () => {
    state.callbacks.onMessage = state.callbacks.onMessage.filter(
      (cb) => cb !== callback
    );
  };
}

export function onTyping(callback: TypingCallback) {
  state.callbacks.onTyping.push(callback);
  return () => {
    state.callbacks.onTyping = state.callbacks.onTyping.filter(
      (cb) => cb !== callback
    );
  };
}

export function onStopTyping(callback: TypingCallback) {
  state.callbacks.onStopTyping.push(callback);
  return () => {
    state.callbacks.onStopTyping = state.callbacks.onStopTyping.filter(
      (cb) => cb !== callback
    );
  };
}

export function onPresenceChange(callback: PresenceCallback) {
  state.callbacks.onPresence.push(callback);
  return () => {
    state.callbacks.onPresence = state.callbacks.onPresence.filter(
      (cb) => cb !== callback
    );
  };
}

export function disconnectRealtime() {
  state.channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  state.channels.clear();
  state.userId = null;
  state.tenantId = null;
  state.callbacks = {
    onMessage: [],
    onTyping: [],
    onStopTyping: [],
    onPresence: [],
  };
  console.log("🔌 Disconnected from realtime");
}

export function getOnlineUsers(): string[] {
  const tenantChannel = state.channels.get(`tenant:${state.tenantId}`);
  if (!tenantChannel) return [];

  const presenceState = tenantChannel.presenceState();
  return Object.keys(presenceState);
}
