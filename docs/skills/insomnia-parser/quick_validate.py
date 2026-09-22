#!/usr/bin/env python3
"""Lightweight validator for the insomnia-parser skill.

This intentionally avoids third-party dependencies so it can run in a fresh
workspace where PyYAML is not installed.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


REQUIRED_SECTIONS = [
    "## Status Implementasi Saat Ini",
    "## Target Output Template",
    "## Insomnia Reference Shape",
    "## Mapping Environment",
    "## Mapping URL, API, dan Collection",
    "## Mapping Request Scenario",
    "## Response Chaining `{% response %}`",
    "## Step Ordering",
    "## Script Insomnia",
    "## Data Sheet",
    "## Import Behavior Mock API Studio",
    "## Minimal Converter Checklist",
]

REQUIRED_TERMS = [
    "pre-converter Insomnia",
    "mock-api-studio/scenario-flow/v1",
    "FlowExportTemplate",
    "subEnvironments",
    "api.targetEnvironment",
    "topological sort",
    "preRequest",
    "flow.variables.datasheet",
]


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise ValueError("SKILL.md must start with YAML frontmatter delimiter '---'.")

    try:
        raw_frontmatter = text.split("---\n", 2)[1]
    except IndexError as exc:
        raise ValueError("SKILL.md frontmatter is not closed with '---'.") from exc

    parsed: dict[str, str] = {}
    for line in raw_frontmatter.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Invalid frontmatter line: {line!r}")
        key, value = line.split(":", 1)
        parsed[key.strip()] = value.strip().strip("'\"")
    return parsed


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_file = skill_dir / "SKILL.md"

    if not skill_file.exists():
        return [f"Missing required file: {skill_file}"]

    text = skill_file.read_text(encoding="utf-8")

    try:
        frontmatter = parse_frontmatter(text)
    except ValueError as exc:
        errors.append(str(exc))
        frontmatter = {}

    if frontmatter.get("name") != "insomnia-to-scenario-flow-parser":
        errors.append("Frontmatter name must be 'insomnia-to-scenario-flow-parser'.")

    description = frontmatter.get("description", "")
    if len(description) < 40:
        errors.append("Frontmatter description is too short or missing.")

    if "YAML/JSON v5" not in description:
        errors.append("Description should mention Insomnia YAML/JSON v5.")

    for section in REQUIRED_SECTIONS:
        if section not in text:
            errors.append(f"Missing required section: {section}")

    for term in REQUIRED_TERMS:
        if term not in text:
            errors.append(f"Missing required term/context: {term}")

    if "belum menerima YAML Insomnia langsung" not in text:
        errors.append("Skill must explicitly state that current import does not accept Insomnia YAML directly.")

    if re.search(r"import\s+yaml|from\s+['\"]js-yaml['\"]", text):
        errors.append("Skill should not embed the old js-yaml converter implementation.")

    if "file://" in text:
        errors.append("Skill should avoid file:// links; use repository-relative paths.")

    return errors


def main() -> int:
    skill_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent
    errors = validate_skill(skill_dir)
    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Validation passed: {skill_dir / 'SKILL.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
