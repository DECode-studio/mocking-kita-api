#!/usr/bin/env python3
"""Convert Confluence API Markdown document(s) into Mock API Studio JSON or OpenAPI 3.0.3 Spec."""

from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def unescape_confluence_md(text: str) -> str:
    """Remove markdown escaping characters commonly added by Confluence export."""
    text = re.sub(r"\\([_*\-[\]()])", r"\1", text)
    text = text.replace("&nbsp;", " ")
    return text.replace("\r\n", "\n")


def clean_url(url_str: str) -> str:
    """Clean wrapping angle brackets or whitespace from URL."""
    return re.sub(r"[<>]", "", url_str).strip()


def extract_collection_name(path: str) -> str:
    """Derive collection/folder name from API path segments."""
    clean_path = path.split("?")[0].split("#")[0]
    segments = [s for s in clean_path.split("/") if s]
    if not segments:
        return "General"

    target = segments[-2] if len(segments) > 1 else segments[0]
    if re.match(r"^v\d+(\.\d+)?$", target, re.IGNORECASE) and len(segments) > 2:
        target = segments[-1]

    words = re.split(r"[-_]", target)
    capitalized = " ".join(w.capitalize() for w in words if w)
    return capitalized or "General"


def parse_headers_table(table_block: str) -> Dict[str, str]:
    """Parse Markdown table under ### Headers into key-value pairs."""
    headers = {}
    for line in table_block.split("\n"):
        line = line.strip()
        if not line.startswith("|") or "---" in line:
            continue
        parts = [p.strip().replace("**", "") for p in line.split("|") if p.strip()]
        if len(parts) >= 2:
            key, val = parts[0], parts[1]
            if key.lower() not in ("parameter", "header"):
                headers[key] = val
    return headers


def parse_response_code_table(table_block: str) -> List[Dict[str, Any]]:
    """Parse HTTP Code, Message, Custom Code table."""
    defs = []
    for line in table_block.split("\n"):
        line = line.strip()
        if not line.startswith("|") or "---" in line:
            continue
        parts = [p.strip().replace("**", "") for p in line.split("|") if p.strip()]
        if len(parts) >= 2:
            http_raw = parts[0]
            if "http code" in http_raw.lower():
                continue
            msg = parts[1]
            custom_code = parts[2] if len(parts) > 2 else ""
            match = re.search(r"\d{3}", http_raw)
            status_code = int(match.group(0)) if match else 200
            defs.append({
                "statusCode": status_code,
                "message": msg,
                "customCode": custom_code,
            })
    return defs


def extract_json_blocks(text: str) -> List[Any]:
    """Extract and parse all ```json ``` code blocks from text."""
    blocks = []
    pattern = re.compile(r"```(?:json)?\s*\n([\s\S]*?)\n```", re.IGNORECASE)
    for match in pattern.finditer(text):
        content = match.group(1).strip()
        if not content:
            continue
        try:
            parsed = json.loads(content)
            blocks.append(parsed)
        except json.JSONDecodeError:
            pass
    return blocks


def parse_environments(doc_text: str) -> List[Dict[str, str]]:
    """Extract environment base URLs from Markdown table."""
    envs = []
    match = re.search(r"###\s*\*{0,2}Environment\*{0,2}\s*\n([\s\S]*?)(?=\n###|\n##|$)", doc_text, re.IGNORECASE)
    if not match:
        return envs

    lines = [l.strip() for l in match.group(1).split("\n") if l.strip().startswith("|") and "---" not in l]
    if len(lines) >= 2:
        headers = [c.replace("**", "").strip() for c in lines[0].split("|") if c.strip()]
        values = [clean_url(c.replace("**", "").strip()) for c in lines[1].split("|") if c.strip()]
        for h, v in zip(headers, values):
            if v.startswith("http://") or v.startswith("https://"):
                envs.append({"name": h, "url": v})
    return envs


def parse_confluence_document(doc_text: str) -> Dict[str, Any]:
    """Parse a single Confluence spec document into endpoints, environments, and metadata."""
    text = unescape_confluence_md(doc_text)
    environments = parse_environments(text)

    # Find endpoint declarations: METHOD **/path**
    method_regex = re.compile(r"(?:^|\n)\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\*{0,2}([^\s\*]+)\*{0,2}", re.IGNORECASE)
    matches = list(method_regex.finditer(text))
    if not matches:
        return {"environments": environments, "endpoints": []}

    endpoints = []
    for idx, match in enumerate(matches):
        method = match.group(1).upper()
        path = match.group(2).strip()
        start_idx = match.start()
        end_idx = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section = text[start_idx:end_idx]
        before = text[:start_idx]

        # Extract name
        headings = [l.strip().replace("##", "").strip() for l in before.split("\n") if l.strip().startswith("## ")]
        doc_title_line = next((l.strip() for l in text.split("\n") if l.strip().startswith("# ")), "")
        doc_title = re.sub(r"^#\s*(?:SPEC(?:-WG)?-API\s*-\s*)?", "", doc_title_line, flags=re.IGNORECASE).strip()
        name = headings[-1] if headings else (doc_title or f"{method} {path}")

        # Description
        desc_match = re.search(r"Description:\s*([^\n]+)", section, re.IGNORECASE) or re.search(r"Description:\s*([^\n]+)", before, re.IGNORECASE)
        description = desc_match.group(1).strip() if desc_match else None

        # Headers
        headers = {}
        h_match = re.search(r"###\s*Headers([\s\S]*?)(?=\n###|\n##|$)", section, re.IGNORECASE)
        if h_match:
            headers = parse_headers_table(h_match.group(1))

        # Payload JSON
        request_body = None
        p_match = re.search(r"###\s*Payload[^\n]*([\s\S]*?)(?=\n###\s*Response|\n##|$)", section, re.IGNORECASE)
        if p_match:
            p_blocks = extract_json_blocks(p_match.group(1))
            if p_blocks:
                request_body = p_blocks[0]

        # Response Code Table
        status_defs = []
        rc_match = re.search(r"###\s*Response\s*Code([\s\S]*?)(?=\n###\s*Response\b|\n##|$)", section, re.IGNORECASE)
        if rc_match:
            status_defs = parse_response_code_table(rc_match.group(1))

        # Response JSON blocks
        response_blocks = []
        r_match = re.search(r"###\s*Response\b([\s\S]*?)(?=\n##\s+[A-Za-z]|\n#\s+|$)", section, re.IGNORECASE)
        if r_match:
            response_blocks = extract_json_blocks(r_match.group(1))

        endpoints.append({
            "name": name,
            "description": description,
            "method": method,
            "path": path,
            "headers": headers,
            "requestBody": request_body,
            "statusDefinitions": status_defs,
            "responseBlocks": response_blocks,
        })

    return {"environments": environments, "endpoints": endpoints}


def match_response_scenario(block: Any, status_defs: List[Dict[str, Any]], idx: int) -> Tuple[int, str]:
    """Map a JSON response body to appropriate status code and scenario name."""
    matched = None
    if isinstance(block, dict):
        code_val = block.get("code")
        if not code_val and isinstance(block.get("error_helper"), dict):
            code_val = block["error_helper"].get("code")

        if code_val and isinstance(code_val, str):
            for d in status_defs:
                if d.get("customCode", "").lower() == code_val.lower():
                    matched = d
                    break
            if not matched:
                if code_val.endswith("000"):
                    matched = {"statusCode": 200, "message": "Success", "customCode": code_val}
                elif re.search(r"28\d$", code_val):
                    matched = {"statusCode": 400, "message": "Validation Error", "customCode": code_val}
                elif re.search(r"18\d$", code_val):
                    matched = {"statusCode": 401, "message": "Unauthorized", "customCode": code_val}
                elif re.search(r"31\d$", code_val):
                    matched = {"statusCode": 404, "message": "Data Not Found", "customCode": code_val}
                elif re.search(r"99\d$", code_val):
                    matched = {"statusCode": 500, "message": "Internal Server Error", "customCode": code_val}

        if not matched and isinstance(block.get("status"), int) and 100 <= block["status"] < 600:
            matched = {"statusCode": block["status"], "message": str(block.get("message", f"HTTP {block['status']}")), "customCode": ""}

    if not matched:
        if idx == 0:
            matched = next((d for d in status_defs if d["statusCode"] == 200), {"statusCode": 200, "message": "Success", "customCode": ""})
        elif idx < len(status_defs):
            matched = status_defs[idx]
        else:
            matched = {"statusCode": 200, "message": f"Scenario {idx + 1}", "customCode": ""}

    status_code = matched["statusCode"]
    title_parts = [str(status_code)]
    if matched.get("message"):
        title_parts.append(matched["message"])
    if matched.get("customCode"):
        title_parts.append(f"({matched['customCode']})")

    return status_code, " - ".join(title_parts)


def convert_to_mock_api_studio(docs: List[str], project_id: str = "project-1") -> Dict[str, Any]:
    """Convert parsed documents into Mock API Studio ExtractedProjectData JSON structure."""
    collections = {}
    apis = []
    request_scenarios = []
    response_scenarios = []
    environments = {}

    for doc in docs:
        parsed = parse_confluence_document(doc)
        for env in parsed.get("environments", []):
            name = env["name"]
            environments[name.lower()] = {
                "id": str(uuid.uuid4()),
                "projectId": project_id,
                "name": name,
                "isBaseUrl": True,
                "values": {name.upper(): env["url"]},
                "variables": [{"id": str(uuid.uuid4()), "key": "baseUrl", "value": env["url"], "type": "plain", "enabled": True}],
                "status": True,
            }

        for ep in parsed.get("endpoints", []):
            col_name = extract_collection_name(ep["path"])
            col_key = col_name.lower()
            if col_key not in collections:
                col_id = str(uuid.uuid4())
                collections[col_key] = {
                    "id": col_id,
                    "projectId": project_id,
                    "name": col_name,
                    "description": f"Collection for {col_name} endpoints",
                    "status": True,
                }
            else:
                col_id = collections[col_key]["id"]

            api_id = str(uuid.uuid4())
            apis.append({
                "id": api_id,
                "projectId": project_id,
                "collectionId": col_id,
                "name": ep["name"],
                "description": ep.get("description"),
                "path": ep["path"],
                "methodRequest": ep["method"],
                "status": True,
            })

            req_id = str(uuid.uuid4())
            request_scenarios.append({
                "id": req_id,
                "apiId": api_id,
                "name": "Default Scenario",
                "description": f"Request scenario for {ep['name']}",
                "headers": ep.get("headers", {}),
                "queryParams": {},
                "pathParams": {},
                "body": ep.get("requestBody") or {},
                "bodyType": "JSON",
                "matchType": "EXACT",
                "priority": 0,
                "status": True,
            })

            seen_names: Dict[str, int] = {}
            r_blocks = ep.get("responseBlocks", [])
            if r_blocks:
                for b_idx, block in enumerate(r_blocks):
                    status_code, base_title = match_response_scenario(block, ep.get("statusDefinitions", []), b_idx)
                    count = seen_names.get(base_title, 0)
                    seen_names[base_title] = count + 1
                    final_title = f"{base_title} (Variant {count + 1})" if count > 0 else base_title

                    response_scenarios.append({
                        "id": str(uuid.uuid4()),
                        "requestScenarioId": req_id,
                        "name": final_title,
                        "description": "Auto-generated from Confluence Markdown spec",
                        "statusCode": status_code,
                        "headers": {"Content-Type": "application/json"},
                        "body": block,
                        "responseType": "JSON",
                        "delayMs": 0,
                        "weight": 100,
                        "priority": b_idx,
                        "status": True,
                    })
            else:
                response_scenarios.append({
                    "id": str(uuid.uuid4()),
                    "requestScenarioId": req_id,
                    "name": "200 - Success",
                    "description": "Default success scenario",
                    "statusCode": 200,
                    "headers": {"Content-Type": "application/json"},
                    "body": {"code": "200", "message": "Success"},
                    "responseType": "JSON",
                    "delayMs": 0,
                    "weight": 100,
                    "priority": 0,
                    "status": True,
                })

    return {
        "collections": list(collections.values()),
        "environments": list(environments.values()),
        "apis": apis,
        "requestScenarios": request_scenarios,
        "responseScenarios": response_scenarios,
    }


def convert_to_openapi_3(docs: List[str], title: str = "Confluence Converted API", version: str = "1.0.0") -> Dict[str, Any]:
    """Convert parsed documents into valid OpenAPI 3.0.3 Specification JSON."""
    paths: Dict[str, Any] = {}
    servers: List[Dict[str, str]] = []
    tags: List[Dict[str, str]] = []
    seen_tags = set()

    for doc in docs:
        parsed = parse_confluence_document(doc)
        for env in parsed.get("environments", []):
            if not any(s["url"] == env["url"] for s in servers):
                servers.append({"url": env["url"], "description": env["name"]})

        for ep in parsed.get("endpoints", []):
            tag_name = extract_collection_name(ep["path"])
            if tag_name not in seen_tags:
                seen_tags.add(tag_name)
                tags.append({"name": tag_name, "description": f"Operations for {tag_name}"})

            path_key = ep["path"]
            if path_key not in paths:
                paths[path_key] = {}

            method_key = ep["method"].lower()

            parameters = []
            for h_key, h_val in ep.get("headers", {}).items():
                parameters.append({
                    "name": h_key,
                    "in": "header",
                    "required": True if "auth" in h_key.lower() or "key" in h_key.lower() else False,
                    "schema": {"type": "string"},
                    "example": h_val,
                })

            operation: Dict[str, Any] = {
                "tags": [tag_name],
                "summary": ep["name"],
                "description": ep.get("description") or ep["name"],
                "operationId": f"{method_key}_{re.sub(r'[^a-zA-Z0-9]+', '_', path_key.strip('/'))}",
                "parameters": parameters,
                "responses": {},
            }

            req_body = ep.get("requestBody")
            if req_body is not None:
                operation["requestBody"] = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"},
                            "example": req_body,
                        }
                    }
                }

            # Responses
            r_blocks = ep.get("responseBlocks", [])
            status_defs = ep.get("statusDefinitions", [])
            if r_blocks:
                for b_idx, block in enumerate(r_blocks):
                    status_code, resp_title = match_response_scenario(block, status_defs, b_idx)
                    sc_str = str(status_code)
                    if sc_str not in operation["responses"]:
                        operation["responses"][sc_str] = {
                            "description": resp_title,
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object"},
                                    "examples": {},
                                }
                            }
                        }
                    ex_map = operation["responses"][sc_str]["content"]["application/json"]["examples"]
                    ex_key = f"example_{len(ex_map) + 1}"
                    ex_map[ex_key] = {
                        "summary": resp_title,
                        "value": block,
                    }
            else:
                operation["responses"]["200"] = {
                    "description": "Successful operation",
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"},
                            "example": {"code": "200", "message": "Success"}
                        }
                    }
                }

            paths[path_key][method_key] = operation

    return {
        "openapi": "3.0.3",
        "info": {
            "title": title,
            "description": "API specification generated from Confluence Markdown docs",
            "version": version,
        },
        "servers": servers,
        "tags": tags,
        "paths": paths,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Confluence API Markdown into Mock API Studio JSON or OpenAPI 3.0.3.")
    parser.add_argument("paths", nargs="+", help="File path(s) or folder containing .md documents")
    parser.add_argument("-f", "--format", choices=["studio", "openapi"], default="studio", help="Target output format: 'studio' (Mock API Studio) or 'openapi' (OpenAPI 3.0.3 Spec)")
    parser.add_argument("-o", "--output", help="Output file path (default: stdout)")
    parser.add_argument("--project-id", default="project-1", help="Target projectId for Mock API Studio format")
    parser.add_argument("--title", default="Confluence Converted API", help="Title for OpenAPI format")

    args = parser.parse_args()

    files_to_read: List[Path] = []
    for p_str in args.paths:
        p = Path(p_str)
        if p.is_dir():
            files_to_read.extend(sorted(p.glob("*.md")))
        elif p.is_file():
            files_to_read.append(p)
        else:
            print(f"Error: Path not found: {p_str}", file=sys.stderr)
            sys.exit(1)

    if not files_to_read:
        print("No .md files found.", file=sys.stderr)
        sys.exit(1)

    documents = [f.read_text(encoding="utf-8") for f in files_to_read]

    if args.format == "openapi":
        result = convert_to_openapi_3(documents, title=args.title)
    else:
        result = convert_to_mock_api_studio(documents, project_id=args.project_id)

    formatted_json = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(formatted_json, encoding="utf-8")
        print(f"Successfully converted {len(files_to_read)} file(s) -> {args.output}")
    else:
        print(formatted_json)


if __name__ == "__main__":
    main()
