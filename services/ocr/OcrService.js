import TextRecognition from '@react-native-ml-kit/text-recognition';

// Enum for verification status
export const VERIFICATION_STATUS = {
    VERIFIED: 'VERIFIED',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED',
    FAILED: 'FAILED'
};

/**
 * Main verification function
 * @param {string} imageUri - Local URI of the image
 * @param {string} documentType - 'DL' or 'PAN'
 * @param {object} digilockerData - verified data { number, name, dob }
 * @returns {Promise<{status: string, reason: string, ocrData: object}>}
 */
export const verifyDocument = async (imageUri, documentType, digilockerData) => {
    try {
        if (!imageUri) {
            throw new Error('No image provided');
        }

        // 1. OCR Processing
        // Input: local image path selected by user
        // Output: raw recognized text as a string
        const result = await TextRecognition.recognize(imageUri);
        const rawText = result.text;

        console.log(`OCR Raw Text (${documentType}):`, rawText);

        // 2. Extraction based on type
        let extractedData = {};
        if (documentType === 'DL') {
            extractedData = extractDLData(rawText);
        } else if (documentType === 'PAN') {
            extractedData = extractPANData(rawText);
        } else {
            throw new Error('Invalid document type. Must be DL or PAN.');
        }

        // console.log('Extracted Data:', extractedData);

        // 3. Comparison
        // Compare OCR-extracted data with DigiLocker data
        const comparisonResult = compareData(extractedData, digilockerData);

        return {
            status: comparisonResult.status,
            reason: comparisonResult.reason,
            ocrData: extractedData
        };

    } catch (error) {
        console.error('OCR Verification Error:', error);
        return {
            status: VERIFICATION_STATUS.FAILED,
            reason: 'OCR Processing Failed: ' + error.message,
            ocrData: null
        };
    }
};

// ==========================================
// EXTRACTION LOGIC
// ==========================================

const extractDLData = (text) => {
    const lines = text.split('\n');
    let number = null;
    let name = null;
    let dob = null;

    // Normalize text for easier searching
    const normalizedText = text.toUpperCase();

    // 1. Extract DL Number
    // Regex for Indian DL: Two letters, numbers, maybe spaces/dashes. Length varies 10-20.
    // Example: KA0120111234567, MH-12-2011-1234567
    // Broad regex trying to capture standard formats
    const dlRegex = /([A-Z]{2}[0-9]{2}[\s\-]?[0-9]{4}[\s\-]?[0-9]{7})|([A-Z]{2}[\s\-]?[0-9]{13,})|([A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11})/;
    const dlMatch = text.match(dlRegex);
    if (dlMatch) {
        number = dlMatch[0];
    } else {
        // Fallback: look for "DL No" or "Licence No"
        const noLine = lines.find(l => /DL\s*No|Licence\s*No/i.test(l));
        if (noLine) {
            // extraction logic from line... simplistic approach
            const parts = noLine.split(/[:.]/);
            if (parts.length > 1) number = parts[1].trim();
        }
    }

    // 2. Extract DOB
    // Look for date pattern dd/mm/yyyy or dd-mm-yyyy
    const dobRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) {
        dob = dobMatch[0]; // e.g., 12/05/1990
    } else if (text.includes('DOB')) {
        // Fallback specific line search
        const dobLine = lines.find(l => l.includes('DOB') || l.includes('Date of Birth'));
        if (dobLine) {
            const subMatch = dobLine.match(dobRegex);
            if (subMatch) dob = subMatch[0];
        }
    }

    // 3. Extract Name
    // This is hardest. Usually near "Name" or top of lines.
    // We will look for lines that don't match DL No, DOB, "Driving License", "Union of India" labels.
    // And assume user provides Digilocker name, so we are fuzzy matching.
    // For extraction purely from OCR without hint (as per step 2), we try heuristics:
    const namePrefixRegex = /(Name|S\/O|D\/O|W\/O)[:\s]+([A-Za-z\s]+)/i;
    const nameMatch = text.match(namePrefixRegex);
    if (nameMatch && nameMatch[2]) {
        name = nameMatch[2].trim();
    } else {
        // Fallback: Check first few lines for purely alphabetic strings that aren't header keywords
        const ignoreWords = ['FORM', 'DRIVING', 'LICENCE', 'O', 'INDIA', 'STATE', 'GOVT', 'TRANSPORT', 'DEPARTMENT', 'VALID', 'ISSUED', 'DOB', 'NO', 'DL'];
        for (let line of lines) {
            const cleanLine = line.trim().toUpperCase().replace(/[^A-Z\s]/g, '');
            if (cleanLine.length > 3 && !hasWords(cleanLine, ignoreWords)) {
                // Potential name?
                // Ideally we return what we find. 
                // Since step 4 compares with DigiLocker name, we might iterate lines and check similarity during extraction?
                // But Step 2 says "Extract Name".
                if (!name) name = cleanLine; // take first plausible candidate
            }
        }
    }

    return {
        number: number ? cleanString(number) : null,
        name: name ? cleanString(name) : null, // keep spaces for name
        dob: dob ? normalizeDate(dob) : null
    };
};

const extractPANData = (text) => {
    const lines = text.split('\n');
    let number = null;
    let name = null;
    let dob = null;

    // 1. Extract PAN Number
    // Standard Regex for PAN: 5 letters, 4 digits, 1 letter.
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    const panMatch = text.match(panRegex);
    if (panMatch) {
        number = panMatch[0];
    }

    // 2. Extract DOB
    const dobRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) {
        dob = dobMatch[0];
    }

    // 3. Extract Name
    // On PAN, Name is typically the line(S) below "INCOME TAX DEPARTMENT" or near top.
    // Or check lines for full upper case string.
    // Usually: 
    // INCOME TAX DEPARTMENT
    // <NAME>
    // <FATHER NAME>
    // <DOB>
    // <PAN>

    // We can try to identify position relative to PAN (PAN is usually at bottom) or DOB.
    // Let's assume Name is before DOB.
    const dobIndex = lines.findIndex(l => dobRegex.test(l));
    if (dobIndex > 0) {
        // Lines above DOB are Name and Father's Name.
        // Usually Name is above Father's Name.
        // We might just grab the line immediately above DOB as Father's Name? 
        // Actually on PAN card: Name, then Father Name, then DOB.
        // So Name is at dobIndex - 2? or -1? It varies.
        // Let's grab all lines before DOB and filter out known headers.
        const potentialNames = lines.slice(0, dobIndex).filter(l => {
            const u = l.toUpperCase();
            return !u.includes('INCOME') && !u.includes('TAX') && !u.includes('DEPARTMENT') && !u.includes('INDIA') && !u.includes('GOVT');
        });

        // Take the last one or second to last? 
        // Often Name is the most prominent text. 
        // Let's just return the line that is most likely a name (only letters).
        // Since we verify against DigiLocker name, we can also extract multiple candidates?
        // But the requirement says "Extract Name". 
        // We will return the line 2 positions above DOB if available, else 1 position.
        if (potentialNames.length > 0) {
            name = potentialNames[potentialNames.length - (potentialNames.length >= 2 ? 2 : 1)];
        }

    }

    // If still null, try finding line that is pure uppercase letters
    if (!name) {
        const nameCand = lines.find(l => /^[A-Z\s]+$/.test(l.trim()) && l.length > 4 && !l.includes('TAX'));
        if (nameCand) name = nameCand;
    }

    return {
        number: number ? cleanString(number) : null,
        name: name ? cleanString(name) : null,
        dob: dob ? normalizeDate(dob) : null
    };
};

// ==========================================
// HELPERS
// ==========================================

const cleanString = (str) => {
    if (!str) return '';
    return str.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, ''); // keep alphanumeric and spaces
};

const cleanBufferForNumber = (str) => {
    // For comparing numbers, strip spaces too
    if (!str) return '';
    return str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const normalizeDate = (dateStr) => {
    // Convert to DD-MM-YYYY or uniform format
    // Input might be dd/mm/yyyy or dd-mm-yyyy or even dd.mm.yyyy
    return dateStr.replace(/[\/\.]/g, '-');
};

const hasWords = (text, words) => {
    return words.some(w => text.includes(w));
};

// ==========================================
// COMPARISON LOGIC
// ==========================================

const compareData = (ocrData, digilockerData) => {
    const { number: ocrNum, name: ocrName, dob: ocrDob } = ocrData;
    const { number: dlNum, name: dlName, dob: dlDob } = digilockerData;

    const reasons = [];

    // 1. Document Number Check (Exact match after strict cleaning)
    // DigiLocker/OCR might have different spacing.
    if (cleanBufferForNumber(ocrNum) !== cleanBufferForNumber(dlNum)) {
        console.log(`Mismatch Number: OCR[${cleanBufferForNumber(ocrNum)}] != DL[${cleanBufferForNumber(dlNum)}]`);
        return {
            status: VERIFICATION_STATUS.FAILED,
            reason: 'Document number mismatch'
        };
    }

    // 2. DOB Check (Exact Match)
    // Ensure both are DD-MM-YYYY
    // DigiLocker DOB format: usually YYYY-MM-DD or DD-MM-YYYY depending on source.
    // Important: Normalize both dates.
    // Note: If digilocker date is YYYY-MM-DD, convert to DD-MM-YYYY for comparison
    const normDlDob = formatDateForComparison(dlDob);
    const normOcrDob = formatDateForComparison(ocrDob);

    if (normDlDob !== normOcrDob) {
        reasons.push(`DOB mismatch (OCR: ${normOcrDob}, Rec: ${normDlDob})`);
    }

    // 3. Name Check (Fuzzy Match 80%)
    const similarity = calculateSimilarity(ocrName, dlName);
    console.log(`Name Similarity: ${similarity}% (${ocrName} vs ${dlName})`);

    if (similarity < 80) {
        reasons.push(`Name does not match (Similarity: ${similarity}%)`);
    }

    if (reasons.length > 0) {
        return {
            status: VERIFICATION_STATUS.REVIEW_REQUIRED,
            reason: reasons.join(', ')
        };
    }

    return {
        status: VERIFICATION_STATUS.VERIFIED,
        reason: 'All fields matched'
    };
};

const formatDateForComparison = (dateStr) => {
    if (!dateStr) return '';
    // Handle YYYY-MM-DD to DD-MM-YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    }
    return dateStr.replace(/\//g, '-');
};

// Levenshtein Distance based similarity
const calculateSimilarity = (s1, s2) => {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    const editDistance = levenshteinDistance(longer, shorter);
    return Math.round(((longerLength - editDistance) / parseFloat(longerLength)) * 100);
};

const levenshteinDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
};
