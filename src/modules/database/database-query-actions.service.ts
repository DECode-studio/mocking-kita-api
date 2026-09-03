import { getAllApis, getApiById, getApiEnvironment, getApiEnvironmentsByApiId, getApisByProjectId } from '@/src/modules/api';
import { getCollectionById, getCollectionsByProjectId } from '@/src/modules/collection';
import { getAllEnvironments, getEnvironmentById, getEnvironmentsByProjectId } from '@/src/modules/environment';
import { getAllProjects, getProjectById } from '@/src/modules/project';
import { getRequestScenarioById, getRequestScenariosByApiId } from '@/src/modules/request-scenario';
import { getResponseScenarioById, getResponseScenariosByRequestScenarioId } from '@/src/modules/response-scenario';
import { getDashboardSummary } from './database-dashboard-summary.service';
import {
  ApiEnvironmentLookupPayloadSchema,
  ApiIdPayloadSchema,
  DatabaseActionBody,
  IdPayloadSchema,
  ProjectIdPayloadSchema,
  RequestScenarioIdPayloadSchema,
} from './database.schema';

export async function handleQueryDatabaseAction(body: DatabaseActionBody): Promise<Response | null> {
  switch (body.action) {
    case 'getDashboardSummary':
      return queryResponse(await getDashboardSummary());
    case 'listProjects':
      return queryResponse(await getAllProjects());
    case 'getProjectById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getProjectById(id));
    }
    case 'listCollectionsByProjectId': {
      const { projectId } = ProjectIdPayloadSchema.parse(body.payload);
      return queryResponse(await getCollectionsByProjectId(projectId));
    }
    case 'getCollectionById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getCollectionById(id));
    }
    case 'listEnvironmentsByProjectId': {
      const { projectId } = ProjectIdPayloadSchema.parse(body.payload);
      return queryResponse(await getEnvironmentsByProjectId(projectId));
    }
    case 'listEnvironments':
      return queryResponse(await getAllEnvironments());
    case 'getEnvironmentById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getEnvironmentById(id));
    }
    case 'listApisByProjectId': {
      const { projectId } = ProjectIdPayloadSchema.parse(body.payload);
      return queryResponse(await getApisByProjectId(projectId));
    }
    case 'listApis':
      return queryResponse(await getAllApis());
    case 'getApiById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getApiById(id));
    }
    case 'listApiEnvironmentsByApiId': {
      const { apiId } = ApiIdPayloadSchema.parse(body.payload);
      return queryResponse(await getApiEnvironmentsByApiId(apiId));
    }
    case 'getApiEnvironment': {
      const { apiId, environmentId } = ApiEnvironmentLookupPayloadSchema.parse(body.payload);
      return queryResponse(await getApiEnvironment(apiId, environmentId));
    }
    case 'listRequestScenariosByApiId': {
      const { apiId } = ApiIdPayloadSchema.parse(body.payload);
      return queryResponse(await getRequestScenariosByApiId(apiId));
    }
    case 'getRequestScenarioById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getRequestScenarioById(id));
    }
    case 'listResponseScenariosByRequestScenarioId': {
      const { requestScenarioId } = RequestScenarioIdPayloadSchema.parse(body.payload);
      return queryResponse(await getResponseScenariosByRequestScenarioId(requestScenarioId));
    }
    case 'getResponseScenarioById': {
      const { id } = IdPayloadSchema.parse(body.payload);
      return queryResponse(await getResponseScenarioById(id));
    }
    default:
      return null;
  }
}

function queryResponse<T>(data: T): Response {
  return Response.json({ success: true, data });
}
