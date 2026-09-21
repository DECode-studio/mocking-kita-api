-- AlterTable: Add is_base_url, values, and make environment_type nullable
ALTER TABLE "tblEnvironment" ADD COLUMN IF NOT EXISTS "is_base_url" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tblEnvironment" ADD COLUMN IF NOT EXISTS "values" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "tblEnvironment" ALTER COLUMN "environment_type" DROP NOT NULL;

-- Data Migration & Consolidation
DO $$
BEGIN
    -- 1. Populate initial values for all existing rows from variables/baseUrl
    UPDATE "tblEnvironment"
    SET "values" = jsonb_build_object(
        COALESCE("environment_type"::text, 'DEVELOPMENT'),
        COALESCE(
            (SELECT elem->>'value' 
             FROM jsonb_array_elements("variables") AS elem 
             WHERE elem->>'key' = 'baseUrl' OR elem->>'key' = 'base_url' 
             LIMIT 1),
            ''
        )
    )
    WHERE "values" = '{}'::jsonb OR "values" IS NULL;

    -- 2. Consolidate 'Platform AUTH' (Dev absorbs Stg)
    IF EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381') AND
       EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = '41fefa63-d2ac-4b78-903b-ba2d10301ac8') THEN
        
        -- Update Target
        UPDATE "tblEnvironment"
        SET "name" = 'Platform AUTH',
            "is_base_url" = true,
            "values" = jsonb_build_object(
                'LOCAL', null,
                'DEVELOPMENT', 'https://dev-plat-auth.kbfinansia.com',
                'TESTING', null,
                'STAGING', 'https://stg-plat-auth.kbfinansia.com',
                'PRODUCTION', null
            )
        WHERE id = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381';

        -- Deduplicate tblApiEnvironment before updating FK
        DELETE FROM "tblApiEnvironment"
        WHERE "environment_id" = '41fefa63-d2ac-4b78-903b-ba2d10301ac8'
          AND "api_id" IN (SELECT "api_id" FROM "tblApiEnvironment" WHERE "environment_id" = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381');

        UPDATE "tblApiEnvironment"
        SET "environment_id" = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381'
        WHERE "environment_id" = '41fefa63-d2ac-4b78-903b-ba2d10301ac8';

        UPDATE "tblScenarioFlow"
        SET "default_environment_id" = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381'
        WHERE "default_environment_id" = '41fefa63-d2ac-4b78-903b-ba2d10301ac8';

        UPDATE "tblScenarioFlowExecution"
        SET "environment_id" = '0d9e3bbf-516f-43d4-9c65-1a1e3c469381'
        WHERE "environment_id" = '41fefa63-d2ac-4b78-903b-ba2d10301ac8';

        DELETE FROM "tblEnvironment" WHERE id = '41fefa63-d2ac-4b78-903b-ba2d10301ac8';
    END IF;

    -- 3. Consolidate 'Platform OTP' (Dev absorbs Stg)
    IF EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06') AND
       EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = '2ce85d73-551e-439c-b5ac-62ada2876b5c') THEN
        
        -- Update Target
        UPDATE "tblEnvironment"
        SET "name" = 'Platform OTP',
            "is_base_url" = true,
            "values" = jsonb_build_object(
                'LOCAL', null,
                'DEVELOPMENT', 'https://dev-plat-otp.kbfinansia.com',
                'TESTING', null,
                'STAGING', 'https://stg-plat-otp.kbfinansia.com',
                'PRODUCTION', null
            )
        WHERE id = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06';

        -- Deduplicate tblApiEnvironment before updating FK
        DELETE FROM "tblApiEnvironment"
        WHERE "environment_id" = '2ce85d73-551e-439c-b5ac-62ada2876b5c'
          AND "api_id" IN (SELECT "api_id" FROM "tblApiEnvironment" WHERE "environment_id" = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06');

        UPDATE "tblApiEnvironment"
        SET "environment_id" = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06'
        WHERE "environment_id" = '2ce85d73-551e-439c-b5ac-62ada2876b5c';

        UPDATE "tblScenarioFlow"
        SET "default_environment_id" = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06'
        WHERE "default_environment_id" = '2ce85d73-551e-439c-b5ac-62ada2876b5c';

        UPDATE "tblScenarioFlowExecution"
        SET "environment_id" = 'd6f18f94-a93e-4e3c-b79b-1c6458965e06'
        WHERE "environment_id" = '2ce85d73-551e-439c-b5ac-62ada2876b5c';

        DELETE FROM "tblEnvironment" WHERE id = '2ce85d73-551e-439c-b5ac-62ada2876b5c';
    END IF;

    -- 4. Consolidate 'KPM (Apigee Gateway)' (Dev absorbs Stg)
    IF EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394') AND
       EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = '448d3522-d46e-445e-aff0-390cc844f481') THEN
        
        -- Update Target
        UPDATE "tblEnvironment"
        SET "name" = 'KPM (Apigee Gateway)',
            "is_base_url" = true,
            "values" = jsonb_build_object(
                'LOCAL', null,
                'DEVELOPMENT', 'https://dev-api-gateway.kbfinansia.com',
                'TESTING', null,
                'STAGING', 'https://testing-api-gateway.kbfinansia.com',
                'PRODUCTION', null
            )
        WHERE id = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394';

        -- Deduplicate tblApiEnvironment before updating FK
        DELETE FROM "tblApiEnvironment"
        WHERE "environment_id" = '448d3522-d46e-445e-aff0-390cc844f481'
          AND "api_id" IN (SELECT "api_id" FROM "tblApiEnvironment" WHERE "environment_id" = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394');

        UPDATE "tblApiEnvironment"
        SET "environment_id" = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394'
        WHERE "environment_id" = '448d3522-d46e-445e-aff0-390cc844f481';

        UPDATE "tblScenarioFlow"
        SET "default_environment_id" = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394'
        WHERE "default_environment_id" = '448d3522-d46e-445e-aff0-390cc844f481';

        UPDATE "tblScenarioFlowExecution"
        SET "environment_id" = 'a56ee1fc-9d2e-4ec8-922b-24438bb41394'
        WHERE "environment_id" = '448d3522-d46e-445e-aff0-390cc844f481';

        DELETE FROM "tblEnvironment" WHERE id = '448d3522-d46e-445e-aff0-390cc844f481';
    END IF;

    -- 5. Rename and format 'KPM (Direct API)'
    IF EXISTS (SELECT 1 FROM "tblEnvironment" WHERE id = '448ac4d8-729e-4430-a4d3-040a745e0fe5') THEN
        UPDATE "tblEnvironment"
        SET "name" = 'KPM (Direct API)',
            "is_base_url" = true,
            "values" = jsonb_build_object(
                'LOCAL', null,
                'DEVELOPMENT', 'https://dev-kpm-api.kbfinansia.com',
                'TESTING', null,
                'STAGING', null,
                'PRODUCTION', null
            )
        WHERE id = '448ac4d8-729e-4430-a4d3-040a745e0fe5';
    END IF;

END $$;
