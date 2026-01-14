import api from './api';
import * as DocumentPicker from 'expo-document-picker';

export interface VerificationDocument {
  _id: string;
  url: string;
  type: string;
  name: string;
  description?: string;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface UserWithDocuments {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  documents?: VerificationDocument[];
  pendingDocuments?: VerificationDocument[];
  verifiedAt?: string;
}

// User functions - manage their own documents

export const uploadDocument = async (
  documentUri: string,
  type: string,
  name: string,
  description?: string
): Promise<{ message: string; document: VerificationDocument }> => {
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = documentUri.split('/').pop() || 'document.pdf';
  
  // Detect MIME type from file extension
  const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'pdf';
  
  let mimeType = 'application/octet-stream';
  if (extension === 'pdf') {
    mimeType = 'application/pdf';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  } else if (extension === 'doc') {
    mimeType = 'application/msword';
  } else if (extension === 'docx') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  
  // @ts-ignore - FormData in React Native accepts this format
  formData.append('document', {
    uri: documentUri,
    type: mimeType,
    name: filename,
  } as any);
  
  formData.append('type', type);
  formData.append('name', name);
  if (description) {
    formData.append('description', description);
  }

  const response = await api.post('/api/users/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getUserDocuments = async (): Promise<{ documents: VerificationDocument[] }> => {
  try {
    const response = await api.get('/api/users/documents');
    return response.data;
  } catch (error: any) {
    // If 404, user has no documents yet - return empty array
    if (error?.response?.status === 404) {
      return { documents: [] };
    }
    throw error;
  }
};

export const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/users/documents/${documentId}`);
  return response.data;
};

// Admin functions - view and verify documents

export const getPendingVerifications = async (): Promise<{ users: UserWithDocuments[] }> => {
  try {
    const response = await api.get('/api/users/admin/verifications/pending');
    return response.data;
  } catch (error: any) {
    // If 404, no pending verifications - return empty array
    if (error?.response?.status === 404) {
      return { users: [] };
    }
    throw error;
  }
};

export const getUserDocumentsAdmin = async (userId: string): Promise<{ user: UserWithDocuments }> => {
  try {
    const response = await api.get(`/api/users/admin/users/${userId}/documents`);
    return response.data;
  } catch (error: any) {
    // If 404, user has no documents yet
    if (error?.response?.status === 404) {
      throw new Error('User not found or has no documents');
    }
    throw error;
  }
};

export const verifyDocument = async (
  userId: string,
  documentId: string,
  status: 'verified' | 'rejected',
  rejectionReason?: string
): Promise<{ message: string; document: VerificationDocument }> => {
  const response = await api.put(
    `/api/users/admin/users/${userId}/documents/${documentId}/verify`,
    { status, rejectionReason }
  );
  return response.data;
};

export const toggleUserVerification = async (
  userId: string,
  isVerified: boolean
): Promise<{ message: string; user: { _id: string; isVerified: boolean; verifiedAt?: string } }> => {
  const response = await api.put(
    `/api/users/admin/users/${userId}/verification-badge`,
    { isVerified }
  );
  return response.data;
};

// Helper function to pick a document from device
export const pickDocument = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'], // Accept PDFs and images
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking document:', error);
    throw error;
  }
};