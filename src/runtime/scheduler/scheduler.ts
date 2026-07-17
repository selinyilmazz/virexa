import { SCHEDULE_DEFINITIONS } from "@/runtime/scheduler/schedule-definitions";
import type { JobType } from "@/runtime/types";

export type ScheduledJobRunner = (jobType: JobType) => void;

/**
 * Real scheduler infrastructure ("gerçek scheduler altyapısı") - every
 * entry in `SCHEDULE_DEFINITIONS` gets its own `setInterval` timer that
 * calls back into whatever `runJob` function the caller (`RuntimeEngine`)
 * provided. `start()`/`stop()` control every timer at once;
 * `triggerNow()` runs any job type immediately regardless of its
 * schedule or whether the scheduler is currently running - the manual
 * trigger the task requires ("scheduler manuel de tetiklenebilsin").
 */
export class RuntimeScheduler {
  private readonly timers = new Map<JobType, ReturnType<typeof setInterval>>();
  private running = false;

  constructor(private readonly runJob: ScheduledJobRunner) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const definition of SCHEDULE_DEFINITIONS) {
      const timer = setInterval(() => this.runJob(definition.jobType), definition.intervalMs);
      this.timers.set(definition.jobType, timer);
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.running = false;
  }

  /** Runs a job type right now, independent of its schedule - works whether or not `start()` has been called. */
  triggerNow(jobType: JobType): void {
    this.runJob(jobType);
  }

  getSchedule(): ScheduleDefinitionSnapshot[] {
    return SCHEDULE_DEFINITIONS.map((definition) => ({ ...definition, isActive: this.timers.has(definition.jobType) }));
  }
}

type ScheduleDefinitionSnapshot = {
  jobType: JobType;
  cron: string;
  intervalMs: number;
  isActive: boolean;
};
