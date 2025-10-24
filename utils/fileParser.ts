export const parseFileToText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error("Failed to read the file."));
            }
        };
        reader.onerror = () => {
            reject(new Error("An error occurred while reading the file."));
        };

        if (file.type === 'text/plain') {
            reader.readAsText(file, 'UTF-8');
        } else {
            // Placeholder for other file types like PDF or DOCX
            // This would require more complex libraries (e.g., pdf.js, mammoth.js)
            reject(new Error(`Unsupported file type: ${file.type}. Please use a .txt file.`));
        }
    });
};