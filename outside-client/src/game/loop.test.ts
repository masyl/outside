import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from './loop';
import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { GameRenderer } from '../renderer/renderer';
import { PlaybackState } from '../timeline/types';
import { TimelineManager } from '../timeline/manager';

// Mock dependencies
vi.mock('../renderer/renderer');
vi.mock('../timeline/manager');

describe('GameLoop', () => {
  let store: Store;
  let commandQueue: CommandQueue;
  let renderer: GameRenderer;
  let gameLoop: GameLoop;
  let timelineManager: TimelineManager;

  beforeEach(() => {
    store = new Store();
    commandQueue = new CommandQueue();
    // renderer = new GameRenderer(document.createElement('canvas'), store);
    // Mock application for renderer
    const mockApp = {
      stage: { addChild: vi.fn() },
      renderer: { resize: vi.fn() },
      screen: { width: 800, height: 600 },
    } as any;
    renderer = new GameRenderer(mockApp);
    gameLoop = new GameLoop(store, commandQueue, renderer);
    timelineManager = new TimelineManager(store, null as any); // Mocked
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window.setInterval
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    gameLoop.stop();
  });

  describe('Playback Control', () => {
    it('should initialize with PLAYING state', () => {
      expect(gameLoop.getPlaybackState()).toBe(PlaybackState.PLAYING);
    });

    it('should transition to PAUSED state when pause() is called', () => {
      gameLoop.pause();
      expect(gameLoop.getPlaybackState()).toBe(PlaybackState.PAUSED);
    });

    it('should transition to PLAYING state when resume() is called', () => {
      gameLoop.pause();
      gameLoop.resume();
      expect(gameLoop.getPlaybackState()).toBe(PlaybackState.PLAYING);
    });

    it('should allow setting timeline manager', () => {
      gameLoop.setTimelineManager(timelineManager);
      // Access private property for verification if needed, or verify behavior
      // Since property is private, we verify behavior via step()
      const stepSpy = vi.spyOn(timelineManager, 'stepForward');
      gameLoop.step();
      expect(stepSpy).toHaveBeenCalled();
    });
  });

  describe('Game Loop Execution', () => {
    it('should process commands when PLAYING', () => {
      gameLoop.start();
      
      // Enqueue a command
      const command = { type: 'test', id: '1' } as any;
      commandQueue.enqueue(command);
      
      // Advance timers
      vi.advanceTimersByTime(125);
      
      // Command should be dequeued (processed)
      expect(commandQueue.length()).toBe(0);
    });

    it('should NOT process commands when PAUSED', () => {
      gameLoop.start();
      gameLoop.pause();
      
      // Enqueue a command
      const command = { type: 'test', id: '1' } as any;
      commandQueue.enqueue(command);
      
      // Advance timers
      vi.advanceTimersByTime(125);
      
      // Command should NOT be dequeued
      expect(commandQueue.length()).toBe(1);
    });

    it('should NOT process commands when TRAVELING', () => {
      gameLoop.start();
      gameLoop.setPlaybackState(PlaybackState.TRAVELING);
      
      // Enqueue a command
      const command = { type: 'test', id: '1' } as any;
      commandQueue.enqueue(command);
      
      // Advance timers
      vi.advanceTimersByTime(125);
      
      // Command should NOT be dequeued
      expect(commandQueue.length()).toBe(1);
    });
  });

  describe('Step Execution', () => {
    it('should delegate step to timeline manager', () => {
      gameLoop.setTimelineManager(timelineManager);
      const stepSpy = vi.spyOn(timelineManager, 'stepForward');
      
      gameLoop.step();
      
      expect(stepSpy).toHaveBeenCalled();
    });

    it('should handle missing timeline manager gracefully', () => {
      // No timeline manager set
      expect(() => gameLoop.step()).not.toThrow();
    });
  });
});
