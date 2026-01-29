const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold text-white">VCRAFT</span>
            <span className="text-xl font-light text-gray-400 ml-1">AI</span>
            <p className="text-sm text-gray-400 mt-2">
              AI-powered pitch deck analysis for startups
            </p>
          </div>
          
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} VCRAFT AI. Built for founders.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
