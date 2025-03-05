// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

/**
 * Wrap text into an array of lines with maximum width.
 * If no spaces are found, it will simply break the text into chunks.
 */
function wrapText(text: string, maxWidth: number): string[] {
    if (text.indexOf(' ') === -1) {
        // If there are no spaces, split into chunks of maxWidth.
        const result: string[] = [];
        for (let i = 0; i < text.length; i += maxWidth) {
            result.push(text.substring(i, maxWidth)+"\\");
        }
        return result;
    }
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
        const appended = currentLine ? currentLine + ' ' + word : word;
        if (appended.length > maxWidth) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Word itself longer than maxWidth.
                for (let i = 0; i < word.length; i += maxWidth) {
                    lines.push(word.substring(i, maxWidth));
                }
                currentLine = "";
            }
        } else {
            currentLine = appended;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
}

/**
 * Generate a continuation prefix for ENSDF records.
 * Assumes basePrefix is exactly 9 characters:
 *   [col1] space, [col2-4] Nuclide, [col5] space, [col6] space, [col7] record type,
 *   [col8-9] spaces.
 * For continuation lines, keep columns 1–6 unchanged, and then for count 2–9:
 *   label = count as a digit + record type (e.g. "2c", "3c", …, "9c"),
 * and for count ≥10:
 *   label = letter starting at 'a' + record type (e.g. "ac", "bc", etc.).
 * Append a space to complete 9 characters.
 */
function getContinuationPrefix(basePrefix: string, count: number): string {
    // Fixed part: columns 1-5 (should be " 35P " for 35P)
    const NUCID = basePrefix.substring(0, 5);
    const recordType = basePrefix.substring(6, 8);
    let label: string;
    if (count < 10) {
        label = count.toString() + recordType;
    } else {
        label = String.fromCharCode('a'.charCodeAt(0) + (count - 10)) + recordType;
    }
    // New prefix: fixed (6 chars) + label (2 chars) + space (1 char) = 9 characters.
    return NUCID + label + " ";
}

//wrap a long text of a comment and add prefix+wrapped lines into new lines
function wrapAndaddToNewLines(textToWrap: string, newLines:string[]) {
	const wrapWidth = 80;
	const prefixWidth = 9; // fixed prefix length (columns 1-9)
	const availableWidth = wrapWidth - prefixWidth; // 71 characters available for text

	if(textToWrap.length>0){

		// Extract base prefix (first 9 characters) and content (from column 10 onward)            
		const basePrefix = textToWrap.substring(0, prefixWidth);        
		const content = textToWrap.substring(prefixWidth).trim();            
		
		//console.log(basePrefix);

		// Wrap content into parts of maximum availableWidth.
		const wrappedParts = wrapText(content, availableWidth);

		//console.log("### "+wrappedParts.length+"@"+textToWrap);
		// First line uses original prefix.
		newLines.push(basePrefix + wrappedParts[0]);
		// For each additional part, generate a continuation prefix.
		for (let i = 1; i < wrappedParts.length; i++) {
			const contPrefix = getContinuationPrefix(basePrefix, i + 1);
			newLines.push(contPrefix + wrappedParts[i]);
		}	
	}
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('ensdf.wrap80', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from ensdf-line-wrap!');

		const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        const fullText = doc.getText();
        const lines = fullText.split(/\r?\n/);

        const newLines: string[] = [];

        let tempText ="";

        for (const line of lines) {
            if (line.trim() === "") {
				if(tempText.length>0){
					wrapAndaddToNewLines(tempText,newLines);
					tempText="";
				}

                newLines.push("");
                continue;
            }
			//console.log("1###"+line);

			const c1=line.charAt(5);
			const c2=line.toUpperCase().charAt(6);
			if(c2!="C"&&c2!="D"){
				if(tempText.length>0){
					wrapAndaddToNewLines(tempText,newLines);
					tempText="";
				}
				newLines.push(line);
				continue;
			}
			//console.log("2###"+line+"@"+c1+"@"+c2+" "+tempText.length);
			if(c1==' '){
				if(tempText.length>0){
					wrapAndaddToNewLines(tempText,newLines);
				}
				tempText=line.trimEnd();
			}else{
				tempText=tempText.trimEnd()+" "+line.substring(9).trim();
				if(lines.indexOf(line)==lines.length-1){//last line
					wrapAndaddToNewLines(tempText,newLines);
				}
			}

        }
        const eol = doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
        const newText = newLines.join(eol);
        editor.edit(editBuilder => {
            const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(fullText.length));
            editBuilder.replace(fullRange, newText);
        });
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
