import { parseFileToText } from '../utils/fileParser';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink: string;
  webViewLink: string;
}

const API_KEY = process.env.API_KEY;

export const extractFileIdFromUrl = (url: string): string | null => {
    // Standard file link: drive.google.com/file/d/FILE_ID/view
    // Doc link: docs.google.com/document/d/FILE_ID/edit
    // Sheet link: docs.google.com/spreadsheets/d/FILE_ID/edit
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Legacy / open links: ?id=FILE_ID
    const urlObj = new URL(url);
    const idParam = urlObj.searchParams.get('id');
    return idParam;
};

export const getFileMetadata = async (fileId: string): Promise<{ name: string, mimeType: string }> => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType&key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Failed to fetch file metadata.');
    }
    return response.json();
};

export const listItems = async (folderId: string): Promise<GoogleDriveFile[]> => {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, iconLink, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Failed to fetch files from Google Drive.');
    }
    const data = await response.json();
    const fetchedItems = data.files || [];

    fetchedItems.sort((a: GoogleDriveFile, b: GoogleDriveFile) => {
        const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
        const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
        if (isAFolder && !isBFolder) return -1;
        if (!isAFolder && isBFolder) return 1;
        return a.name.localeCompare(b.name);
    });

    return fetchedItems;
};

export const getFileContent = async (fileId: string, mimeType: string): Promise<string> => {
    let url: string;
    let response: Response;
    
    switch (mimeType) {
        case 'application/vnd.google-apps.document':
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&key=${API_KEY}`;
            response = await fetch(url);
            if (!response.ok) throw new Error('Failed to export Google Doc.');
            return response.text();
            
        case 'application/pdf':
        case 'text/plain':
            url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
            response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download file content.');
            const blob = await response.blob();
            const file = new File([blob], "tempfile", { type: mimeType });
            return parseFileToText(file);
            
        default:
            throw new Error('Unsupported file type for content extraction.');
    }
};

export const getFileBlob = async (fileId: string): Promise<Blob> => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download file.');
    return response.blob();
};

export const isFileContentSupported = (mimeType: string): boolean => {
    const supportedTypes = [
        'application/vnd.google-apps.document',
        'application/pdf',
        'text/plain'
    ];
    return supportedTypes.includes(mimeType);
};