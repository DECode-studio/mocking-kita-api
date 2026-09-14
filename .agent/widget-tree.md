# FE/BE Modular Directory Tree

Dokumen ini mendefinisikan target tree proyek **Mock API Studio** setelah flow FE dan BE dipisahkan.

Prinsip:
- `src/client/presentation`, `src/client/domain`, `src/client/data`, dan `src/core/di` adalah flow FE/client application.
- `src/app/api` adalah HTTP adapter.
- `src/server` adalah flow BE/module application.
- `src/core` berisi helper lintas runtime, dipisahkan menjadi shared/client/server saat migrasi.

---

## 1. Result Directory Tree

```text
mock-api-studio/
  src/
    app/
      api/
        route.ts
        [...path]/
          route.ts

        auth/
          route.ts
          sso/
            route.ts
            callback/
              route.ts

        admin/
          accounts/
            route.ts

        projects/
          route.ts
          [id]/
            route.ts
            export-openapi/
              route.ts
            import-openapi/
              route.ts

        environments/
          route.ts
          [id]/
            route.ts

        collections/
          route.ts
          [id]/
            route.ts

        apis/
          route.ts
          [id]/
            route.ts
            environments/
              route.ts

        request-scenarios/
          route.ts
          [id]/
            route.ts

        response-scenarios/
          route.ts
          [id]/
            route.ts

        change-logs/
          route.ts

        database/
          route.ts
          export/
            route.ts
          import/
            route.ts

        settings/
          route.ts

        upload/
          route.ts

    presentation/
      views/
        dashboard/
          DashboardView.tsx
          hook/
            useDashboard.ts
          components/
          constant/

        projects/
          ProjectsView.tsx
          hook/
            useProjects.ts
          components/
          constant/

        project-detail/
          ProjectDetailView.tsx
          hook/
            useProjectDetail.ts
            useOpenApi.ts
          components/
          constant/

        api-collections/
          ApiCollectionsView.tsx
          hook/
            useApiCollections.ts
          components/
          constant/

        api-detail/
          ApiDetailView.tsx
          hook/
            useApiDetail.ts
            useRequestScenarioActions.ts
            useResponseScenarioActions.ts
            useRequestScenarioModal.ts
            useResponseScenarioModal.ts
            useEnvironmentOverrideActions.ts
            useJsonEditor.ts
            useKeyValueEditor.ts
            useKeyValueOrJsonEditor.ts
          components/
          constant/

        environments/
          EnvironmentsView.tsx
          hook/
            useEnvironments.ts
          components/
          constant/

        admin-accounts/
          AccountsAdminView.tsx
          hook/
            useAdminAccounts.ts
          components/
          constant/

        admin-change-logs/
          ChangeLogsAdminView.tsx
          hook/
            useAdminChangeLogs.ts
          components/
          constant/

        settings/
          SettingsView.tsx
          hook/
            useSettings.ts
          components/
          constant/

        sign-in/
          SignInView.tsx
          hook/
            useSignIn.ts
          components/
          constant/

        faq/
          FaqView.tsx
          hook/
            useFaq.ts
          components/
          constant/

      components/
        layout/
        shared/

      stores/

    domain/
      account/
        entity/
        repository/
        usecase/
      api/
        entity/
        repository/
        usecase/
      auth/
        entity/
        repository/
        usecase/
      change-log/
        entity/
        repository/
        usecase/
      collection/
        entity/
        repository/
        usecase/
      database/
        entity/
        repository/
        usecase/
      environment/
        entity/
        repository/
        usecase/
      faq/
        entity/
        repository/
        usecase/
      project/
        entity/
        repository/
        usecase/
      request-scenario/
        entity/
        repository/
        usecase/
      response-scenario/
        entity/
        repository/
        usecase/

    data/
      account/
        model/
        data_source/
        repository/
      api/
        model/
        data_source/
        repository/
      auth/
        model/
        data_source/
        repository/
      change-log/
        model/
        data_source/
        repository/
      collection/
        model/
        data_source/
        repository/
      database/
        model/
        data_source/
        repository/
      environment/
        model/
        data_source/
        repository/
      faq/
        model/
        data_source/
        repository/
      project/
        model/
        data_source/
        repository/
      request-scenario/
        model/
        data_source/
        repository/
      response-scenario/
        model/
        data_source/
        repository/

    server/
      auth/
        index.ts
        auth.controller.ts
        auth.service.ts
        auth.repository.ts
        auth.schema.ts
        auth.mapper.ts
        auth.policy.ts
        auth.errors.ts
        auth.constants.ts
        __tests__/

      account/
        index.ts
        account.controller.ts
        account.service.ts
        account.repository.ts
        account.schema.ts
        account.mapper.ts
        account.policy.ts
        account.audit.ts
        account.errors.ts
        __tests__/

      project/
        index.ts
        project.controller.ts
        project.service.ts
        project.repository.ts
        project.schema.ts
        project.mapper.ts
        project.policy.ts
        project.audit.ts
        project.errors.ts
        __tests__/

      environment/
        index.ts
        environment.controller.ts
        environment.service.ts
        environment.repository.ts
        environment.schema.ts
        environment.mapper.ts
        environment.policy.ts
        environment.audit.ts
        environment.errors.ts
        __tests__/

      collection/
        index.ts
        collection.controller.ts
        collection.service.ts
        collection.repository.ts
        collection.schema.ts
        collection.mapper.ts
        collection.policy.ts
        collection.audit.ts
        collection.errors.ts
        __tests__/

      api/
        index.ts
        api.controller.ts
        api.service.ts
        api.repository.ts
        api-environment.service.ts
        api-environment.repository.ts
        api.schema.ts
        api.mapper.ts
        api.policy.ts
        api.audit.ts
        api.errors.ts
        __tests__/

      request-scenario/
        index.ts
        request-scenario.controller.ts
        request-scenario.service.ts
        request-scenario.repository.ts
        request-scenario.schema.ts
        request-scenario.mapper.ts
        request-scenario.policy.ts
        request-scenario.audit.ts
        request-scenario.errors.ts
        __tests__/

      response-scenario/
        index.ts
        response-scenario.controller.ts
        response-scenario.service.ts
        response-scenario.repository.ts
        response-scenario.schema.ts
        response-scenario.mapper.ts
        response-scenario.policy.ts
        response-scenario.audit.ts
        response-scenario.errors.ts
        __tests__/

      mock-proxy/
        index.ts
        mock-proxy.controller.ts
        mock-proxy.service.ts
        mock-proxy.repository.ts
        mock-proxy.schema.ts
        mock-proxy.mapper.ts
        mock-proxy.cache.ts
        mock-proxy.matcher.ts
        mock-proxy.response.ts
        mock-proxy.headers.ts
        mock-proxy.files.ts
        mock-proxy.throttle.ts
        mock-proxy.errors.ts
        __tests__/

      database/
        index.ts
        database.controller.ts
        database.service.ts
        database.repository.ts
        database.schema.ts
        database.mapper.ts
        database.importer.ts
        database.exporter.ts
        database.reset.ts
        database.audit.ts
        database.errors.ts
        __tests__/

      openapi/
        index.ts
        openapi.controller.ts
        openapi.service.ts
        openapi.importer.ts
        openapi.exporter.ts
        openapi.schema.ts
        openapi.mapper.ts
        openapi.audit.ts
        openapi.errors.ts
        __tests__/

      upload/
        index.ts
        upload.controller.ts
        upload.service.ts
        upload.storage.ts
        upload.schema.ts
        upload.mapper.ts
        upload.policy.ts
        upload.errors.ts
        __tests__/

      change-log/
        index.ts
        change-log.controller.ts
        change-log.service.ts
        change-log.repository.ts
        change-log.schema.ts
        change-log.mapper.ts
        change-log.policy.ts
        change-log.errors.ts
        __tests__/

      settings/
        index.ts
        settings.controller.ts
        settings.service.ts
        settings.repository.ts
        settings.schema.ts
        settings.mapper.ts
        settings.policy.ts
        settings.errors.ts
        __tests__/

    core/
      shared/
        types.ts
        constants.ts
        date.ts
        json.ts
        uuid.ts

      client/
        api-client.ts
        api-error.ts

      server/
        db/
          prisma-client.ts
        auth/
          session.ts
          password-hash.ts
        http/
          api-response.ts
          request-context.ts
        security/
          safe-path.ts
          sanitize-error.ts
          sanitize-header.ts
          rate-limit.ts
        observability/
          logger.ts
          timing.ts

      db/                         # transitional existing server-only files
      http-client/                # transitional existing FE HTTP client files
      utils/                      # transitional helper files
      constants/
      openapi/

    di/
      container.ts (getService)

  prisma/
    schema.prisma
    migrations/

  test/
    api/
    data/
    domain/
    presentation/
```

---

## 2. FE Sequence

```text
User
  -> View
  -> ViewModel/Hook
  -> FE UseCase
  -> Domain Repository Interface
  -> FE Remote Repository
  -> FE Data/API Client
  -> HTTP /api route
```

FE tidak boleh melewati HTTP untuk mutasi/read persistent dari browser.

---

## 3. BE Sequence

```text
HTTP /api route
  -> Route Adapter / Controller
  -> Module Schema Validation
  -> Module Policy / Authorization
  -> Module Service
  -> Module Repository
  -> Prisma/Core Server
  -> Module Mapper
  -> API Response Helper
```

BE service adalah tempat business rule final, audit log, transaction orchestration, cache invalidation, dan observability.

---

## 4. Migration Order

1. `mock-proxy`: paling high traffic dan sudah punya cache/security rules.
2. `upload`: boundary kecil, security-sensitive, mudah dites.
3. `auth` dan `account`: security-sensitive dan butuh session helper reusable.
4. `project`, `environment`, `collection`, `api`.
5. `request-scenario` dan `response-scenario`.
6. `database`, `openapi`, `change-log`, `settings`.
