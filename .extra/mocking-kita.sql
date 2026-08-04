CREATE TABLE `tblProject` (
  `id` uuid PRIMARY KEY,
  `name` varchar(255),
  `description` text,
  `status` boolean DEFAULT true,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `tblEnvironment` (
  `id` uuid PRIMARY KEY,
  `project_id` uuid,
  `name` varchar(255),
  `environment_type` ENUM ('LOCAL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION'),
  `public_base_url` varchar(255),
  `origin_base_url` varchar(255),
  `status` boolean DEFAULT true,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `tblApi` (
  `id` uuid PRIMARY KEY,
  `project_id` uuid,
  `name` varchar(255),
  `description` text,
  `path` varchar(255),
  `method_request` ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'),
  `status` boolean DEFAULT true,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `tblApiEnvironment` (
  `id` uuid PRIMARY KEY,
  `api_id` uuid,
  `environment_id` uuid,
  `enabled` boolean DEFAULT true,
  `path_override` varchar(255),
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `tblRequestScenario` (
  `id` uuid PRIMARY KEY,
  `api_id` uuid,
  `name` varchar(255),
  `description` text,
  `headers` json,
  `query_params` json,
  `path_params` json,
  `body` json,
  `match_type` ENUM ('EXACT', 'PARTIAL', 'REGEX', 'JSON_SCHEMA') DEFAULT 'EXACT',
  `priority` int DEFAULT 0,
  `status` boolean DEFAULT true,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `tblResponseScenario` (
  `id` uuid PRIMARY KEY,
  `request_scenario_id` uuid,
  `name` varchar(255),
  `description` text,
  `status_code` int,
  `headers` json,
  `body` json,
  `delay_ms` int DEFAULT 0,
  `weight` int DEFAULT 100,
  `priority` int DEFAULT 0,
  `status` boolean DEFAULT true,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE UNIQUE INDEX `tblApi_index_0` ON `tblApi` (`project_id`, `path`, `method_request`);

CREATE UNIQUE INDEX `tblApiEnvironment_index_1` ON `tblApiEnvironment` (`api_id`, `environment_id`);

ALTER TABLE `tblEnvironment` ADD FOREIGN KEY (`project_id`) REFERENCES `tblProject` (`id`);

ALTER TABLE `tblApi` ADD FOREIGN KEY (`project_id`) REFERENCES `tblProject` (`id`);

ALTER TABLE `tblApiEnvironment` ADD FOREIGN KEY (`api_id`) REFERENCES `tblApi` (`id`);

ALTER TABLE `tblApiEnvironment` ADD FOREIGN KEY (`environment_id`) REFERENCES `tblEnvironment` (`id`);

ALTER TABLE `tblRequestScenario` ADD FOREIGN KEY (`api_id`) REFERENCES `tblApi` (`id`);

ALTER TABLE `tblResponseScenario` ADD FOREIGN KEY (`request_scenario_id`) REFERENCES `tblRequestScenario` (`id`);
