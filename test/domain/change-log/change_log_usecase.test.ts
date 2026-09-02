import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeLogUseCaseImpl } from '@/src/domain/change-log/usecase/change_log_usecase';
import { ChangeLogRepository } from '@/src/domain/change-log/repository/change_log_repository';
import { ChangeLog } from '@/src/domain/change-log/entity/change_log';

describe('ChangeLogUseCaseImpl', () => {
  let repository: Partial<ChangeLogRepository>;
  let useCase: ChangeLogUseCaseImpl;

  const mockLog: ChangeLog = {
    id: 'log-1',
    action: 'CREATE',
    entity_type: 'project',
    entity_id: 'proj-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    operator: 'Admin',
    description: 'Created project',
    before_state: null,
    after_state: null,
    metadata: null,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      getChangeLogs: vi.fn(),
    };
    useCase = new ChangeLogUseCaseImpl(repository as ChangeLogRepository);
  });

  it('should delegate getChangeLogs to repository', async () => {
    const params = { limit: 10, offset: 0, search: 'project' };
    const expectedRes = { changeLogs: [mockLog], totalCount: 1 };
    (repository.getChangeLogs as any).mockResolvedValue(expectedRes);

    const result = await useCase.getChangeLogs(params);

    expect(repository.getChangeLogs).toHaveBeenCalledWith(params);
    expect(result).toEqual(expectedRes);
  });
});
