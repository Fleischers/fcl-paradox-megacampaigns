# Cultures template

## Purpose

This is a reusable CK3 mod for culture definitions and selected culture-related
assets. It contains an Iberian province-history overlay for a quick in-game
pilot, plus a script and CSV for applying an explicit province-culture map to a
converted mod.

## Included province assignments

`history/provinces/00_culture_template_iberia.txt` is an initial Iberian pilot:

- 14 province IDs in the example's north-western Iberian region are assigned to
  `celtiberian`.
- 13 province IDs in the example's Lusitanian region are assigned to
  `lusoiberian`.
- Other Iberian provinces and all other regions are left unchanged.

The assignments use CK3 province IDs taken from `FCL1_2026_10_10` as a
geographic reference. The example conversion itself is not modified. These
placements are a starting point, not a complete or definitive culture map.
The same 27 pilot entries are in
`data/province_culture_assignments.csv`, the input mapping for the script.

`data/province_culture_assignments_FCL1_2026_10.csv` is a separate full-world
reference extracted from the beginning-of-game export at
`C:\Users\fleis\Documents\Paradox Interactive\Crusader Kings III\mod\cultures_FCL1_2026_10`.
It started with 3,476 explicit province assignments across 214 culture IDs,
with the source province-history file recorded in each row. It now contains
3,502 assignments across 215 cultures. Intentional overrides include all 17
barony provinces in Duchy of Brittany (`d_brittany`) to `breton`, 23 Vepsian
provinces in the White Rus and Novgorod kingdoms to the East Slavic `urslavic`
culture, and all 25 barony provinces in the Duchy of Lombardy (`d_lombardia`)
to `etruscan`. Eleven Breton provinces and 17 Lombard provinces did not have
explicit cultures in the source export. Estonian provinces were not changed.
All 215 culture IDs used are defined in this template.

This reference records the exported starting map; it is not a final 1200 AUC
assignment plan. Before using it with another conversion, verify that the
province IDs still refer to the same places and decide whether each source
culture should be restored there. Provinces without an explicit culture entry
in the export are intentionally absent from the CSV.

The two culture IDs are defined in this template's `common/culture/cultures`
files. The template's descriptor replaces the culture and pillar definition
directories so the template versions are used.

## Applying a mapping to a converted mod

After the campaign reaches 1200 AUC and the final save has been converted:

1. Back up the converted CK3 mod and check that the final conversion uses the
   same CK3 map/province IDs as the pilot.
2. Expand `data/province_culture_assignments.csv` with the desired
   `province_id,culture` entries. Province IDs must be taken from the **final
   converted mod** and checked on the map; do not assume the example IDs still
   represent the same places. `notes` is optional. The exported starting map
   in `data/province_culture_assignments_FCL1_2026_10.csv` may be used as a
   reference when deciding what to restore, but do not copy it over the pilot
   mapping without reviewing its global effect.
3. Preview the proposed changes. On Windows, from the repository root:

   ```powershell
   py -3 "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template\tools\reassign_province_cultures.py" `
     --mod "C:\path\to\the\final\converted\mod" `
     --mapping "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template\data\province_culture_assignments.csv" `
     --template "campaign-2026-07-12-the-first\game-2-ck3\mod\cultures_template"
   ```

4. Review the previewed province-history files and counts. The script checks
   that every province ID exists and every culture is defined by either the
   converted mod or the template. It does not determine what culture should
   live in a province, and it stops for provinces with nested/date-specific
   culture-history entries so they can be reviewed manually.
5. When the preview is correct, run the same command with `--apply`. It updates
   only the mapped provinces and makes timestamped backups beside the converted
   mod. The script defaults to preview-only; without `--apply`, files are not
   changed.
6. Ensure the converted mod uses the culture definitions and supporting data
   from this template (for example by merging the needed template culture data
   into the converted mod while keeping its own `descriptor.mod`). Then start a
   **new game** from the converted bookmark and check the map and CK3 error log.
   Existing saves do not pick up province-history changes.

The in-game overlay is intentionally limited to Iberia. The full-world CSV is
an exported starting-map reference, not an automatic reconstruction of
pre-assimilation cultures in a later save. To reassign the whole world, review
the reference against the final conversion and decide which assignments to
restore. The script applies the selected map; it cannot infer the desired
culture for a province by itself.

The overlay in `history/provinces/` is for enabling the template as a separate
test mod. The script is the recommended route for the final conversion because
it applies assignments directly to that conversion's own province-history
files.

## Characters and playable rulers

Province-history assignments change the culture of the affected provinces at
the start of a new game. They do not change character culture, title history,
faith, or the culture of provinces after the campaign begins. If a ruler should
also belong to one of the restored cultures at game start, that character's
history needs a matching culture assignment as a separate, conversion-specific
change.

## Claude Code skill

The repository skill at
[`.claude/skills/restore-converted-cultures/SKILL.md`](../../../../.claude/skills/restore-converted-cultures/SKILL.md)
describes how an assistant can help inspect the final conversion, build and
review the assignment CSV, and run the script safely. The skill guides the
workflow; the script performs the province-history edits.
