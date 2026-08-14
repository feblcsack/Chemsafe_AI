// Supabase Realtime Debugging Helper

export function debugRealtimeConnection(channelName: string) {
  console.log(`🔄 Setting up Realtime channel: ${channelName}`);
  
  return {
    onSubscribe: () => {
      console.log(`✅ Successfully subscribed to: ${channelName}`);
    },
    onError: (error: any) => {
      console.error(`❌ Realtime error on ${channelName}:`, error);
    },
    onEvent: (event: string, payload: any) => {
      console.log(`📡 Realtime event on ${channelName}:`, event, payload);
    },
    onCleanup: () => {
      console.log(`🧹 Cleaning up Realtime channel: ${channelName}`);
    }
  };
}

export function logRealtimeStatus() {
  console.log('📊 Realtime Connection Status Check');
  // You can add more debugging info here
}