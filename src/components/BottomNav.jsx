const BottomNav = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: <Phone /> },
    { id: "favorites", label: "Favorites", icon: <Favorite /> },
    { id: "contacts", label: "Contacts", icon: <Contacts /> },
    { id: "calllogs", label: "Call Logs", icon: <History /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-effect p-2 xs:p-3 sm:p-3 flex justify-between gap-1 xs:gap-2 sm:gap-3 bg-gray-800/80 shadow-2xl animate-[fadeInUp_0.8s_ease-out_forwards] md:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`p-3 xs:p-3 sm:p-4 rounded-lg flex flex-col items-center transition-all transform hover:scale-110 min-w-[48px] min-h-[48px] ${
            currentPage === item.id
              ? "text-white bg-blue-500/30"
              : DarkMode
              ? "text-white hover:text-white"
              : "text-black hover:text-white"
          }`}
          aria-label={`Navigate to ${item.label}`}
        >
          {item.icon}
          <span className="text-xs xs:text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );
};