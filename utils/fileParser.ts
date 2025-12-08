import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';
import JSZip from 'jszip';

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
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                try {
                    const arrayBuffer = event.target.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    resolve(result.value);
                } catch (docxError) {
                    console.error("DOCX parsing error:", docxError);
                    reject(new Error("Failed to parse DOCX file."));
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
                try {
                    const arrayBuffer = event.target.result as ArrayBuffer;
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const slidePromises: Promise<string>[] = [];
                    
                    zip.folder('ppt/slides')?.forEach((_, zipEntry) => {
                        if (zipEntry.name.endsWith('.xml')) {
                            slidePromises.push(zipEntry.async('string'));
                        }
                    });

                    const slideXmls = await Promise.all(slidePromises);
                    const parser = new DOMParser();
                    let fullText = '';

                    for (const xmlString of slideXmls) {
                        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
                        const textNodes = xmlDoc.getElementsByTagName('a:t');
                        for (let i = 0; i < textNodes.length; i++) {
                            if(textNodes[i].textContent) {
                                fullText += textNodes[i].textContent + ' ';
                            }
                        }
                    }
                    resolve(fullText.trim());
                } catch (pptxError) {
                    console.error("PPTX parsing error:", pptxError);
                    reject(new Error("Failed to parse PPTX file. The file might be corrupted. Try saving as PDF for best results."));
                }
            } else if (file.type === 'application/vnd.ms-powerpoint' || file.name.endsWith('.ppt') || file.type === 'application/msword' || file.name.endsWith('.doc')) {
                reject(new Error("Legacy Office files (.ppt, .doc) are not supported. Please save as a modern format (.pptx, .docx) or PDF and try again."));
            } else if (file.type === 'text/plain') {
                // The result is a string for text files
                resolve(event.target.result as string);
            } else {
                 // Fallback for types that might not match exact mime but are readable as text
                 if (file.name.endsWith('.txt')) {
                     resolve(event.target.result as string);
                 } else {
                     reject(new Error(`Unsupported file type: ${file.type}. Please use .pdf, .docx, .pptx, or .txt.`));
                 }
            }
        };

        reader.onerror = () => {
            reject(new Error("An error occurred while reading the file."));
        };

        // Read file based on type
        if (
            file.type === 'application/pdf' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.name.endsWith('.docx') ||
            file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.name.endsWith('.pptx')
        ) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file, 'UTF-8');
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