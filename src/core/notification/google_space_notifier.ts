import prisma from '@/src/core/db/prisma-client';

export interface NotificationPayload {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'RESET';
  entityType: 'project' | 'collection' | 'api' | 'request_scenario' | 'response_scenario' | 'database' | 'environment';
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
  API: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
  REQUEST_SCENARIO: 'https://cdn-icons-png.flaticon.com/512/2164/2164832.png',
  RESPONSE_JSON: 'https://cdn-icons-png.flaticon.com/512/136/136525.png',
  RESPONSE_FILE: 'https://cdn-icons-png.flaticon.com/512/2965/2965335.png',
  RESPONSE_IMAGE: 'https://cdn-icons-png.flaticon.com/512/3342/3342137.png',
  OPENAPI_IMPORT: 'https://cdn-icons-png.flaticon.com/512/875/875615.png',
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
 * - CRUD on Project, Api, Request Scenario, Response Scenario
 * - Import OpenAPI / Swagger JSON
 */
export async function sendGoogleSpaceNotification(payload: NotificationPayload): Promise<void> {
  const webhookUrl = process.env.GOOGLE_SPACE_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) {
    return;
  }

  const { action, entityType, projectId, userId, operator, description, beforeState, afterState, metadata } = payload;

  // Filter triggers:
  // 1. Every CRUD on Project, Api, Response (response_scenario), Request (request_scenario)
  // 2. OpenAPI / Swagger JSON import
  const targetEntities = ['project', 'api', 'request_scenario', 'response_scenario'];
  const isTargetEntity = targetEntities.includes(entityType);
  const isOpenApiImport =
    action === 'IMPORT' &&
    (metadata?.openApiImport ||
      description?.toLowerCase().includes('openapi') ||
      description?.toLowerCase().includes('swagger'));

  if (!isTargetEntity && !isOpenApiImport) {
    return;
  }

  // Determine Action Emoji, Title and Accent Color
  let actionTitle = action as string;

  if (isOpenApiImport) {
    actionTitle = 'IMPORT OPENAPI';
  } else {
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
      case 'RESTORE':
        actionTitle = 'RESTORE';
        break;
      case 'IMPORT':
        actionTitle = 'IMPORT';
        break;
    }
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

  if (isOpenApiImport) {
    cardHeaderImageUrl = ICONS.OPENAPI_IMPORT;
    entityLabel = 'OpenAPI';
  } else {
    switch (entityType) {
      case 'project':
        entityLabel = 'Project';
        cardHeaderImageUrl = ICONS.PROJECT;
        break;
      case 'api':
        entityLabel = 'API';
        cardHeaderImageUrl = ICONS.API;
        break;
      case 'request_scenario':
        entityLabel = 'Request Scenario';
        cardHeaderImageUrl = ICONS.REQUEST_SCENARIO;
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
    }
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

  // Build Card v2 Payload for Google Space UI (Pure Card Layout, no chat balloon)
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
    // Sending ONLY cardsV2 (without top-level text) renders as pure Card without chat balloon container
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        cardsV2: cardsV2,
      }),
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });

    if (!response.ok) {
      console.error(`[GoogleSpaceNotifier] Webhook returned status ${response.status}`);
    }
  } catch (error: any) {
    console.error('[GoogleSpaceNotifier] Failed to send notification to Google Space:', error?.message || error);
  }
}
