import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { Menu, X, User, Home, Calendar, LogOut } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl tracking-tight">
                Couns<span className="text-blue-400">Connect</span>
              </span>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
            >
              <Home size={16} className="mr-1" />
              Dashboard
            </Link>
            <Link
              to="/clients"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/clients")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
            >
              <User size={16} className="mr-1" />
              Clients
            </Link>
            <Link
              to="/appointments"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/appointments")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
            >
              <Calendar size={16} className="mr-1" />
              Appointments
            </Link>

            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 flex items-center"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/")
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={16} className="mr-2" />
              Dashboard
            </Link>
            <Link
              to="/clients"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/clients")
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={16} className="mr-2" />
              Clients
            </Link>
            <Link
              to="/appointments"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/appointments")
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } transition-colors duration-200 flex items-center`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar size={16} className="mr-2" />
              Appointments
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 mt-4 flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;