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
4,148 assignments across 242 cultures. Intentional overrides include all 17
barony provinces in Duchy of Brittany (`d_brittany`) to `breton`, 23 Vepsian
provinces in the White Rus and Novgorod kingdoms to the East Slavic `urslavic`
culture, and all 25 barony provinces in the Duchy of Lombardy (`d_lombardia`)
to `etruscan`. Eleven Breton provinces and 17 Lombard provinces did not have
explicit cultures in the source export. The eight remaining Gallic provinces
in the Kingdom of North Italy were changed to `italian`; two of those had no
explicit culture in the source export. All 35 barony provinces in the Duchy of
Bohemia (`d_bohemia`) were changed to `czech`; 27 had no explicit culture in
the source export. All 11 barony provinces in the Duchy of Granada
(`d_granada`) were changed to `andalusian`; seven had no explicit culture in
the source export. All four barony provinces in the Duchy of Mallorca
(`d_mallorca`) were changed to `catalan`; one had no explicit culture in the
source export. All 14 barony provinces in the Duchy of Sicily (`d_sicily`)
were changed to `maghrebi`; nine had no explicit culture in the source export.
All 16 barony provinces in the Duchy of Dyrrachion (`d_dyrrachion`) were
changed to `albanian`; 11 had no explicit culture in the source export.
All 13 barony provinces in the Duchy of Croatia (`d_croatia`) were changed to
`croatian`; nine had no explicit culture in the source export. Estonian
provinces were not changed. All 28 barony provinces in the Duchy of Nyitra
(`d_nyitra`, corresponding to Nitra) and all 18 barony provinces in the Duchy
of Moravia (`d_moravia`) were changed to `slovien`; 19 Nyitra and 12 Moravia
provinces had no explicit culture in the source export. The template does not
define a Slovakian culture, so Slovien was used for Nyitra as requested.
All 22 barony provinces in the Duchy of Wielkopolska (Polania), 15 in Upper
Silesia, 19 in Lower Silesia, and 20 in Mazovia were changed to `polish`; 49
had no explicit culture in the source export. Lesser Poland was not changed.
All 12 baronies in Berry and 16 in Orléans were changed to `french`; 19 had no
explicit culture in the source export. In the Kingdom of Aquitaine
(`k_aquitane_gaul`), the 11 baronies that had `gallic` were changed to
`occitan`; all other culture assignments there were left unchanged. All 13
baronies in the Duchy of Sardinia (`d_sardinia`) were changed to `sardinian`;
eight had no explicit culture in the source export. All 26 baronies in the
Duchy of Barcelona (`d_barcelona`) were changed to `catalan`; 18 had no
explicit culture in the source export. All 16 baronies in Castile
(`d_castilla`) and seven in Cantabria (`d_cantabria`) were changed to
`castilian`; 16 had no explicit culture in the source export. All 17 baronies
in León (`d_leon`) were changed to `asturleonese`, the closest available
culture because the template does not define `asturian`. The other 34
baronies in the Kingdom of Galicia (`k_iberian_galicia`) - Galicia, Asturias,
and Porto - were changed to `galician`; 25 had no explicit culture in the
source export. All 64 baronies in the Kingdom of Tahert (`k_tahert`) were
changed to `numidian`; 45 had no explicit culture in the source export. There
is no `d_moesia` landed duchy in the converted mod; as clarified, Moesia is
represented by the County of Nikopolis (`c_nikopolis`), whose four baronies
were assigned to `bulgarian`. Naissus (`c_naissus`, four baronies) and Vidin
(`d_vidin`, eight baronies) were also assigned to `bulgarian`. The earlier
Dobrudja assignment was removed and its starting cultures restored. All 21
baronies in the Duchy of Raška (`d_rashka`) were assigned to `serbian`, and
all 16 baronies in the Duchy of Visegrad (`d_visegrad`) were assigned to
`mogyer` (the template also defines `hungarian`). All 242 culture IDs used
are defined in this template. The seven baronies in the Kingdom of Caucasus
(`k_caucasus`) that were Sarmatian were changed to `khazar`; other cultures
in the kingdom were left unchanged. In the Kingdom of Rhetia (`k_rhetia`),
the 11 baronies that were Gallic were changed to `swabian`; all other
cultures in the kingdom were left unchanged. The nine Rhetian baronies with
the in-game display culture Scordiscian (internal ID `celtic_pannonian`) were
changed to `bavarian`. All baronies in the Duchies of Bavaria (`d_bavaria`,
27), Nordgau (`d_nordgau`, 13), and Salzburg (`d_salzburg`, 17) were also
changed to `bavarian`. All 18 baronies in Upper Bosnia (`d_bosna`) and all
12 in Lower Bosnia (`d_lower_bosna`) were changed to `bosnian`. All 15
baronies in the Duchy of Moldavia (`d_moldova`) were changed to `vlach`.
All 19 baronies in the Duchy of York (`d_york`) were changed to `angle`, and
all eight in the Duchy of Meath (`d_meath`) to `norse`. All 148 baronies in
the Kingdom of Germania Superior (`k_germania_superior`) were changed to
`franconian`. The Duchy of Pomerania (`d_pommerania`) was changed to
`pommeranian` (the culture's defined ID; displayed as Pomeranian), while all
13 baronies in the Duchy of Veletia (`d_nordmark`, its Polabian cultural
title name) were changed to `polabian`. The five requested Egyptian duchies -
Delta (`d_delta`, 14 baronies), Cairo (`d_cairo`, 10), Al-Said (`d_al-said`,
19), Sinai (`d_sinai`, 10), and Nobatia (`d_nobatia`, 12) - were all changed
to `egyptian`.
The three baronies in the County of Kerch (`c_kerch`) were changed to
`gothic`, a localized assignment reflecting the later Gothic presence in
Crimea rather than changing the entire duchy.
The five baronies in the County of Tunis (`c_tunis`) were changed from
`vandal` to `catalan`; other counties in the Duchy of Tunis remain Vandal.
All five currently Samnite provinces outside the County of Cosenza were
changed to `langobard`; the Samnite province in Cosenza was left unchanged.
All three currently Mesapic provinces outside the County of Lecce were
changed to `lombard`; Lecce's Mesapic province was left unchanged.
All 14 baronies in the Duchy of Tunis (`d_tunis`) were changed to `vandal`.
All eight baronies in the Duchy of Kroumerie (`d_kroumerie`) were also changed
to `vandal`.
All 11 baronies in the Duchy of Coimbra (`d_coimbra`) were changed to `suebi`
(Suebian).
All six baronies in the County of Ifni (`c_ifni`) were changed to `scythian`.
All three baronies in the County of Orania (`c_orania`) were changed to
`cornish`.
The five baronies in the County of Abydos (`c_abydos`) and the four in the
County of Mysia (`c_mysia`) were changed to `levantine`.
All 16 baronies in the Duchy of Flanders (`d_flanders`) and all 12 in the
Duchy of Brabant (`d_brabant`) were assigned to `frankish`, since Flemish is
not defined in the template.

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
