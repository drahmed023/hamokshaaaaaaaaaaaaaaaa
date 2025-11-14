
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source for pdf.js to ensure it works in this environment.
// Loading from the same CDN as the library to avoid cross-origin issues.
GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`;

export const parseFileToText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read the file."));
            }
            
            if (file.type === 'application/pdf') {
                try {
                    // Use the result as an ArrayBuffer for PDF.js
                    const pdf = await getDocument(event.target.result as ArrayBuffer).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        // The 'str' property holds the text for each item. Check for its existence.
                        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                    }
                    resolve(fullText);
                } catch (pdfError) {
                    console.error("PDF parsing error:", pdfError);
                    reject(new Error("Failed to parse PDF file. The file may be corrupted or protected."));
                }
            } else if (file.type === 'text/plain') {
                // The result is a string for text files
                resolve(event.target.result as string);
            }
        };

        reader.onerror = () => {
            reject(new Error("An error occurred while reading the file."));
        };

        // Read file based on type
        if (file.type === 'application/pdf') {
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            reader.readAsText(file, 'UTF-8');
        } else {
            reject(new Error(`Unsupported file type: ${file.type}. Please use a .txt or .pdf file.`));
        }
    });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // result is a data URL (e.g., "data:image/jpeg;base64,....")
                // we only want the base64 part
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
