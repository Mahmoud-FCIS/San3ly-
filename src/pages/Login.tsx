import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import logo from "../assets/logo.png"; // ✅ path is correct if Login.tsx is in src/

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      await login(email, password);
      
      // Check if this is an admin login
      if (email.toLowerCase() === 'admin@gmail.com' && password === '123456') {
        toast.success("مرحباً بك في لوحة التحكم الرئيسية");
        console.log('Admin login successful - navigating to master page');
        navigate('/master');
      } else {
        toast.success("تم تسجيل الدخول بنجاح");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("خطأ في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <span className="text-xl sm:text-2xl font-bold text-white">S</span>
          </div>

          {/* Replaced SAN3LY text with logo image */}
          <img
            src={logo}
            alt="San3ly Logo"
            className="h-9 sm:h-10 w-auto mx-auto mb-2 object-contain"
          />

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">منصة ربط المصانع والعملاء</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl sm:text-2xl dark:text-white">{t('login')}</CardTitle>
            <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-300">أهلاً بعودتك! سجل دخولك للمتابعة</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 h-11 sm:h-12 text-sm sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 h-11 sm:h-12 text-sm sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-left">
              <Button variant="link" className="text-green-600 dark:text-green-400 p-0 h-auto text-sm">
                نسيت كلمة المرور؟
              </Button>
            </div>

            {/* Login Button */}
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 sm:h-12 text-base sm:text-lg"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : t('login')}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                ليس لديك حساب؟{" "}
                <Button 
                  variant="link" 
                  className="text-green-600 dark:text-green-400 p-0 h-auto font-semibold text-sm sm:text-base"
                  onClick={() => navigate('/register')}
                >
                  إنشاء حساب جديد
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-4 sm:mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 text-sm sm:text-base"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
