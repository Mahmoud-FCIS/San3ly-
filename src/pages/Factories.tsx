
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MapPin, Clock, Star, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { specializations, getSpecializationById } from "@/data/specializations";

// Mock data for factories
const mockFactories = [
  {
    id: 1,
    name: "شركة البلاستيك المتطور",
    nameEn: "Advanced Plastic Company",
    rating: 4.7,
    reviews: 89,
    description: "الرائدون في تصنيع المنتجات البلاستيكية والتغليف المخصص للشركات والمصانع",
    descriptionEn: "Leaders in manufacturing plastic products and custom packaging for companies and factories",
    specialties: ["plastic_injection", "packaging", "blow_molding"],
    location: "غزة، قطاع غزة",
    locationEn: "Gaza, Gaza Strip",
    projects: 218,
    responseTime: "خلال 3 ساعات",
    responseTimeEn: "Within 3 hours",
    avatar: "/lovable-uploads/8f8285d7-d283-4234-9b1d-aae5aaa8de78.png",
    verified: true,
    online: true
  },
  {
    id: 2,
    name: "مصنع الدقة للمعادن",
    nameEn: "Precision Metal Factory",
    rating: 4.9,
    reviews: 127,
    description: "متخصصون في تصنيع القطع المعدنية عالية الدقة والمعدات الصناعية بأحدث التقنيات",
    descriptionEn: "Specialists in manufacturing high-precision metal parts and industrial equipment with latest technologies",
    specialties: ["metal_fabrication", "machining", "welding"],
    location: "رام الله، الضفة الغربية",
    locationEn: "Ramallah, West Bank",
    projects: 342,
    responseTime: "خلال ساعة",
    responseTimeEn: "Within 1 hour",
    avatar: "/lovable-uploads/2fcae1b7-4dd0-48e4-ac57-1b8cae772a3e.png",
    verified: true,
    online: false
  },
  {
    id: 3,
    name: "مركز الطباعة ثلاثية الأبعاد",
    nameEn: "3D Printing Center",
    rating: 4.5,
    reviews: 64,
    description: "نقدم خدمات الطباعة ثلاثية الأبعاد المتقدمة للنماذج الأولية والمنتجات المخصصة",
    descriptionEn: "We provide advanced 3D printing services for prototypes and custom products",
    specialties: ["3d_printing", "prototyping", "electronics"],
    location: "نابلس، الضفة الغربية",
    locationEn: "Nablus, West Bank",
    projects: 156,
    responseTime: "خلال يوم",
    responseTimeEn: "Within 1 day",
    avatar: "/placeholder.svg",
    verified: false,
    online: true
  }
];

const Factories = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", nameAr: "الكل", nameEn: "All" },
    { id: "metal_fabrication", nameAr: "معدني", nameEn: "Metal" },
    { id: "plastic_injection", nameAr: "بلاستيك", nameEn: "Plastic" },
    { id: "furniture", nameAr: "خشبي", nameEn: "Wood" },
    { id: "3d_printing", nameAr: "طباعة ثلاثية", nameEn: "3D Printing" },
    { id: "electronics", nameAr: "إلكترونيات", nameEn: "Electronics" }
  ];

  const filteredFactories = mockFactories.filter(factory => {
    const factoryName = language === 'ar' ? factory.name : factory.nameEn;
    const factoryDescription = language === 'ar' ? factory.description : factory.descriptionEn;
    
    const matchesSearch = factoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factoryDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           factory.specialties.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search and Filter */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('searchFactories')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 pl-10 h-11 sm:h-12 text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
          <Filter className="absolute left-3 top-3 w-4 h-4 text-green-600" />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`whitespace-nowrap text-sm ${
                selectedCategory === category.id 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {language === 'ar' ? category.nameAr : category.nameEn}
            </Button>
          ))}
        </div>
      </div>

      {/* Factories List */}
      <div className="px-4 sm:px-6 pb-20 space-y-4">
        {filteredFactories.map((factory) => (
          <Card key={factory.id} className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="relative">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                    <AvatarImage src={factory.avatar} alt={factory.name} />
                    <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm sm:text-lg font-bold">
                      {(language === 'ar' ? factory.name : factory.nameEn)[0]}
                    </AvatarFallback>
                  </Avatar>
                  {factory.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {language === 'ar' ? factory.name : factory.nameEn}
                    </h3>
                    {factory.verified && (
                      <div className="text-green-600 text-sm sm:text-lg flex-shrink-0">✓</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          i < Math.floor(factory.rating) 
                            ? "text-yellow-400 fill-current" 
                            : "text-gray-300 dark:text-gray-600"
                        }`} 
                      />
                    ))}
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mr-1">
                      {factory.rating} ({factory.reviews})
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                    {language === 'ar' ? factory.description : factory.descriptionEn}
                  </p>

                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                    {factory.specialties.slice(0, 2).map((specialtyId) => {
                      const specialty = getSpecializationById(specialtyId);
                      if (!specialty) return null;
                      const SpecialtyIcon = specialty.icon;
                      return (
                        <Badge 
                          key={specialtyId} 
                          variant="secondary" 
                          className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs flex items-center gap-1"
                        >
                          <SpecialtyIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">{language === 'ar' ? specialty.nameAr : specialty.nameEn}</span>
                        </Badge>
                      );
                    })}
                    {factory.specialties.length > 2 && (
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                        +{factory.specialties.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{language === 'ar' ? factory.location : factory.locationEn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">💼</span>
                      <span>{factory.projects} {t('projects')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{language === 'ar' ? factory.responseTime : factory.responseTimeEn}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs sm:text-sm"
                      size="sm"
                    >
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                      {t('contact')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                      size="sm"
                    >
                      {t('viewProfile')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Factories;
