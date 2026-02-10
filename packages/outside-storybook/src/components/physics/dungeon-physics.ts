import { Body, Box, Plane, Sphere, Vec3, World } from 'cannon-es';

export interface DungeonWallCell {
  x: number;
  z: number;
}

export interface SphereSample {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface WallBoxSample {
  centerX: number;
  centerY: number;
  centerZ: number;
  halfX: number;
  halfY: number;
  halfZ: number;
}

export interface ClippingExperimentOptions {
  width: number;
  depth: number;
  botCount: number;
  botRadius: number;
  moveSpeed: number;
  jumpImpulse: number;
  durationSec: number;
  fixedStepSec: number;
  severeTolerance: number;
  seed: number;
}

export interface ClippingExperimentResult {
  maxSevereClips: number;
  finalSevereClips: number;
}

export function createSmallDungeonWalls(width: number, depth: number): DungeonWallCell[] {
  const walls = new Set<string>();

  for (let x = 0; x < width; x++) {
    walls.add(`${x},0`);
    walls.add(`${x},${depth - 1}`);
  }

  for (let z = 0; z < depth; z++) {
    walls.add(`0,${z}`);
    walls.add(`${width - 1},${z}`);
  }

  for (let z = 2; z < depth - 2; z++) {
    walls.add(`4,${z}`);
  }
  for (let x = 4; x < width - 2; x++) {
    walls.add(`${x},3`);
  }

  return [...walls].map((key) => {
    const [xRaw, zRaw] = key.split(',');
    return { x: Number(xRaw), z: Number(zRaw) };
  });
}

export function createWallBodies(world: World, cells: DungeonWallCell[]): Body[] {
  const bodies: Body[] = [];
  for (let i = 0; i < cells.length; i++) {
    const wall = cells[i];
    const body = new Body({ mass: 0 });
    body.addShape(new Box(new Vec3(0.5, 0.5, 0.5)));
    body.position.set(wall.x + 0.5, 0.5, wall.z + 0.5);
    world.addBody(body);
    bodies.push(body);
  }
  return bodies;
}

export function computeSphereWallPenetration(sphere: SphereSample, wall: WallBoxSample): number {
  const minX = wall.centerX - wall.halfX;
  const maxX = wall.centerX + wall.halfX;
  const minY = wall.centerY - wall.halfY;
  const maxY = wall.centerY + wall.halfY;
  const minZ = wall.centerZ - wall.halfZ;
  const maxZ = wall.centerZ + wall.halfZ;

  const clampedX = Math.max(minX, Math.min(sphere.x, maxX));
  const clampedY = Math.max(minY, Math.min(sphere.y, maxY));
  const clampedZ = Math.max(minZ, Math.min(sphere.z, maxZ));

  const dx = sphere.x - clampedX;
  const dy = sphere.y - clampedY;
  const dz = sphere.z - clampedZ;
  const distance = Math.hypot(dx, dy, dz);
  return Math.max(0, sphere.radius - distance);
}

export function countSevereWallPenetrationsFromSamples(
  spheres: readonly SphereSample[],
  walls: readonly WallBoxSample[],
  tolerance: number
): number {
  let count = 0;
  for (let i = 0; i < spheres.length; i++) {
    const sphere = spheres[i];
    let severe = false;
    for (let j = 0; j < walls.length; j++) {
      const penetration = computeSphereWallPenetration(sphere, walls[j]);
      if (penetration > tolerance) {
        severe = true;
        break;
      }
    }
    if (severe) count += 1;
  }
  return count;
}

function toSphereSample(body: Body): SphereSample | null {
  const shape = body.shapes[0];
  if (!(shape instanceof Sphere)) return null;
  return {
    x: body.position.x,
    y: body.position.y,
    z: body.position.z,
    radius: shape.radius,
  };
}

function toWallSample(body: Body): WallBoxSample | null {
  const shape = body.shapes[0];
  if (!(shape instanceof Box)) return null;
  return {
    centerX: body.position.x,
    centerY: body.position.y,
    centerZ: body.position.z,
    halfX: shape.halfExtents.x,
    halfY: shape.halfExtents.y,
    halfZ: shape.halfExtents.z,
  };
}

export function countSevereWallPenetrations(
  spheres: readonly Body[],
  walls: readonly Body[],
  tolerance: number = 0.03
): number {
  const sphereSamples: SphereSample[] = [];
  const wallSamples: WallBoxSample[] = [];

  for (let i = 0; i < spheres.length; i++) {
    const sample = toSphereSample(spheres[i]);
    if (sample) sphereSamples.push(sample);
  }
  for (let i = 0; i < walls.length; i++) {
    const sample = toWallSample(walls[i]);
    if (sample) wallSamples.push(sample);
  }

  return countSevereWallPenetrationsFromSamples(sphereSamples, wallSamples, tolerance);
}

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function randomFreeCell(
  rng: () => number,
  freeCells: readonly DungeonWallCell[]
): DungeonWallCell {
  const idx = Math.floor(rng() * freeCells.length) % freeCells.length;
  return freeCells[Math.max(0, idx)];
}

export function runClippingExperiment(
  options: ClippingExperimentOptions
): ClippingExperimentResult {
  const rng = createRng(options.seed);
  const world = new World({ gravity: new Vec3(0, -25, 0) });
  world.allowSleep = true;

  const floor = new Body({ mass: 0 });
  floor.addShape(new Plane());
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floor);

  const wallCells = createSmallDungeonWalls(options.width, options.depth);
  const wallBodies = createWallBodies(world, wallCells);
  const wallSet = new Set(wallCells.map((wall) => `${wall.x},${wall.z}`));

  const freeCells: DungeonWallCell[] = [];
  for (let x = 1; x < options.width - 1; x++) {
    for (let z = 1; z < options.depth - 1; z++) {
      if (!wallSet.has(`${x},${z}`)) freeCells.push({ x, z });
    }
  }
  if (freeCells.length === 0) {
    return { maxSevereClips: 0, finalSevereClips: 0 };
  }

  const botBodies: Body[] = [];
  const botTargets: Array<{ x: number; z: number; nextJumpAt: number }> = [];

  for (let i = 0; i < options.botCount; i++) {
    const start = randomFreeCell(rng, freeCells);
    const target = randomFreeCell(rng, freeCells);
    const body = new Body({
      mass: 1,
      linearDamping: 0.25,
      angularDamping: 0.9,
    });
    body.addShape(new Sphere(options.botRadius));
    body.position.set(start.x + 0.5, options.botRadius, start.z + 0.5);
    world.addBody(body);
    botBodies.push(body);
    botTargets.push({
      x: target.x + 0.5,
      z: target.z + 0.5,
      nextJumpAt: 0.7 + rng() * 1.4,
    });
  }

  let simSec = 0;
  let maxSevereClips = 0;
  let finalSevereClips = 0;
  const steps = Math.max(1, Math.floor(options.durationSec / options.fixedStepSec));

  for (let step = 0; step < steps; step++) {
    simSec += options.fixedStepSec;

    for (let i = 0; i < botBodies.length; i++) {
      const body = botBodies[i];
      const target = botTargets[i];
      const dx = target.x - body.position.x;
      const dz = target.z - body.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.35) {
        const next = randomFreeCell(rng, freeCells);
        target.x = next.x + 0.5;
        target.z = next.z + 0.5;
      } else {
        const desiredX = (dx / Math.max(dist, 0.0001)) * options.moveSpeed;
        const desiredZ = (dz / Math.max(dist, 0.0001)) * options.moveSpeed;
        const impulseX = (desiredX - body.velocity.x) * 0.08;
        const impulseZ = (desiredZ - body.velocity.z) * 0.08;
        body.applyImpulse(new Vec3(impulseX, 0, impulseZ));
      }

      if (simSec >= target.nextJumpAt && body.position.y <= options.botRadius + 0.03) {
        body.applyImpulse(new Vec3(0, options.jumpImpulse, 0));
        target.nextJumpAt = simSec + 1 + rng() * 2;
      }
    }

    world.step(options.fixedStepSec);

    finalSevereClips = countSevereWallPenetrations(
      botBodies,
      wallBodies,
      options.severeTolerance
    );
    if (finalSevereClips > maxSevereClips) {
      maxSevereClips = finalSevereClips;
    }
  }

  return { maxSevereClips, finalSevereClips };
}
