import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Live Database Verification (Matrix Model)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should verify consolidated environment matrix records in Neon DB', async () => {
    const environments = await prisma.environment.findMany({
      orderBy: { name: 'asc' },
      include: {
        apiEnvironments: true,
      },
    });

    expect(environments.length).toBeGreaterThan(0);

    for (const env of environments) {
      // 1. isBaseUrl must be a boolean
      expect(typeof env.isBaseUrl).toBe('boolean');

      // 2. values must be an object
      expect(env.values).toBeDefined();
      expect(typeof env.values).toBe('object');
      const valuesMap = env.values as Record<string, any>;

      // 3. Rule check: If isBaseUrl is true, LOCAL must be null or absent
      if (env.isBaseUrl) {
        expect(valuesMap.LOCAL).toBeNull();
      }

      // 4. Check that at least one stage has a valid string value
      const hasAnyStage = Object.entries(valuesMap).some(
        ([stage, val]) => stage !== 'LOCAL' && typeof val === 'string' && val.length > 0
      );
      expect(hasAnyStage).toBe(true);
    }
  }, 20000);

  it('should verify deduplicated apiEnvironment links in Neon DB', async () => {
    const apiEnvironments = await prisma.apiEnvironment.findMany();
    expect(apiEnvironments.length).toBeGreaterThan(0);

    // Verify there are no duplicate (apiId, environmentId) pairs
    const seenPairs = new Set<string>();
    for (const link of apiEnvironments) {
      const pair = `${link.apiId}:${link.environmentId}`;
      expect(seenPairs.has(pair)).toBe(false);
      seenPairs.add(pair);
    }
  }, 20000);
});
