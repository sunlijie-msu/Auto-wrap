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
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
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
 * @param AsIs: true for using type as is like "151HO2cL "
 *              false for making the prefix for the first
 *              comment line, e.g., if type="2cL", prefix
 *              could be "151HO cL ", instead of "151HO2cL "
 * @returns
 */
function makeENSDFLinePrefix(NUCID, type, AsIs) {
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
        //console.log("s="+s+"$ c1="+c1+"$ c2="+c2+"$");
        let s1 = "", s2 = "";
        if (c1 === "C" || (c1 === "D" && s.length === 1)) { // comment and document lines, "CL", "D"
            if (c1 === "C" && c2 === "C") {
                if (AsIs) {
                    s1 = s.substring(0, 2);
                    ;
                    s2 = s.substring(2);
                }
                else {
                    s1 = " " + s.charAt(1);
                    s2 = s.substring(2);
                }
            }
            else {
                s1 = " " + s.charAt(0);
                s2 = s.substring(1);
            }
        }
        else if (c2 === "C" || (c2 === "D" && s.length === 2)) { // "2CL", "2D"
            if (!AsIs) {
                s1 = " " + s.charAt(1);
            }
            else {
                s1 = s.substring(0, 2);
            }
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
            else if (c2 === "D" && s.length > 2) { // "2DL", "2DP", "2DDN", document, not continuation record
                if (AsIs) {
                    s1 = s.substring(0, 2);
                }
                else {
                    s1 = " " + s.charAt(1);
                }
                s2 = s.substring(2);
                //console.log("###s="+s+"$ s1="+s1+"$ s2="+s2);
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
            if (!AsIs) {
                s1 = " " + s.charAt(1);
            }
            //console.log("###s="+s+"$ s1="+s1+"$ s2="+s2);
        }
        if (s2.length >= 2) {
            s2 = s2.substring(0, 2);
        }
        else {
            s2 = s2.padEnd(2);
        }
        //console.log("1 NUCID="+NUCID+"$ type="+type+"$")+" s1="+s1+" s2="+s2;
        type = s1 + s2.toUpperCase();
        //console.log("2 NUCID="+NUCID+"$ type="+type+"$"+" s1="+s1+" "+AsIs);
    }
    return `${NUCID.padStart(5)}${type.padStart(4)}`;
}
/**
 *
 * @param line: must start with a prefix which has a NUCID and comment linetype
 *              (like "cL", "L", "2cL") separated by at least one blank space,
 *              except for delayed-particle record, like " 44CA2cDP"
 * @returns a 4-element array: [0] for NUCID, [1] for line type, [3] for
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
        while (isLetter(s.charAt(i)) && count < 2) {
            EN += s.charAt(i);
            count++;
            i++;
        }
        //console.log(EN+" isEn="+isElementSymbol(EN)+" isNUCID="+isNUCID(AS+EN)+" line="+line);
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
                //console.log(line+"\n1 type="+lineType+"$ body="+comBody);
            }
            else {
                let n = s.indexOf(" ");
                if (n > 0) {
                    s1 = s.substring(0, n);
                    if (s1.toUpperCase().match(/^[2-9A-Z]?[CD][LGBAEP]?$/)) {
                        lineType = s1;
                        comBody = s.substring(n).trim();
                    }
                    //console.log(line+"\n1 type="+lineType+"$ body="+comBody);
                    //console.log(line+"\n2 type="+lineType+" n="+n+"  s="+s+" s1="+s1+"  body="+comBody);
                    //console.log(s1.match(/^[2-9a-zA-Z]?[CD][LGBAEP]?$/));
                }
            }
            if (lineType.length > 0) {
                out[0] = NUCID;
                out[1] = lineType;
                out[2] = comBody;
                out[3] = makeENSDFLinePrefix(NUCID, lineType, true);
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
 * split a long text (no prefix) of a single comment into an array of lines with maximum width.
 * If no spaces are found, it will simply break the text into chunks.
 */
function splitCommentText(text, NUCID, prefix, maxWidth) {
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
function getNextPrefix(currPrefix) {
    // Fixed part: columns 1-5 (should be " 35P " for 35P)
    const NUCID = currPrefix.substring(0, 5);
    const recordType = currPrefix.substring(6, 9);
    let c1 = currPrefix.charAt(5); //"151DY2cL "; charAt(5)=2
    let c2 = currPrefix.charAt(6); //"c" or "d" for comment/document, " " for record/continuation record
    let c3 = currPrefix.charAt(7); //record line type
    let c4 = currPrefix.charAt(8);
    if (c2 === ' ') {
        return currPrefix;
    }
    if (c1 === ' ') {
        return NUCID + "2" + c2 + c3 + c4;
    }
    let count = -1;
    if (isDigit(c1)) {
        count = parseInt(c1);
        count = count + 1;
    }
    else if (isLetter(c1)) {
        count = c1.charCodeAt(0) - 'a'.charCodeAt(0) + 10 + 1;
    }
    else {
        return currPrefix;
    }
    let label;
    if (count < 10) {
        label = count.toString() + recordType;
    }
    else {
        label = String.fromCharCode('a'.charCodeAt(0) + (count - 10)) + recordType;
        //console.log("label="+label+" count="+count);
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
        const wrappedParts = splitCommentText(content, NUCID, prefix, availableWidth);
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
        let prevPrefix = basePrefix;
        for (let i = 1; i < wrappedParts.length; i++) {
            const contPrefix = getNextPrefix(prevPrefix);
            line = contPrefix + sep + wrappedParts[i];
            newLines.push(line.padEnd(80));
            //console.log("i="+i+" part="+wrappedParts[i]+" currPrefix="+contPrefix+" prevFix="+prevPrefix);
            prevPrefix = contPrefix;
        }
    }
}
/**
 * Wrap a ENSDF text (selected or all in a dataset) to an array of new lines
 * in 80-column format.
 * @param text: ENSDF text to wrap; could include one or multiple comments;
 *              must start with (NUCID)+("cL" or "dL")+(comment body),
 *              separated by at least one blank space, otherwise it will not
 *              be wrapped
 * @returns an array of new lines in 80-column format
 */
function wrapENSDFText(text) {
    const newLines = [];
    let s = text.trim();
    let ns = s.indexOf(" ");
    if (ns < 0) {
        return newLines;
    }
    let NUCID = s.substring(0, ns).trim().toUpperCase();
    let isAbstract = false;
    //text must start with (NUCID)+("cL" or "dL")+(comment body), separated by at least one blank space
    //NUCID could be like "151HO", "1H", or "33" in an abstract dataset
    if (NUCID.length > 5) {
        let out = parseNUCIDandComType(text);
        if (out.length > 0) {
            NUCID = out[0];
        }
    }
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
        else {
        }
        if (!isAbstract) {
            return newLines;
        }
    }
    //console.log(text);
    //console.log(startPos+"  "+endPos);
    //const text = doc.getText();
    //const startPos=0;
    //const endPos=text.length;
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) {
        return newLines;
    }
    let tempText = "";
    let count = 0;
    for (const line of lines) {
        if (line.trim() === "") {
            if (tempText.length > 0) {
                wrapAndaddToNewLines(tempText, NUCID, newLines);
                tempText = "";
            }
            newLines.push("");
            continue;
        }
        //console.log("1@@@"+line +" NUCID="+NUCID+" "+line.trim().startsWith(NUCID));
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
        //console.log("2@@@"+line +" NUCID="+NUCID+" "+line.trim().startsWith(NUCID)+" "+out.length);
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
        //console.log("###"+line +" NUCID="+NUCID+" comType="+comType+" prefix="+prefix+"$");
        //console.log("2###"+line+"@"+c1+"@"+c2+" "+tempText.length);
        //if(c1===' '){
        let typeS = comType.toUpperCase();
        if ((/^[CD]/.test(typeS) && typeS !== "CC") || (count === 0 && /^[[2-9A-Z][CD]/.test(typeS))) {
            if (tempText.length > 0) {
                wrapAndaddToNewLines(tempText, NUCID, newLines);
            }
            tempText = line.trimEnd();
            if (lines.indexOf(line) === lines.length - 1) { //last line
                wrapAndaddToNewLines(tempText, NUCID, newLines);
            }
            count++;
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
    return newLines;
}
function wrapENSDFTextToNewText(text, eol) {
    const newLines = wrapENSDFText(text);
    //console.log("newLines "+newLines.length+" input text="+text);
    let s = "";
    if (newLines.length > 0) {
        s = newLines.join(eol);
        //console.log("text="+text);
        //console.log("new text="+s);
    }
    if (s.length > 0) {
        return s;
    }
    return text;
}
function makeCommand(namePrefix, option) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    option = option.trim().toLowerCase();
    if (option !== "selected" && option !== "all") {
        option = "all";
    }
    const disposable = vscode.commands.registerCommand(namePrefix + option, () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World from ensdf-line-wrap!');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        let text = "";
        let fullText = doc.getText();
        let selection = editor.selection;
        //let hasSelection = !selection.isEmpty;		
        if (option === "selected") {
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
        const eol = doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
        //const newLines=wrapENSDFText(text);
        //const newText = newLines.join(eol);
        const newText = wrapENSDFTextToNewText(text, eol);
        editor.edit(editBuilder => {
            //const range = new vscode.Range(doc.positionAt(startPos), doc.positionAt(endPos));
            editBuilder.replace(selection, newText);
        });
    });
    return disposable;
}
function getCursorPosition() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active; //position of the cursor
        vscode.window.showInformationMessage(`Cursor Position - Line: ${position.line}, Character: ${position.character}`);
    }
    else {
        vscode.window.showInformationMessage('No active editor');
    }
}
function getEOL() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const doc = editor.document;
        const eol = doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
        return eol;
    }
    return "\n";
}
function extractNSRKeynumbersFromEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const document = editor.document;
    const keynumberPattern = /\b\d{4}[a-zA-Z]{2}([a-zA-Z]{2}|[0-9]{2})\b/g;
    const extractedKeynumbers = new Set();
    const doc = editor.document;
    let text = doc.getText();
    let selection = editor.selection;
    if (!selection.isEmpty) {
        text = doc.getText(selection);
    }
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        if (line.length > 6 && (line[6] !== ' ' || line.substring(7, 9) === '  ')) {
            const matches = line.match(keynumberPattern);
            if (matches) {
                matches.forEach(match => {
                    if (!extractedKeynumbers.has(match.toUpperCase())) {
                        extractedKeynumbers.add(match.toUpperCase());
                    }
                });
            }
        }
    }
    const keynumbersArray = Array.from(extractedKeynumbers).sort();
    //vscode.window.showInformationMessage(`Extracted NSR Keynumbers:\n${keynumbersArray.join('\n')}`);
    const keynumbersString = keynumbersArray.join('\n');
    // Create a temporary file and write the keynumbers to it
    const tempFilePath = path.join(os.tmpdir(), 'extracted_keynumbers.txt');
    fs.writeFile(tempFilePath, keynumbersString, (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Error writing to temporary file: ${err.message}`);
            return;
        }
        // Open the temporary file in the editor
        vscode.workspace.openTextDocument(tempFilePath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });
}
const MAX_COLUMN = 80; // Set your maximum column number here
let hasStarted = false;
/**
 *
 * wrap the current comment text only when the text starts with a NUCID and a valid comment type
 */
function autoWrapCurrentComment() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const doc = editor.document;
        const position = editor.selection.active; //###note this is the position of the cursor before change
        let line = doc.lineAt(position.line);
        let text = line.text;
        let nextLine = null;
        if (position.line < doc.lineCount - 1) {
            nextLine = doc.lineAt(position.line + 1);
        }
        let remainingComText = ""; //remaining text of the same comment
        let out = parseNUCIDandComType(line.text);
        if (out === null || out.length === 0) {
            return;
        }
        let NUCID = out[0];
        //let lineType=out[1];
        //let comBody=out[2];
        let prefix = out[3];
        let selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
        //console.log(text);
        let isEndLine = false;
        if (nextLine === null) {
            remainingComText = "";
            isEndLine = true;
        }
        else {
            let n = position.line + 1;
            let startPos = position;
            let lastComLine = null; //this is the first line of the remaining comment
            let count = 0;
            while (n < doc.lineCount) {
                let line = doc.lineAt(n);
                let s = line.text;
                if (s.trim().length === 0 || (s.charAt(5) === ' ' || s.charAt(6) === ' ') && s.startsWith(NUCID)) {
                    break;
                }
                if (count === 0) {
                    startPos = line.range.start;
                }
                if (s.endsWith("\\")) {
                    s = s.substring(0, s.length - 1).trim();
                }
                remainingComText += s + "\n";
                lastComLine = line;
                n++;
                count++;
            }
            let endPos = position;
            if (lastComLine) {
                endPos = lastComLine.range.end;
            }
            //console.log(startPos.line+"  "+startPos.character+" end="+endPos.line+"  "+endPos.character);
            selection = new vscode.Selection(startPos, endPos);
        }
        //console.log("1 curr line="+line.text+" **cursor="+position.character+" remainingCom="+remainingComText+" selection="+doc.getText(selection));
        //console.log(" hasStarted="+hasStarted+"   text length="+text.length+"##"+text.charAt(80)+"##"+text.trim());
        //console.log("#  "+position.line+"  "+position.character);
        //Note position.character is the column# (zero-based) before the change (or typing)
        if (position.character >= MAX_COLUMN ||
            (text.length >= MAX_COLUMN && position.character === MAX_COLUMN - 1 && text.substring(MAX_COLUMN).trim().length === 0)) {
            //if (text.length >= MAX_COLUMN || (text.length===MAX_COLUMN&&position.character===MAX_COLUMN) ) {
            const char = text[MAX_COLUMN - 1];
            let resetCursorOffset = 0;
            let wrapIndex = MAX_COLUMN - 1;
            if (char !== ' ' && char !== '.') {
                while (wrapIndex > 0 && text[wrapIndex] !== ' ') {
                    wrapIndex--;
                }
            }
            let remainingLineText = "";
            let keptLineText = "";
            if (wrapIndex > 0 && wrapIndex > 40) {
                remainingLineText = text.substring(wrapIndex + 1).trimStart();
                keptLineText = text.substring(0, wrapIndex + 1).trimEnd();
                if (wrapIndex === MAX_COLUMN - 1) {
                    resetCursorOffset = text.substring(wrapIndex, position.character + 1).trim().length;
                }
                else {
                    resetCursorOffset = (MAX_COLUMN - 1) - wrapIndex;
                }
            }
            else {
                wrapIndex = MAX_COLUMN - 1;
                remainingLineText = text.substring(wrapIndex);
                keptLineText = text.substring(0, wrapIndex);
                if (remainingLineText.startsWith("\\")) {
                    remainingLineText = remainingLineText.substring(1);
                }
                if (remainingLineText.trim().length > 0 && !keptLineText.endsWith("\\")) {
                    keptLineText += "\\";
                    //console.log("##"+keptLineText+"##");
                }
            }
            //console.log("2 curr line="+line.text+" **cursor="+position.character+" remainingCom="+remainingComText+" selection="+doc.getText(selection));
            //console.log("  remainingLineText="+remainingLineText+" keptLine="+keptLineText);
            //console.log(line.text+"  old="+prefix+"$");                    
            prefix = getNextPrefix(prefix);
            //console.log(line.text+"  new="+prefix+"$");
            //console.log("3 **cursor="+position.character+" remainingLine="+remainingLineText+"##"+" prefix="+prefix+"##"+remainingComText.length);
            let newLineText = prefix + remainingLineText.trim();
            let toReplace = false;
            let wrappedRemainingText = ""; //remainling part of curr line+remaining comment
            if (remainingLineText.trim().length === 0 && text.charAt(position.character) === ' ') {
                newLineText = "";
            }
            else if (remainingComText.length > 0 || remainingLineText.trim().length > 0) {
                let s = "";
                if (remainingComText.length > 0) {
                    s = remainingComText;
                }
                if (remainingLineText.trim().length > 0) {
                    if (s.length > 0) {
                        s = newLineText + "\n" + s;
                    }
                    else {
                        s = newLineText;
                    }
                }
                //console.log("s="+s+"$");
                //console.log("4 **cursor="+position.character+" remainingLine="+remainingLineText+"##newLine="+newLineText+"#");
                wrappedRemainingText = wrapENSDFTextToNewText(s, getEOL());
                //if(wrappedRemainingText.c){
                wrappedRemainingText = wrappedRemainingText.trimEnd();
                //}
                //console.log("    keptLine="+keptLineText+"#");		
                //console.log("5  wrappedRemainingText="+wrappedRemainingText+"#"+wrappedRemainingText.endsWith(getEOL()));
                toReplace = true;
            }
            hasStarted = true;
            editor.edit(editBuilder => {
                //let tempSelection=editor.selection;
                //editBuilder.replace(tempSelection, "");
                //ßconsole.log(line.text+" $"+line.range.start.character+" to "+line.range.end.character+" hasStarted="+hasStarted);   
                editBuilder.replace(line.range, keptLineText.padEnd(80));
                //console.log(" keptLine="+keptLineText);	
                //console.log("5.6 new line="+newLineText+"#length="+newLineText.length+" new cursor pos="+editor.selection.active.character);	
                /*
                if(toReplace && !selection.isEmpty){

                    editBuilder.replace(selection,wrappedRemainingText);

                    console.log("5.5 new text=\n"+wrappedRemainingText+" selection=\n"+doc.getText(selection));
                    console.log(" start="+selection.start.line+" col="+selection.start.character+" end="+selection.end.line+" col="+selection.end.character);
                            
                }else{
                    if(newLineText.length>0){
                        editBuilder.insert(new vscode.Position(position.line + 1, 0), newLineText + '\n');
                    }
                }
    
                console.log("5.6 new line="+newLineText+"#length="+newLineText.length+" new cursor pos="+editor.selection.active.character);
                console.log(doc.getText());
                        
                let resetCursorPos=false;
                if(position.character>MAX_COLUMN-1){
                    resetCursorPos=true;
                }else if(wrappedRemainingText.length>0){
                    resetCursorPos=true;
                }else if(newLineText.length>0){
                    resetCursorPos=true;
                }
                            
                            
                if(resetCursorPos){
                    let next=position.line;
                    if(next<doc.lineCount){
                        next+=1;
                    }
                    let nextLine=doc.lineAt(next);
                    const newPosition = new vscode.Position(next, Math.min(9,nextLine.text.length-1));
                    editor.selection = new vscode.Selection(newPosition, newPosition);
                    editor.revealRange(new vscode.Range(newPosition, newPosition));
                                
                    console.log("6 new line="+newLineText+"#length="+newLineText.length+" new cursor pos="+editor.selection.active.character);
                }
                    */
            }).then(() => {
                editor.edit(editBuilder => {
                    let resetCursorPos = false;
                    if (position.character > MAX_COLUMN - 1) {
                        resetCursorPos = true;
                    }
                    else if (wrappedRemainingText.length > 0) {
                        resetCursorPos = true;
                    }
                    else if (newLineText.length > 0) {
                        resetCursorPos = true;
                    }
                    const tempPosition = new vscode.Position(position.line, 0);
                    editor.selection = new vscode.Selection(tempPosition, tempPosition);
                    if (toReplace) {
                        if (!selection.isEmpty) {
                            editBuilder.replace(selection, wrappedRemainingText);
                        }
                        else {
                            editBuilder.insert(new vscode.Position(position.line + 1, 0), wrappedRemainingText.trimEnd().padEnd(80) + "\n");
                        }
                        //console.log("hello1 "+position.line+"  "+doc.lineCount+"  "+wrappedRemainingText+"   "+selection.isEmpty+" $"+doc.getText(selection)+"$");
                        //console.log(selection.start.line+" "+selection.start.character+"  end="+selection.end.line+"  "+selection.end.character);
                    }
                    else {
                        if (newLineText.length > 0) {
                            editBuilder.insert(new vscode.Position(position.line + 1, 0), newLineText.trimEnd().padEnd(80) + "\n");
                        }
                    }
                    /*
                    if (resetCursorPos) {
                        let next = position.line;
                        if (next < doc.lineCount-1 && !selection.isEmpty) {
                            next += 1;
                        }
                        //console.log(resetCursorOffset);

                        let nextLine = doc.lineAt(next);
                        const newPosition = new vscode.Position(next, Math.min(9+resetCursorOffset,79));
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                        editor.revealRange(new vscode.Range(newPosition, newPosition));

                        console.log("  next line="+nextLine.text);
                    }
                    */
                    //console.log("6 new line="+newLineText+"#length="+newLineText.length+" new cursor pos="+editor.selection.active.character);
                    hasStarted = false;
                }).then(() => {
                    let resetCursorPos = false;
                    if (position.character >= MAX_COLUMN - 1) {
                        resetCursorPos = true;
                    }
                    else if (wrappedRemainingText.length > 0) {
                        resetCursorPos = true;
                    }
                    else if (newLineText.length > 0) {
                        resetCursorPos = true;
                    }
                    //console.log(resetCursorOffset+"  "+resetCursorPos);
                    if (resetCursorPos) {
                        let next = position.line;
                        if (next < doc.lineCount - 1) {
                            next += 1;
                        }
                        //console.log(text+"  "+resetCursorOffset);
                        //let nextLine = doc.lineAt(next);
                        const newPosition = new vscode.Position(next, Math.min(9 + resetCursorOffset, 79));
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                        editor.revealRange(new vscode.Range(newPosition, newPosition));
                        //console.log("  next line="+nextLine.text);
                    }
                });
            });
        }
    }
}
let autoWrap = false;
let lastDocumentVersion = -1;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    let extensionID = "ensdf";
    let commandPrefix = "wrap80";
    let namePrefix = extensionID + "." + commandPrefix;
    //command name=namePrefix+option must be the same as the corresponding "commands"
    //in package.json
    let disposable1 = makeCommand(namePrefix, "selected"); //(namePrefix,option)
    let disposable2 = makeCommand(namePrefix, "all");
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    autoWrap = false;
    hasStarted = false;
    //if(autoWrap){
    //getCursorPosition();
    const autoWrapDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        //if (editor) {
        //	console.log(autoWrap+"  "+(event.document === editor.document)+"  "+editor.selection.isEmpty);
        //}
        if (autoWrap && editor && event.document === editor.document) {
            const position = editor.selection.active; //Note this is the initial cursor position before change
            const document = editor.document;
            const line = document.lineAt(position.line);
            const text = line.text;
            // Check if the change is due to an undo operation
            if (event.document.version <= lastDocumentVersion) {
                lastDocumentVersion = event.document.version;
                return;
            }
            lastDocumentVersion = event.document.version;
            if (event.contentChanges.length === 0 || position.character < MAX_COLUMN - 1) {
                return;
            }
            //console.log("########"+event.contentChanges.length+" cursor="+position.character );
            //for(let i=0;i<event.contentChanges.length;i++){
            //	console.log("$$$$"+event.contentChanges[i].text+"$$$$");
            //}
            const change = event.contentChanges[0];
            if (change.text === '\n' || change.text === '\r\n') {
                const lineBeforeEnter = document.lineAt(change.range.start.line).text;
                //console.log(`Line before Enter: ${lineBeforeEnter}` + "  " + change.range.start.line);
                //console.log(" original line=" + text + " #" + position.line);
            }
            else if (change.text.length > 1 || change.text.includes('\n')) {
                // Handle paste operation
                //console.log("Paste operation detected");
                // You can add your handling logic for paste operation here
            }
            //console.log("@ hasStarted= "+hasStarted+"  line="+ position.line+"  "+position.character);
            //vscode.window.showInformationMessage(`#Cursor Position - Line: ${position.line}, Character: ${position.character}`);
            //if (position.character >= MAX_COLUMN-1 || text.length>MAX_COLUMN) {//trigger auto-wrap when cursor>80 or line length>80
            if (!hasStarted && position.character >= MAX_COLUMN - 1 && editor.selection.isEmpty) { //trigger auto-wrap only when cursor goes beyond column 80
                autoWrapCurrentComment();
            }
        }
    });
    context.subscriptions.push(autoWrapDisposable);
    //}
    //add a status bar item for running wrapping command by clicking on it
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    let statusText0 = '$(' + extensionID + ') Wrap ENSDF'; //'$('+extensionID+') for icon, since there is none, no icon will show
    let autoWrapLabel = "Auto-wrap ON";
    statusBarItem.text = statusText0;
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Update the status bar item command and tooltip based on the selection
    const updateStatusBarItem = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            if (autoWrap) {
                //toggle autoWrap off
                statusBarItem.command = extensionID + '.toggleAutoWrap',
                    statusBarItem.text = autoWrapLabel;
                statusBarItem.tooltip = 'Auto-wrap of ENSDF lines is enabled';
            }
            else {
                statusBarItem.text = statusText0;
                if (selection.isEmpty) {
                    statusBarItem.command = namePrefix + "all";
                    statusBarItem.tooltip = 'Wrap all ENSDF lines';
                }
                else {
                    statusBarItem.command = namePrefix + "selected";
                    statusBarItem.tooltip = 'Wrap selected ENSDF lines';
                }
            }
        }
    };
    // Update the status bar item when the selection changes
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem);
    context.subscriptions.push(selectionChangeDisposable);
    // Initial update of the status bar item
    updateStatusBarItem();
    // Register the toggleAutoWrap command
    const toggleAutoWrapDisposable = vscode.commands.registerCommand(extensionID + '.toggleAutoWrap', () => {
        autoWrap = !autoWrap;
        if (autoWrap) {
            statusBarItem.command = extensionID + '.toggleAutoWrap',
                statusBarItem.text = autoWrapLabel;
            statusBarItem.tooltip = 'Auto-wrap of ENSDF lines is enabled';
        }
        else {
            updateStatusBarItem();
        }
        vscode.window.showInformationMessage(`Auto Wrap is now ${autoWrap ? 'enabled' : 'disabled'}`);
    });
    context.subscriptions.push(toggleAutoWrapDisposable);
    /*
    const cursorPositionDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        const position = editor.selection.active;//Note this is the new cursor position after move
        vscode.window.showInformationMessage(`@Cursor Position - Line: ${position.line}, Character: ${position.character}`);
    });
    context.subscriptions.push(cursorPositionDisposable);
    */
    //console.log(makeENSDFLinePrefix("151HO","2cP",true)+"$");
    // Create a status bar item for displaying the current line and column numbers
    const lineColumnStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    lineColumnStatusBarItem.text = 'L1, C1';
    lineColumnStatusBarItem.show();
    context.subscriptions.push(lineColumnStatusBarItem);
    // Function to update the line and column numbers in the status bar
    const updateLineColumnStatusBarItem = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = editor.selection.active;
            lineColumnStatusBarItem.text = `L${position.line + 1}, C${position.character + 1}`;
        }
    };
    // Update the line and column numbers status bar item when the selection changes
    const selectionChangeDisposable1 = vscode.window.onDidChangeTextEditorSelection(updateLineColumnStatusBarItem);
    context.subscriptions.push(selectionChangeDisposable1);
    // Initial update of the line and column numbers status bar item
    updateLineColumnStatusBarItem();
    // Register the extractNSRKeynumbers command
    let disposable3 = vscode.commands.registerCommand(extensionID + '.extractNSRKeynumber', () => {
        extractNSRKeynumbersFromEditor();
    });
    context.subscriptions.push(disposable3);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
