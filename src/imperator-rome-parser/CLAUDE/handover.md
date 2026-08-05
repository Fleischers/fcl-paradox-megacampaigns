# Handover for next agent

## Project
`src/imperator-rome-parser`

## What we tried

1. Identified two `.rome` formats:
   - real Imperator save containers with embedded ZIP payloads and binary `gamestate`
   - rakaly-melted text saves that are plain UTF-8 text

2. Updated `index.ts` to detect and handle both:
   - sample save header with `readSampleHeader()`
   - ZIP `gamestate` extraction via `extractEmbeddedZipEntry()`
   - fallback binary scan with `scanBinaryGamestate()` and `buildBinaryFallbackReport()`
   - streamed text parsing with `createTextReadStream()` and `parseLargeTextSaveStreaming()` for large plain text saves

3. Fixed TypeScript errors around optional regex captures and buffer typing.

## What is working

- Parser now chooses a large-text streaming path when the save is very large and appears text-based.
- ZIP extraction and binary fallback path are still available for save containers.
- The code compiles cleanly with no TypeScript errors in `index.ts`.

## What is not working well

- The generated report contains bad ledger stats for fallback or incomplete parsing paths.
- `imperator_report.md` currently shows many `0`, `N/A`, and bogus `Tech` values because the report code is still trying to format country stats even when full text content is absent.
- The parser is not yet robust at distinguishing a real text save from a binary/ZIP save in every case.

## Current pain points

- `parseLargeTextSaveStreaming()` writes `tmp_countries.ndjson`, then reads it back to build the report, but the report template still expects `fullContent` for enrichment.
- Binary fallback output is too generous: it still writes an `imperator_report.md` ledger table even though the data is incomplete.
- There is no clear separation between "parsed plain text save" and "binary fallback" report modes.

## Files to inspect

- `src/imperator-rome-parser/index.ts`
- `src/imperator-rome-parser/imperator_report.md`
- `src/imperator-rome-parser/inspect_melted_text.py`
- `src/imperator-rome-parser/inspect_gamestate.py`

## Recommended next steps

1. Make the report generation explicitly conditional on having valid parsed text data.
2. In fallback mode, output only diagnostics + binary scan info, not ledger rows.
3. Add a separate validation/logging stage for detected save format:
   - plain text
   - gzip-compressed text
   - embedded ZIP with binary gamestate
4. If the save is plain text but parse results are poor, inspect the raw save structure and adjust the regex patterns used for country data extraction.

## Notes

- The current CLI path is `node index.js path/to/save.rome` (or `npx tsx index.ts`).
- `SAVE_FILE_PATH` still defaults to a hardcoded `E:\Games\paradox_tools\FCL1-2026-08-02-b_melted.rome`.
