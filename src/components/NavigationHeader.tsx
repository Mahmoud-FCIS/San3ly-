import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, FileText, Factory, MessageSquare, User, Info, Phone, Moon, Sun, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import logo from "../assets/logo.png"; // adjust if file is in a different path

const NavigationHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const navigationItems = [
    { icon: Home, label: "الصفحة الرئيسية", path: "/dashboard" },
    { icon: FileText, label: t('requests'), path: "/requests" },
    { icon: Factory, label: t('factories'), path: "/factories" },
    { icon: MessageSquare, label: t('messages'), path: "/messages" },
    { icon: Info, label: t('about'), path: "/about" },
    { icon: Phone, label: t('contact'), path: "/contact" }
  ];

  if (isAdmin) {
    navigationItems.push({ icon: Settings, label: "Master Page", path: "/master" });
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogoClick = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={handleLogoClick}>

          <img
            src={logo}
            alt="San3ly Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                      isActive(item.path)
                        ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}

          {currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                isActive('/profile')
                  ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{t('profile')}</span>
            </Button>
          )}

          <LanguageSelector />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          {!currentUser && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
              >
                {t('login')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {t('register')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
