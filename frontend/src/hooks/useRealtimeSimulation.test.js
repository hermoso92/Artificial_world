import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtimeSimulation } from './useRealtimeSimulation';

vi.mock('../config/api', () => ({ WS_URL: 'ws://test:9999/ws' }));

describe('useRealtimeSimulation', () => {
  let OriginalWebSocket;

  beforeEach(() => {
    OriginalWebSocket = global.WebSocket;
    global.WebSocket = vi.fn(() => ({
      readyState: 0,
      close: vi.fn(),
      addEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    global.WebSocket = OriginalWebSocket;
  });

  it('returns initial state with connected false', () => {
    const { result } = renderHook(() => useRealtimeSimulation());
    expect(result.current.connected).toBe(false);
    expect(result.current.tick).toBe(0);
    expect(result.current.refuge).toBeNull();
    expect(result.current.running).toBe(false);
  });

  it('exposes reconnect function', () => {
    const { result } = renderHook(() => useRealtimeSimulation());
    expect(typeof result.current.reconnect).toBe('function');
  });

});
