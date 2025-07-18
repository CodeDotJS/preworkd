import { Activity } from 'lucide-react'

interface NavigationProps {
  currentPage: 'validate' | 'browse' | 'settings'
}

export default function Navigation({ currentPage }: NavigationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <a href="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/25">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            preworkd
          </h1>
          <p className="text-gray-600 text-sm font-medium">
            Fixing your data mistakes—gently mocking them along the way.
          </p>
        </div>
      </a>
      
      <nav className="flex items-center gap-2">
        <a 
          href="/" 
          className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-all duration-200 ${
            currentPage === 'validate'
              ? 'bg-violet-600 text-white shadow-violet-500/25 hover:bg-violet-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Validate
        </a>
        <a 
          href="/browse" 
          className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
            currentPage === 'browse'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 hover:bg-violet-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Browse
        </a>
        <a 
          href="/settings" 
          className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
            currentPage === 'settings'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 hover:bg-violet-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Settings
        </a>
      </nav>
    </div>
  )
} 