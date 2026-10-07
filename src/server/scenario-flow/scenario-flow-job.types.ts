export type JobStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type JobScheduleType = 'CRON' | 'INTERVAL' | 'ONCE';
export type JobStopCondition = 'FOREVER' | 'MAX_ITERATIONS' | 'UNTIL_DATE' | 'DATASHEET_EXHAUSTED';
export type JobDataSourceType = 'NONE' | 'STATIC' | 'DATASHEET';
export type JobDataIterationMode = 'PER_TICK' | 'BATCH_ALL';
export type JobTargetMode = 'LIVE' | 'MOCK';

export interface ScenarioFlowJobInput {
  id?: string;
  projectId?: string | null;
  flowId: string;
  environmentId?: string | null;
  name: string;
  description?: string | null;
  status?: JobStatus;
  scheduleType: JobScheduleType;
  cronExpression?: string | null;
  intervalSeconds?: number | null;
  scheduledAt?: string | Date | null;
  targetMode?: JobTargetMode;
  stopCondition: JobStopCondition;
  maxIterations?: number | null;
  endAt?: string | Date | null;
  dataSourceType: JobDataSourceType;
  dataSheetId?: string | null;
  dataIterationMode?: JobDataIterationMode;
  customVariables?: Record<string, any> | null;
}

export interface ScenarioFlowJobEntity {
  id: string;
  projectId: string | null;
  flowId: string;
  environmentId: string | null;
  name: string;
  description: string | null;
  status: JobStatus;
  scheduleType: JobScheduleType;
  cronExpression: string | null;
  intervalSeconds: number | null;
  scheduledAt: Date | null;
  targetMode: JobTargetMode;
  stopCondition: JobStopCondition;
  maxIterations: number | null;
  currentIteration: number;
  endAt: Date | null;
  dataSourceType: JobDataSourceType;
  dataSheetId: string | null;
  dataIterationMode: JobDataIterationMode;
  dataSheetCurrentIndex: number;
  customVariables: any;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastStatus: string | null;
  lastError: string | null;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  flow?: {
    id: string;
    name: string;
  };
  environment?: {
    id: string;
    name: string;
  } | null;
  dataSheet?: {
    id: string;
    name: string;
    code: string;
  } | null;
}
