'use client';

import LaLillyLogoNew from '../../components/LaLillyLogoNew';

export default function LogoPreviewPage() {
  const downloadSVG = (variant: 'light' | 'dark' | 'gradient', filename: string) => {
    // This is a simplified approach - in production you'd want a more robust SVG export
    const svgContent = `
      <svg viewBox="0 0 240 72" xmlns="http://www.w3.org/2000/svg">
        ${variant === 'gradient' ? `
        <defs>
          <linearGradient id="lilyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f472b6" />
            <stop offset="50%" stop-color="#db2777" />
            <stop offset="100%" stop-color="#9d174d" />
          </linearGradient>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1f2937" />
            <stop offset="50%" stop-color="#4b5563" />
            <stop offset="100%" stop-color="#1f2937" />
          </linearGradient>
        </defs>
        ` : ''}
        <g transform="translate(12, 16)">
          <path d="M20 20 C10 10, 10 5, 20 10 C30 5, 30 10, 20 20 Z" 
                fill="${variant === 'gradient' ? 'url(#lilyGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
                opacity="0.9" />
          <path d="M20 20 C15 8, 10 8, 16 16 C10 8, 15 8, 20 20 Z" 
                fill="${variant === 'gradient' ? 'url(#lilyGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
                opacity="0.7" transform="rotate(45 20 20)" />
          <path d="M20 20 C25 8, 30 8, 24 16 C30 8, 25 8, 20 20 Z" 
                fill="${variant === 'gradient' ? 'url(#lilyGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
                opacity="0.7" transform="rotate(-45 20 20)" />
          <circle cx="20" cy="20" r="2" 
                  fill="${variant === 'gradient' ? 'url(#lilyGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
                  opacity="0.8" />
          <line x1="20" y1="20" x2="20" y2="35" 
                stroke="${variant === 'gradient' ? 'url(#lilyGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
                stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
        </g>
        <text x="60" y="35" font-family="Georgia, Times, serif" font-size="24" font-weight="400" 
              fill="${variant === 'gradient' ? 'url(#textGradient)' : variant === 'light' ? '#1f2937' : '#ffffff'}" 
              letter-spacing="0.02em">LaLilly</text>
        <text x="60" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="300" 
              fill="${variant === 'light' ? '#6b7280' : '#d1d5db'}" 
              letter-spacing="0.1em" text-transform="uppercase">the event marketplace</text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">LaLilly Logo Variants</h1>
        
        {/* Gradient Variant */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">Gradient Version (Primary)</h2>
          <div className="flex justify-center mb-4">
            <LaLillyLogoNew variant="gradient" size="lg" />
          </div>
          <div className="text-center">
            <button
              onClick={() => downloadSVG('gradient', 'lalilly-logo-gradient.svg')}
              className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-2 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all"
            >
              Download SVG
            </button>
          </div>
        </div>

        {/* Light Variant */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">Light Version (for light backgrounds)</h2>
          <div className="flex justify-center mb-4">
            <LaLillyLogoNew variant="light" size="lg" />
          </div>
          <div className="text-center">
            <button
              onClick={() => downloadSVG('light', 'lalilly-logo-light.svg')}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-all"
            >
              Download SVG
            </button>
          </div>
        </div>

        {/* Dark Variant */}
        <div className="mb-12 p-8 bg-gray-900 rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4 text-white">Dark Version (for dark backgrounds)</h2>
          <div className="flex justify-center mb-4">
            <LaLillyLogoNew variant="dark" size="lg" />
          </div>
          <div className="text-center">
            <button
              onClick={() => downloadSVG('dark', 'lalilly-logo-dark.svg')}
              className="bg-white text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Download SVG
            </button>
          </div>
        </div>

        {/* Size Variants */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-6">Size Variants</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-gray-600 mb-2">Large</h3>
              <LaLillyLogoNew variant="gradient" size="lg" />
            </div>
            <div>
              <h3 className="text-sm text-gray-600 mb-2">Medium</h3>
              <LaLillyLogoNew variant="gradient" size="md" />
            </div>
            <div>
              <h3 className="text-sm text-gray-600 mb-2">Small</h3>
              <LaLillyLogoNew variant="gradient" size="sm" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">Usage Instructions</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use the <strong>gradient version</strong> as the primary logo</li>
            <li>• Use <strong>light version</strong> on white/light backgrounds when gradients aren&apos;t supported</li>
            <li>• Use <strong>dark version</strong> on dark backgrounds</li>
            <li>• For PNG conversion, use online tools like convertio.co or similar</li>
            <li>• Maintain minimum clear space around the logo equal to the height of the lily flower</li>
          </ul>
        </div>
      </div>
    </div>
  );
}