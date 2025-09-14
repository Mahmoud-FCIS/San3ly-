import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Factory, MessageSquare, Star, Target, Eye, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "../assets/logo.png"; // ✅ adjust if About.tsx is in a subfolder

const About = () => {
  const { t, language } = useLanguage();

  const stats = [
    {
      icon: Users,
      value: "10,000+",
      labelAr: "عميل مسجل",
      labelEn: "Registered Clients"
    },
    {
      icon: Factory,
      value: "1,500+",
      labelAr: "مصنع وورشة",
      labelEn: "Factories & Workshops"
    },
    {
      icon: MessageSquare,
      value: "50,000+",
      labelAr: "طلب مكتمل",
      labelEn: "Completed Requests"
    },
    {
      icon: Star,
      value: "4.8/5",
      labelAr: "تقييم المنصة",
      labelEn: "Platform Rating"
    }
  ];

  const features = [
    {
      icon: Target,
      titleAr: "ربط مباشر",
      titleEn: "Direct Connection",
      descriptionAr: "نربط العملاء مباشرة بالمصانع والورش المتخصصة",
      descriptionEn: "We connect clients directly with specialized factories and workshops"
    },
    {
      icon: Eye,
      titleAr: "شفافية كاملة",
      titleEn: "Complete Transparency",
      descriptionAr: "جميع الأسعار والمواصفات واضحة ومعلنة",
      descriptionEn: "All prices and specifications are clear and announced"
    },
    {
      icon: Heart,
      titleAr: "ضمان الجودة",
      titleEn: "Quality Assurance",
      descriptionAr: "نضمن جودة المنتجات من خلال نظام التقييم والمراجعة",
      descriptionEn: "We guarantee product quality through rating and review system"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <img
            src={logo}
            alt="San3ly Logo"
            className="h-16 sm:h-20 w-auto mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {language === "ar" ? "عن المنصة" : "About the Platform"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {language === "ar"
              ? "منصة رقمية رائدة تهدف إلى ربط العملاء بالمصانع والورش المتخصصة في جميع أنحاء المنطقة، مما يسهل عملية الطلب والتصنيع"
              : "A leading digital platform that aims to connect clients with specialized factories and workshops throughout the region, facilitating the ordering and manufacturing process"}
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <CardContent className="p-4 sm:p-6">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2 sm:mb-3" />
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {language === "ar" ? stat.labelAr : stat.labelEn}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-600 text-lg sm:text-xl">
                {language === "ar" ? "رسالتنا" : "Our Mission"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {language === "ar"
                  ? "نسعى لتسهيل عملية التواصل بين العملاء والمصانع من خلال منصة رقمية متطورة تضمن الشفافية والجودة وسرعة التنفيذ. نهدف إلى دعم الاقتصاد المحلي وتطوير الصناعات الصغيرة والمتوسطة."
                  : "We strive to facilitate communication between clients and factories through an advanced digital platform that ensures transparency, quality and speed of execution. We aim to support the local economy and develop small and medium industries."}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-600 text-lg sm:text-xl">
                {language === "ar" ? "رؤيتنا" : "Our Vision"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {language === "ar"
                  ? "أن نكون المنصة الرائدة في المنطقة لربط العملاء بالمصانع والورش، وأن نساهم في تطوير القطاع الصناعي من خلال التكنولوجيا الحديثة والابتكار المستمر."
                  : "To be the leading platform in the region for connecting clients with factories and workshops, and to contribute to the development of the industrial sector through modern technology and continuous innovation."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-6 sm:mb-8">
            {language === "ar" ? "مميزاتنا" : "Our Features"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                      {language === "ar" ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      {language === "ar" ? feature.descriptionAr : feature.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Specializations */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-center text-gray-900 dark:text-white">
              {language === "ar" ? "التخصصات المتوفرة" : "Available Specializations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { ar: "تشكيل المعادن", en: "Metal Fabrication" },
                { ar: "حقن البلاستيك", en: "Plastic Injection" },
                { ar: "الأثاث الخشبي", en: "Wooden Furniture" },
                { ar: "الملابس والنسيج", en: "Clothing & Textiles" },
                { ar: "الطباعة ثلاثية الأبعاد", en: "3D Printing" },
                { ar: "الإلكترونيات", en: "Electronics" },
                { ar: "المواد الغذائية", en: "Food Processing" },
                { ar: "الأجهزة الطبية", en: "Medical Devices" },
                { ar: "الحرف اليدوية", en: "Handicrafts" },
                { ar: "مواد البناء", en: "Construction Materials" }
              ].map((spec, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  {language === "ar" ? spec.ar : spec.en}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
