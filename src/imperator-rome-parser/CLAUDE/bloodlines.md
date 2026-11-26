# Bloodline rules for Imperator-to-CK3 exports

## Agreed design

- Give each player nation's ruling dynasty one primary, non-genetic fame trait.
- On a new CK3 game, give the primary trait to every living member of that dynasty.
- Traits inherited by later children use a 70% chance when only one parent has the trait and 100% when both parents have it.
- Each primary bloodline grants its nation-specific +1 skill, +0.1 monthly Prestige, and +1 direct-vassal Opinion.
- `Blood of the Winner` is a separate Tuscia-only fame trait. It grants +0.1 monthly Prestige, has 60% inheritance (100% when both parents have it), and has no Tuscia-specific name or description.
- Trait icons should represent the original country identity, so they remain recognizable if a character changes titles or tags. Each nation's stylized flag uses a 12-pixel transparent perimeter rather than a visible frame; `Blood of the Winner` uses an original abstract crown.

## Primary traits and current title mapping

The start hook resolves the dynasty from the current holder of each title, then adds the trait to every living dynasty member. This avoids depending on converter-generated character IDs.

| Nation | Trait | +1 skill | Current title used to find the dynasty |
|---|---|---|---|
| Albion | `blood_of_albion` | Diplomacy | `k_IRTOCK3_ICE` |
| Greater Armenia | `blood_of_armenia` | Stewardship | `e_armenia` |
| Belgia | `blood_of_belgia` | Diplomacy | `k_IRTOCK3_RMI` |
| Dacia | `blood_of_dacia` | Martial | `k_IRTOCK3_AHL` |
| Germania (formed by Scandia) | `blood_of_germania` | Intrigue | `e_germany` |
| Greater Iberia | `blood_of_greater_iberia` | Stewardship | `h_IRTOCK3_CRM` |
| Israel | `blood_of_israel` | Diplomacy | `k_israel` |
| Macedon | `blood_of_macedon` | Martial | Unresolved; `k_macedon` is unheld and has no bookmark character |
| Numidia (formed by Mauretania) | `blood_of_numidia` | Learning | `k_IRTOCK3_MAU` |
| Scythia | `blood_of_scythia` | Intrigue | `e_IRTOCK3_A3O` |
| Tuscia | `blood_of_tuscia` | Stewardship | `e_IRTOCK3_A64` |

Tuscia's dynasty also receives `blood_of_the_winner` at game start.

## Implementation

Bloodlines are packaged as the separate companion mod `campaign-2026-07-12-the-first/game-2-ck3/mod/FCL1_bloodlines`, which depends on and should load after `Converted - FCL1_export_test`.

- Trait definitions and inheritance settings: `common/traits/00_bloodlines.txt`
- English names and descriptions: `localization/english/bloodlines_l_english.yml`
- Trait icon DDS files and PNG previews: `gfx/interface/icons/traits/`. The 256x256 icons use 12-pixel transparent perimeters (3 pixels at 64x64 icon scale). In each trait definition, set `icon = <trait>.dds`; CK3 prepends `gfx/interface/icons/traits/` automatically, so don't include the directory in the `icon` value.
- Start assignment: `common/on_action/IRToCK3_game_start.txt`, called after the lobby closes.
- Mod installation and dependency notes: `campaign-2026-07-12-the-first/game-2-ck3/mod/FCL1_bloodlines/README.md`

The assignments affect characters at the start of a new game. They do not retroactively grant traits to characters in an already-started save.

## Updating for future exports

1. Recheck the starting country titles in the new export's bookmark and title history files.
2. Update the title mapping in `FCL1_bloodlines/common/on_action/IRToCK3_game_start.txt` if a player's title ID changed.
3. Confirm each mapped title is held by the intended player's dynasty at the selected start date.
4. Keep the start effect scoped to living members of the holder's dynasty; do not assign by culture or broad region.
5. Add any new trait icon paths only after their DDS assets exist.
6. Launch a new game with the updated mod and verify the starting dynasties' traits in-game.

## Current-export caveat

The `k_macedon` title is unheld at the current export's 890 bookmark start, and the bookmark has no Macedon player character. No Macedon assignment is active: identify the player's actual starting title or dynasty before adding it. Do not use a future `k_macedon` holder automatically unless verified as the player dynasty.
