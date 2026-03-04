import { listMachines, OrbMachine, AndonStatus } from "../core/orb.ts";

export type AndonServiceState = "stopped" | "polling" | "idle";

export class AndonService {
  private state: AndonServiceState = "stopped";
  private intervalId: number | null = null;
  private timeoutId: number | null = null;
  private latestData: OrbMachine[] = [];
  
  // Emitter callback array for React hooks
  private listeners: ((data: OrbMachine[], state: AndonServiceState) => void)[] = [];

  constructor(
    private intervalMs: number = 5000,
    private expirationMs: number = 15000
  ) {}

  public subscribe(listener: (data: OrbMachine[], state: AndonServiceState) => void) {
    this.listeners.push(listener);
    // Send immediate initial sync
    listener(this.latestData, this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.latestData, this.state);
    }
  }

  /**
   * Request data. If service is stopped/idle, starts polling for a certain expiration window.
   */
  public async requestRefresh() {
    this.extendExpiration();
    if (this.state === "stopped" || this.state === "idle") {
      this.startPolling();
      await this.poll();
    }
  }

  private startPolling() {
    if (this.intervalId !== null) return;
    this.state = "polling";
    this.emit();

    this.intervalId = setInterval(async () => {
      if (this.state === "polling") {
        await this.poll();
      }
    }, this.intervalMs);
  }

  private stopPolling() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state = "idle";
    this.emit();
  }

  private extendExpiration() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.stopPolling();
    }, this.expirationMs);
  }

  private async poll() {
    try {
      this.latestData = await listMachines();
      this.emit();
    } catch (err) {
      // In case of error (e.g. OrbStack not running), don't crash the background service
      // Maybe emit an error state?
      console.error("Andon poll failure:", err);
    }
  }

  public getStaticData() {
    return this.latestData;
  }
}
