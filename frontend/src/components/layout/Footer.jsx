const Footer = () => {
  return (
    <footer className="relative bg-gray-900/95 backdrop-blur-xl text-gray-300 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-orange-300">VCRAFT</span>
            <span className="text-xl font-light text-gray-500">AI</span>
            <span className="hidden sm:inline text-gray-600 ml-2 pl-3 border-l border-gray-700/50 text-sm">
              AI-powered pitch intelligence for startups
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} VCRAFT AI &middot; Built for founders
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
