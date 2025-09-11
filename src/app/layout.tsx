import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Van Schalkwyk Trust Mobile',
  description: 'Mobile banking for the Van Schalkwyk Family Trust',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00703C" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Check for updates on page load
                    registration.update();

                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // A new version is installed and waiting.
                            // Dispatch an event that the PwaUpdater component can listen for.
                            const event = new CustomEvent('pwa-update-available', { detail: registration });
                            window.dispatchEvent(event);
                          }
                        });
                      }
                    });
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="container mx-auto max-w-lg bg-background min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
