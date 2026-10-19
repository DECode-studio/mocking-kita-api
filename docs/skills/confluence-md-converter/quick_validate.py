#!/usr/bin/env python3
"""Quickly validate Confluence Markdown documents against minimum requirements."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def validate_confluence_md(content: str) -> dict:
    """Validate markdown content and report errors and warnings."""
    errors = []
    warnings = []

    # 1. Check Method and Path
    method_match = re.search(r"(?:^|\n)\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\*{0,2}([^\s\*]+)\*{0,2}", content, re.IGNORECASE)
    if not method_match:
        errors.append("Missing HTTP Method & Path declaration (e.g., 'POST **/v1/resource**' or 'GET /v1/resource').")
    else:
        method = method_match.group(1).upper()
        path = method_match.group(2).strip()

    # 2. Check Response Code Table
    rc_match = re.search(r"###\s*Response\s*Code([\s\S]*?)(?=\n###\s*Response\b|\n##|$)", content, re.IGNORECASE)
    if not rc_match:
        warnings.append("No '### Response Code' table found. Defaulting responses to 200/400 heuristics.")
    else:
        rows = [l for l in rc_match.group(1).split("\n") if l.strip().startswith("|") and "---" not in l]
        if len(rows) < 2:
            warnings.append("'### Response Code' table appears empty or missing rows.")

    # 3. Check Response Code Blocks
    resp_match = re.search(r"###\s*Response\b([\s\S]*?)(?=\n##\s+[A-Za-z]|\n#\s+|$)", content, re.IGNORECASE)
    if not resp_match:
        errors.append("Missing '### Response' section.")
    else:
        json_pattern = re.compile(r"```(?:json)?\s*\n([\s\S]*?)\n```", re.IGNORECASE)
        blocks = list(json_pattern.finditer(resp_match.group(1)))
        if not blocks:
            errors.append("No code block (```json) found in '### Response' section.")
        else:
            invalid_count = 0
            for b in blocks:
                try:
                    json.loads(b.group(1).strip())
                except json.JSONDecodeError:
                    invalid_count += 1
            if invalid_count > 0:
                errors.append(f"{invalid_count} response code block(s) contain invalid JSON.")

    # 4. Check Payload (for POST/PUT/PATCH)
    if method_match and method_match.group(1).upper() in ("POST", "PUT", "PATCH"):
        payload_match = re.search(r"###\s*Payload[^\n]*([\s\S]*?)(?=\n###\s*Response|\n##|$)", content, re.IGNORECASE)
        if not payload_match:
            warnings.append(f"HTTP {method_match.group(1).upper()} endpoint does not specify '### Payload JSON Body'.")
        else:
            p_blocks = list(re.compile(r"```(?:json)?\s*\n([\s\S]*?)\n```", re.IGNORECASE).finditer(payload_match.group(1)))
            if p_blocks:
                try:
                    json.loads(p_blocks[0].group(1).strip())
                except json.JSONDecodeError:
                    warnings.append("Request body JSON in '### Payload JSON Body' is not valid JSON.")

    return {
        "valid": len(errors) == 0,
        "method": method_match.group(1).upper() if method_match else None,
        "path": method_match.group(2).strip() if method_match else None,
        "errors": errors,
        "warnings": warnings,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Confluence Markdown files for Mock API Studio import.")
    parser.add_argument("paths", nargs="+", help="File(s) or directory to validate")
    args = parser.parse_args()

    files: list[Path] = []
    for p_str in args.paths:
        p = Path(p_str)
        if p.is_dir():
            files.extend(sorted(p.glob("*.md")))
        elif p.is_file():
            files.append(p)

    total_valid = 0
    total_invalid = 0

    for f in files:
        result = validate_confluence_md(f.read_text(encoding="utf-8"))
        status_label = "[VALID]" if result["valid"] else "[INVALID]"
        ep_info = f" ({result['method']} {result['path']})" if result["method"] else ""
        print(f"{status_label} {f.name}{ep_info}")

        for e in result["errors"]:
            print(f"  ❌ Error: {e}")
        for w in result["warnings"]:
            print(f"  ⚠️ Warning: {w}")

        if result["valid"]:
            total_valid += 1
        else:
            total_invalid += 1

    print("\nSummary:")
    print(f"  Total Checked: {len(files)}")
    print(f"  Valid: {total_valid}")
    print(f"  Invalid: {total_invalid}")

    if total_invalid > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()

