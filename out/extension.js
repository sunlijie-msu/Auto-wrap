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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const elementSymbols = [
    "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
    "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
    "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
    "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
    "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
    "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
    "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
    "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
    "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
    "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
    "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
    "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
];
function isElementSymbol(symbol) {
    return elementSymbols.some(element => element.toLowerCase() === symbol.toLowerCase());
}
function getZ(elementSymbol) {
    let s = elementSymbol.trim();
    if (s.length === 0) {
        return -1;
    }
    if (s === "n" || s.toUpperCase() === "NN") {
        return 0;
    }
    s = s.toUpperCase().charAt(0) + s.toLowerCase().substring(1);
    const index = elementSymbols.indexOf(elementSymbol);
    if (index === -1) {
        return -1;
    }
    return index + 1;
}
function isLetter(char) {
    return char.length === 1 && char.match(/[a-zA-Z]/) !== null;
}
function isDigit(char) {
    return char.length === 1 && char.match(/[0-9]/) !== null;
}
function isNUCID(text) {
    let s = text.trim();
    if (s.length > 5) {
        return false;
    }
    let i = 0;
    while (isDigit(s.charAt(i))) {
        i++;
    }
    let AS = s.substring(0, i);
    let EN = s.substring(i);
    if (AS.length === 0 || AS.length > 3 || EN.length === 0 || EN.length > 2 || !isElementSymbol(EN)) {
        return false;
    }
    let A = parseInt(AS);
    if (A > 310 || A < getZ(EN)) {
        return false;
    }
    return true;
}
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}
function isInteger(value) {
    return /^-?\d+$/.test(value);
}
function isA(AS) {
    if (isInteger(AS)) {
        let A = parseInt(AS);
        if (A <= 310 && A > 0) {
            return true;
        }
    }
    return false;
}
function extractLeadingNumber(text) {
    let s = text.trim();
    let n = text.indexOf(" ");
    if (n > 0) {
        s = s.substring(0, n);
    }
    let match = s.match(/^(\d+)/);
    return match ? match[0] : "";
}
/**
 * make a ENSDF line prefix using given NUCID and line type
 * @param NUCID: size<=5, eg, "1H", "9BE","23NA","119AG"
 * @param type: size<=4, eg, "L", "CL","2 L","CDP","2 DP"
 * @returns
 */
function makeENSDFLinePrefix(NUCID, type) {
    let s = "";
    let n = 0;
    if (type.trim().length > 4) {
        return "";
    }
    try {
        s = NUCID.trim();
        n = s.length;
        let c = '';
        if (n > 1) {
            c = s.charAt(n - 2);
            if (/\d/.test(c) && /[a-zA-Z]/.test(s.charAt(n - 1))) { // NUCID with length=1 for element name
                s = s + " ";
            }
            else if (isInteger(s)) {
                s = s + "  "; // NUCID with no element name
            }
        }
    }
    catch (e) {
        return "";
    }
    NUCID = s;
    // type: col5-8, like 
    // "  L ", " cL "," dL ", "2cL ", "xcL ","2 L ","B L " for L/G/B/A/E record
    // "  DP", " cDP"," dDP", "2cDP", "xcDP","2 DP" for delayed particle (N/P/D/T) record
    // "   P", " c P"," d P", "2c P", "xc P","2  P" for prompt particle record
    // " PN ","cPN "
    s = type.trim();
    if (s.length === 0) {
        type = "";
    }
    else if (type.length === 4 && type.substring(0, 3).trim().length === 0 && "NPDT".includes(s.toUpperCase())) { // prompt particle decay
        type = type.toUpperCase();
    }
    else {
        let c1 = s.toUpperCase().charAt(0);
        let c2 = "";
        if (s.length > 1) {
            c2 = s.toUpperCase().charAt(1);
        }
        let s1 = "", s2 = "";
        if (c1 === "C" || (c1 === "D" && s.length === 1)) { // comment and document lines, "CL", "D"
            s1 = " " + s.charAt(0);
            s2 = s.substring(1);
        }
        else if (c2 === "C" || (c2 === "D" && s.length === 2)) { // "2CL","2D"
            s1 = " " + s.charAt(1);
            s2 = s.substring(2);
        }
        else if (c2 === " ") { // continuation record
            s1 = s.substring(0, 2);
            s2 = s.substring(2);
            if (s2.trim().length === 1 && "NPDT".includes(s2.trim())) {
                if (c1 === "D") { // document for prompt particle record, not continuation record
                    s1 = " " + s.charAt(1);
                    s2 = " " + s2;
                }
            }
            else {
                s2 = s2.trim(); // e.g., type is incorrectly given as "2  L", while it should be "2 L "
            }
        }
        else if (isNumeric(c1) && "NPQLGBEADHT".includes(c2)) { // e.g., type is incorrectly given as "2L", while it should be "2 L"
            s1 = c1 + " ";
            s2 = s.substring(1);
            if ("NPDT".includes(c2) && s2.length === 1) { // prompt particle decay record
                s2 = " " + s2;
            }
            else if (c2 === "D" && s.length > 2) { // "2DL", "2DP", document, not continuation record
                s1 = " " + s.charAt(1);
                s2 = s.substring(2);
            }
        }
        else if (s.length === 1) { // NPQLGBEAH record
            s1 = "  ";
            s2 = s + " ";
        }
        else if (s.length === 2 && c1 === "D" && "NPDT".includes(c2)) { // delayed-particle record
            s1 = "  ";
            s2 = s;
        }
        else if ((c1 === "C" || c1 === "D") && "LGBEADHQ".includes(c2)) { // "DL","DE","DG"
            s1 = " " + s.charAt(0);
            s2 = s.substring(1);
        }
        else if ((c2 === "C" || c2 === "D") && s.length > 2 && "LGBEADHQ".includes(s.toUpperCase().charAt(2))) {
            s1 = s.substring(0, 2);
            s2 = s.substring(2);
        }
        if (s2.length >= 2) {
            s2 = s2.substring(0, 2);
        }
        else {
            s2 = s2.padEnd(2);
        }
        type = s1 + s2.toUpperCase();
    }
    return `${NUCID.padStart(5)}${type.padStart(4)}`;
}
/**
 *
 * @param line: must start with a prefix which has a NUCID and comment linetype
 *              (like "cL", "L", "2cL") separated by at least one blank space,
 *              except for delayed-particle record, like " 44CA2cDP"
 * @returns a two-element array: [0] for NUCID, [1] for line type, [3] for
 *              comment body, [4] for re-formated prefix using NUCID+linetype,
 */
function parseNUCIDandComType(line) {
    let out = [];
    let s = line.trim();
    let i = 0;
    let AS = "", EN = "";
    while (isDigit(s.charAt(i))) {
        AS += s.charAt(i);
        i++;
    }
    //console.log(line+" AS="+AS+"  isA="+isA(AS));
    if (isA(AS)) {
        let count = 0;
        while (isLetter(s.charAt(i)) && count <= 2) {
            EN += s.charAt(i);
            count++;
            i++;
        }
        //console.log(EN+" isEn="+isElementSymbol(EN)+" isNUCID="+isNUCID(AS+EN));
        if (isElementSymbol(EN) && isNUCID(AS + EN)) {
            let NUCID = AS + EN;
            let lineType = "", comBody = "";
            s = s.substring(i).trim();
            let s1 = s.toUpperCase();
            if (/^[2-9A-Z]?[CD][\sD]?[PN]/.test(s1)) { //delayed or prompt proton or neutron
                const match = s1.match(/^[2-9A-Z]?[CD][\sD]?[PN]/);
                if (match) {
                    lineType = s.substring(0, match[0].length);
                    comBody = s.substring(match[0].length).trim();
                }
                //console.log(line+"\n1 type="+lineType+" body="+comBody);
            }
            else {
                let n = s.indexOf(" ");
                if (n > 0) {
                    s1 = s.substring(0, n);
                    if (s1.toUpperCase().match(/^[2-9A-Z]?[CD][LGBAEP]?$/)) {
                        lineType = s1;
                        comBody = s.substring(n).trim();
                    }
                    //console.log(line+"\n2 type="+lineType+" n="+n+"  s="+s+" s1="+s1+"  body="+comBody);
                    //console.log(s1.match(/^[2-9a-zA-Z]?[CD][LGBAEP]?$/));
                }
            }
            if (lineType.length > 0) {
                out[0] = NUCID;
                out[1] = lineType;
                out[2] = comBody;
                out[3] = makeENSDFLinePrefix(NUCID, lineType);
                //console.log(line);
                //console.log("NUCID="+NUCID+"$type="+lineType+"$prefix="+out[3]+"$body="+comBody);
            }
        }
    }
    return out;
}
/**
 *
 * @param text: a string which is expected to start with a NUCID
 * return the NUCID (or A if mass-chain cover page) at the begining of the text
 */
function extractLeadingNUCID(text) {
    let s = text.trim();
    if (s.length < 2) {
        return "";
    }
    let AS = extractLeadingNumber(s);
    if (AS.length === 0 || s.startsWith("0")) {
        return "";
    }
    let A = parseInt(AS);
    if (A > 310) {
        return "";
    }
    let n = s.indexOf(" ");
    if (n > 0) {
        s = s.substring(0, n);
        if (s.length <= 5 && (isNUCID(s) || isA(s))) {
            return s.toUpperCase();
        }
        n = s.indexOf(AS);
        let EN = s.substring(n);
        if (EN.length === 0) {
            return AS;
        }
        else if (EN.length > 2) {
            EN = EN.substring(0, 2);
        }
        if (isElementSymbol(EN)) {
            s = AS + EN;
        }
        else if (isElementSymbol(EN.charAt(0))) {
            s = AS + EN.charAt(0);
        }
        else {
            return "";
        }
    }
    if (isNUCID(s) || isA(s)) {
        return s.toUpperCase();
    }
    return "";
}
/**
 * Wrap text into an array of lines with maximum width.
 * If no spaces are found, it will simply break the text into chunks.
 */
function wrapText(text, NUCID, prefix, maxWidth) {
    let maxWidth0 = maxWidth;
    let maxWidth1 = maxWidth;
    if (!prefix.endsWith(" ")) {
        //for particle record, "P" or "N" at column#9
        //add an indent of one blank for the comment
        maxWidth1 -= 1;
    }
    if (text.indexOf(' ') === -1) {
        // If there are no spaces, split into chunks of maxWidth.
        const result = [];
        let count = 0;
        maxWidth = maxWidth0 - 1; //leave one space for the concatenation symbol "\" at the end
        for (let i = 0; i < text.length; i += maxWidth) {
            if (count > 0) {
                maxWidth = maxWidth1 - 1;
            }
            if ((i + maxWidth) >= text.length) {
                result.push(text.substring(i));
            }
            else {
                result.push(text.substring(i, i + maxWidth) + "\\"); // add a \ at the end to concatenate with next line without any space
            }
            count++;
        }
        return result;
    }
    NUCID = NUCID.trim();
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    maxWidth = maxWidth0;
    for (const [index, word] of words.entries()) {
        //console.log("$$$"+word+"@"+NUCID+"  "+word.toUpperCase().startsWith(NUCID));
        if (word.trim().length === 0) {
            continue;
        }
        if (lines.length > 0) {
            maxWidth = maxWidth1;
        }
        //check if the word is a comment prefix	    
        if (word.toUpperCase().startsWith(NUCID)) {
            let n = NUCID.length;
            let s = word.substring(n);
            //console.log("###"+word+"@"+NUCID+"  next="+s);
            let skipNext = false;
            let nextIndex = -1;
            if (s.length === 0) {
                //the whole word is NUCID, then check if the following word is a comment-type 
                //string
                if (index < words.length - 1) {
                    nextIndex = index + 1;
                    let nextWord = words[index + 1];
                    s = nextWord;
                    skipNext = true;
                }
                //console.log("###"+word+"@"+NUCID+" index="+index+" next="+words[index+1]+" "+words+"  size="+words.length);
            }
            if (s.length > 0) {
                if (s.length === 3 && s.match(/[2-9a-zA-Z][cCdD][LGBAEPD]/) !== null) {
                    //is comment prefix, skip it
                    if (skipNext) { //also skip next word
                        words.splice(nextIndex, 1);
                    }
                    continue;
                }
                else if (s.length === 2 && s.match(/[1-9a-zA-Z][cCdD]/) !== null) {
                    //is comment prefix, skip it
                    //console.log("###"+word+"@"+NUCID+"  next="+s);
                    if (skipNext) { //also skip next word	
                        words.splice(nextIndex, 1);
                    }
                    continue;
                }
            }
        }
        const appended = currentLine ? currentLine + ' ' + word : word;
        if (appended.length > maxWidth) {
            if (word.length > maxWidth) {
                // Word itself longer than maxWidth.
                let remaining = "";
                if (currentLine) {
                    if (currentLine.length > 0.6 * maxWidth) {
                        //print the word in next line if current line already occupies most of the space
                        lines.push(currentLine);
                        currentLine = "";
                        remaining = word;
                    }
                    else {
                        let n = maxWidth - currentLine.length - 1;
                        lines.push(currentLine + " " + word.substring(0, n - 1) + "\\");
                        currentLine = "";
                        remaining = word.substring(n);
                    }
                }
                else {
                    remaining = word;
                }
                if (remaining.length > 0) {
                    let tempMaxWidth = maxWidth - 1;
                    for (let i = 0; i < remaining.length; i += tempMaxWidth) {
                        if ((i + tempMaxWidth) >= remaining.length - 1) {
                            currentLine = remaining.substring(i); //last line of the word
                        }
                        else {
                            lines.push(remaining.substring(i, i + tempMaxWidth) + "\\"); // add a \ at the end to concatenate with next line without any space
                        }
                    }
                }
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
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
    // Fixed part: columns 1-5 (should be " 35P " for 35P)
    const NUCID = basePrefix.substring(0, 5);
    const recordType = basePrefix.substring(6, 9);
    let label;
    if (count < 10) {
        label = count.toString() + recordType;
    }
    else {
        label = String.fromCharCode('a'.charCodeAt(0) + (count - 10)) + recordType;
    }
    // New prefix: fixed (6 chars) + label (2 chars) + space or particle-type (1 char) = 9 characters.
    return NUCID + label;
}
/**
 * wrap a long text of a comment and add prefix+wrapped lines into new lines
 * @param textToWrap: must start with NUCID
 * @param NUCID
 * @param newLines
 */
function wrapAndaddToNewLines(textToWrap, NUCID, newLines) {
    const wrapWidth = 80;
    const prefixWidth = 9; // fixed prefix length (columns 1-9)
    let availableWidth = wrapWidth - prefixWidth; // 71 characters available for text
    if (textToWrap.length > 0 && textToWrap.toUpperCase().trim().startsWith(NUCID.toUpperCase().trim())) {
        //make sure textToWrap starts with NUCID
        //const NUCID=extractLeadingNUCID(textToWrap);
        // Extract base prefix (first 9 characters) and content (from column 10 onward)            
        //const basePrefix = textToWrap.substring(0, prefixWidth);        
        //const content = textToWrap.substring(prefixWidth).trim();            
        //const NUCID = basePrefix.substring(0, 5);
        let out = parseNUCIDandComType(textToWrap);
        if (out === null || out.length === 0) {
            return; //should not happen
        }
        let NUCID1 = out[0];
        let comType = out[1];
        let comBody = out[2];
        let prefix = out[3]; //length=9, ends with a blank space except for particle record with "P" or "N"
        //console.log(NUCID1+"$comType="+comType+"$comBody="+comBody+"$prefix="+prefix+"$");
        NUCID = NUCID.trim().toUpperCase();
        if (NUCID !== NUCID1) {
            return; //should not happen
        }
        const basePrefix = prefix;
        const content = comBody;
        //console.log(basePrefix);
        // Wrap content into parts of maximum availableWidth.
        const wrappedParts = wrapText(content, NUCID, prefix, availableWidth);
        //console.log("### "+wrappedParts.length+"@"+textToWrap);
        // First line uses original prefix.
        let line = basePrefix + wrappedParts[0];
        newLines.push(line.padEnd(80));
        let sep = "";
        if (!prefix.endsWith(" ")) {
            //for particle record, prefix ends with "P" or "N"
            //add a blank space to separate it from the comment body line
            sep = " ";
        }
        // For each additional part, generate a continuation prefix.
        for (let i = 1; i < wrappedParts.length; i++) {
            const contPrefix = getContinuationPrefix(basePrefix, i + 1);
            line = contPrefix + sep + wrappedParts[i];
            newLines.push(line.padEnd(80));
        }
    }
}
function makeCommand(option) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    option = option.trim().toUpperCase();
    if (option !== "SELECTED" && option !== "ALL") {
        option = "All";
    }
    else {
        option = option.charAt(0) + option.toLowerCase().substring(1);
    }
    option = option.toLowerCase();
    const disposable = vscode.commands.registerCommand('ensdf.wrap80' + option, () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        let text = "";
        let fullText = doc.getText();
        let selection = editor.selection;
        //let hasSelection = !selection.isEmpty;		
        if (option === "Selected") {
            text = doc.getText(selection);
            let lineNo = selection.end.line;
            let colNo = selection.end.character;
            let line = doc.lineAt(lineNo).text;
            if (colNo < line.length - 1 && line.substring(colNo, line.length).trim().length === 0) {
                let startPos = fullText.indexOf(text);
                let endPos = startPos + text.length + (line.length - colNo);
                selection = new vscode.Selection(doc.positionAt(startPos), doc.positionAt(endPos));
            }
            //if(colNo<line.length-1 || (line.endsWith("\n")
            //selection.end.
            //console.log("LineNo="+lineNo+" colNo="+colNo+" line="+line+"$"+line.length+" "+line.includes("\r\n")+" "+line.includes("\r"));
            //console.log("@@@"+line.charAt(line.length)+"$$"+(line===line.trim())+" "+line.trim().length);
        }
        else {
            text = fullText;
            selection = new vscode.Selection(doc.positionAt(0), doc.positionAt(text.length));
        }
        let s = text.trim();
        let ns = s.indexOf(" ");
        if (ns < 0) {
            return;
        }
        let NUCID = s.substring(0, ns).trim().toUpperCase();
        let isAbstract = false;
        //text must start with (NUCID)+("cL" or "dL")+(comment body), separated by at least one blank space
        //NUCID could be like "151HO", "1H", or "33" in an abstract dataset
        if (!isNUCID(NUCID)) {
            if (isA(NUCID)) {
                s = s.substring(ns + 1).trim();
                ns = s.indexOf(" ");
                if (ns > 0) {
                    s = s.substring(0, ns).toUpperCase();
                    if (s === 'C' || s === 'D') {
                        isAbstract = true;
                    }
                }
            }
            if (!isAbstract) {
                return;
            }
        }
        //console.log(text);
        //console.log(startPos+"  "+endPos);
        //const text = doc.getText();
        //const startPos=0;
        //const endPos=text.length;
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) {
            return;
        }
        const newLines = [];
        let tempText = "";
        for (const line of lines) {
            if (line.trim() === "") {
                if (tempText.length > 0) {
                    wrapAndaddToNewLines(tempText, NUCID, newLines);
                    tempText = "";
                }
                newLines.push("");
                continue;
            }
            //console.log("1###"+line +" NUCID="+NUCID+" "+line.startsWith(NUCID));
            if (!line.toUpperCase().trim().startsWith(NUCID)) {
                if (tempText.length > 0) {
                    tempText = tempText.trimEnd() + " " + line.trim();
                    if (lines.indexOf(line) === lines.length - 1) { //last line
                        wrapAndaddToNewLines(tempText, NUCID, newLines);
                    }
                }
                else {
                    newLines.push(line);
                }
                continue;
            }
            //the following for an ENSDF line in correct format, but it is not necessary for wrapping
            //const c1=line.charAt(5);
            //const c2=line.toUpperCase().charAt(6);
            let out = parseNUCIDandComType(line);
            //console.log(out.length);
            //if(c2!=="C"&&c2!=="D"){
            if (out === null || out.length === 0) {
                if (tempText.length > 0) {
                    wrapAndaddToNewLines(tempText, NUCID, newLines);
                    tempText = "";
                }
                newLines.push(line);
                continue;
            }
            let NUCID1 = out[0];
            let comType = out[1]; //"c", or "cL", or "2cL", similar for "d"
            let comBody = out[2];
            let prefix = out[3];
            //console.log("2###"+line+"@"+c1+"@"+c2+" "+tempText.length);
            //if(c1===' '){
            if (/^[CD]/.test(comType.toUpperCase())) {
                if (tempText.length > 0) {
                    wrapAndaddToNewLines(tempText, NUCID, newLines);
                }
                tempText = line.trimEnd();
                if (lines.indexOf(line) === lines.length - 1) { //last line
                    wrapAndaddToNewLines(tempText, NUCID, newLines);
                }
            }
            else {
                if (tempText.length === 0) {
                    newLines.push(line);
                }
                else {
                    tempText = tempText.trimEnd() + " " + comBody;
                    if (lines.indexOf(line) === lines.length - 1) { //last line
                        wrapAndaddToNewLines(tempText, NUCID, newLines);
                    }
                }
            }
        }
        const eol = doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
        const newText = newLines.join(eol);
        editor.edit(editBuilder => {
            //const range = new vscode.Range(doc.positionAt(startPos), doc.positionAt(endPos));
            editBuilder.replace(selection, newText);
        });
    });
    return disposable;
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    let disposable1 = makeCommand("selected");
    let disposable2 = makeCommand("all");
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
