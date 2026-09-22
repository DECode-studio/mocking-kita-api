-- AlterTable: Make variables column nullable to match schema.prisma
ALTER TABLE "tblEnvironment" ALTER COLUMN "variables" DROP NOT NULL;
