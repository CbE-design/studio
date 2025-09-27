
'use client';

import { ArrowLeft, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DocumentsPage() {
  const router = useRouter();

  // Placeholder data - in a real app, this would be fetched
  const documents = [
    { name: 'January_Statement_2024.pdf', url: '#' },
    { name: 'Tax_Certificate_2023.pdf', url: '#' },
    { name: 'Account_Confirmation_Letter.pdf', url: '#' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Documents & Statements</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Manage Your Documents</AlertTitle>
          <AlertDescription>
            You can upload and manage your important documents here once the document storage feature is fully enabled.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.name} className="flex items-center justify-between p-3 bg-white rounded-md border hover:bg-gray-50">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      <span>{doc.name}</span>
                    </a>
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
