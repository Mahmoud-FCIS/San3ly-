import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Camera, Calendar, Package, Ruler, Weight, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { saveManufacturingRequest } from "@/services/requestService";
import { useToast } from "@/hooks/use-toast";

const NewRequest = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    material: "",
    dimensions: "",
    weight: "",
    deadline: "",
    category: "",
    budget: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.quantity || !formData.material || !formData.deadline || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Submitting new request:", formData);
      const docId = await saveManufacturingRequest(currentUser.uid, formData);
      console.log("Request saved with document ID:", docId);
      
      toast({
        title: "تم بنجاح",
        description: "تم إرسال طلب التصنيع بنجاح وسيظهر في قائمة طلباتك"
      });
      
      // Navigate back to requests with refresh flag
      navigate('/requests', { state: { refresh: true } });
    } catch (error) {
      console.error("Error submitting request:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الطلب";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "معدني",
    "بلاستيك",
    "خشبي",
    "طباعة ثلاثية الأبعاد",
    "نسيج",
    "زجاج",
    "سيراميك",
    "مطاط",
    "أخرى"
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/requests')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">طلب تصنيع جديد</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">تفاصيل طلب التصنيع</CardTitle>
            <p className="text-center text-gray-600 text-sm">املأ البيانات التالية لإرسال طلبك للمصانع المتخصصة</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Images */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">صور المنتج أو التصميم *</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">صورة رئيسية</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">صورة إضافية</p>
                </div>
              </div>
            </div>

            {/* Product Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">عنوان المنتج *</label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="مثال: تصنيع قطع معدنية حسب الطلب"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">وصف المنتج والمتطلبات *</label>
              <Textarea
                placeholder="اكتب وصفاً مفصلاً للمنتج المطلوب تصنيعه، المواصفات الفنية، والمتطلبات الخاصة..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">فئة التصنيع *</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={formData.category === category ? "default" : "outline"}
                    className={`text-sm ${formData.category === category ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => handleInputChange('category', category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الكمية المطلوبة *</label>
              <div className="relative">
                <Package className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="مثال: 100 قطعة"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Material */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">نوع المادة الخام *</label>
              <Input
                placeholder="مثال: ستانلس ستيل، ألمنيوم، بلاستيك ABS..."
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الأبعاد والمقاسات</label>
              <div className="relative">
                <Ruler className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="مثال: 50 سم × 30 سم × 20 سم"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الوزن المتوقع</label>
              <div className="relative">
                <Weight className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="مثال: 2 كيلوغرام"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">موعد التسليم المطلوب *</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الميزانية المتوقعة</label>
              <div className="relative">
                <span className="absolute right-3 top-3 text-gray-400 text-sm">₪</span>
                <Input
                  placeholder="مثال: 1000 - 2000"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب للمصانع"}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              سيتم إرسال طلبك للمصانع المتخصصة في فئة المنتج المحددة، وستبدأ باستلام العروض خلال 24 ساعة
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewRequest;
