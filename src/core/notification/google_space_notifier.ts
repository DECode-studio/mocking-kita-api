import prisma from '@/src/core/db/prisma-client';
import { ENV } from '@/src/core/constants/env';

export interface NotificationPayload {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'EXPORT' | 'RESET';
  entityType: 'project' | 'collection' | 'api' | 'request_scenario' | 'response_scenario' | 'database' | 'environment' | 'scenario_flow' | 'data_sheet';
  entityId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  operator?: string | null;
  description?: string | null;
  beforeState?: any;
  afterState?: any;
  metadata?: any;
}

const ICONS = {
  PROJECT: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
  COLLECTION: 'https://cdn-icons-png.flaticon.com/512/3767/3767084.png',
  ENVIRONMENT: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
  API: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
  REQUEST_SCENARIO: 'https://cdn-icons-png.flaticon.com/512/2164/2164832.png',
  RESPONSE_JSON: 'https://cdn-icons-png.flaticon.com/512/136/136525.png',
  RESPONSE_FILE: 'https://cdn-icons-png.flaticon.com/512/2965/2965335.png',
  RESPONSE_IMAGE: 'https://cdn-icons-png.flaticon.com/512/3342/3342137.png',
  OPENAPI_IMPORT: 'https://cdn-icons-png.flaticon.com/512/875/875615.png',
  DATABASE: 'https://cdn-icons-png.flaticon.com/512/4248/4248443.png',
  SCENARIO_FLOW: 'https://cdn-icons-png.flaticon.com/512/2620/2620582.png',
  DATA_SHEET: 'https://cdn-icons-png.flaticon.com/512/2965/2965300.png',
};

function isImageResponse(state: any): boolean {
  if (!state) return false;
  if (state.responseType !== 'FILE') return false;
  const target = (state.fileName || state.filePath || '').toLowerCase();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'];
  if (imageExtensions.some((ext) => target.endsWith(ext))) {
    return true;
  }
  if (state.headers && typeof state.headers === 'object') {
    const contentType = (state.headers['content-type'] || state.headers['Content-Type'] || '') as string;
    if (typeof contentType === 'string' && contentType.toLowerCase().startsWith('image/')) {
      return true;
    }
  }
  return false;
}

/**
 * Sends a pure Card v2 notification (without chat balloon container) to Google Space webhook when target operations occur:
 * - Create, update, and delete on Project, Collection, Environment, Api, Request Scenario, Response Scenario, Scenario Flow, Database
 */
export async function sendGoogleSpaceNotification(payload: NotificationPayload): Promise<void> {
  const webhookUrl = ENV.GOOGLE_SPACE_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) {
    return;
  }

  const { action, entityType, entityId, projectId, userId, operator, description, beforeState, afterState, metadata } = payload;

  // Filter triggers:
  // Data mutations and database maintenance operations should broadcast.
  if (!['CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'EXPORT', 'RESET'].includes(action)) {
    return;
  }

  const targetEntities = ['project', 'collection', 'environment', 'api', 'request_scenario', 'response_scenario', 'database', 'scenario_flow', 'data_sheet'];
  const isTargetEntity = targetEntities.includes(entityType);

  if (!isTargetEntity) {
    return;
  }

  // Determine Action Emoji, Title and Accent Color
  let actionTitle = action as string;

  switch (action) {
    case 'CREATE':
      actionTitle = 'CREATE';
      break;
    case 'UPDATE':
      actionTitle = 'UPDATE';
      break;
    case 'DELETE':
      actionTitle = 'DELETE';
      break;
    case 'IMPORT':
      actionTitle = 'IMPORT';
      break;
    case 'EXPORT':
      actionTitle = 'EXPORT';
      break;
    case 'RESET':
      actionTitle = 'RESET';
      break;
  }

  // Extract Entity Target Name / Info
  const state = afterState || beforeState || {};
  let targetInfo = state.name || '';
  if (entityType === 'api') {
    const method = state.methodRequest || '';
    const path = state.path || '';
    if (method || path) {
      targetInfo = `${targetInfo ? `${targetInfo} ` : ''}(\`${method} ${path}\`)`.trim();
    }
  } else if (entityType === 'response_scenario' && state.statusCode) {
    targetInfo = `${targetInfo ? `${targetInfo} ` : ''}(HTTP ${state.statusCode})`.trim();
  }

  // Friendly Entity Type Label & Card Header Icon
  let entityLabel = entityType as string;
  let cardHeaderImageUrl = ICONS.PROJECT;

  switch (entityType) {
    case 'project':
      entityLabel = 'Project';
      cardHeaderImageUrl = ICONS.PROJECT;
      break;
    case 'collection':
      entityLabel = 'Collection';
      cardHeaderImageUrl = ICONS.COLLECTION;
      break;
    case 'environment':
      entityLabel = 'Environment';
      cardHeaderImageUrl = ICONS.ENVIRONMENT;
      break;
    case 'api':
      entityLabel = 'API';
      cardHeaderImageUrl = ICONS.API;
      break;
    case 'request_scenario':
      entityLabel = 'Request Scenario';
      cardHeaderImageUrl = ICONS.REQUEST_SCENARIO;
      break;
    case 'scenario_flow':
      entityLabel = 'Scenario Flow';
      cardHeaderImageUrl = ICONS.SCENARIO_FLOW;
      break;
    case 'data_sheet':
      entityLabel = 'Data Sheet';
      cardHeaderImageUrl = ICONS.DATA_SHEET;
      break;
    case 'response_scenario': {
      const isFile = state.responseType === 'FILE';
      const isImage = isImageResponse(state);
      if (isImage) {
        entityLabel = 'Response (Image)';
        cardHeaderImageUrl = ICONS.RESPONSE_IMAGE;
      } else if (isFile) {
        entityLabel = 'Response (File)';
        cardHeaderImageUrl = ICONS.RESPONSE_FILE;
      } else {
        entityLabel = 'Response Scenario';
        cardHeaderImageUrl = ICONS.RESPONSE_JSON;
      }
      break;
    }
    case 'database':
      entityLabel = 'Database';
      cardHeaderImageUrl = ICONS.DATABASE;
      targetInfo = targetInfo || metadata?.fileName || metadata?.format || 'Database';
      break;
  }

  // Resolve Project Name if available
  let projectName = '';
  const resolvedProjectId = projectId || state.projectId;
  if (resolvedProjectId) {
    try {
      const proj = await prisma.project.findUnique({
        where: { id: resolvedProjectId },
        select: { name: true },
      });
      if (proj) {
        projectName = proj.name;
      }
    } catch {
      // Ignore DB query errors for project name
    }
  }

  // Resolve Executed By / User Information
  let userName = '';
  let userHandle = '';

  if (userId) {
    try {
      const acc = await prisma.account.findUnique({
        where: { id: userId },
        select: { username: true, name: true },
      });
      if (acc) {
        userName = acc.name;
        userHandle = acc.username;
      }
    } catch {
      // Ignore DB query errors for user
    }
  }

  if (!userName && operator && operator !== 'system') {
    try {
      const acc = await prisma.account.findUnique({
        where: { username: operator.toLowerCase() },
        select: { username: true, name: true },
      });
      if (acc) {
        userName = acc.name;
        userHandle = acc.username;
      }
    } catch {
      // Ignore DB query errors for user
    }
  }

  if (!userName) {
    userName = operator || 'System';
  }

  // Resolve PIC(s) for Project and API
  interface PicUser {
    id: string;
    name: string;
    username: string;
    googleId?: string | null;
    source: 'Project' | 'API';
  }

  const picMap = new Map<string, PicUser>();

  const resolvePicFromAccount = async (picIdOrAcc: string | any, source: 'Project' | 'API') => {
    if (!picIdOrAcc) return;
    if (Array.isArray(picIdOrAcc)) {
      for (const item of picIdOrAcc) {
        await resolvePicFromAccount(item, source);
      }
      return;
    }
    if (typeof picIdOrAcc === 'object' && (picIdOrAcc.id || picIdOrAcc.account)) {
      const acc = picIdOrAcc.account || picIdOrAcc;
      if (acc && acc.id) {
        picMap.set(acc.id, {
          id: acc.id,
          name: acc.name || acc.username,
          username: acc.username,
          googleId: acc.googleId || null,
          source,
        });
      }
      return;
    }
    if (typeof picIdOrAcc === 'string') {
      try {
        const acc = await prisma.account.findUnique({
          where: { id: picIdOrAcc },
          select: { id: true, name: true, username: true, googleId: true },
        });
        if (acc) {
          picMap.set(acc.id, {
            id: acc.id,
            name: acc.name,
            username: acc.username,
            googleId: acc.googleId,
            source,
          });
        }
      } catch {
        // Ignore DB query errors for PIC
      }
    }
  };

  // 1. If entity is Project
  if (entityType === 'project') {
    const picTargets = state.pics || state.picIds || (beforeState && (beforeState.pics || beforeState.picIds));
    if (picTargets && (Array.isArray(picTargets) ? picTargets.length > 0 : true)) {
      await resolvePicFromAccount(picTargets, 'Project');
    } else if (entityId || resolvedProjectId) {
      try {
        const proj = await prisma.project.findUnique({
          where: { id: (entityId || resolvedProjectId)! },
          select: { pics: { select: { account: { select: { id: true, name: true, username: true, googleId: true } } } } },
        });
        if (proj?.pics) {
          await resolvePicFromAccount(proj.pics, 'Project');
        }
      } catch {
        // Ignore DB query errors for project pic
      }
    }
  }

  // 2. If entity is API (or scenario belonging to an API)
  if (entityType === 'api' || entityType === 'request_scenario' || entityType === 'response_scenario') {
    // Check API PIC
    const apiPicTargets = state.pics || state.picIds || (beforeState && (beforeState.pics || beforeState.picIds));
    if (apiPicTargets && (Array.isArray(apiPicTargets) ? apiPicTargets.length > 0 : true)) {
      await resolvePicFromAccount(apiPicTargets, 'API');
    } else if (entityType === 'api' && entityId) {
      try {
        const apiData = await prisma.api.findUnique({
          where: { id: entityId },
          select: { pics: { select: { account: { select: { id: true, name: true, username: true, googleId: true } } } } },
        });
        if (apiData?.pics) {
          await resolvePicFromAccount(apiData.pics, 'API');
        }
      } catch {
        // Ignore DB query errors for api pic
      }
    }

    // Check Project PIC
    if (resolvedProjectId) {
      try {
        const proj = await prisma.project.findUnique({
          where: { id: resolvedProjectId },
          select: { pics: { select: { account: { select: { id: true, name: true, username: true, googleId: true } } } } },
        });
        if (proj?.pics) {
          await resolvePicFromAccount(proj.pics, 'Project');
        }
      } catch {
        // Ignore DB query errors for project pic
      }
    }
  } else if (entityType !== 'project' && resolvedProjectId) {
    // 3. For other non-project entities (Scenario Flow, Collection, Environment) resolve Project PIC if linked
    try {
      const proj = await prisma.project.findUnique({
        where: { id: resolvedProjectId },
        select: { pics: { select: { account: { select: { id: true, name: true, username: true, googleId: true } } } } },
      });
      if (proj?.pics) {
        await resolvePicFromAccount(proj.pics, 'Project');
      }
    } catch {
      // Ignore DB query errors for project pic
    }
  }

  const pics = Array.from(picMap.values());
  const googleMentions: string[] = [];
  const picDisplayTexts: string[] = [];

  for (const pic of pics) {
    if (pic.googleId) {
      googleMentions.push(`<users/${pic.googleId}>`);
      picDisplayTexts.push(`${pic.name} (<users/${pic.googleId}>) [${pic.source}]`);
    } else {
      picDisplayTexts.push(`${pic.name} (@${pic.username}) [${pic.source}]`);
    }
  }

  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const cardHeaderTitle = `[${actionTitle}] ${entityLabel}: "${targetInfo || projectName || 'Untitled'}"`;
  const cardHeaderSubtitle = `Executed by ${userName}${userHandle ? ` (@${userHandle})` : ''}`;

  // Build Card v2 Payload for Google Space UI (Pure Card Layout)
  const cardWidgets: any[] = [
    {
      decoratedText: {
        topLabel: 'ENTITY',
        text: `<b>${entityLabel}</b>`,
        startIcon: { knownIcon: 'STAR' },
      },
    },
  ];

  if (targetInfo) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'TARGET',
        text: `<b>${targetInfo}</b>`,
        startIcon: { knownIcon: 'BOOKMARK' },
      },
    });
  }

  if (entityType === 'response_scenario' && state.responseType === 'FILE') {
    const isImage = isImageResponse(state);
    const attachmentName = state.fileName || state.filePath;
    if (attachmentName) {
      cardWidgets.push({
        decoratedText: {
          topLabel: isImage ? 'IMAGE ATTACHMENT' : 'FILE ATTACHMENT',
          text: `<code>${attachmentName}</code>`,
          startIcon: { knownIcon: 'DESCRIPTION' },
        },
      });
    }
  }

  if (entityType !== 'project' && projectName && projectName !== targetInfo) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'PROJECT',
        text: `<b>${projectName}</b>`,
        startIcon: { knownIcon: 'DESCRIPTION' },
      },
    });
  }

  if (pics.length > 0) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'PIC (PERSON IN CHARGE)',
        text: picDisplayTexts.join(', '),
        startIcon: { knownIcon: 'MEMBERSHIP' },
      },
    });
  }

  cardWidgets.push({
    decoratedText: {
      topLabel: 'EXECUTED BY',
      text: userHandle ? `${userName} (<code>${userHandle}</code>)` : `${userName}`,
      startIcon: { knownIcon: 'PERSON' },
    },
  });

  if (description) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'DETAILS',
        text: description,
        startIcon: { knownIcon: 'DESCRIPTION' },
      },
    });
  }

  cardWidgets.push({
    decoratedText: {
      topLabel: 'TIMESTAMP',
      text: `${timestamp} WIB`,
      startIcon: { knownIcon: 'CLOCK' },
    },
  });

  const cardsV2 = [
    {
      cardId: 'mockApiStudioNotificationCard',
      card: {
        header: {
          title: cardHeaderTitle,
          subtitle: cardHeaderSubtitle,
          imageUrl: cardHeaderImageUrl,
          imageType: 'CIRCLE',
        },
        sections: [
          {
            widgets: cardWidgets,
          },
        ],
      },
    },
  ];

  try {
    const requestBody: Record<string, any> = {
      cardsV2: cardsV2,
    };

    // If there are Google user mentions, include top-level text to trigger active notification ping
    if (googleMentions.length > 0) {
      requestBody.text = `${googleMentions.join(' ')} - [${actionTitle}] ${entityLabel}: "${targetInfo || projectName || 'Untitled'}"`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });

    if (!response.ok) {
      console.error(`[GoogleSpaceNotifier] Webhook returned status ${response.status}`);
    }
  } catch (error: any) {
    console.error('[GoogleSpaceNotifier] Failed to send notification to Google Space:', error?.message || error);
  }
}

export interface JobFailureNotificationPayload {
  jobId: string;
  jobName: string;
  flowId: string;
  flowName: string;
  projectId?: string | null;
  environmentName?: string | null;
  iteration: number;
  totalIterations?: number | null;
  failedStepName?: string | null;
  failedStepOrder?: number | null;
  failedStepUrl?: string | null;
  failedStepMethod?: string | null;
  httpStatusCode?: number | null;
  errorMessage: string;
  scheduleType?: string | null;
  cronExpression?: string | null;
}

/**
 * Sends a high-priority failure alert card to Google Space when a scheduled Scenario Flow Job fails or encounters errors.
 */
export async function sendJobFailureGoogleSpaceNotification(
  payload: JobFailureNotificationPayload
): Promise<void> {
  const webhookUrl = ENV.GOOGLE_SPACE_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) {
    return;
  }

  const {
    jobName,
    flowName,
    projectId,
    environmentName,
    iteration,
    failedStepName,
    failedStepOrder,
    failedStepUrl,
    failedStepMethod,
    httpStatusCode,
    errorMessage,
    scheduleType,
    cronExpression,
  } = payload;

  // Resolve Project PIC(s)
  interface PicUser {
    id: string;
    name: string;
    username: string;
    googleId?: string | null;
  }

  const picMap = new Map<string, PicUser>();
  let projectName = '';

  if (projectId) {
    try {
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          pics: {
            select: {
              account: {
                select: { id: true, name: true, username: true, googleId: true },
              },
            },
          },
        },
      });
      if (proj) {
        projectName = proj.name;
        if (proj.pics) {
          for (const picItem of proj.pics) {
            const acc = picItem.account;
            if (acc) {
              picMap.set(acc.id, {
                id: acc.id,
                name: acc.name || acc.username,
                username: acc.username,
                googleId: acc.googleId || null,
              });
            }
          }
        }
      }
    } catch {
      // Ignore DB query errors
    }
  }

  const pics = Array.from(picMap.values());
  const googleMentions: string[] = [];
  const picDisplayTexts: string[] = [];

  for (const pic of pics) {
    if (pic.googleId) {
      googleMentions.push(`<users/${pic.googleId}>`);
      picDisplayTexts.push(`${pic.name} (<users/${pic.googleId}>)`);
    } else {
      picDisplayTexts.push(`${pic.name} (@${pic.username})`);
    }
  }

  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const cardHeaderTitle = `🚨 [JOB FAILURE] Flow: "${flowName}"`;
  const cardHeaderSubtitle = `Job "${jobName}" failed at iteration #${iteration}`;
  const alertIconUrl = 'https://cdn-icons-png.flaticon.com/512/564/564619.png';

  const cardWidgets: any[] = [
    {
      decoratedText: {
        topLabel: 'FLOW & JOB',
        text: `<b>${flowName}</b> (Job: <code>${jobName}</code>)`,
        startIcon: { knownIcon: 'STAR' },
      },
    },
    {
      decoratedText: {
        topLabel: 'TRIGGER SCHEDULE',
        text: scheduleType === 'CRON' ? `CRON: <code>${cronExpression || '* * * * *'}</code>` : `${scheduleType || 'SCHEDULED'}`,
        startIcon: { knownIcon: 'CLOCK' },
      },
    },
  ];

  if (projectName) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'PROJECT',
        text: `<b>${projectName}</b>`,
        startIcon: { knownIcon: 'BOOKMARK' },
      },
    });
  }

  if (environmentName) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'TARGET ENVIRONMENT',
        text: `<b>${environmentName}</b>`,
        startIcon: { knownIcon: 'MAP_PIN' },
      },
    });
  }

  if (failedStepName || failedStepOrder) {
    const stepDetail = failedStepOrder ? `Step #${failedStepOrder}: ${failedStepName || ''}` : failedStepName;
    const httpInfo = failedStepMethod && failedStepUrl ? ` [<code>${failedStepMethod} ${failedStepUrl}</code>]` : '';
    const statusText = httpStatusCode ? ` (HTTP ${httpStatusCode})` : '';

    cardWidgets.push({
      decoratedText: {
        topLabel: 'FAILED STEP',
        text: `<b>${stepDetail}</b>${statusText}${httpInfo}`,
        startIcon: { knownIcon: 'DESCRIPTION' },
      },
    });
  }

  cardWidgets.push({
    decoratedText: {
      topLabel: 'ERROR DETAILS',
      text: `<font color="#d93025"><b>${errorMessage}</b></font>`,
      startIcon: { knownIcon: 'BUS' },
    },
  });

  if (pics.length > 0) {
    cardWidgets.push({
      decoratedText: {
        topLabel: 'PIC(S) NOTIFIED',
        text: picDisplayTexts.join(', '),
        startIcon: { knownIcon: 'MEMBERSHIP' },
      },
    });
  }

  cardWidgets.push({
    decoratedText: {
      topLabel: 'TIMESTAMP',
      text: `${timestamp} WIB`,
      startIcon: { knownIcon: 'CLOCK' },
    },
  });

  const cardsV2 = [
    {
      cardId: 'mockApiStudioJobFailureCard',
      card: {
        header: {
          title: cardHeaderTitle,
          subtitle: cardHeaderSubtitle,
          imageUrl: alertIconUrl,
          imageType: 'CIRCLE',
        },
        sections: [
          {
            widgets: cardWidgets,
          },
        ],
      },
    },
  ];

  try {
    const requestBody: Record<string, any> = {
      cardsV2,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`[GoogleSpaceNotifier] Job failure webhook returned status ${response.status}`);
    }
  } catch (error: any) {
    console.error('[GoogleSpaceNotifier] Failed to send job failure alert to Google Space:', error?.message || error);
  }
}

