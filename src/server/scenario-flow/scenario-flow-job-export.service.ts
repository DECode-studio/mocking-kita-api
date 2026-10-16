import { formatDate } from '@/src/core/utils/date';
import {
  ScenarioFlowExecution,
  ScenarioFlowExecutionStep,
  AssertionResult,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { getJobExecutions, GetJobExecutionsParams } from './scenario-flow-job.repository';
import { getExecutionById } from './scenario-flow.repository';

/**
 * Escapes values for standard CSV format
 */
function escapeCsv(val: unknown): string {
  if (val === undefined || val === null) return '""';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates Markdown report for a single execution
 */
export function generateSingleExecutionLogMarkdown(execution: ScenarioFlowExecution, flowName?: string): string {
  const isSuccess = execution.status === 'SUCCESS';
  const steps = execution.steps || [];
  const title = execution.flow?.name || flowName || 'Scenario Flow';
  const envName = execution.environment?.name || 'Default';
  const jobName = execution.job?.name || (execution.executedBy?.startsWith('Job: ') ? execution.executedBy.replace('Job: ', '') : undefined);

  let md = `# 🧪 Test Execution Report: ${title}\n\n`;

  md += `| Attribute | Details |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Status** | ${isSuccess ? '✅ **PASSED**' : '❌ **FAILED**'} |\n`;
  md += `| **Execution ID** | \`${execution.id}\` |\n`;
  md += `| **Date** | ${formatDate(execution.createdAt)} |\n`;
  if (jobName) {
    md += `| **Job Name** | ${jobName} |\n`;
  }
  md += `| **Environment** | ${envName} (${execution.targetMode || 'LIVE'}) |\n`;
  md += `| **Executed By** | ${execution.executedBy || 'User'} |\n`;
  md += `| **Duration** | ${execution.durationMs || 0} ms |\n`;
  md += `| **Steps Passed** | **${execution.passedSteps || 0}** / ${execution.totalSteps || steps.length} |\n\n`;

  if (execution.errorSummary) {
    md += `> ⚠️ **Error Summary:** ${execution.errorSummary}\n\n`;
  }

  md += `## 📋 Steps Overview\n\n`;
  md += `| # | Step Name | Method | Endpoint URL | Status | HTTP Code | Duration |\n`;
  md += `| :-: | :--- | :--- | :--- | :-: | :-: | :-: |\n`;

  for (const step of steps) {
    const statusIcon = step.status === 'SUCCESS' ? '✅' : step.status === 'SKIPPED' ? '⏭️' : '❌';
    const code = step.httpStatusCode ? `\`${step.httpStatusCode}\`` : '-';
    md += `| ${step.stepOrder} | ${step.stepName} | \`${step.method}\` | \`${step.url}\` | ${statusIcon} ${step.status} | ${code} | ${step.durationMs}ms |\n`;
  }

  md += `\n---\n\n`;
  md += `## 🔍 Step Details Breakdown\n\n`;

  for (const step of steps) {
    const statusIcon = step.status === 'SUCCESS' ? '✅ SUCCESS' : step.status === 'SKIPPED' ? '⏭️ SKIPPED' : '❌ FAILED';
    md += `### Step ${step.stepOrder}: ${step.stepName}\n\n`;
    md += `- **Endpoint**: \`${step.method} ${step.url}\`\n`;
    md += `- **Result**: ${statusIcon} (HTTP ${step.httpStatusCode || 'N/A'})\n`;
    md += `- **Execution Time**: ${step.durationMs}ms\n`;

    if (step.errorMessage) {
      md += `- **Error**: \`${step.errorMessage}\`\n`;
    }

    if (step.requestSnapshot) {
      const req = step.requestSnapshot;
      md += `\n#### 📤 Request Sent\n`;
      if (req.headers && Object.keys(req.headers).length > 0) {
        md += `**Headers:**\n\`\`\`json\n${JSON.stringify(req.headers, null, 2)}\n\`\`\`\n`;
      }
      if (req.body !== undefined && req.body !== null) {
        md += `**Body:**\n\`\`\`json\n${typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body}\n\`\`\`\n`;
      }
    }

    if (step.responseSnapshot) {
      const resp = step.responseSnapshot;
      md += `\n#### 📥 Response Received\n`;
      if (resp.body !== undefined && resp.body !== null) {
        md += `\`\`\`json\n${typeof resp.body === 'object' ? JSON.stringify(resp.body, null, 2) : resp.body}\n\`\`\`\n`;
      }
    }

    const assertions = (step.assertionResults as AssertionResult[]) || [];
    if (assertions.length > 0) {
      md += `\n#### 🛡️ Assertions (${assertions.filter((a) => a.passed).length}/${assertions.length} passed)\n\n`;
      md += `| Rule | Operator | Expected | Actual | Result |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      for (const a of assertions) {
        const passIcon = a.passed ? '✅ Pass' : '❌ Fail';
        const ruleName = a.rule?.type + (a.rule?.path ? ` (${a.rule.path})` : '');
        md += `| \`${ruleName}\` | \`${a.rule?.operator}\` | \`${JSON.stringify(a.rule?.expected)}\` | \`${JSON.stringify(a.actual)}\` | ${passIcon} |\n`;
      }
    }

    const extracted = (step.extractedVariables as Record<string, unknown>) || {};
    if (Object.keys(extracted).length > 0) {
      md += `\n#### 🔑 Extracted Variables\n\n`;
      md += `| Variable | Extracted Value |\n`;
      md += `| :--- | :--- |\n`;
      for (const [k, v] of Object.entries(extracted)) {
        md += `| \`${k}\` | \`${typeof v === 'object' ? JSON.stringify(v) : v}\` |\n`;
      }
    }

    md += `\n---\n\n`;
  }

  md += `*Report automatically generated by Mock API Studio on ${new Date().toISOString()}*\n`;
  return md;
}

/**
 * Generates Markdown report for multiple executions
 */
export function generateMultiRunLogMarkdown(executions: ScenarioFlowExecution[], flowName?: string): string {
  const totalRuns = executions.length;
  const title = flowName || executions[0]?.flow?.name || 'Scenario Flow';
  const passedRuns = executions.filter((e) => e.status === 'SUCCESS').length;
  const failedRuns = totalRuns - passedRuns;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;
  const totalDurationMs = executions.reduce((sum, e) => sum + (e.durationMs || 0), 0);
  const firstExec = executions[0];
  const envName = firstExec?.environment?.name || 'Default';
  const targetMode = firstExec?.targetMode || 'LIVE';

  let md = `# 🧪 Multi-Run Test Execution Report: ${title} (${totalRuns} Iterations)\n\n`;

  md += `## 📊 Multi-Run Executive Summary\n\n`;
  md += `| Attribute | Details |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Overall Result** | ${failedRuns === 0 ? '✅ **ALL RUNS PASSED**' : `⚠️ **${passedRuns}/${totalRuns} PASSED** (${failedRuns} failed)`} |\n`;
  md += `| **Total Iterations** | **${totalRuns} runs** |\n`;
  md += `| **Pass Rate** | **${passRate}%** (${passedRuns} passed, ${failedRuns} failed) |\n`;
  md += `| **Date** | ${formatDate(firstExec?.createdAt || new Date().toISOString())} |\n`;
  md += `| **Environment** | ${envName} (${targetMode}) |\n`;
  md += `| **Executed By** | ${firstExec?.executedBy || 'User'} |\n`;
  md += `| **Total Duration** | ${totalDurationMs} ms (avg ~${totalRuns > 0 ? Math.round(totalDurationMs / totalRuns) : 0} ms/run) |\n\n`;

  md += `### 📈 Iteration Runs Summary Table\n\n`;
  md += `| Run # | Job / Source | Status | Steps Passed / Total | Duration | Date | Execution ID |\n`;
  md += `| :-: | :--- | :-: | :-: | :-: | :--- | :--- |\n`;
  executions.forEach((exec, idx) => {
    const isSuccess = exec.status === 'SUCCESS';
    const statusIcon = isSuccess ? '✅ PASSED' : '❌ FAILED';
    const jobName = exec.job?.name || (exec.executedBy?.startsWith('Job: ') ? exec.executedBy.replace('Job: ', '') : exec.executedBy || '-');
    const dateStr = exec.createdAt ? formatDate(exec.createdAt) : '-';
    md += `| **Run #${idx + 1}** | ${jobName} | ${statusIcon} | **${exec.passedSteps || 0}** / ${exec.totalSteps || (exec.steps?.length ?? 0)} | ${exec.durationMs || 0}ms | ${dateStr} | \`${exec.id}\` |\n`;
  });

  md += `\n---\n\n`;
  md += `## 🔍 Iteration Breakdown Details\n\n`;

  executions.forEach((exec, idx) => {
    const isSuccess = exec.status === 'SUCCESS';
    const steps = exec.steps || [];

    md += `### 🏃 Run #${idx + 1} of ${totalRuns} (${isSuccess ? '✅ PASSED' : '❌ FAILED'})\n\n`;
    md += `- **Execution ID**: \`${exec.id}\`\n`;
    md += `- **Status**: ${isSuccess ? '✅ PASSED' : '❌ FAILED'}\n`;
    md += `- **Duration**: ${exec.durationMs || 0} ms\n`;
    md += `- **Steps Passed**: **${exec.passedSteps || 0}** / ${exec.totalSteps || steps.length}\n`;

    if (exec.errorSummary) {
      md += `> ⚠️ **Error Summary:** ${exec.errorSummary}\n\n`;
    }

    md += `\n#### 📋 Steps Overview (Run #${idx + 1})\n\n`;
    md += `| # | Step Name | Method | Endpoint URL | Status | HTTP Code | Duration |\n`;
    md += `| :-: | :--- | :--- | :--- | :-: | :-: | :-: |\n`;

    for (const step of steps) {
      const statusIcon = step.status === 'SUCCESS' ? '✅' : step.status === 'SKIPPED' ? '⏭️' : '❌';
      const code = step.httpStatusCode ? `\`${step.httpStatusCode}\`` : '-';
      md += `| ${step.stepOrder} | ${step.stepName} | \`${step.method}\` | \`${step.url}\` | ${statusIcon} ${step.status} | ${code} | ${step.durationMs}ms |\n`;
    }

    md += `\n#### 🔍 Step Details Breakdown (Run #${idx + 1})\n\n`;

    for (const step of steps) {
      const statusIcon = step.status === 'SUCCESS' ? '✅ SUCCESS' : step.status === 'SKIPPED' ? '⏭️ SKIPPED' : '❌ FAILED';
      md += `##### Step ${step.stepOrder}: ${step.stepName}\n\n`;
      md += `- **Endpoint**: \`${step.method} ${step.url}\`\n`;
      md += `- **Result**: ${statusIcon} (HTTP ${step.httpStatusCode || 'N/A'})\n`;
      md += `- **Execution Time**: ${step.durationMs}ms\n`;

      if (step.errorMessage) {
        md += `- **Error**: \`${step.errorMessage}\`\n`;
      }

      if (step.requestSnapshot) {
        const req = step.requestSnapshot;
        md += `\n###### 📤 Request Sent\n`;
        if (req.headers && Object.keys(req.headers).length > 0) {
          md += `**Headers:**\n\`\`\`json\n${JSON.stringify(req.headers, null, 2)}\n\`\`\`\n`;
        }
        if (req.body !== undefined && req.body !== null) {
          md += `**Body:**\n\`\`\`json\n${typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body}\n\`\`\`\n`;
        }
      }

      if (step.responseSnapshot) {
        const resp = step.responseSnapshot;
        md += `\n###### 📥 Response Received\n`;
        if (resp.body !== undefined && resp.body !== null) {
          md += `\`\`\`json\n${typeof resp.body === 'object' ? JSON.stringify(resp.body, null, 2) : resp.body}\n\`\`\`\n`;
        }
      }

      const assertions = (step.assertionResults as AssertionResult[]) || [];
      if (assertions.length > 0) {
        md += `\n###### 🛡️ Assertions (${assertions.filter((a) => a.passed).length}/${assertions.length} passed)\n\n`;
        md += `| Rule | Operator | Expected | Actual | Result |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- |\n`;
        for (const a of assertions) {
          const passIcon = a.passed ? '✅ Pass' : '❌ Fail';
          const ruleName = a.rule?.type + (a.rule?.path ? ` (${a.rule.path})` : '');
          md += `| \`${ruleName}\` | \`${a.rule?.operator}\` | \`${JSON.stringify(a.rule?.expected)}\` | \`${JSON.stringify(a.actual)}\` | ${passIcon} |\n`;
        }
      }

      const extracted = (step.extractedVariables as Record<string, unknown>) || {};
      if (Object.keys(extracted).length > 0) {
        md += `\n###### 🔑 Extracted Variables\n\n`;
        md += `| Variable | Extracted Value |\n`;
        md += `| :--- | :--- |\n`;
        for (const [k, v] of Object.entries(extracted)) {
          md += `| \`${k}\` | \`${typeof v === 'object' ? JSON.stringify(v) : v}\` |\n`;
        }
      }

      md += `\n`;
    }

    md += `---\n\n`;
  });

  md += `*Report automatically generated by Mock API Studio on ${new Date().toISOString()}*\n`;
  return md;
}

/**
 * Generates CSV report for a single execution
 */
export function generateSingleExecutionLogCsv(execution: ScenarioFlowExecution, _flowName?: string): string {
  const steps = execution.steps || [];
  const headers = [
    'Step Order',
    'Step Name',
    'Method',
    'Endpoint URL',
    'Status',
    'HTTP Status Code',
    'Duration (ms)',
    'Error Message',
    'Assertions Total',
    'Assertions Passed',
    'Assertions Failed',
    'Extracted Variables',
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => `"${h}"`).join(','));

  for (const step of steps) {
    const assertions = (step.assertionResults as AssertionResult[]) || [];
    const passedAssertions = assertions.filter((a) => a.passed).length;
    const failedAssertions = assertions.length - passedAssertions;
    const extracted = step.extractedVariables ? JSON.stringify(step.extractedVariables) : '';

    const row = [
      escapeCsv(step.stepOrder),
      escapeCsv(step.stepName),
      escapeCsv(step.method),
      escapeCsv(step.url),
      escapeCsv(step.status),
      escapeCsv(step.httpStatusCode || ''),
      escapeCsv(step.durationMs || 0),
      escapeCsv(step.errorMessage || ''),
      escapeCsv(assertions.length),
      escapeCsv(passedAssertions),
      escapeCsv(failedAssertions),
      escapeCsv(extracted),
    ];

    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}

/**
 * Generates CSV report for multiple executions
 */
export function generateMultiRunLogCsv(executions: ScenarioFlowExecution[], _flowName?: string): string {
  const headers = [
    'Run #',
    'Execution ID',
    'Job Name',
    'Flow Name',
    'Environment',
    'Execution Time',
    'Step Order',
    'Step Name',
    'Method',
    'Endpoint URL',
    'Status',
    'HTTP Status Code',
    'Duration (ms)',
    'Error Message',
    'Assertions Total',
    'Assertions Passed',
    'Assertions Failed',
    'Extracted Variables',
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => `"${h}"`).join(','));

  executions.forEach((exec, execIdx) => {
    const runLabel = `Run #${execIdx + 1}`;
    const jobName = exec.job?.name || (exec.executedBy?.startsWith('Job: ') ? exec.executedBy.replace('Job: ', '') : '-');
    const flowName = exec.flow?.name || _flowName || '-';
    const envName = exec.environment?.name || 'Default';
    const execTime = exec.createdAt ? formatDate(exec.createdAt) : '-';
    const steps = exec.steps || [];

    if (steps.length === 0) {
      rows.push(
        [
          escapeCsv(runLabel),
          escapeCsv(exec.id),
          escapeCsv(jobName),
          escapeCsv(flowName),
          escapeCsv(envName),
          escapeCsv(execTime),
          escapeCsv('-'),
          escapeCsv('No steps recorded'),
          escapeCsv('-'),
          escapeCsv('-'),
          escapeCsv(exec.status),
          escapeCsv(''),
          escapeCsv(exec.durationMs || 0),
          escapeCsv(exec.errorSummary || ''),
          escapeCsv(0),
          escapeCsv(0),
          escapeCsv(0),
          escapeCsv(''),
        ].join(',')
      );
      return;
    }

    for (const step of steps) {
      const assertions = (step.assertionResults as AssertionResult[]) || [];
      const passedAssertions = assertions.filter((a) => a.passed).length;
      const failedAssertions = assertions.length - passedAssertions;
      const extracted = step.extractedVariables ? JSON.stringify(step.extractedVariables) : '';

      const row = [
        escapeCsv(runLabel),
        escapeCsv(exec.id),
        escapeCsv(jobName),
        escapeCsv(flowName),
        escapeCsv(envName),
        escapeCsv(execTime),
        escapeCsv(step.stepOrder),
        escapeCsv(step.stepName),
        escapeCsv(step.method),
        escapeCsv(step.url),
        escapeCsv(step.status),
        escapeCsv(step.httpStatusCode || ''),
        escapeCsv(step.durationMs || 0),
        escapeCsv(step.errorMessage || ''),
        escapeCsv(assertions.length),
        escapeCsv(passedAssertions),
        escapeCsv(failedAssertions),
        escapeCsv(extracted),
      ];

      rows.push(row.join(','));
    }
  });

  return rows.join('\r\n');
}

/**
 * Server-side Orchestrator to export job executions as Markdown or CSV
 */
export async function exportJobExecutionsReport(params: {
  format: 'md' | 'csv';
  executionId?: string;
  flowId?: string;
  projectId?: string;
  jobId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  flowName?: string;
}) {
  const format = params.format === 'csv' ? 'csv' : 'md';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Single execution export
  if (params.executionId) {
    const single = await getExecutionById(params.executionId);
    if (!single) {
      throw new Error(`Execution ${params.executionId} not found`);
    }

    const flowTitle = single.flow?.name || params.flowName || 'Scenario-Flow';
    const safeTitle = flowTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const filename = `${safeTitle}-execution-${params.executionId.slice(0, 8)}-${timestamp}.${format}`;

    const content =
      format === 'md'
        ? generateSingleExecutionLogMarkdown(single as unknown as ScenarioFlowExecution, flowTitle)
        : generateSingleExecutionLogCsv(single as unknown as ScenarioFlowExecution, flowTitle);

    const contentType = format === 'md' ? 'text/markdown; charset=utf-8' : 'text/csv; charset=utf-8';
    return { content, filename, contentType };
  }

  // Multi-run or filtered executions export
  const queryParams: GetJobExecutionsParams = {
    flowId: params.flowId,
    projectId: params.projectId,
    jobId: params.jobId,
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
    page: 1,
    limit: 1000,
  };

  const { items } = await getJobExecutions(queryParams);

  const flowTitle = params.flowName || items[0]?.flow?.name || 'Scenario-Flow';
  const safeTitle = flowTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  const filename = `${safeTitle}-${items.length}-runs-${timestamp}.${format}`;

  let content = '';
  if (items.length === 0) {
    content = format === 'md' ? `# No Executions Found\n\nNo execution logs match the criteria.` : 'No executions found';
  } else if (items.length === 1) {
    content =
      format === 'md'
        ? generateSingleExecutionLogMarkdown(items[0] as unknown as ScenarioFlowExecution, flowTitle)
        : generateSingleExecutionLogCsv(items[0] as unknown as ScenarioFlowExecution, flowTitle);
  } else {
    content =
      format === 'md'
        ? generateMultiRunLogMarkdown(items as unknown as ScenarioFlowExecution[], flowTitle)
        : generateMultiRunLogCsv(items as unknown as ScenarioFlowExecution[], flowTitle);
  }

  const contentType = format === 'md' ? 'text/markdown; charset=utf-8' : 'text/csv; charset=utf-8';
  return { content, filename, contentType };
}

