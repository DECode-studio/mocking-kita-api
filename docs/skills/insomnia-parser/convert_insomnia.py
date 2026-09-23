#!/usr/bin/env python3
"""Convert an Insomnia collection export into a Mock API Studio flow template."""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    import yaml
    try:
        from yaml import CSafeLoader as SafeLoader
    except ImportError:
        from yaml import SafeLoader
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing dependency: PyYAML. Install with:\n"
        "  python3 -m pip install -r docs/skills/insomnia-parser/requirements.txt"
    ) from exc


STAGES = ["LOCAL", "DEVELOPMENT", "TESTING", "STAGING", "PRODUCTION"]
RESPONSE_TAG_RE = re.compile(
    r"\{%\s*response\s*['\"]?(body|header)['\"]?\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"][^%]*%\}"
)
BASE_URL_TOKEN_RE = re.compile(r"^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$", re.S)


def stage_for(name: str) -> str:
    normalized = (name or "").lower()
    if re.search(r"local|localhost", normalized):
        return "LOCAL"
    if re.search(r"dev|development", normalized):
        return "DEVELOPMENT"
    if re.search(r"test|testing|qa", normalized):
        return "TESTING"
    if re.search(r"stag|staging", normalized):
        return "STAGING"
    if re.search(r"prod|production", normalized):
        return "PRODUCTION"
    return "DEVELOPMENT"


def base_url_key(key: str, value: Any) -> bool:
    return bool(
        re.search(r"(?:^|_)URL$|BASE_URL|API_URL|_URL_", str(key), re.I)
        or re.match(r"^https?://", str(value), re.I)
    )


def normalize_json_path(path: Any) -> str:
    result = str(path or "")
    result = re.sub(r"^\$\.", "", result)
    result = re.sub(r"^\$", "", result)
    result = re.sub(r"\[(\w+)\]", r".\1", result)
    result = re.sub(r"^\.", "", result)
    return result


def decode_filter(raw_filter: str) -> str:
    match = re.match(r"^b64::([^:]+)::46b$", str(raw_filter or ""))
    if not match:
        return normalize_json_path(raw_filter)
    try:
        decoded = base64.b64decode(match.group(1)).decode("utf-8")
    except Exception:
        return normalize_json_path(raw_filter)
    return normalize_json_path(decoded)


def variable_name(source_req_id: str, json_path: str) -> str:
    raw = f"{source_req_id}_{json_path}"
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", raw)
    cleaned = re.sub(r"_+", "_", cleaned)
    return re.sub(r"_$", "", cleaned)


def iter_response_tags(text: Any):
    for match in RESPONSE_TAG_RE.finditer(str(text or "")):
        from_part, source_req_id, raw_filter = match.groups()
        json_path = decode_filter(raw_filter)
        yield from_part, source_req_id, raw_filter, json_path, variable_name(source_req_id, json_path)


def replace_insomnia_tokens(value: Any) -> Any:
    if not isinstance(value, str):
        return value

    def replace_response(match: re.Match[str]) -> str:
        source_req_id = match.group(2)
        json_path = decode_filter(match.group(3))
        return "{{" + variable_name(source_req_id, json_path) + "}}"

    replaced = RESPONSE_TAG_RE.sub(replace_response, value)
    return re.sub(r"\{\{\s*_\.([a-zA-Z0-9_-]+)\s*\}\}", r"{{\1}}", replaced)


def normalize_list_to_map(items: Any) -> dict[str, str]:
    result: dict[str, str] = {}
    if not isinstance(items, list):
        return result

    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get("disabled") or not str(item.get("name") or ""):
            continue
        result[str(item["name"])] = str(replace_insomnia_tokens(str(item.get("value") or "")))
    return result


def parse_body(req: dict[str, Any]) -> tuple[Any, str]:
    body = req.get("body")
    if not isinstance(body, dict):
        return {}, "NONE"

    text = body.get("text")
    if text is None or not str(text).strip():
        return {}, "NONE"

    content_type = str(body.get("mimeType") or "").lower()
    clean_text = replace_insomnia_tokens(str(text))

    if "x-www-form-urlencoded" in content_type:
        return clean_text, "URL_ENCODED"
    if "multipart" in content_type:
        return clean_text, "FORM_DATA"

    try:
        return json.loads(clean_text), "JSON"
    except json.JSONDecodeError:
        return clean_text, "JSON"


def traverse_collection(
    items: Any,
    parent_path: list[str] | None = None,
    requests: list[dict[str, Any]] | None = None,
    order: dict[str, int] | None = None,
) -> list[dict[str, Any]]:
    if parent_path is None:
        parent_path = []
    if requests is None:
        requests = []
    if order is None:
        order = {"value": 0}

    if not isinstance(items, list):
        return requests

    for item in items:
        if not isinstance(item, dict):
            continue
        children = item.get("children")
        if isinstance(children, list):
            traverse_collection(children, parent_path + [str(item.get("name") or "")], requests, order)
        elif item.get("url") and item.get("method"):
            order["value"] += 1
            meta = item.get("meta") if isinstance(item.get("meta"), dict) else {}
            req_id = meta.get("id") or item.get("_id") or f"generated_req_{order['value']}"
            requests.append(
                {
                    "id": str(req_id),
                    "req": item,
                    "folder_path": " / ".join([p for p in parent_path if p]),
                    "traversal_order": order["value"],
                    "sort_key": meta.get("sortKey") or order["value"],
                }
            )

    return requests


def extract_after_response(script: Any) -> list[dict[str, str]]:
    extractors: list[dict[str, str]] = []
    text = str(script or "")
    pattern = re.compile(
        r"insomnia\.environment\.set\(\s*['\"]([^'\"]+)['\"]\s*,\s*response\.([a-zA-Z0-9_.\[\]]+)\s*\)"
    )
    for variable, path in pattern.findall(text):
        extractors.append({"variable": variable, "from": "body", "path": normalize_json_path(path)})
    return extractors


def extract_script_environment_refs(script: Any) -> dict[str, set[str]]:
    text = str(script or "")
    reads = set(re.findall(r"insomnia\.environment\.get\(\s*['\"]([^'\"]+)['\"]\s*\)", text))
    writes = set(re.findall(r"insomnia\.environment\.set\(\s*['\"]([^'\"]+)['\"]\s*,", text))
    return {"reads": reads, "writes": writes}


def build_environment_template(
    parsed: dict[str, Any],
    warnings: list[str],
    script_env_reads: set[str] | None = None,
    script_env_writes: set[str] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    script_env_reads = script_env_reads or set()
    script_env_writes = script_env_writes or set()

    env_root = parsed.get("environments") if isinstance(parsed.get("environments"), dict) else {}
    stage_data: dict[str, dict[str, Any]] = {}

    base_data = env_root.get("data") if isinstance(env_root.get("data"), dict) else {}
    if base_data:
        stage_data["DEVELOPMENT"] = dict(base_data)

    for subenv in env_root.get("subEnvironments") or []:
        if not isinstance(subenv, dict) or not isinstance(subenv.get("data"), dict):
            continue
        stage = stage_for(str(subenv.get("name") or ""))
        stage_data.setdefault(stage, {}).update(subenv["data"])

    base_keys: set[str] = set()
    variable_keys: set[str] = set()
    for data in stage_data.values():
        for key, value in data.items():
            key_str = str(key)
            if base_url_key(key_str, value):
                base_keys.add(key_str)
            else:
                variable_keys.add(key_str)

    for key in script_env_reads | script_env_writes:
        if key not in base_keys:
            variable_keys.add(key)

    if not base_keys:
        warnings.append("No base URL environment variables found.")

    environments: list[dict[str, Any]] = []
    for index, key in enumerate(sorted(base_keys)):
        values = {stage: None for stage in STAGES}
        for stage, data in stage_data.items():
            if key in data and str(data[key]) != "":
                values[stage] = str(data[key])

        environments.append(
            {
                "id": key,
                "name": key,
                "isBaseUrl": True,
                "environmentType": "DEVELOPMENT" if values.get("DEVELOPMENT") else next(iter(stage_data.keys()), "DEVELOPMENT"),
                "values": values,
                "variables": [],
                "isDefault": index == 0,
            }
        )

    flow_variables: dict[str, Any] = {}
    preferred_stage = "DEVELOPMENT" if "DEVELOPMENT" in stage_data else next(iter(stage_data.keys()), None)
    if preferred_stage:
        for key in sorted(variable_keys):
            val = stage_data[preferred_stage].get(key)
            if isinstance(val, (datetime, date)):
                val = val.isoformat()
            flow_variables[key] = val

    for key in sorted(script_env_reads | script_env_writes):
        if key not in flow_variables and key not in base_keys:
            flow_variables[key] = None

    return environments, flow_variables


def sort_requests(
    requests: list[dict[str, Any]],
    dependencies: dict[str, set[str]],
    warnings: list[str],
) -> list[dict[str, Any]]:
    by_id = {item["id"]: item for item in requests}
    inbound = {item["id"]: set() for item in requests}
    outbound: dict[str, set[str]] = {item["id"]: set() for item in requests}

    for target, sources in dependencies.items():
        inbound.setdefault(target, set())
        for source in sources:
            if source not in by_id:
                warnings.append(f"Missing dependency source {source} referenced by {target}.")
                continue
            inbound[target].add(source)
            outbound.setdefault(source, set()).add(target)

    ready = sorted(
        [item for item in requests if not inbound.get(item["id"])],
        key=lambda item: (int(item["sort_key"]), int(item["traversal_order"])),
    )
    sorted_items: list[dict[str, Any]] = []

    while ready:
        current = ready.pop(0)
        sorted_items.append(current)
        for target in outbound.get(current["id"], set()):
            inbound[target].discard(current["id"])
            if not inbound[target]:
                ready.append(by_id[target])
                ready.sort(key=lambda item: (int(item["sort_key"]), int(item["traversal_order"])))

    if len(sorted_items) != len(requests):
        remaining = [item for item in requests if item not in sorted_items]
        warnings.append(
            f"Dependency cycle or unresolved ordering for {len(remaining)} request(s); appended by folder/sort order."
        )
        sorted_items.extend(sorted(remaining, key=lambda item: (int(item["sort_key"]), int(item["traversal_order"]))))

    return sorted_items


def load_source(input_path: Path) -> dict[str, Any]:
    raw = input_path.read_text(encoding="utf-8")
    if input_path.suffix.lower() == ".json":
        parsed = json.loads(raw)
    else:
        parsed = yaml.load(raw, Loader=SafeLoader)

    if not isinstance(parsed, dict):
        raise ValueError("Insomnia source must parse to an object.")
    return parsed


def convert(input_path: Path) -> dict[str, Any]:
    parsed = load_source(input_path)

    warnings: list[str] = []
    requests = traverse_collection(parsed.get("collection"))
    by_id = {item["id"]: item for item in requests}
    extractors_by_req: dict[str, list[dict[str, Any]]] = {}
    dependencies: dict[str, set[str]] = {}
    response_tag_count = 0
    pre_request_count = 0
    script_env_reads: set[str] = set()
    script_env_writes: set[str] = set()

    for item in requests:
        req = item["req"]
        scan_payload = json.dumps(
            {
                "url": req.get("url"),
                "body": req.get("body"),
                "parameters": req.get("parameters"),
                "headers": req.get("headers"),
            },
            ensure_ascii=False,
        )

        for from_part, source_req_id, _raw_filter, json_path, var_name in iter_response_tags(scan_payload):
            response_tag_count += 1
            source_extractors = extractors_by_req.setdefault(source_req_id, [])
            extractor = {
                "variable": var_name,
                "from": "headers" if from_part == "header" else "body",
                "path": json_path,
            }
            if not any(existing["variable"] == var_name for existing in source_extractors):
                source_extractors.append(extractor)
            if source_req_id in by_id:
                dependencies.setdefault(item["id"], set()).add(source_req_id)

        scripts = req.get("scripts") if isinstance(req.get("scripts"), dict) else {}
        for extractor in extract_after_response(scripts.get("afterResponse")):
            target_extractors = extractors_by_req.setdefault(item["id"], [])
            if not any(existing["variable"] == extractor["variable"] for existing in target_extractors):
                target_extractors.append(extractor)

        pre_script = str(scripts.get("preRequest") or "")
        after_script = str(scripts.get("afterResponse") or "")
        if pre_script.strip():
            pre_request_count += 1

        for script in [pre_script, after_script]:
            refs = extract_script_environment_refs(script)
            script_env_reads.update(refs["reads"])
            script_env_writes.update(refs["writes"])

    environments, flow_variables = build_environment_template(
        parsed,
        warnings,
        script_env_reads=script_env_reads,
        script_env_writes=script_env_writes,
    )
    sorted_requests = sort_requests(requests, dependencies, warnings)

    steps: list[dict[str, Any]] = []
    for index, item in enumerate(sorted_requests):
        req = item["req"]
        description = replace_insomnia_tokens(str((req.get("meta") or {}).get("description") or ""))
        raw_url = str(req.get("url") or "")
        target_environment = None
        path = raw_url

        match = BASE_URL_TOKEN_RE.match(raw_url)
        if match:
            target_environment = match.group(1)
            path = match.group(2)
        elif re.match(r"^https?://", raw_url, re.I):
            parsed_url = urlparse(raw_url)
            target_environment = re.sub(r"[^A-Z0-9_]", "_", f"{parsed_url.hostname}_BASE_URL".upper())
            path = parsed_url.path

        path = replace_insomnia_tokens(path)
        if not path:
            path = "/"

        body, body_type = parse_body(req)
        headers = normalize_list_to_map(req.get("headers"))
        query_params = normalize_list_to_map(req.get("parameters"))
        name = str(req.get("name") or f"Step {index + 1}")

        steps.append(
            {
                "order": index + 1,
                "name": name,
                "description": description,
                "enabled": True,
                "delayMs": 0,
                "continueOnError": False,
                "api": {
                    "method": str(req.get("method") or "GET").upper(),
                    "path": path,
                    "name": str(req.get("name") or ""),
                    "collection": item["folder_path"] or None,
                    "description": description,
                    "targetEnvironment": target_environment,
                    "environmentIds": [target_environment] if target_environment else [],
                },
                "requestScenario": {
                    "name": f"{name} Scenario",
                    "headers": headers,
                    "queryParams": query_params,
                    "pathParams": {},
                    "body": body,
                    "bodyType": body_type,
                },
                "expectedResponseScenario": {
                    "name": f"{name} Response",
                    "statusCode": 200,
                    "headers": {},
                    "body": {},
                },
                "overrides": {
                    "headers": None,
                    "queryParams": None,
                    "pathParams": None,
                    "body": None,
                    "bodyType": body_type,
                },
                "extractors": extractors_by_req.get(item["id"], []),
                "assertions": [{"type": "statusCode", "operator": "equals", "expected": 200}],
            }
        )

    if pre_request_count:
        warnings.append(
            f"{pre_request_count} request(s) contain preRequest scripts; scripts are not executable in Scenario Flow import."
        )

    return {
        "$schema": "mock-api-studio/scenario-flow/v1",
        "version": "1.0",
        "exportedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "environments": environments,
        "flow": {
            "name": str(parsed.get("name") or "Imported Insomnia Flow"),
            "description": str((parsed.get("meta") or {}).get("description") or "Converted from Insomnia collection"),
            "stopOnFailure": True,
            "variables": flow_variables,
        },
        "steps": steps,
        "x-conversionSummary": {
            "source": input_path.name,
            "requests": len(requests),
            "responseTags": response_tag_count,
            "dependencies": sum(len(sources) for sources in dependencies.values()),
            "environments": len(environments),
            "scriptEnvironmentReads": sorted(script_env_reads),
            "scriptEnvironmentWrites": sorted(script_env_writes),
            "preRequestScripts": pre_request_count,
            "warnings": sorted(set(warnings)),
        },
    }


def json_dumps_default(obj: Any) -> Any:
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, set):
        return sorted(list(obj))
    return str(obj)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Insomnia YAML/JSON export")
    parser.add_argument("-o", "--output", type=Path, help="Write converted template JSON to this path")
    parser.add_argument("--no-summary", action="store_true", help="Do not print conversion summary to stderr")
    args = parser.parse_args()

    template = convert(args.input)
    json_text = json.dumps(template, indent=2, ensure_ascii=False, default=json_dumps_default)

    if args.output:
        args.output.write_text(json_text + "\n", encoding="utf-8")
    else:
        print(json_text)

    if not args.no_summary:
        print(json.dumps(template["x-conversionSummary"], indent=2, ensure_ascii=False, default=json_dumps_default), file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
