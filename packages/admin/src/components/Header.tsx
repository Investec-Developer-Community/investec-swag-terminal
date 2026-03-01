interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="bg-investec-navy-800 border-b border-investec-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase leading-tight">
                Swag Portal
              </h1>
              <p className="text-[11px] text-investec-stone">
                Investec Developer Community
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-investec-navy-500 font-mono">admin</span>
            <button
              onClick={onLogout}
              className="px-3 py-1 text-xs text-investec-stone hover:text-white border border-investec-navy-700 hover:border-investec-navy-500 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
