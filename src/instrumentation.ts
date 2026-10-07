export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { flowJobScheduler } = await import('@/src/server/scenario-flow/scenario-flow-job.scheduler');
    await flowJobScheduler.init();
  }
}
