---
name: restore-converted-cultures
description: Plan and apply reviewed CK3 province culture assignments after an Imperator-to-CK3 conversion.
---

# Restore converted cultures

Use this skill when asked to restore local culture variety in an Imperator:
Rome-to-CK3 converted mod.

## Key distinction

Culture definitions make culture IDs available to CK3, but do not place them on
the map. Map placement is stored in `history/provinces` in the converted mod.
Changing that history changes a new game's starting map; it does not alter an
existing save or automatically change character cultures.

## Workflow

1. Locate the culture template at
   `campaign-2026-07-12-the-first/game-2-ck3/mod/cultures_template/`.
2. Inspect the final converted mod's `history/provinces` files and identify the
   province IDs, existing culture assignments, and relevant regional context.
   Treat older conversions only as examples: IDs and geography must be
   rechecked against the final output.
   If available, use
   `data/province_culture_assignments_FCL1_2026_10.csv` as a reference for the
   campaign's beginning-of-game culture distribution. It is a reference
   baseline, not an unquestioned final assignment map; compare IDs and
   locations, then decide which cultures should be restored in the target.
4. Review the culture IDs available in the template's
   `common/culture/cultures` definitions. Never invent an ID. If the requested
   local culture is not defined, explain that its definition must be added
   separately before assigning it.
5. Build or update
   `data/province_culture_assignments.csv` with explicit `province_id,culture`
   pairs and optional notes. Do not bulk-replace all uses of a broad culture
   without an intentional region-to-culture plan. Use a reasonable regional
   spread and keep all provinces not selected by the user or the agreed map
   unchanged.
6. Summarize the proposed regions, cultures, province counts, and any uncertain
   placements for the user to review before applying a whole-world mapping.
7. Run `tools/reassign_province_cultures.py` against the target converted mod
   without `--apply` first. Resolve all validation errors and review its preview.
   The script deliberately stops on nested/date-specific province culture
   entries; inspect those entries and handle them explicitly instead of
   assuming the top-level assignment controls the bookmark.
8. Apply only after the user has approved the mapping or clearly requested
   execution. Add `--apply`; the script creates timestamped backups beside the
   converted mod.
9. Verify the script's summary, inspect the resulting changed province-history
   entries, and report that a new CK3 game is required to see start-date
   history. Do not claim an in-game result unless the game was actually tested.

## Script invocation

From the repository root, preview using:

```powershell
py -3 "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template\tools\reassign_province_cultures.py" `
  --mod "C:\path\to\converted\mod" `
  --mapping "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template\data\province_culture_assignments.csv" `
  --template "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template"
```

Add `--apply` only after reviewing the preview. For a complete world map,
review the exported starting-map reference and update the assignment CSV with
all intended provinces. The script applies a mapping but does not infer
pre-assimilation cultures or decide geography on its own.
