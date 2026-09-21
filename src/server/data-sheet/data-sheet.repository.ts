import prisma from '@/src/core/db/prisma-client';
import { Prisma } from '@prisma/client';
import { DataSheetFilter, DataSheetInput, DataSheetUpdateInput } from './data-sheet.types';

export async function getDataSheets(filter?: DataSheetFilter) {
  const where: Prisma.DataSheetWhereInput = {
    deletedAt: null,
  };

  if (filter?.projectId !== undefined) {
    where.projectId = filter.projectId;
  }

  if (filter?.category) {
    where.category = {
      equals: filter.category,
      mode: 'insensitive',
    };
  }

  if (filter?.status !== undefined) {
    where.status = filter.status;
  }

  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { code: { contains: filter.search, mode: 'insensitive' } },
      { category: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  return prisma.dataSheet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getDataSheetById(id: string) {
  return prisma.dataSheet.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getDataSheetByCode(code: string, projectId?: string | null) {
  return prisma.dataSheet.findFirst({
    where: {
      code,
      projectId: projectId ?? null,
      deletedAt: null,
    },
  });
}

export async function createDataSheet(input: DataSheetInput) {
  return prisma.dataSheet.create({
    data: {
      id: input.id,
      projectId: input.projectId ?? null,
      name: input.name,
      code: input.code,
      category: input.category ?? null,
      description: input.description ?? null,
      format: input.format ?? 'LIST',
      data: (input.data ?? []) as Prisma.InputJsonValue,
      status: input.status ?? true,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateDataSheet(id: string, input: DataSheetUpdateInput) {
  const data: Prisma.DataSheetUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code;
  if (input.category !== undefined) data.category = input.category;
  if (input.description !== undefined) data.description = input.description;
  if (input.format !== undefined) data.format = input.format;
  if (input.data !== undefined) data.data = input.data as Prisma.InputJsonValue;
  if (input.status !== undefined) data.status = input.status;

  return prisma.dataSheet.update({
    where: { id },
    data,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function softDeleteDataSheet(id: string) {
  return prisma.dataSheet.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}
