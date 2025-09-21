
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<DocumentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const querySnapshot = await getDocs(collection(db, 'announcements'));
        if (querySnapshot.empty) {
          setError('No announcements found in the database. Please add some data to your "announcements" collection in the Firebase console.');
        } else {
          setAnnouncements(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setError(null);
        }
      } catch (e: any) {
        if (e.code === 'permission-denied') {
             setError('Connection failed: You need to set up Firestore security rules. Go to your Firebase console > Firestore Database > Rules and set them to allow reads: "allow read: if true;"');
        } else {
            setError(`An error occurred: ${e.message}`);
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
        <Card className="shadow-lg animate-pulse">
            <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mt-2"></div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div>
      {error ? (
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle />
              Firestore Connection Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : (
         <Card className="bg-green-50 border-green-200 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle />
                    Firestore Connection Successful!
                </CardTitle>
            </CardHeader>
             <CardContent className="space-y-2 text-green-700">
                <p>Here are the latest announcements from your database:</p>
                <ul className="list-disc pl-5">
                {announcements.map(ann => (
                    <li key={ann.id}>
                        <strong>{ann.title}:</strong> {ann.message}
                    </li>
                ))}
                </ul>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
