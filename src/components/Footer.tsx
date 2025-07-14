export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Developed by{' '}
            <a 
              href="https://portland.marketing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Portland.Marketing
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};