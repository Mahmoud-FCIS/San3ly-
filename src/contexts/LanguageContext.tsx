import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  ar: {
    // Navigation
    'home': 'الرئيسية',
    'requests': 'الطلبات',
    'factories': 'المصانع',
    'messages': 'الرسائل',
    'profile': 'الملف الشخصي',
    'about': 'عن San3ly',
    'contact': 'تواصل معنا',
    'logout': 'خروج',
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'dashboard': 'لوحة التحكم',
    'newRequest': 'طلب جديد',
    
    // General
    'welcome': 'مرحباً بك',
    'topFactories': 'أفضل المصانع تقييماً',
    'overview': 'نظرة عامة',
    'welcomeMessage': 'مرحباً بك في San3ly',
    'platformDescription': 'منصة ربط المصانع والعملاء',
    'search': 'بحث',
    'filter': 'تصفية',
    'all': 'الكل',
    'category': 'الفئة',
    'location': 'الموقع',
    'rating': 'التقييم',
    'projects': 'المشاريع',
    'contactFactory': 'تواصل مع المصنع',
    'viewProfile': 'عرض الملف',
    'online': 'متصل',
    'offline': 'غير متصل',
    'verified': 'موثق',
    'currency': 'ج.م',
    
    // Languages
    'arabic': 'العربية',
    'english': 'الإنجليزية',
    'selectLanguage': 'اختر اللغة',
    
    // Factory specializations
    'specializations': 'التخصصات',
    'factoriesAndWorkshops': 'المصانع والورش',
    'searchFactories': 'ابحث عن المصانع...',
    
    // Request form
    'requestTitle': 'عنوان الطلب',
    'requestDescription': 'وصف الطلب',
    'requestCategory': 'فئة الطلب',
    'quantity': 'الكمية',
    'material': 'المادة',
    'dimensions': 'الأبعاد',
    'weight': 'الوزن',
    'deadline': 'الموعد النهائي',
    'budget': 'الميزانية',
    'images': 'الصور',
    'submitRequest': 'إرسال الطلب',
    
    // Time
    'withinHour': 'خلال ساعة',
    'within3Hours': 'خلال 3 ساعات',
    'withinDay': 'خلال يوم',
    'responseTime': 'وقت الاستجابة'
  },
  en: {
    // Navigation
    'home': 'Home',
    'requests': 'Requests',
    'factories': 'Factories',
    'messages': 'Messages',
    'profile': 'Profile',
    'about': 'About San3ly',
    'contact': 'Contact Us',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    'dashboard': 'Dashboard',
    'newRequest': 'New Request',
    
    // General
    'welcome': 'Welcome',
    'topFactories': 'Top Rated Factories',
    'overview': 'Overview',
    'welcomeMessage': 'Welcome to San3ly',
    'platformDescription': 'Factory & Client Connection Platform',
    'search': 'Search',
    'filter': 'Filter',
    'all': 'All',
    'category': 'Category',
    'location': 'Location',
    'rating': 'Rating',
    'projects': 'Projects',
    'contactFactory': 'Contact Factory',
    'viewProfile': 'View Profile',
    'online': 'Online',
    'offline': 'Offline',
    'verified': 'Verified',
    'currency': 'EGP',
    
    // Languages
    'arabic': 'Arabic',
    'english': 'English',
    'selectLanguage': 'Select Language',
    
    // Factory specializations
    'specializations': 'Specializations',
    'factoriesAndWorkshops': 'Factories & Workshops',
    'searchFactories': 'Search factories...',
    
    // Request form
    'requestTitle': 'Request Title',
    'requestDescription': 'Request Description',
    'requestCategory': 'Request Category',
    'quantity': 'Quantity',
    'material': 'Material',
    'dimensions': 'Dimensions',
    'weight': 'Weight',
    'deadline': 'Deadline',
    'budget': 'Budget',
    'images': 'Images',
    'submitRequest': 'Submit Request',
    
    // Time
    'withinHour': 'Within 1 hour',
    'within3Hours': 'Within 3 hours',
    'withinDay': 'Within 1 day',
    'responseTime': 'Response Time'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'ar' | 'en'>('ar');
  const isRTL = language === 'ar';

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('preferred-language', lang);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as 'ar' | 'en';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else {
      setLanguage('ar'); // Default to Arabic
    }
  }, []);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div className={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};
