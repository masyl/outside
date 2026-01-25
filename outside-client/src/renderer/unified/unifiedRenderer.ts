import type { Renderable } from './renderables';

export interface DisplayAdapter<TDisplay> {
  create(renderable: Renderable): TDisplay;
  update(display: TDisplay, renderable: Renderable): void;
  destroy(display: TDisplay): void;
  setZIndex?: (display: TDisplay, z: number) => void;
}

/**
 * Incremental renderer core.
 *
 * - Owns a single display index keyed by EntityId (Renderable.id)
 * - Applies create/update/delete lifecycle from a flat Renderable[] input
 * - Does not know about WorldState, Pixi, textures, or assets (adapter-owned)
 */
export class UnifiedRenderer<TDisplay> {
  private displayIndex = new Map<string, TDisplay>();

  constructor(private adapter: DisplayAdapter<TDisplay>) {}

  getIndex(): ReadonlyMap<string, TDisplay> {
    return this.displayIndex;
  }

  render(renderables: Renderable[]): void {
    // Ensure deterministic order regardless of caller.
    const ordered = [...renderables].sort((a, b) => (a.z !== b.z ? a.z - b.z : a.id.localeCompare(b.id)));

    const nextIds = new Set<string>();

    for (const r of ordered) {
      nextIds.add(r.id);

      let display = this.displayIndex.get(r.id);
      if (!display) {
        display = this.adapter.create(r);
        this.displayIndex.set(r.id, display);
      }

      if (this.adapter.setZIndex) {
        this.adapter.setZIndex(display, r.z);
      }

      this.adapter.update(display, r);
    }

    // Remove anything not present in the next set.
    for (const [id, display] of this.displayIndex) {
      if (nextIds.has(id)) continue;
      this.adapter.destroy(display);
      this.displayIndex.delete(id);
    }
  }

  destroyAll(): void {
    for (const display of this.displayIndex.values()) {
      this.adapter.destroy(display);
    }
    this.displayIndex.clear();
  }
}

