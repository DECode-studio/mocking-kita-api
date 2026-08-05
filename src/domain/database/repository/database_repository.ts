export interface DatabaseRepository {
  resetDatabase(): Promise<void>;
}
