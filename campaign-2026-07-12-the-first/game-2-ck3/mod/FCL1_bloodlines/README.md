# FCL1 Bloodlines

This is a companion CK3 mod for the `Converted - FCL1_export` export mod.
Enable both mods, with FCL1 Bloodlines after the export mod.

The mod contains the bloodline traits, English localization, flag and crown
icons, and a new-game hook that grants traits to living members of the mapped
ruling dynasties. The hook resolves those dynasties through title holders in
the export, so title IDs may need updating after a new export. Macedon's trait
is assigned through `k_IRTOCK3_MAC` in this export.

For a local installation, copy this folder into the CK3 `mod` directory and
add it through the launcher. Keep `descriptor.mod` with the mod folder.

The mod depends on the export and is not currently configured for standalone
play. For a vanilla visual test, remove that dependency and disable the
export-specific start hook; the traits can then be added to test characters
with the in-game console.
