'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, Loader2, Download } from 'lucide-react';

function ViewerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Documento';
  const back = searchParams.get('back') || '/materiais';

  // Convert Google Drive file link to clean preview URL
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // → https://drive.google.com/file/d/FILE_ID/preview
  function getPreviewUrl(link: string): string {
    const fileMatch = link.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }
    // Folder embed as fallback
    const folderMatch = link.match(/\/folders\/([^?/]+)/);
    if (folderMatch) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
    }
    return link;
  }

  const previewUrl = getPreviewUrl(url);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <p>Nenhum documento selecionado.</p>
        <button
          onClick={() => router.push(back)}
          className="mt-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header bar */}
      <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => router.push(back)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir original
          </a>
        </div>
      </div>

      {/* Iframe viewer */}
      <div className={`relative ${isFullscreen ? 'flex-1' : 'min-h-[calc(100vh-180px)]'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-gray-500">Carregando documento...</p>
            </div>
          </div>
        )}
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          style={{ minHeight: isFullscreen ? '100%' : 'calc(100vh - 180px)' }}
          allow="autoplay"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

export default function ViewerContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <ViewerInner />
    </Suspense>
  );
}
