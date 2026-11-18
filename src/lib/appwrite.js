import { Client, Account, Storage, Functions } from 'appwrite';

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
export const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'editor_files';
export const APPWRITE_FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_ID || '';
export const ADMIN_USER_ID = import.meta.env.VITE_APPWRITE_ADMIN_USER_ID || '';
export const ADMIN_EMAILS = (import.meta.env.VITE_APPWRITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
