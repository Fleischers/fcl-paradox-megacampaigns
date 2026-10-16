#!/usr/bin/env python3
"""Apply an explicit province-ID-to-culture mapping to CK3 province history."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
import sys
from dataclasses import dataclass
from pathlib import Path


IDENTIFIER = re.compile(r"^[A-Za-z0-9_]+$")
PROVINCE_HEADER = re.compile(r"(?m)^[ \t]*(\d+)[ \t]*=[ \t]*\{")
CULTURE_LINE = re.compile(r"^([ \t]*culture[ \t]*=[ \t]*)([A-Za-z0-9_]+)(.*)$")


class MappingError(Exception):
    """Raised when the mapping or target mod cannot be safely processed."""


@dataclass(frozen=True)
class Assignment:
    province_id: str
    culture: str
    row_number: int


@dataclass
class ProvinceBlock:
    province_id: str
    open_brace: int
    close_brace: int
    culture_lines: list[tuple[int, int, re.Match[str]]]
    has_nested_culture: bool


def read_text(path: Path) -> tuple[str, bool]:
    raw = path.read_bytes()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    try:
        return raw.decode("utf-8-sig"), has_bom
    except UnicodeDecodeError as error:
        raise MappingError(f"{path}: expected UTF-8 text: {error}") from error


def matching_brace(text: str, open_brace: int) -> int:
    depth = 0
    in_quote = False
    escaped = False
    in_comment = False

    for index in range(open_brace, len(text)):
        char = text[index]
        if in_comment:
            if char == "\n":
                in_comment = False
            continue
        if in_quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_quote = False
            continue
        if char == "#":
            in_comment = True
        elif char == '"':
            in_quote = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index
            if depth < 0:
                break

    raise MappingError(f"Unclosed province history block at character {open_brace}")


def top_level_culture_lines(
    text: str, open_brace: int, close_brace: int
) -> list[tuple[int, int, re.Match[str]]]:
    lines: list[tuple[int, int, re.Match[str]]] = []
    depth = 1
    in_quote = False
    escaped = False
    position = open_brace + 1

    while position < close_brace:
        line_end = text.find("\n", position, close_brace)
        if line_end == -1:
            line_end = close_brace
            next_position = close_brace
        else:
            next_position = line_end + 1
        line = text[position:line_end]
        if depth == 1:
            match = CULTURE_LINE.match(line)
            if match:
                lines.append((position, line_end, match))

        in_comment = False
        for char in line:
            if in_comment:
                continue
            if in_quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_quote = False
            elif char == "#":
                in_comment = True
            elif char == '"':
                in_quote = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1

        position = next_position

    return lines


def index_provinces(history_dir: Path) -> dict[str, tuple[Path, ProvinceBlock]]:
    province_index: dict[str, tuple[Path, ProvinceBlock]] = {}
    for path in sorted(history_dir.rglob("*.txt")):
        text, _ = read_text(path)
        for header in PROVINCE_HEADER.finditer(text):
            province_id = header.group(1)
            open_brace = text.find("{", header.start(), header.end())
            close_brace = matching_brace(text, open_brace)
            culture_lines = top_level_culture_lines(text, open_brace, close_brace)
            block = ProvinceBlock(
                province_id=province_id,
                open_brace=open_brace,
                close_brace=close_brace,
                culture_lines=culture_lines,
                has_nested_culture=(
                    sum(
                        1
                        for line in text[open_brace + 1 : close_brace].splitlines()
                        if CULTURE_LINE.match(line)
                    )
                    > len(culture_lines)
                ),
            )
            if province_id in province_index:
                previous = province_index[province_id][0]
                raise MappingError(
                    f"Province ID {province_id} appears in both {previous} and {path}"
                )
            province_index[province_id] = (path, block)
    return province_index


def read_mapping(path: Path) -> list[Assignment]:
    assignments: list[Assignment] = []
    seen: set[str] = set()
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            if reader.fieldnames is None or not {"province_id", "culture"}.issubset(
                reader.fieldnames
            ):
                raise MappingError(
                    f"{path}: CSV header must include province_id,culture"
                )
            for row_number, row in enumerate(reader, start=2):
                province_id = (row.get("province_id") or "").strip()
                culture = (row.get("culture") or "").strip()
                if not province_id and not culture:
                    continue
                if not province_id.isdigit():
                    raise MappingError(
                        f"{path}:{row_number}: invalid province_id {province_id!r}"
                    )
                if not IDENTIFIER.fullmatch(culture):
                    raise MappingError(
                        f"{path}:{row_number}: invalid culture ID {culture!r}"
                    )
                if province_id in seen:
                    raise MappingError(
                        f"{path}:{row_number}: duplicate province_id {province_id}"
                    )
                seen.add(province_id)
                assignments.append(Assignment(province_id, culture, row_number))
    except OSError as error:
        raise MappingError(f"Cannot read mapping {path}: {error}") from error
    if not assignments:
        raise MappingError(f"{path}: mapping contains no assignments")
    return assignments


def culture_ids_in(directory: Path) -> set[str]:
    culture_dir = directory / "common" / "culture" / "cultures"
    if not culture_dir.is_dir():
        return set()
    ids: set[str] = set()
    for path in culture_dir.rglob("*.txt"):
        text, _ = read_text(path)
        ids.update(
            match.group(1)
            for match in re.finditer(r"(?m)^([A-Za-z0-9_]+)[ \t]*=[ \t]*\{", text)
        )
    return ids


def rewrite_block(text: str, block: ProvinceBlock, culture: str, newline: str) -> str:
    if len(block.culture_lines) > 1:
        raise MappingError(
            f"Province {block.province_id} has multiple top-level culture assignments"
        )
    if block.culture_lines:
        start, end, match = block.culture_lines[0]
        if match.group(2) == culture:
            return text
        replacement = match.group(1) + culture + match.group(3)
        return text[:start] + replacement + text[end:]

    opening_line_end = text.find("\n", block.open_brace, block.close_brace)
    if opening_line_end == -1:
        insertion = f" culture = {culture} "
        return text[: block.close_brace] + insertion + text[block.close_brace :]
    insert_at = opening_line_end + 1
    return (
        text[:insert_at]
        + f"\tculture = {culture}{newline}"
        + text[insert_at:]
    )


def parse_args() -> argparse.Namespace:
    script_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description=(
            "Preview or apply explicit CK3 province culture assignments. "
            "Without --apply, no files are changed."
        )
    )
    parser.add_argument(
        "--mod",
        required=True,
        type=Path,
        help="Converted CK3 mod directory to update",
    )
    parser.add_argument(
        "--mapping",
        type=Path,
        default=script_root / "data" / "province_culture_assignments.csv",
        help="CSV mapping (default: the template's pilot mapping)",
    )
    parser.add_argument(
        "--template",
        type=Path,
        default=script_root,
        help="Culture template directory used to validate culture IDs",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write changes and create a timestamped backup directory",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    mod_dir = args.mod.resolve()
    history_dir = mod_dir / "history" / "provinces"
    if not mod_dir.is_dir():
        raise MappingError(f"Converted mod directory does not exist: {mod_dir}")
    if not history_dir.is_dir():
        raise MappingError(f"Province history directory does not exist: {history_dir}")
    if not args.mapping.is_file():
        raise MappingError(f"Mapping CSV does not exist: {args.mapping}")

    assignments = read_mapping(args.mapping)
    province_index = index_provinces(history_dir)
    known_cultures = culture_ids_in(mod_dir) | culture_ids_in(args.template.resolve())

    changes: dict[Path, list[tuple[ProvinceBlock, str]]] = {}
    for assignment in assignments:
        if assignment.province_id not in province_index:
            raise MappingError(
                f"{args.mapping}:{assignment.row_number}: province "
                f"{assignment.province_id} is not present in {history_dir}"
            )
        if assignment.culture not in known_cultures:
            raise MappingError(
                f"{args.mapping}:{assignment.row_number}: culture "
                f"{assignment.culture!r} is not defined in the converted mod "
                "or culture template"
            )
        path, block = province_index[assignment.province_id]
        if block.has_nested_culture:
            raise MappingError(
                f"{args.mapping}:{assignment.row_number}: province "
                f"{assignment.province_id} has a nested/date-specific culture "
                "history entry. Review that province manually before applying."
            )
        text, _ = read_text(path)
        updated = rewrite_block(text, block, assignment.culture, "\r\n" if "\r\n" in text else "\n")
        if updated != text:
            changes.setdefault(path, []).append((block, assignment.culture))

    changed_count = sum(len(entries) for entries in changes.values())
    if changed_count == 0:
        print(f"All {len(assignments)} assignments already match; nothing to change.")
        return 0

    print(f"{'Would update' if not args.apply else 'Updating'} {changed_count} of "
          f"{len(assignments)} assignments in {len(changes)} province-history file(s):")
    for path, entries in sorted(changes.items()):
        print(f"  {path.relative_to(mod_dir)}: {len(entries)} province(s)")
    if not args.apply:
        print("Preview only. Re-run with --apply to write changes.")
        return 0

    timestamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    backup_dir = mod_dir.parent / f"{mod_dir.name}_culture_backups_{timestamp}"
    staged: dict[Path, bytes] = {}
    originals: dict[Path, bytes] = {}
    for path in changes:
        original = path.read_bytes()
        text, has_bom = read_text(path)
        updated = text
        newline = "\r\n" if "\r\n" in text else "\n"
        for block, culture in sorted(
            changes[path], key=lambda item: item[0].open_brace, reverse=True
        ):
            updated = rewrite_block(updated, block, culture, newline)
        encoded = updated.encode("utf-8")
        if has_bom:
            encoded = b"\xef\xbb\xbf" + encoded
        staged[path] = encoded
        originals[path] = original

    backups_created = False
    try:
        for path, original in originals.items():
            relative = path.relative_to(mod_dir)
            backup = backup_dir / relative
            backup.parent.mkdir(parents=True, exist_ok=True)
            backup.write_bytes(original)
        backups_created = True
        for path, content in staged.items():
            path.write_bytes(content)
    except OSError as error:
        rollback_errors: list[str] = []
        if backups_created:
            for path, original in originals.items():
                try:
                    path.write_bytes(original)
                except OSError as rollback_error:
                    rollback_errors.append(f"{path}: {rollback_error}")
        rollback_message = (
            f" Rollback errors: {'; '.join(rollback_errors)}"
            if rollback_errors
            else " Original files were restored."
            if backups_created
            else ""
        )
        raise MappingError(
            f"Failed while writing updates: {error}.{rollback_message} "
            f"Backups are in {backup_dir} if they were created."
        ) from error

    print(f"Updated {changed_count} province assignment(s).")
    print(f"Backups saved outside the mod at: {backup_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MappingError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(2)
