
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, DashboardStats } from "@/services/statsService";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userProfile, currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user can create new requests (client or both)
  const canCreateRequests = userProfile?.accountType === 'client' || userProfile?.accountType === 'both';

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const loadStats = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userStats = await getDashboardStats(currentUser.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { number: loading ? "..." : stats.activeRequests.toString(), label: "الطلبات النشطة", color: "text-blue-600" },
    { number: loading ? "..." : stats.completedRequests.toString(), label: "الطلبات المكتملة", color: "text-green-600" },
    { number: loading ? "..." : stats.averageRating.toFixed(1), label: "متوسط التقييم", color: "text-yellow-600" },
    { number: loading ? "..." : `${stats.totalRevenue.toLocaleString()} ج.م`, label: "إجمالي المصروف", color: "text-purple-600" }
  ];

  const topFactories = [
    {
      name: "مصنع الدقة للمعادن",
      rating: 4.9,
      specialty: "تصنيع معدني", 
      location: "القاهرة",
      price: "342 ج.م",
      image: "/placeholder.svg"
    },
    {
      name: "شبكة المطور",
      rating: 4.8,
      specialty: "بلاستيك وتغليف",
      location: "الإسكندرية",
      price: "250 ج.م",
      image: "/placeholder.svg"
    },
    {
      name: "مصنع الحديد المتطور",
      rating: 4.7,
      specialty: "حديد ومعادن",
      location: "الجيزة",
      price: "400 ج.م",
      image: "/placeholder.svg"
    }
  ];

  const sliderImages = [
    {
      src: "/placeholder.svg",
      alt: "مصنع حديث للتصنيع",
      title: "أحدث تقنيات التصنيع"
    },
    {
      src: "/placeholder.svg", 
      alt: "فريق عمل محترف",
      title: "فريق عمل متخصص"
    },
    {
      src: "/placeholder.svg",
      alt: "منتجات عالية الجودة",
      title: "جودة عالية مضمونة"
    },
    {
      src: "/placeholder.svg",
      alt: "خدمة عملاء ممتازة",
      title: "خدمة عملاء على مدار الساعة"
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            مرحباً بك في لوحة التحكم
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            إدارة طلباتك ومتابعة أعمالك بسهولة
          </p>
        </div>

        {/* Image Slider */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
            رحلتك في عالم التصنيع
          </h2>
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {sliderImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-xl lg:rounded-2xl shadow-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl lg:rounded-b-2xl p-4 lg:p-6">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{image.title}</h3>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* New Request Button - Only show for clients and both account types */}
        {canCreateRequests && (
          <div className="text-center mb-8 sm:mb-12">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 text-lg sm:text-xl rounded-xl shadow-lg w-full sm:w-auto"
              onClick={() => navigate('/new-request')}
            >
              <Plus className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6" />
              طلب تصنيع جديد
            </Button>
          </div>
        )}

        {/* Stats Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
            {t('overview')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statsData.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 rounded-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.color} mb-2 sm:mb-3`}>{stat.number}</div>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Factories Section */}
        <div>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {t('topFactories')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              اكتشف أفضل المصانع المعتمدة في منطقتك
            </p>
          </div>
          
          <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {topFactories.map((factory, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"></div>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">{factory.name}</h3>
                      <Badge variant="secondary" className="mb-2 text-xs sm:text-sm">{factory.specialty}</Badge>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span>📍</span> {factory.location}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                        <span className="text-xs sm:text-sm font-medium dark:text-white">{factory.rating}</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-green-600">{factory.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3 sm:mb-4">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base">
                    عرض التفاصيل
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
