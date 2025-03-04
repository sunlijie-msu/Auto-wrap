"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Wrap text into an array of lines with maximum width.
 * If no spaces are found, it will simply break the text into chunks.
 */
function wrapText(text, maxWidth) {
    if (text.indexOf(' ') === -1) {
        // If there are no spaces, split into chunks of maxWidth.
        const result = [];
        for (let i = 0; i < text.length; i += maxWidth) {
            result.push(text.substr(i, maxWidth));
        }
        return result;
    }
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const appended = currentLine ? currentLine + ' ' + word : word;
        if (appended.length > maxWidth) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                // Word itself longer than maxWidth.
                for (let i = 0; i < word.length; i += maxWidth) {
                    lines.push(word.substr(i, maxWidth));
                }
                currentLine = "";
            }
        }
        else {
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
function getContinuationPrefix(basePrefix, count) {
    // Fixed part: columns 1-6 (should be " 35P  " for 35P)
    const fixed = basePrefix.substring(0, 6);
    const recordType = basePrefix.substring(6, 7);
    let label;
    if (count < 10) {
        label = count.toString() + recordType;
    }
    else {
        label = String.fromCharCode('a'.charCodeAt(0) + (count - 10)) + recordType;
    }
    // New prefix: fixed (6 chars) + label (2 chars) + space (1 char) = 9 characters.
    return fixed + label + " ";
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('ensdf.wrap80', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        const fullText = doc.getText();
        const lines = fullText.split(/\r?\n/);
        const wrapWidth = 80;
        const prefixWidth = 9; // fixed prefix length (columns 1-9)
        const availableWidth = wrapWidth - prefixWidth; // 71 characters available for text
        const newLines = [];
        for (const line of lines) {
            if (line.trim() === "") {
                newLines.push("");
                continue;
            }
            // Extract base prefix (first 9 characters) and content (from column 10 onward)
            const basePrefix = line.substring(0, prefixWidth);
            const content = line.substring(prefixWidth).trim();
            // Wrap content into parts of maximum availableWidth.
            const wrappedParts = wrapText(content, availableWidth);
            // First line uses original prefix.
            newLines.push(basePrefix + wrappedParts[0]);
            // For each additional part, generate a continuation prefix.
            for (let i = 1; i < wrappedParts.length; i++) {
                const contPrefix = getContinuationPrefix(basePrefix, i + 1);
                newLines.push(contPrefix + wrappedParts[i]);
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
