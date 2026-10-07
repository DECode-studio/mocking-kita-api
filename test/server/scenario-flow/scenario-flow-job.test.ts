import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flowJobScheduler } from '@/src/server/scenario-flow/scenario-flow-job.scheduler';

describe('ScenarioFlowJobScheduler', () => {
  it('should correctly calculate next run date for CRON expression', () => {
    // Every 5 minutes: */5 * * * *
    const nextDate = flowJobScheduler.getNextRunDate('CRON', '*/5 * * * *');
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should return null for invalid CRON expression', () => {
    const nextDate = flowJobScheduler.getNextRunDate('CRON', 'invalid cron');
    expect(nextDate).toBeNull();
  });

  it('should correctly calculate next run date for INTERVAL schedule', () => {
    const nextDate = flowJobScheduler.getNextRunDate('INTERVAL', null, 300);
    expect(nextDate).toBeInstanceOf(Date);
    // Difference should be approx 300 seconds
    const diff = Math.round((nextDate!.getTime() - Date.now()) / 1000);
    expect(diff).toBeGreaterThanOrEqual(299);
    expect(diff).toBeLessThanOrEqual(301);
  });

  it('should correctly calculate next run date for ONCE schedule in future', () => {
    const futureDate = new Date(Date.now() + 60000);
    const nextDate = flowJobScheduler.getNextRunDate('ONCE', null, null, futureDate);
    expect(nextDate).toEqual(futureDate);
  });

  it('should return null for ONCE schedule in past', () => {
    const pastDate = new Date(Date.now() - 60000);
    const nextDate = flowJobScheduler.getNextRunDate('ONCE', null, null, pastDate);
    expect(nextDate).toBeNull();
  });
});
