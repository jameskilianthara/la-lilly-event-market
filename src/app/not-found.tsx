import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page not found
          </h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Go to Homepage
          </Link>
          
          <div className="text-sm">
            <Link
              href="/how-it-works"
              className="text-orange-600 hover:text-orange-700"
            >
              Learn how EventFoundry works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


