/**
 * Main App component with Google Forms integration
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShadcnSubsidyForm } from './components/ShadcnSubsidyForm';

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// Check if Sheets API endpoint is configured
const SHEETS_API_ENDPOINT = import.meta.env.VITE_SHEETS_API_ENDPOINT || '';

const App: React.FC = () => {
  const handleSubmitSuccess = (responseId: string) => {
    console.log('Form submitted successfully:', responseId);
    alert(`申請が完了しました。受付番号: ${responseId}`);
  };

  const handleSubmitError = (error: Error) => {
    console.error('Form submission error:', error);
    alert(`エラーが発生しました: ${error.message}`);
  };

  // API endpoint check is optional - form can still function without it
  if (!SHEETS_API_ENDPOINT) {
    console.warn('Google Sheets API endpoint not configured. Form data will not be saved.');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <img 
                  src="/spot-sharoushi-character.png" 
                  alt="スポット社労士くん" 
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    【第4回】働きやすい職場環境づくり推進奨励金
                  </h1>
                  <p className="text-sm text-gray-500">事前エントリーフォーム</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main>
          <ShadcnSubsidyForm
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
          />
        </main>

        <footer className="bg-gray-800 text-white mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-sm">
                Copyright © 2015-2025 スポット社労士くん社会保険労務士法人
              </p>
              <p className="text-sm mt-1">
                東京都千代田区二番町8-3二番町大沼ビル4階
              </p>
              <a 
                href="https://www.spot-s.jp/privacy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block"
              >
                プライバシーポリシー
              </a>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
};

export default App;
