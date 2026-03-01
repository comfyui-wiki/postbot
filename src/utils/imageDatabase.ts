/**
 * IndexedDB utilities for storing image blobs
 * Allows saving and retrieving images with drafts
 */

const DB_NAME = 'postbot_images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

type ImageRecord = {
  id: string; // draftId_imageIndex
  draftId: string;
  index: number;
  blob: Blob;
  metadata: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  createdAt: number;
};

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save image blob for a draft
 */
export const saveImageBlob = async (
  draftId: string,
  index: number,
  file: File
): Promise<void> => {
  const database = await initDB();
  const id = `${draftId}_${index}`;

  const record: ImageRecord = {
    id,
    draftId,
    index,
    blob: file,
    metadata: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Retrieve image blob for a draft
 */
export const getImageBlob = async (
  draftId: string,
  index: number
): Promise<File | null> => {
  const database = await initDB();
  const id = `${draftId}_${index}`;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const record = request.result as ImageRecord | undefined;
      if (!record) {
        resolve(null);
        return;
      }

      // Convert blob back to File
      const file = new File([record.blob], record.metadata.name, {
        type: record.metadata.type,
        lastModified: record.metadata.lastModified,
      });
      resolve(file);
    };
  });
};

/**
 * Retrieve all image blobs for a draft
 */
export const getImageBlobs = async (draftId: string): Promise<File[]> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const records = (request.result as ImageRecord[]).filter(
        (r) => r.draftId === draftId
      );

      // Sort by index
      records.sort((a, b) => a.index - b.index);

      // Convert blobs back to Files
      const files = records.map(
        (record) =>
          new File([record.blob], record.metadata.name, {
            type: record.metadata.type,
            lastModified: record.metadata.lastModified,
          })
      );

      resolve(files);
    };
  });
};

/**
 * Delete image blob for a draft
 */
export const deleteImageBlob = async (
  draftId: string,
  index: number
): Promise<void> => {
  const database = await initDB();
  const id = `${draftId}_${index}`;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Delete all images for a draft
 */
export const deleteAllImageBlobs = async (draftId: string): Promise<void> => {
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const records = (request.result as ImageRecord[]).filter(
        (r) => r.draftId === draftId
      );

      const deleteTransaction = database.transaction([STORE_NAME], 'readwrite');
      const deleteStore = deleteTransaction.objectStore(STORE_NAME);

      records.forEach((record) => {
        deleteStore.delete(record.id);
      });

      deleteTransaction.oncomplete = () => resolve();
      deleteTransaction.onerror = () => reject(deleteTransaction.error);
    };
  });
};

/**
 * Convert File to data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
