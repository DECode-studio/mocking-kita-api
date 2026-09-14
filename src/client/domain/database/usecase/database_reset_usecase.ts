export interface DatabaseResetUseCase {
  resetDatabase(): Promise<void>;
}

