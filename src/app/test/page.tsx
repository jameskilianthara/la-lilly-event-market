export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Tailwind Test
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this styled properly, Tailwind is working!
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
          Test Button
        </button>
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Tailwind CSS is rendering properly!
        </div>
      </div>
    </div>
  )
}