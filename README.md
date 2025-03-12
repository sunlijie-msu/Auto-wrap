# ENSDF Auto Wrap

ENSDF Auto Wrap is a Visual Studio Code extension designed to automatically reformat comment lines in dataset files according to the 80-column ENSDF standard. It wraps long lines while preserving a fixed 9-character prefix and inserting proper continuation prefixes (e.g., " 35P  c  ", " 35P 2c  ", " 35P 3c  ", etc.).

## Installation

1. **Download the VSIX Package**  
   Download the file `ensdf-auto-wrap-0.0.3.vsix`.

2. **Install the Extension**  
   - Open Visual Studio Code.
   - Press **Ctrl+Shift+P** and select **"Extensions: Install from VSIX…"**.
   - Choose the downloaded `.vsix` file to install the extension.

## Usage

1. **Open Your ENSDF Dataset File:**  
   Ensure that each comment line in your file starts with a fixed 9-character prefix formatted as follows:
   - **Column 1:** space  
   - **Columns 2–4:** Nuclide identifier (e.g., "35P")  
   - **Column 5:** space  
   - **Column 6:** space  
   - **Column 7:** record type (e.g., "c")  
   - **Columns 8–9:** spaces  
   The comment text begins at column 10.

2. **Wrap the Text:**  
   - Run the command **"ENSDF: Wrap Text to 80 Columns"** to wrap all text in the file.
   - Run the command **"ENSDF: Wrap Text to 80 Columns (selected)"** to wrap only the selected text.
   - **Using the Status Bar:**  
     A status-bar item labeled **"Wrap ENSDF"** appears at the left of the status bar. Clicking it will run the wrapping command. If no text is selected, it wraps the entire file; if text is selected, it wraps just the selection.

3. **Toggle Auto Wrap:**  
   - Run the command **"Toggle Auto Wrap ENSDF"** to enable or disable auto-wrap while typing.
   - By default, auto-wrap is **disabled**.
   - When enabled, the status bar item changes to **"Auto-wrap ON"** and the extension automatically reformats lines as you type.
   - To disable auto-wrap, click the status-bar item or run the command again; the status-bar text will revert to **"Wrap ENSDF"**.


## Contributing & Feedback

If you have suggestions or bug fixes, please contact the FRIB Nuclear Data Center.

## License

This extension is licensed under the MIT License.
