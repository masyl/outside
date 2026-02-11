import { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import { ControllerInputProcessor, type RawControllerSnapshot } from '@outside/controller-core';
import { PixiEcsRenderer } from '@outside/renderer';
import {
  InspectorOverlay,
  InspectorRenderer,
  applyInspectorStream,
  buildInspectorFrame,
  createInspectorRenderWorld,
  type InspectorFrame,
} from '@outside/inspector-renderer';
import { TestPlayerCanvas } from './pixi-container';
import { createStreamController } from './stream-controller';
import type { TestPlayerProps } from './types';
import { useScenarioRenderStream } from './use-scenario-render-stream';

const EMPTY_FRAME: InspectorFrame = {
  tiles: [],
  entities: [],
  followLinks: [],
  pathfindingPaths: [],
  collisionEntityCount: 0,
  collisionTileCount: 0,
  followLinkCount: 0,
  pathfindingPathCount: 0,
  unknownCount: 0,
};

type ControllerSelection = 'none' | 'auto' | number;

export function TestPlayer({
  seed,
  ticsPerSecond,
  botCount,
  foodCount,
  dogCount,
  catCount,
  ballCount,
  ballBounciness = 0.82,
  kickBaseImpulse = 0.22,
  kickSpeedFactor = 0.06,
  kickLiftBase = 1.6,
  kickLiftBouncinessFactor = 0.8,
  ballMaxHorizontalSpeed = 9,
  ballGroundRestitution = 0.72,
  actors = 'all',
  pointerVariant = 'ui.cursor.r0c0',
  act = 'idle',
  pace = 'walk',
  spawnFn,
  tileSize = 16,
  waitForAssets = false,
  useCrtEffect = false,
  showInspectorOverlay = false,
  showInspectorFollowLinks = true,
  showInspectorVelocityVectors = true,
  showInspectorCollisionTint = true,
  showInspectorWallOutlines = true,
  showInspectorPathfindingPaths = false,
  showInspectorPhysicsShapes = false,
  onClickAction = 'order-path',
  physics3dTuning,
  controller,
}: TestPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const rendererAppRef = useRef<Application | null>(null);
  const inspectorWorldRef = useRef(createInspectorRenderWorld());
  const streamControllerRef = useRef(createStreamController());
  const pointerWorldRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const controllerDpadLeftPressedRef = useRef(false);
  const controllerTouchpadPressedRef = useRef(false);
  const controllerHeroMovingRef = useRef(false);
  const pixiApplyQueueRef = useRef(Promise.resolve());
  const applyGenerationRef = useRef(0);
  const [inspectorFrame, setInspectorFrame] = useState<InspectorFrame>(EMPTY_FRAME);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const [rendererReady, setRendererReady] = useState(0);

  const controllerEnabled = controller?.enabled === true;
  const controllerPollFps = controller?.pollFps ?? 60;
  const controllerGamepadIndex = controller?.gamepadIndex;
  const controllerShowDeviceSelector = controller?.showDeviceSelector !== false;
  const [controllerSelection, setControllerSelection] = useState<ControllerSelection>(() =>
    controllerGamepadIndex != null ? controllerGamepadIndex : 'none'
  );
  const [availableGamepads, setAvailableGamepads] = useState<Array<{ index: number; id: string }>>(
    []
  );

  const assetBaseUrl = (() => {
    if (typeof window === 'undefined') return '/sprites';
    return new URL('./sprites', window.location.href).toString().replace(/\/$/, '');
  })();

  const stream = useScenarioRenderStream({
    mode: 'dynamic',
    seed,
    botCount,
    spawnOptions: {
      botCount,
      foodCount,
      dogCount,
      catCount,
      ballCount,
      ballBounciness,
      actorSelection: actors,
      actorAct: act,
      actorPace: pace,
      pointerVariant,
    },
    physics3dTuning: {
      botKickBaseImpulse: kickBaseImpulse,
      botKickSpeedFactor: kickSpeedFactor,
      ballKickLiftBase: kickLiftBase,
      ballKickLiftBouncinessFactor: kickLiftBouncinessFactor,
      ballMaxHorizontalSpeed,
      ballGroundRestitution,
      ...physics3dTuning,
    },
    ticsPerSecond,
    spawnFn,
  });

  useEffect(() => {
    setControllerSelection(controllerGamepadIndex != null ? controllerGamepadIndex : 'none');
  }, [controllerEnabled, controllerGamepadIndex]);

  useEffect(() => {
    if (
      !controllerEnabled ||
      typeof navigator === 'undefined' ||
      typeof navigator.getGamepads !== 'function'
    ) {
      setAvailableGamepads([]);
      return;
    }

    const readGamepads = () => {
      const next = Array.from(navigator.getGamepads())
        .filter((pad): pad is Gamepad => pad != null && pad.connected)
        .map((pad) => ({
          index: pad.index,
          id: pad.id || '(unlabeled)',
        }));
      setAvailableGamepads(next);
    };

    readGamepads();
    window.addEventListener('gamepadconnected', readGamepads);
    window.addEventListener('gamepaddisconnected', readGamepads);
    const intervalId = window.setInterval(readGamepads, 1000);
    return () => {
      window.removeEventListener('gamepadconnected', readGamepads);
      window.removeEventListener('gamepaddisconnected', readGamepads);
      window.clearInterval(intervalId);
    };
  }, [controllerEnabled]);

  const initRenderer = useCallback((app: Application) => {
    if (rendererRef.current && rendererAppRef.current === app) return;
    if (rendererRef.current) {
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
    const renderer = new PixiEcsRenderer(app, {
      tileSize,
      assetBaseUrl,
    });
    rendererRef.current = renderer;
    rendererAppRef.current = app;
    void renderer.loadAssets();
    setRendererReady((v) => v + 1);
  }, []);

  const applyWorldAction = useCallback(
    (worldX: number, worldY: number, _source: 'pointer' | 'controller') => {
      const tileX = Math.floor(worldX);
      const tileY = Math.floor(worldY);

      if (
        onClickAction === 'jump-random' ||
        onClickAction === 'jump-all' ||
        onClickAction === 'jump-sequence'
      ) {
        stream.triggerZooActorJump(
          onClickAction === 'jump-all'
            ? 'all'
            : onClickAction === 'jump-sequence'
              ? 'sequence'
              : 'random'
        );
        return;
      }

      if (onClickAction === 'pick-pointer') {
        stream.pickPointerVariantAtTile(tileX, tileY);
        return;
      }
      if (stream.isFocusedEntityMouseFollowModeEnabled()) {
        return;
      }
      const result = stream.orderFocusedEntityToTile(tileX, tileY);
      if (!result.ordered) {
        return;
      }
    },
    [
      stream.orderFocusedEntityToTile,
      stream.pickPointerVariantAtTile,
      stream.triggerZooActorJump,
      stream.isFocusedEntityMouseFollowModeEnabled,
      onClickAction,
    ]
  );

  const handlePointerDown = useCallback(
    (screenX: number, screenY: number) => {
      const worldX = stream.center.x + (screenX - viewportSize.width / 2) / tileSize;
      const worldY = stream.center.y - (screenY - viewportSize.height / 2) / tileSize;
      pointerWorldRef.current = { x: worldX, y: worldY };
      applyWorldAction(worldX, worldY, 'pointer');
    },
    [
      stream.center.x,
      stream.center.y,
      viewportSize.width,
      viewportSize.height,
      tileSize,
      applyWorldAction,
    ]
  );

  const handlePointerMove = useCallback(
    (screenX: number, screenY: number) => {
      const worldX = stream.center.x + (screenX - viewportSize.width / 2) / tileSize;
      const worldY = stream.center.y - (screenY - viewportSize.height / 2) / tileSize;
      pointerWorldRef.current = { x: worldX, y: worldY };
      stream.setPointerWorld(worldX, worldY);
      stream.setZooActorsFollowPoint(worldX, worldY);
      stream.setFocusedEntityFollowPoint(worldX, worldY);
    },
    [
      stream.center.x,
      stream.center.y,
      stream.setPointerWorld,
      stream.setZooActorsFollowPoint,
      stream.setFocusedEntityFollowPoint,
      viewportSize.width,
      viewportSize.height,
      tileSize,
    ]
  );

  const handlePointerLeave = useCallback(() => {
    stream.clearPointer();
    stream.clearFocusedEntityFollowPoint();
  }, [stream.clearPointer, stream.clearFocusedEntityFollowPoint]);

  useEffect(() => {
    pointerWorldRef.current = { x: stream.center.x, y: stream.center.y };
    controllerDpadLeftPressedRef.current = false;
    controllerTouchpadPressedRef.current = false;
    controllerHeroMovingRef.current = false;
  }, [stream.streamKey]);

  useEffect(() => {
    applyGenerationRef.current += 1;
    streamControllerRef.current.reset(stream.streamKey);
    pixiApplyQueueRef.current = Promise.resolve();
    inspectorWorldRef.current = createInspectorRenderWorld();
    setInspectorFrame(EMPTY_FRAME);
  }, [stream.streamKey]);

  useEffect(() => {
    applyGenerationRef.current += 1;
    pixiApplyQueueRef.current = Promise.resolve();
  }, [tileSize, waitForAssets]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || rendererReady === 0) return;
    renderer.resetWorld();
    renderer.setTileSize(tileSize);
    streamControllerRef.current.replay('pixi');
  }, [rendererReady, tileSize, stream.streamKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || rendererReady === 0) return;
    renderer.setCrtEnabled(useCrtEffect);
  }, [rendererReady, useCrtEffect]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        stream.toggleFocusedEntityMouseFollowMode();
        return;
      }
      if (event.code !== 'Space') return;
      stream.triggerDebugJump();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [stream.toggleFocusedEntityMouseFollowMode, stream.triggerDebugJump]);

  useEffect(() => {
    if (!controllerEnabled) {
      return;
    }
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return;
    }

    const processor = new ControllerInputProcessor();
    let rafId = 0;
    let lastFrameAt = 0;
    const minIntervalMs = Math.max(1, Math.floor(1000 / Math.max(1, controllerPollFps)));

    const toSnapshot = (pad: Gamepad): RawControllerSnapshot => ({
      id: pad.id,
      mapping: pad.mapping ?? '',
      connected: pad.connected,
      axes: Array.from(pad.axes),
      buttons: Array.from(pad.buttons).map((button) => ({
        value: button.value,
        pressed: button.pressed,
        touched: button.touched,
      })),
    });

    const selectPad = (): Gamepad | null => {
      const pads = navigator.getGamepads();
      if (controllerSelection === 'none') {
        return null;
      }
      if (typeof controllerSelection === 'number') {
        const selectedPad = pads[controllerSelection];
        return selectedPad?.connected ? selectedPad : null;
      }
      const firstConnected = Array.from(pads).find(
        (pad): pad is Gamepad => pad != null && pad.connected
      );
      return firstConnected ?? null;
    };

    const ensureHeroControlReady = (): boolean => {
      const activation = stream.ensureControllerHeroActor();
      if (activation.heroEid == null) {
        return false;
      }
      return true;
    };

    const tick = (now: number) => {
      if (lastFrameAt !== 0 && now - lastFrameAt < minIntervalMs) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const pad = selectPad();
      if (pad != null) {
        const result = processor.process(toSnapshot(pad), now);
        const dpadLeftPressed = result.normalized.buttons.dpadLeft.pressed;
        if (dpadLeftPressed && !controllerDpadLeftPressedRef.current) {
          const switchResult = stream.cycleControllerHeroActor('previous');
          if (switchResult.heroEid != null) {
            stream.clearFocusedEntityTargetDirection();
            controllerHeroMovingRef.current = false;
          }
        }
        controllerDpadLeftPressedRef.current = dpadLeftPressed;

        const touchpadPressed = result.normalized.buttons.touchpad.pressed;
        if (touchpadPressed && !controllerTouchpadPressedRef.current) {
          applyWorldAction(pointerWorldRef.current.x, pointerWorldRef.current.y, 'controller');
        }
        controllerTouchpadPressedRef.current = touchpadPressed;

        for (let i = 0; i < result.actions.length; i++) {
          const action = result.actions[i];
          if (action.phase === 'pressed' && action.action === 'PRIMARY') {
            if (ensureHeroControlReady()) {
              stream.triggerDebugJump();
            }
            break;
          }
        }

        const stick = result.normalized.sticks.left;
        const desiredDirectionX = stick.x;
        const desiredDirectionY = -stick.y;
        const desiredMagnitude = Math.hypot(desiredDirectionX, desiredDirectionY);
        if (desiredMagnitude > 0.12) {
          if (ensureHeroControlReady()) {
            const directionResult = stream.setFocusedEntityTargetDirection(
              desiredDirectionX,
              desiredDirectionY
            );
            controllerHeroMovingRef.current = directionResult.updated;
          }
        } else if (controllerHeroMovingRef.current) {
          stream.clearFocusedEntityTargetDirection();
          controllerHeroMovingRef.current = false;
        }
      } else {
        controllerDpadLeftPressedRef.current = false;
        controllerTouchpadPressedRef.current = false;
        if (controllerHeroMovingRef.current) {
          stream.clearFocusedEntityTargetDirection();
          controllerHeroMovingRef.current = false;
        }
      }

      lastFrameAt = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [
    applyWorldAction,
    controllerEnabled,
    controllerPollFps,
    controllerSelection,
    stream.clearFocusedEntityTargetDirection,
    stream.cycleControllerHeroActor,
    stream.ensureControllerHeroActor,
    stream.setFocusedEntityTargetDirection,
    stream.triggerDebugJump,
  ]);

  useEffect(() => {
    if (!stream.packet) return;
    streamControllerRef.current.push(stream.packet);
  }, [stream.packetVersion]);

  useEffect(() => {
    const unsubscribe = streamControllerRef.current.subscribe('inspector', (packet) => {
      applyInspectorStream(inspectorWorldRef.current, packet);
      const baseFrame = buildInspectorFrame(inspectorWorldRef.current.world);
      const pathfindingPaths = stream.getPathfindingDebugPaths();
      if (pathfindingPaths.length === 0) {
        setInspectorFrame(baseFrame);
        return;
      }
      setInspectorFrame({
        ...baseFrame,
        pathfindingPaths,
        pathfindingPathCount: pathfindingPaths.length,
      });
    });

    return () => unsubscribe();
  }, [stream.streamKey, stream.getPathfindingDebugPaths]);

  useEffect(() => {
    streamControllerRef.current.setReady('inspector', true);
    return () => {
      streamControllerRef.current.setReady('inspector', false);
    };
  }, [stream.streamKey]);

  useEffect(() => {
    const unsubscribe = streamControllerRef.current.subscribe('pixi', (packet) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const generation = applyGenerationRef.current;

      pixiApplyQueueRef.current = pixiApplyQueueRef.current.then(async () => {
        if (applyGenerationRef.current !== generation) {
          return;
        }
        if (rendererRef.current !== renderer) {
          return;
        }
        if (waitForAssets && renderer.getAssetsReady()) {
          await renderer.getAssetsReady();
        }
        if (applyGenerationRef.current !== generation) {
          return;
        }
        if (rendererRef.current !== renderer) {
          return;
        }
        renderer.applyStream({
          kind: packet.kind,
          tic: packet.tic,
          buffer: packet.buffer,
        });
      });
    });

    return () => unsubscribe();
  }, [stream.streamKey, waitForAssets]);

  useEffect(() => {
    const isPixiReady = rendererReady > 0 && rendererRef.current !== null;
    streamControllerRef.current.setReady('pixi', isPixiReady);
    return () => {
      streamControllerRef.current.setReady('pixi', false);
    };
  }, [rendererReady, stream.streamKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setViewCenter(stream.center.x, stream.center.y);
  }, [rendererReady, stream.center.x, stream.center.y, stream.streamKey]);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererAppRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateFromContainer = () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      setViewportSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateFromContainer();
    const observer = new ResizeObserver(updateFromContainer);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleResize = useCallback((_app: Application, nextWidth: number, nextHeight: number) => {
    rendererRef.current?.setViewportSize(nextWidth, nextHeight);
  }, []);

  const controllerSelectionValue =
    controllerSelection === 'none'
      ? 'none'
      : controllerSelection === 'auto'
        ? 'auto'
        : `pad:${controllerSelection}`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TestPlayerCanvas
        instanceKey="pixi-ecs"
        width="100%"
        height="100%"
        backgroundColor={0x0b0d12}
        onResize={handleResize}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        {initRenderer}
      </TestPlayerCanvas>
      {controllerEnabled && controllerShowDeviceSelector ? (
        <label
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 8,
            background: 'rgba(12, 18, 28, 0.86)',
            color: '#d8e0ea',
            fontFamily: 'monospace',
            fontSize: 12,
            border: '1px solid rgba(216, 224, 234, 0.22)',
          }}
        >
          Controller
          <select
            value={controllerSelectionValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === 'none' || nextValue === 'auto') {
                setControllerSelection(nextValue);
                return;
              }
              if (nextValue.startsWith('pad:')) {
                const nextIndex = Number.parseInt(nextValue.slice(4), 10);
                if (Number.isInteger(nextIndex) && nextIndex >= 0) {
                  setControllerSelection(nextIndex);
                  return;
                }
              }
              setControllerSelection('none');
            }}
            style={{
              background: '#0a1018',
              color: '#d8e0ea',
              border: '1px solid rgba(216, 224, 234, 0.22)',
              borderRadius: 6,
              padding: '2px 6px',
            }}
          >
            <option value="none">None</option>
            <option value="auto">Auto (first connected)</option>
            {availableGamepads.map((pad) => (
              <option key={pad.index} value={`pad:${pad.index}`}>
                #{pad.index} {pad.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <InspectorOverlay visible={showInspectorOverlay} pointerEvents="none">
        <InspectorRenderer
          frame={inspectorFrame}
          width={viewportSize.width}
          height={viewportSize.height}
          tileSize={tileSize}
          centerX={stream.center.x}
          centerY={stream.center.y}
          overlayMode={showInspectorOverlay}
          showFollowLinks={showInspectorFollowLinks}
          showVelocityVectors={showInspectorVelocityVectors}
          showCollisionTint={showInspectorCollisionTint}
          showWallOutlines={showInspectorWallOutlines}
          showPathfindingPaths={showInspectorPathfindingPaths}
          showPhysicsShapes={showInspectorPhysicsShapes}
        />
      </InspectorOverlay>
    </div>
  );
}
