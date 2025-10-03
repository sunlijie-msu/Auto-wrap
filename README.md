# ENSDF Auto Wrap

A lightweight VS Code extension to wrap ENSDF comment lines to 80 columns. It preserves the fixed 9-character prefix and inserts continuation prefixes correctly (e.g., " 35P  c  ", " 35P 2c  ", " 35P 3c  ").

## Installation

- Install from a VSIX: press Ctrl+Shift+P → "Extensions: Install from VSIX…" and select `ensdf-auto-wrap-0.1.0.vsix` (or the latest).

## Usage

- Ensure ENSDF comment lines begin with the required 9-character prefix.

- Wrap text
   - Command: "ENSDF: Wrap Text to 80 Columns" (wraps entire file)
   - Command: "ENSDF: Wrap Text to 80 Columns (selected)" (wraps selection only)
   - Status bar: Click "Wrap ENSDF" (wraps selection if present, otherwise whole file)

- Auto wrap while typing
   - Command: "Toggle Auto Wrap ENSDF" (default: disabled)
   - When enabled, status bar shows "Auto-wrap ON" and lines are reformatted as you type
   - Click again to disable; status bar reverts to "Wrap ENSDF"

- Extract NSR keynumbers
   - Command: "Extract NSR Keynumber" to scan the active file and list detected NSR keynumbers in a separate panel

## Recent Changes

- Version 0.0.5
   - Improved wrapping algorithm and prefix handling

## Contributing & Feedback

Questions or suggestions? Contact the FRIB Nuclear Data Center: nucleardata@frib.msu.edu.

## License

MIT License