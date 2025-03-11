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
   - **Using the Status Bar:**  
     A status-bar item labeled **"Wrap ENSDF"** appears at the left of the status bar. Clicking it will run the wrapping command. If no text is selected, it wraps the entire file; if text is selected, it wraps just the selection.
   - **Toggle Auto Wrap When Typing:**  
   - A command titled **"Toggle Auto Wrap ENSDF"** is provided to enable or disable auto-wrap while typing.
   - By default, auto-wrap is **disabled**.
   - When toggled **on**, the status-bar item changes to **"Auto-wrap ON"**, and the extension will automatically reformat lines as you type.
   - Click the status-bar item or run the **"Toggle Auto Wrap ENSDF"** command again to disable auto-wrap; the status-bar text will revert to **"Wrap ENSDF"**.

## Contributing & Feedback

If you have suggestions or bug fixes, please contact the FRIB Nuclear Data Center.

## License

This extension is licensed under the MIT License.
