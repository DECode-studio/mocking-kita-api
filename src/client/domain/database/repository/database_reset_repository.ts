export interface DatabaseResetRepository {
  resetDatabase(): Promise<void>;
}
