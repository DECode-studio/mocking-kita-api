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
  let actionEmoji = '⚡';
  let actionTitle = action as string;

  if (isOpenApiImport) {
    actionEmoji = '📥';
    actionTitle = 'IMPORT OPENAPI';
  } else {
    switch (action) {
      case 'CREATE':
        actionEmoji = '✨';
        actionTitle = 'CREATE';
        break;
      case 'UPDATE':
        actionEmoji = '✏️';
        actionTitle = 'UPDATE';
        break;
      case 'DELETE':
        actionEmoji = '🗑️';
        actionTitle = 'DELETE';
        break;
      case 'RESTORE':
        actionEmoji = '🔄';
        actionTitle = 'RESTORE';
        break;
      case 'IMPORT':
        actionEmoji = '📥';
        actionTitle = 'IMPORT';
        break;
    }
  }

  // Friendly Entity Type Label
  let entityLabel = entityType as string;
  switch (entityType) {
    case 'project':
      entityLabel = 'Project';
      break;
    case 'api':
      entityLabel = 'API';
      break;
    case 'request_scenario':
      entityLabel = 'Request Scenario';
      break;
    case 'response_scenario':
      entityLabel = 'Response Scenario';
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
        startIcon: { knownIcon: 'MEMO' },
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
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
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
