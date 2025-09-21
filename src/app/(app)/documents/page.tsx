
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, File, Upload, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UploadedFile {
  name: string;
  url: string;
}

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const listFiles = async () => {
    setLoadingFiles(true);
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
      console.error('Error listing files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your documents.',
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
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
    const storageRef = ref(storage, `documents/${file.name}`);

    try {
      await uploadBytes(storageRef, file);
      toast({
        title: 'Upload Successful',
        description: `Your file "${file.name}" has been uploaded.`,
      });
      setFile(null);
      // Refresh the file list
      await listFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was a problem uploading your file. Please try again.',
      });
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
                    {/* Note: Delete functionality would require additional logic */}
                    {/* <Button variant="ghost" size="icon" className="text-gray-400 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 p-8">You haven't uploaded any documents yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
