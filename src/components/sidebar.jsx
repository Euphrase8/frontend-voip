import { Phone, Favorite, Contacts, History, Call, AdminPanelSettings } from "@mui/icons-material";

const Sidebar = ({ currentPage, onNavigate, darkMode, user }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: <Phone /> },
    { id: "favorites", label: "Favorites", icon: <Favorite /> },
    { id: "contacts", label: "Contacts", icon: <Contacts /> },
    { id: "calllogs", label: "Call Logs", icon: <History /> },
    { id: "callings", label: "Register", icon: <Call /> }, // New item for Calling page
  ];

  // Add admin panel option if user is admin
  if (user?.role === 'admin') {
    navItems.push({ id: "admin", label: "Admin Panel", icon: <AdminPanelSettings /> });
  }

  return (
    <div
      className={`hidden md:flex fixed top-0 bottom-0 left-0 w-64 flex-col glass-effect p-4 overflow-y-auto z-40 ${
        darkMode ? "bg-gray-900" : "bg-blue-100"
      } shadow-xl animate-[fadeInUp_0.8s_ease-out_forwards]`}
    >
      <h2 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-blue-900"}`}>
        Dashboard
      </h2>
      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all transform hover:scale-105 min-h-[44px] ${
              currentPage === item.id
                ? "bg-blue-600 text-white"
                : darkMode
                ? "text-white hover:bg-gray-700"
                : "text-black hover:bg-blue-200"
            }`}
            aria-label={`Navigate to ${item.label}`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;