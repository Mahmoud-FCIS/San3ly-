import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ShieldCheck, MessageSquare, Users, Factory, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    {
      icon: <Factory className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600" />,
      title: "ربط مباشر مع المصانع",
      description: "تواصل مع أفضل المصانع المتخصصة في محافظتك واحصل على أفضل الأسعار"
    },
    {
      icon: <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />,
      title: "شبكة واسعة من العملاء",
      description: "وصل إلى آلاف العملاء الباحثين عن خدماتك وزيد من أرباحك"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" />,
      title: "دفع آمن ومضمون",
      description: "نظام دفع محمي مع ضمان حقوق جميع الأطراف وحماية كاملة للمعاملات"
    },
    {
      icon: <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-600" />,
      title: "تواصل فوري وآمن",
      description: "نظام دردشة متطور لضمان التواصل السلس مع إشعارات فورية"
    }
  ];

  const benefits = [
    "توفير الوقت والجهد في البحث عن المصانع المناسبة",
    "ضمان الجودة من خلال نظام التقييمات والمراجعات",
    "أسعار تنافسية ومقارنة شفافة بين المصانع",
    "دعم فني متخصص على مدار الساعة"
  ];

  const testimonials = [
    {
      name: "أحمد محمد",
      role: "مالك مصنع النسيج الحديث",
      content: "منصة SAN3LY غيرت طريقة عملي تماماً. زادت طلباتي بنسبة 300% خلال 6 أشهر فقط",
      rating: 5
    },
    {
      name: "فاطمة علي",
      role: "صاحبة مشروع تجاري",
      content: "وجدت أفضل المصانع بأسعار مناسبة وجودة عالية. خدمة العملاء ممتازة والدفع آمن",
      rating: 5
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-right">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 lg:mb-6 leading-tight">
                مرحباً بك في <span className="text-green-200">SAN3LY</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-6 lg:mb-8 text-green-100 leading-relaxed">
                المنصة الرائدة التي تربط بين المصانع والعملاء لتحقيق أفضل حلول التصنيع في المنطقة العربية
              </p>
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 lg:px-10 py-4 lg:py-6 text-lg lg:text-xl rounded-xl shadow-lg"
                  onClick={() => navigate('/register')}
                >
                  ابدأ رحلتك معنا
                  <ArrowRight className="mr-2 lg:mr-3 w-5 h-5 lg:w-6 lg:h-6" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white text-green-400 hover:bg-white hover:text-green-600 font-semibold px-6 sm:px-8 lg:px-10 py-4 lg:py-6 text-lg lg:text-xl rounded-xl"
                  onClick={() => navigate('/login')}
                >
                  {t('login')}
                </Button>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div className="bg-white/20 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-center">
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 lg:mb-2">1000+</div>
                    <div className="text-xs sm:text-sm lg:text-base text-green-100">مصنع مسجل</div>
                  </div>
                  <div className="bg-white/20 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-center">
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 lg:mb-2">5000+</div>
                    <div className="text-xs sm:text-sm lg:text-base text-green-100">عميل راضي</div>
                  </div>
                  <div className="bg-white/20 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-center">
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 lg:mb-2">15000+</div>
                    <div className="text-xs sm:text-sm lg:text-base text-green-100">طلب مكتمل</div>
                  </div>
                  <div className="bg-white/20 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-center">
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 lg:mb-2">4.9</div>
                    <div className="text-xs sm:text-sm lg:text-base text-green-100">متوسط التقييم</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
              لماذا تختار SAN3LY؟
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              منصة متكاملة تضمن لك تجربة تصنيع مميزة وآمنة مع أحدث التقنيات وأفضل الخدمات
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 dark:bg-gray-800 dark:border-gray-700 rounded-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-4 lg:mb-6 flex justify-center">{feature.icon}</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white dark:bg-gray-800 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 lg:mb-8">
                مميزات لا تقاوم
              </h2>
              <div className="space-y-4 lg:space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 lg:gap-4">
                    <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-xl">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-600 mb-3 lg:mb-4">99.9%</div>
                  <div className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-2">معدل الرضا</div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">من عملائنا راضون عن خدماتنا</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
              ماذا يقول عملاؤنا؟
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-lg">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg mb-4 lg:mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{testimonial.name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 lg:mb-6">
            ابدأ رحلتك في عالم التصنيع اليوم
          </h2>
          <p className="text-lg sm:text-xl text-green-100 mb-8 lg:mb-10">
            انضم إلى آلاف المصانع والعملاء الذين يثقون في SAN3LY
          </p>
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
            <Button
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 lg:px-10 py-4 lg:py-6 text-lg lg:text-xl rounded-xl"
              onClick={() => navigate('/register')}
            >
              إنشاء حساب مجاني
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-green-400 hover:bg-white hover:text-green-600 font-semibold px-6 sm:px-8 lg:px-10 py-4 lg:py-6 text-lg lg:text-xl rounded-xl"
            >
              تعرف على المزيد
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
