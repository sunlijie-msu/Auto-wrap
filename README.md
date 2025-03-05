# ENSDF Auto Wrap

ENSDF Auto Wrap is a Visual Studio Code extension designed to automatically reformat comment lines in dataset files according to the 80-column ENSDF standard.

Installation
Download the VSIX Package
Download the file ensdf-auto-wrap-0.0.1.vsix.

Install the Extension

Open Visual Studio Code.
Press Ctrl+Shift+P and select "Extensions: Install from VSIX…".
Choose the downloaded .vsix file to install the extension.
Usage
Open your ENSDF Dataset File:
Ensure that each comment line in your file starts with a fixed 9-character prefix formatted as follows:

Column 1: space
Columns 2–4: Nuclide identifier (e.g., "35P")
Column 5: space
Column 6: space
Column 7: record type (e.g., "c")
Columns 8–9: spaces
Wrap the Text:

Press Ctrl+Shift+P to open the Command Palette.
Run the command "ENSDF: Wrap Text to 80 Columns".
The extension will reformat the file so that no line exceeds 80 columns, inserting continuation prefixes (e.g., " 35P 2c ", " 35P 3c ", etc.) as needed.
Contributing & Feedback
If you have suggestions or bug fixes, please contact the FRIB Nuclear Data Center.

License
This extension is licensed under the MIT License.