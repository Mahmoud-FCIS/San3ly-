// NewRequest.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Camera, Calendar, Package, Ruler, Weight, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ✅ Firebase
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ==================== Helpers: JPEG Base64 ≤ 900KB ==================== */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // ~900KB
const MIN_W = 600;
const MIN_H = 400;
const TARGET_LONG_EDGE = 1600;

type AllowedMime = (typeof ALLOWED_TYPES)[number] | "image/jpeg";

async function fileToBitmap(file: File) {
  return await createImageBitmap(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: AllowedMime,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      "image/jpeg",
      quality
    );
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

/** تصغير + ضغط حتى ≤ 900KB وإرجاع DataURL + preview */
async function fileToSafeBase64(file: File): Promise<{ dataUrl: string; previewUrl: string }> {
  if (!ALLOWED_TYPES.includes(file.type as any)) {
    throw new Error("يُسمح فقط بصور: JPEG / PNG / WEBP");
  }
  const bmp = await fileToBitmap(file);
  if (bmp.width < MIN_W || bmp.height < MIN_H) {
    throw new Error(`أبعاد الصورة صغيرة (${bmp.width}×${bmp.height}). الحد الأدنى ${MIN_W}×${MIN_H}px.`);
  }

  const isLandscape = bmp.width >= bmp.height;
  const scale = Math.min(1, TARGET_LONG_EDGE / (isLandscape ? bmp.width : bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);

  const qualities = [0.8, 0.72, 0.64, 0.56, 0.48, 0.4, 0.32, 0.25];
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    const dataUrl = await blobToDataURL(blob);
    const approxBytes = Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }
  }
  throw new Error("تعذّر تقليل حجم الصورة إلى الحدّ الآمن. جرّب صورة أوضح أو أصغر.");
}
/* ================== End helpers ================== */

const NewRequest = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات الطلب
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    material: "",
    dimensions: "",
    weight: "",
    deadline: "",
    category: "",
    budget: "",
    // صور
    mainImageBase64: "" as string,
    extraImageBase64: "" as string,
  });

  // معاينات + أخطاء الصور
  const [mainPreview, setMainPreview] = useState<string>("");
  const [extraPreview, setExtraPreview] = useState<string>("");
  const [imgError, setImgError] = useState<string>("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>, which: "main" | "extra") {
    try {
      setImgError("");
      const f = e.target.files?.[0];
      if (!f) return;
      const { dataUrl, previewUrl } = await fileToSafeBase64(f);

      setFormData(prev => ({
        ...prev,
        mainImageBase64: which === "main" ? dataUrl : prev.mainImageBase64,
        extraImageBase64: which === "extra" ? dataUrl : prev.extraImageBase64,
      }));

      if (which === "main") {
        if (mainPreview) URL.revokeObjectURL(mainPreview);
        setMainPreview(previewUrl);
      } else {
        if (extraPreview) URL.revokeObjectURL(extraPreview);
        setExtraPreview(previewUrl);
      }
      toast({ title: "تم تجهيز الصورة", description: which === "main" ? "الصورة الرئيسية أصبحت بالحجم الآمن" : "الصورة الإضافية أصبحت بالحجم الآمن" });
    } catch (err: any) {
      console.error(err);
      setImgError(err?.message || "ملف غير صالح");
      toast({ title: "خطأ", description: err?.message || "ملف غير صالح", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  }

  function clearImage(which: "main" | "extra") {
    setFormData(prev => ({
      ...prev,
      mainImageBase64: which === "main" ? "" : prev.mainImageBase64,
      extraImageBase64: which === "extra" ? "" : prev.extraImageBase64,
    }));
    if (which === "main" && mainPreview) { URL.revokeObjectURL(mainPreview); setMainPreview(""); }
    if (which === "extra" && extraPreview) { URL.revokeObjectURL(extraPreview); setExtraPreview(""); }
  }

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

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }

    // التحقق من الحقول المطلوبة
    if (!formData.title || !formData.description || !formData.quantity || !formData.material || !formData.deadline || !formData.category) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    // التحقق من الصور
    if (!formData.mainImageBase64 || !formData.extraImageBase64) {
      toast({ title: "الصور مطلوبة", description: "يرجى رفع الصورة الرئيسية والإضافية", variant: "destructive" });
      return;
    }

    // تأكيد حد الحجم الآمن
    const max = SAFE_MAX_BYTES;
    const sizeMain = Math.ceil((formData.mainImageBase64.length - "data:image/jpeg;base64,".length) * 3 / 4);
    const sizeExtra = Math.ceil((formData.extraImageBase64.length - "data:image/jpeg;base64,".length) * 3 / 4);
    if (sizeMain > max || sizeExtra > max) {
      toast({ title: "حجم الصورة كبير", description: "حجم صورة أو أكثر أكبر من الحد الآمن 900KB", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // حفظ في Firestore: manufacturingRequests
      const payload = {
        userId: currentUser.uid,
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        material: formData.material,
        dimensions: formData.dimensions,
        weight: formData.weight,
        deadline: formData.deadline,
        category: formData.category,
        budget: formData.budget,
        mainImageBase64: formData.mainImageBase64,
        extraImageBase64: formData.extraImageBase64,
        createdAt: serverTimestamp(),
        status: "نشط" as const,
      };

      const coll = collection(db, "manufacturingRequests");
      await addDoc(coll, payload);

      toast({ title: "تم بنجاح", description: "تم إرسال طلب التصنيع وسيظهر في قائمة طلباتك" });
      navigate('/requests', { state: { refresh: true } });
    } catch (error: any) {
      console.error("Error submitting request:", error);
      const errorMessage = error?.message || "حدث خطأ أثناء إرسال الطلب";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
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
              <label className="text-sm font-medium text-gray-700">
                صور المنتج أو التصميم *{" "}
                <span className="text-xs text-gray-500">(JPEG Base64 — حد آمن ≤ 900KB لكل صورة)</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Image */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-700">صورة رئيسية</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage(e, "main")}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {mainPreview ? (
                    <div className="relative mt-3">
                      <img src={mainPreview} alt="main" className="w-full max-h-56 object-cover rounded-md" />
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => clearImage("main")}>
                        <X className="w-4 h-4 mr-1" /> حذف
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">الأنواع المسموحة: JPEG/PNG/WebP</p>
                  )}
                </div>

                {/* Extra Image */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-700">صورة إضافية</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage(e, "extra")}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {extraPreview ? (
                    <div className="relative mt-3">
                      <img src={extraPreview} alt="extra" className="w-full max-h-56 object-cover rounded-md" />
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => clearImage("extra")}>
                        <X className="w-4 h-4 mr-1" /> حذف
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">الأنواع المسموحة: JPEG/PNG/WebP</p>
                  )}
                </div>
              </div>

              {imgError && <p className="text-sm text-red-600 mt-1">{imgError}</p>}
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
                placeholder="اكتب وصفاً مفصلاً للمنتج المطلوب تصنيعه..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Category Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">فئة التصنيع *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={formData.category === category ? "default" : "outline"}
                    className={`text-sm ${formData.category === category ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
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

            {/* Submit */}
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
