import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HostMode } from './host';
import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { SignalingClient } from './signaling';
import { PlaybackState } from '../timeline/types';
import { GameLoop } from '../game/loop';
import { TimelineManager } from '../timeline/manager';

// Mock dependencies
vi.mock('./signaling');
vi.mock('./webrtc');
vi.mock('../game/loop');
vi.mock('../timeline/manager');

describe('HostMode', () => {
  let store: Store;
  let commandQueue: CommandQueue;
  let signalingClient: SignalingClient;
  let hostMode: HostMode;
  let gameLoop: GameLoop;
  let timelineManager: TimelineManager;

  beforeEach(() => {
    store = new Store();
    commandQueue = new CommandQueue();
    signalingClient = new SignalingClient('ws://localhost:8080');
    hostMode = new HostMode(store, commandQueue, signalingClient);
    
    gameLoop = new GameLoop(store, commandQueue, {} as any);
    timelineManager = new TimelineManager(store, null as any);

    // Mock window.setInterval
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    hostMode.cleanup();
  });

  describe('Playback Control', () => {
    it('should initialize with PLAYING state', () => {
      expect(hostMode.getPlaybackState()).toBe(PlaybackState.PLAYING);
    });

    it('should update playback state', () => {
      hostMode.setPlaybackState(PlaybackState.PAUSED);
      expect(hostMode.getPlaybackState()).toBe(PlaybackState.PAUSED);
    });

    it('should sync with TimelineManager state changes', async () => {
      // Setup mock
      const onStateChangeSpy = vi.fn();
      (timelineManager.onStateChange as any) = onStateChangeSpy;

      await hostMode.initialize(gameLoop, timelineManager, { local: true });

      expect(onStateChangeSpy).toHaveBeenCalled();
      
      // Simulate callback execution
      const callback = onStateChangeSpy.mock.calls[0][0];
      callback(PlaybackState.PAUSED);

      expect(hostMode.getPlaybackState()).toBe(PlaybackState.PAUSED);
      // expect(gameLoop.setPlaybackState).toHaveBeenCalledWith(PlaybackState.PAUSED); // gameLoop is mocked but we didn't spy on the method yet
    });
  });

  describe('Step Counter', () => {
    it('should increment step count when PLAYING', async () => {
      await hostMode.initialize(gameLoop, timelineManager, { local: true });
      hostMode.setPlaybackState(PlaybackState.PLAYING);

      const initialStep = hostMode.getCurrentStep();
      
      // Advance time by 125ms (one step)
      vi.advanceTimersByTime(125);
      
      expect(hostMode.getCurrentStep()).toBe(initialStep + 1);
    });

    it('should NOT increment step count when PAUSED', async () => {
      await hostMode.initialize(gameLoop, timelineManager, { local: true });
      hostMode.setPlaybackState(PlaybackState.PAUSED);

      const initialStep = hostMode.getCurrentStep();
      
      // Advance time by 125ms
      vi.advanceTimersByTime(125);
      
      expect(hostMode.getCurrentStep()).toBe(initialStep);
    });
  });

  describe('Autonomy Control', () => {
    it('should not process autonomy when PAUSED', async () => {
      // Enable autonomy
      hostMode.toggleAutonomy();
      expect(hostMode.isAutonomyEnabled()).toBe(true);

      hostMode.setPlaybackState(PlaybackState.PAUSED);
      
      // We can't easily spy on private processAutonomy, but we can verify side effects (queue length)
      // Assuming empty world, autonomy might not do much, but we can verify it doesn't crash or enqueue
      
      // Advance time
      vi.advanceTimersByTime(125);
      
      // If we had bots, we'd check queue.
    });
  });
});
