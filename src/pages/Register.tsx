// Register.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, User, Building, Mail, Lock, Eye, EyeOff, Phone, MapPin, Home, CreditCard, Camera, Fingerprint, Factory, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TermsOfService from "./TermsOfService";
import PrivacyPolicy from "./PrivacyPolicy";
import { specializations } from "@/data/specializations";

/* ---------------- Helpers for Base64 ID images ---------------- */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // 900KB after encoding (safe for Firestore 1MiB limit)
const MIN_W = 600;
const MIN_H = 400;
const TARGET_LONG_EDGE = 1600; // resize down if larger
type AllowedMime = (typeof ALLOWED_TYPES)[number] | "image/jpeg";

/** Read File -> ImageBitmap */
async function fileToBitmap(file: File) {
  return await createImageBitmap(file);
}

/** Canvas -> Blob (JPEG with quality) */
function canvasToBlob(canvas: HTMLCanvasElement, mime: AllowedMime, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      mime === "image/png" ? "image/png" : "image/jpeg",
      mime === "image/png" ? undefined : quality
    );
  });
}

/** Blob -> DataURL */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

/** Validate, resize, and compress to fit SAFE_MAX_BYTES; returns {dataUrl, previewUrl} */
async function fileToSafeBase64(file: File): Promise<{ dataUrl: string; previewUrl: string }> {
  if (!ALLOWED_TYPES.includes(file.type as any)) {
    throw new Error("يُسمح فقط بصور: JPEG / PNG / WEBP");
  }

  const bmp = await fileToBitmap(file);
  if (bmp.width < MIN_W || bmp.height < MIN_H) {
    throw new Error(`أبعاد الصورة صغيرة (${bmp.width}×${bmp.height}). الحد الأدنى ${MIN_W}×${MIN_H}px.`);
  }

  // scale by longer edge
  const isLandscape = bmp.width >= bmp.height;
  const scale = Math.min(1, TARGET_LONG_EDGE / (isLandscape ? bmp.width : bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);

  // Try descending qualities until under SAFE_MAX_BYTES
  const mime: AllowedMime = "image/jpeg";
  const qualities = [0.8, 0.72, 0.64, 0.56, 0.48, 0.4, 0.32];
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, mime, q);
    const dataUrl = await blobToDataURL(blob);
    // Rough dataUrl -> bytes estimate: base64 expands ~4/3 (dataURL has header, but ok)
    const approxBytes = Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }
  }

  // Last attempt with lowest quality
  const finalBlob = await canvasToBlob(canvas, mime, 0.25);
  const dataUrl = await blobToDataURL(finalBlob);
  const approxBytes = Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
  if (approxBytes > SAFE_MAX_BYTES) {
    throw new Error("تعذّر تقليل حجم الصورة إلى الحدّ الآمن. جرّب صورة أوضح أو أصغر.");
  }
  const previewUrl = URL.createObjectURL(finalBlob);
  return { dataUrl, previewUrl };
}

/* ---------------- Component ---------------- */
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [accountType, setAccountType] = useState<'client' | 'manufacturer' | 'both' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    email: "",
    phone: "",
    countryCode: "+20",
    country: "",
    city: "",
    address: "",
    password: "",
    confirmPassword: "",
    // Factory specific fields
    factoryName: "",
    factoryAddress: "",
    specialization: "",
    commercialRecord: null as File | null,
    taxCard: null as File | null,
    // NEW: ID images as Base64 (safe size)
    idFrontBase64: "" as string,
    idBackBase64: "" as string,
  });

  // previews
  const [idFrontPreview, setIdFrontPreview] = useState<string>("");
  const [idBackPreview, setIdBackPreview] = useState<string>("");
  const [idError, setIdError] = useState<string>("");

  const countries = [
    { code: "PS", name: "فلسطين", cities: ["رام الله", "غزة", "الخليل", "نابلس", "جنين", "بيت لحم"] },
    { code: "JO", name: "الأردن", cities: ["عمان", "إربد", "الزرقاء", "العقبة", "الكرك", "معان"] },
    { code: "LB", name: "لبنان", cities: ["بيروت", "طرابلس", "صيدا", "صور", "زحلة", "جونيه"] },
    { code: "SY", name: "سوريا", cities: ["دمشق", "حلب", "حمص", "اللاذقية", "حماة", "دير الزور"] },
    { code: "EG", name: "مصر", cities: ["التجمع الثالث","التجمع الخامس","المقاولون العرب","الإسماعيلية","منطقة العين السخنة الصناعية","منطقة شرق بورسعيد الصناعية","بورسعيد الحرة","بلبيس (الشرقية)","ميت غمر (الدقهلية)","كفر الدوار (البحيرة)","المحلة الكبرى (الغربية)","العبور","الشروق","القاهرة الجديدة","الفيوم الجديدة","أسيوط الجديدة","بني سويف الصناعية","سوهاج الجديدة","قنا الصناعية","المثلث الذهبي","مدينة الأقمشة والنسيج في السادات","مدينة دمياط للأثاث","منطقة الروبيكي للجلود","الصالحية الجديدة","بدر","السادات","برج العرب الجديدة","السادات","السادس من اكتوبر","العاشر من رمضان","الشرقية","القاهرة", "الإسكندرية", "الجيزة", "شبرا الخيمة", "بورسعيد", "السويس"] },
    { code: "SA", name: "السعودية", cities: ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "تبوك"] },
    { code: "AE", name: "الإمارات", cities: ["دبي", "أبو ظبي", "الشارقة", "العين", "عجمان", "رأس الخيمة"] },
    { code: "KW", name: "الكويت", cities: ["مدينة الكويت", "الأحمدي", "حولي", "الفروانية", "الجهراء", "مبارك الكبير"] }
  ];

  const countryCodes = [
    { code: "+970", country: "فلسطين" },
    { code: "+962", country: "الأردن" },
    { code: "+961", country: "لبنان" },
    { code: "+963", country: "سوريا" },
    { code: "+20", country:  "مصر" },
    { code: "+966", country: "السعودية" },
    { code: "+971", country: "الإمارات" },
    { code: "+965", country: "الكويت" }
  ];

  const selectedCountryData = countries.find(c => c.name === formData.country);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1 && accountType) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  /* --------------- ID picker handlers --------------- */
  async function onPickID(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    try {
      setIdError("");
      const f = e.target.files?.[0];
      if (!f) return;
      if (!ALLOWED_TYPES.includes(f.type as any)) {
        throw new Error("اختر صورة بصيغة JPEG أو PNG أو WEBP.");
      }
      // convert to safe base64 (resize + compress)
      const { dataUrl, previewUrl } = await fileToSafeBase64(f);
      setFormData(prev => ({
        ...prev,
        idFrontBase64: side === "front" ? dataUrl : prev.idFrontBase64,
        idBackBase64: side === "back" ? dataUrl : prev.idBackBase64,
      }));
      if (side === "front") {
        if (idFrontPreview) URL.revokeObjectURL(idFrontPreview);
        setIdFrontPreview(previewUrl);
      } else {
        if (idBackPreview) URL.revokeObjectURL(idBackPreview);
        setIdBackPreview(previewUrl);
      }
      toast.success(`تم تجهيز صورة ${side === "front" ? "الوجه" : "الظهر"} بالحجم الآمن ✅`);
    } catch (err: any) {
      console.error(err);
      setIdError(err?.message || "ملف غير صالح");
      toast.error(err?.message || "ملف غير صالح");
    } finally {
      // reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  }

  function clearID(side: "front" | "back") {
    setFormData(prev => ({
      ...prev,
      idFrontBase64: side === "front" ? "" : prev.idFrontBase64,
      idBackBase64: side === "back" ? "" : prev.idBackBase64,
    }));
    if (side === "front" && idFrontPreview) { URL.revokeObjectURL(idFrontPreview); setIdFrontPreview(""); }
    if (side === "back" && idBackPreview) { URL.revokeObjectURL(idBackPreview); setIdBackPreview(""); }
  }

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (!formData.email || !formData.password || !formData.fullName || !formData.idNumber) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!acceptedTerms) {
      toast.error("يجب الموافقة على الشروط والأحكام");
      return;
    }

    // Must provide both ID sides
    if (!formData.idFrontBase64 || !formData.idBackBase64) {
      toast.error("يرجى رفع صورتي البطاقة (الوجه والظهر)");
      return;
    }

    // Additional validation for factory accounts
    if ((accountType === 'manufacturer' || accountType === 'both') && (!formData.factoryName || !formData.factoryAddress || !formData.specialization)) {
      toast.error("يرجى ملء جميع بيانات المصنع بما في ذلك التخصص");
      return;
    }

    setLoading(true);
    try {
      // NOTE: profileData includes idFrontBase64 & idBackBase64 as Base64 strings (≤900KB each)
      const profileData = {
        ...formData,
        accountType,
      };

      await register(formData.email, formData.password, profileData);
      console.log("Registration data:", { accountType, ...formData });
      toast.success("تم إنشاء الحساب بنجاح");
      navigate('/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold dark:text-white">إنشاء حساب جديد</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        {/* Step 1: Account Type Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl dark:text-white">نوع الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setAccountType('client')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      accountType === 'client' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">عميل</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">أبحث عن خدمات تصنيع</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setAccountType('manufacturer')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      accountType === 'manufacturer' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <Building className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">مصنع</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">أقدم خدمات تصنيع</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAccountType('both')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      accountType === 'both' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">عميل/مصنع</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">أقدم وأطلب خدمات</p>
                    </div>
                  </button>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 mt-6"
                  onClick={handleNext}
                  disabled={!accountType}
                >
                  التالي
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl dark:text-white">المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل *</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="أدخل اسمك الكامل"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* ID Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رقم البطاقة *</label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="أدخل رقم البطاقة"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* ID Photo Upload (Front + Back) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    صور البطاقة * <span className="text-xs text-gray-500">(يتم الضغط تلقائيًا — حد آمن ≤ 900KB لكل صورة)</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Camera className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">صورة الوجه</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickID(e, "front")}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
                      />
                      {idFrontPreview ? (
                        <div className="relative mt-3">
                          <img
                            src={idFrontPreview}
                            alt="front"
                            className="w-full max-h-56 object-cover rounded-md"
                          />
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => clearID("front")}>
                            حذف
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">الأنواع المسموحة: JPEG/PNG/WEBP</p>
                      )}
                    </div>

                    {/* Back */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Camera className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">صورة الظهر</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickID(e, "back")}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
                      />
                      {idBackPreview ? (
                        <div className="relative mt-3">
                          <img
                            src={idBackPreview}
                            alt="back"
                            className="w-full max-h-56 object-cover rounded-md"
                          />
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => clearID("back")}>
                            حذف
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">الأنواع المسموحة: JPEG/PNG/WEBP</p>
                      )}
                    </div>
                  </div>
                  {idError && <p className="text-sm text-red-600 mt-1">{idError}</p>}
                </div>

                {/* Factory Information (for manufacturer and both types) */}
                {(accountType === 'manufacturer' || accountType === 'both') && (
                  <>
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Factory className="w-5 h-5" />
                        بيانات المصنع
                      </h3>
                      
                      {/* Factory Name */}
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المصنع *</label>
                        <div className="relative">
                          <Building className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="أدخل اسم المصنع بالكامل"
                            value={formData.factoryName}
                            onChange={(e) => handleInputChange('factoryName', e.target.value)}
                            className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Factory Address */}
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">عنوان المصنع *</label>
                        <div className="relative">
                          <MapPin className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="أدخل عنوان المصنع بالتفصيل"
                            value={formData.factoryAddress}
                            onChange={(e) => handleInputChange('factoryAddress', e.target.value)}
                            className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Specialization Dropdown */}
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">التخصص *</label>
                        <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue placeholder="اختر التخصص" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-700 border dark:border-gray-600 z-50">
                            {specializations.map((spec) => (
                              <SelectItem key={spec.id} value={spec.nameAr} className="dark:text-white dark:focus:bg-gray-600">
                                {spec.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  onClick={handleNext}
                >
                  التالي
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Contact & Security */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="space-y-4">
                {/* Country */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">البلد *</label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="اختر البلد" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المحافظة/المدينة *</label>
                  <Select 
                    value={formData.city} 
                    onValueChange={(value) => handleInputChange('city', value)}
                    disabled={!formData.country}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCountryData?.cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">العنوان بالتفصيل *</label>
                  <div className="relative">
                    <Home className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="أدخل العنوان بالتفصيل"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني *</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف *</label>
                  <div className="flex gap-2">
                    <Select value={formData.countryCode} onValueChange={(value) => handleInputChange('countryCode', value)}>
                      <SelectTrigger className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((code) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="59 123 4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الأمان</h3>
                  
                  {/* Password */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور *</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="أدخل كلمة مرور قوية"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pr-10 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تأكيد كلمة المرور *</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="أعد إدخال كلمة المرور"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pr-10 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <div className="text-sm leading-relaxed">
                    <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                      أوافق على{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-green-600 dark:text-green-400 p-0 h-auto underline">
                            شروط الاستخدام
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>شروط الاستخدام</DialogTitle>
                          </DialogHeader>
                          <TermsOfService />
                        </DialogContent>
                      </Dialog>
                      {" "}و{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-green-600 dark:text-green-400 p-0 h-auto underline">
                            سياسة الخصوصية
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>سياسة الخصوصية</DialogTitle>
                          </DialogHeader>
                          <PrivacyPolicy />
                        </DialogContent>
                      </Dialog>
                    </label>
                  </div>
                </div>

                {/* Register Button */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 flex items-center gap-2 mt-6"
                  onClick={handleRegister}
                  disabled={loading || !acceptedTerms}
                >
                  <Fingerprint className="w-5 h-5" />
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                </Button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    لديك حساب بالفعل؟{" "}
                    <Button 
                      variant="link" 
                      className="text-green-600 dark:text-green-400 p-0 h-auto font-semibold"
                      onClick={() => navigate('/login')}
                    >
                      تسجيل الدخول
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Register;
