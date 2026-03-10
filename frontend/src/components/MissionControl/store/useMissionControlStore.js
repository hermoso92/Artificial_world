import { create } from 'zustand';

const EMPTY_SNAPSHOT = {
  overview: null,
  gateways: [],
  boardGroups: [],
  boards: [],
  agents: [],
  tasks: [],
  runs: [],
  approvals: [],
  events: [],
  filtersApplied: {},
};

function mergeEvent(previousEvents, event) {
  const nextEvents = [event, ...previousEvents.filter((item) => item.id !== event.id)];
  return nextEvents.slice(0, 300);
}

function mergeSnapshot(state, payload) {
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      ...payload,
    },
    loading: false,
    error: null,
  };
}

export const useMissionControlStore = create((set, get) => ({
  snapshot: EMPTY_SNAPSHOT,
  loading: true,
  error: null,
  wsConnected: false,
  wsState: 'connecting',
  reconnectAttempt: 0,
  lastSnapshotAt: null,
  filters: {
    boardGroupId: '',
    gatewayId: '',
    agentId: '',
    priority: '',
    workType: '',
    search: '',
    requiresApproval: false,
    blocked: false,
  },
  activeTaskId: null,
  activeRunId: null,
  activeApprovalId: null,
  activeEvent: null,
  feedPaused: false,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setSnapshot: (payload) => set((state) => mergeSnapshot(state, payload)),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  setWsState: (wsState) => set({ wsState }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setFeedPaused: (feedPaused) => set({ feedPaused }),
  setFilters: (nextFilters) => set((state) => ({ filters: { ...state.filters, ...nextFilters } })),
  setActiveTaskId: (activeTaskId) => set({ activeTaskId, activeRunId: null, activeApprovalId: null, activeEvent: null }),
  setActiveRunId: (activeRunId) => set({ activeRunId, activeTaskId: null, activeApprovalId: null, activeEvent: null }),
  setActiveApprovalId: (activeApprovalId) => set({ activeApprovalId, activeTaskId: null, activeRunId: null, activeEvent: null }),
  setActiveEvent: (activeEvent) => set({ activeEvent, activeTaskId: null, activeRunId: null, activeApprovalId: null }),
  clearSelection: () => set({ activeTaskId: null, activeRunId: null, activeApprovalId: null, activeEvent: null }),
  applyRealtimeMessage: (message) => {
    if (message?.type === 'mission-control:snapshot' && message.data) {
      set((state) => ({
        ...mergeSnapshot(state, message.data),
        lastSnapshotAt: new Date().toISOString(),
      }));
      return;
    }

    if (message?.type === 'mission-control:event' && message.data) {
      const { feedPaused } = get();
      set((state) => ({
        snapshot: {
          ...state.snapshot,
          events: feedPaused ? state.snapshot.events : mergeEvent(state.snapshot.events, message.data),
        },
      }));
    }
  },
}));
