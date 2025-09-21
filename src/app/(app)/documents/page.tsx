
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, File, Upload, LoaderCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UploadedFile {
  name: string;
  url: string;
}

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFirebaseError = (error: any) => {
    console.error('Firebase Storage Error:', error);
    let message = "Could not connect to Firebase Storage. This is often due to security rules not allowing access. Please go to your Firebase Console, navigate to Storage > Rules, and update your rules to `allow read, write: if true;` for development.";
    setStorageError(message);
    toast({
      variant: 'destructive',
      title: 'Storage Connection Error',
      description: 'Could not connect to Firebase Storage. Please check the on-page instructions.',
      duration: 10000,
    });
  };


  useEffect(() => {
    const listFiles = async () => {
      setLoadingFiles(true);
      setStorageError(null);
      const listRef = ref(storage, 'documents/');
      try {
        const res = await listAll(listRef);
        const files = await Promise.all(
          res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return { name: itemRef.name, url };
          })
        );
        setUploadedFiles(files);
      } catch (error) {
        handleFirebaseError(error);
      } finally {
        setLoadingFiles(false);
      }
    };
    listFiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a PDF file to upload.',
      });
      return;
    }

    if (file.type !== 'application/pdf') {
       toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
      });
      return;
    }

    setUploading(true);
    setStorageError(null);
    const storageRef = ref(storage, `documents/${file.name}`);

    try {
      await uploadBytes(storageRef, file);
      toast({
        title: 'Upload Successful',
        description: `Your file "${file.name}" has been uploaded.`,
      });
      setFile(null);
      // Refresh the file list
      const listRef = ref(storage, 'documents/');
      const res = await listAll(listRef);
      const files = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { name: itemRef.name, url };
        })
      );
      setUploadedFiles(files);
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Documents & Statements</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {storageError ? (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-5 w-5 !text-red-800" />
            <AlertTitle className="font-bold">Action Required: Fix Firebase Storage Rules</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Your app cannot connect to Firebase Storage. This is usually caused by incorrect security rules in your Firebase project.</p>
              <p className="font-semibold">To fix this, please follow these steps:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-sm">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a>.</li>
                <li>Select your project.</li>
                <li>Navigate to <strong>Storage</strong> in the "Build" section.</li>
                <li>Click on the <strong>Rules</strong> tab.</li>
                <li>Replace the existing rules with: <code>allow read, write: if true;</code></li>
                <li>Click <strong>Publish</strong>.</li>
              </ol>
               <p className="mt-4">After publishing the new rules, please refresh this page.</p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Upload New Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                    <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="flex-1" />
                     <Button onClick={handleUpload} disabled={uploading || !file}>
                        {uploading ? (
                            <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                            </>
                        ) : (
                            <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload PDF
                            </>
                        )}
                    </Button>
                </div>
                {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFiles ? (
                  <div className="flex items-center justify-center p-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : uploadedFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {uploadedFiles.map((uploadedFile) => (
                      <li key={uploadedFile.name} className="flex items-center justify-between p-3 bg-white rounded-md border hover:bg-gray-50">
                        <a
                          href={uploadedFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <File className="mr-2 h-5 w-5" />
                          <span>{uploadedFile.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 p-8">You haven't uploaded any documents yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
