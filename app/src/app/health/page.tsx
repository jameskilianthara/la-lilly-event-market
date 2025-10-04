export default function HealthCheck() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            System Healthy
          </h1>
          <p className="text-gray-600 mb-4">
            Next.js + Tailwind CSS working properly
          </p>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Next.js:</span>
              <span className="text-green-600 font-medium">✓ Working</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tailwind CSS:</span>
              <span className="text-green-600 font-medium">✓ Working</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TypeScript:</span>
              <span className="text-green-600 font-medium">✓ Working</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">App Router:</span>
              <span className="text-green-600 font-medium">✓ Working</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}