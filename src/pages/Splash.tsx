import { useEffect } from "react";
import logo from "../assets/logo.png";



const Splash = () => {
  useEffect(() => {
    // Remove the automatic navigation since App.tsx already handles the splash timer
    return;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/15 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/2 w-20 h-20 bg-white/25 rounded-full animate-float"></div>
      </div>

      {/* Main Content */}
      <div className="text-center z-10">
        {/* Logo Image */}
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto flex items-center justify-center">
            <img
              src={logo}
              alt="San3ly Logo"
              className="w-full h-full object-contain animate-fade-in"
            />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in"></h1>
        <p className="text-green-100 text-xl mb-8 animate-fade-in-delayed font-light">
          منصة ربط المصانع والعملاء
        </p>

        {/* Enhanced Loading Bar */}
        <div className="w-80 h-3 bg-white/20 rounded-full mx-auto mb-8 relative overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-gradient-to-r from-white via-green-100 to-white rounded-full loading-animation shadow-lg"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"></div>
        </div>

        <p className="text-green-100 text-lg animate-fade-in-delayed font-medium mb-2">
          مرحباً بك في مستقبل التصنيع
        </p>
        <p className="text-green-200 text-sm animate-fade-in-delayed opacity-80">
          v1.0.0
        </p>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
