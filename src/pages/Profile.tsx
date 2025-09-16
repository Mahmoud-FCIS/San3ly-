// Profile.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, Edit2, Save, Star, FileText, Factory, Settings, Shield, Eye, EyeOff, LogOut, Image as ImageIcon, Upload, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserRequests, ManufacturingRequest } from "@/services/requestService";

/* Firebase */
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ========== Image helpers: convert/compress to JPEG Base64 <= ~900KB ========== */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // ~900KB
const MIN_DIMENSION = 200; // min width/height guard
const TARGET_LONG_EDGE = 1200; // starting target size (will scale down if needed)

/** createImageBitmap fallback for older browsers would be needed if supporting them */
async function fileToImageBitmap(file: File) {
  return await createImageBitmap(file);
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
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
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(blob);
  });
}

/**
 * Convert image file -> JPEG dataURL (base64) with iterative quality resizing until <= SAFE_MAX_BYTES
 */
async function fileToSafeJpegDataUrl(file: File): Promise<{ dataUrl: string; previewUrl: string }> {
  if (!ALLOWED_TYPES.includes(file.type as any)) {
    throw new Error("الصيغ المسموح بها: JPEG, PNG, WEBP");
  }

  const bmp = await fileToImageBitmap(file);

  if (bmp.width < MIN_DIMENSION || bmp.height < MIN_DIMENSION) {
    // ليس خطأ قاتل — لكن نحذّر
    // يمكن اختيار رفضه: هنا سنسمح لكن نخفض الجودة أكثر لاحقًا
    console.warn("Image smaller than minimum recommended dimensions");
  }

  // حساب مقياس لتقليل الصورة بحسب أطول ضلع
  const isLandscape = bmp.width >= bmp.height;
  const longEdge = isLandscape ? bmp.width : bmp.height;
  const scale = Math.min(1, TARGET_LONG_EDGE / longEdge);
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // تحسين جودة الرسم إن أردت (imageSmoothingEnabled etc.)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);

  // تجربة مجموعة من القيم الجودة (من عالية إلى منخفضة)
  const qualitySteps = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.28, 0.22, 0.18];

  for (const q of qualitySteps) {
    const blob = await canvasToBlob(canvas, q);
    const dataUrl = await blobToDataURL(blob);
    // حساب الحجم التقريبي من DataURL
    const base64Str = dataUrl.split(",")[1] || "";
    const approxBytes = Math.ceil(base64Str.length * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }

    // إذا لم يكفِ، نجرب تقليل الأبعاد تدريجياً (خاصية إضافية)
    // سنقلل طول الضلع بنسبة 0.85، لكن لا ننخفض عن 300px
    const newLong = Math.round(Math.max(300, (isLandscape ? canvas.width : canvas.height) * 0.85));
    const newScale = Math.min(1, newLong / longEdge);
    const nw = Math.max(1, Math.round(bmp.width * newScale));
    const nh = Math.max(1, Math.round(bmp.height * newScale));
    canvas.width = nw; canvas.height = nh;
    ctx.drawImage(bmp, 0, 0, nw, nh);
    // استمر في محاولة الجودة التالية
  }

  throw new Error("تعذّر ضغط الصورة إلى الحجم الآمن (~900KB). جرّب صورة أصغر أو أقل دقّة.");
}
/* ================= End helpers ================== */

const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const { userProfile, updateProfile, changePassword, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRequests, setUserRequests] = useState<ManufacturingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // profile fields for local editing & display
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatar: "/placeholder.svg",
    country: "",
    city: "",
    address: "",
    factoryName: ""
  });

  // ID images stored in Firestore (base64 data urls)
  const [idFrontBase64, setIdFrontBase64] = useState<string | null>(null);
  const [idBackBase64, setIdBackBase64] = useState<string | null>(null);

  // Avatar dialog state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: `${userProfile.city || ""}${userProfile.city && userProfile.country ? ", " : ""}${userProfile.country || ""}`,
        bio: userProfile.bio || "",
        avatar: userProfile.avatar || "/placeholder.svg",
        country: userProfile.country || "",
        city: userProfile.city || "",
        address: userProfile.address || "",
        factoryName: userProfile.factoryName || ""
      });

      // إذا كانت صور البطاقة موجودة في userProfile خزنها
      if ((userProfile as any).idFrontBase64) setIdFrontBase64((userProfile as any).idFrontBase64);
      if ((userProfile as any).idBackBase64) setIdBackBase64((userProfile as any).idBackBase64);
    }
  }, [userProfile]);

  useEffect(() => {
    // إذا لم تكن صور البطاقة موجودة في ال context، نحاول جلبها من Firestore
    (async () => {
      if (currentUser && (!idFrontBase64 || !idBackBase64)) {
        try {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          const data = snap.data();
          if (data?.idFrontBase64) setIdFrontBase64(data.idFrontBase64);
          if (data?.idBackBase64) setIdBackBase64(data.idBackBase64);
        } catch (err) {
          console.warn("Failed to fetch ID images:", err);
        }
      }
    })();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadUserRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUserRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    try {
      const reqs = await getUserRequests(currentUser.uid);
      setUserRequests(reqs);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone,
        bio: profileData.bio,
        country: profileData.country,
        city: profileData.city,
        address: profileData.address,
        factoryName: profileData.factoryName
      });
      toast.success("تم حفظ البيانات بنجاح");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Avatar pick -> convert -> preview ===== */
  const onAvatarPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, previewUrl } = await fileToSafeJpegDataUrl(file);
      setAvatarDataUrl(dataUrl);
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(previewUrl);
    } catch (err: any) {
      console.error(err);
      setAvatarError(err?.message || "فشل في معالجة الصورة");
      toast.error(err?.message || "فشل في معالجة الصورة");
      // clear any preview
      if (avatarPreviewUrl) { URL.revokeObjectURL(avatarPreviewUrl); setAvatarPreviewUrl(null); }
      setAvatarDataUrl(null);
    } finally {
      // clear input value to allow re-picking same file if needed
      e.currentTarget.value = "";
    }
  };

  /* ===== Save avatar to Firestore (users/{uid}.avatar) ===== */
  const saveAvatarToFirestore = async () => {
    if (!currentUser) return;
    if (!avatarDataUrl) {
      toast.error("يرجى اختيار صورة أولاً");
      return;
    }

    // Safety size check
    const base64Str = avatarDataUrl.split(",")[1] || "";
    const approxBytes = Math.ceil(base64Str.length * 3 / 4);
    if (approxBytes > SAFE_MAX_BYTES) {
      toast.error("حجم الصورة أكبر من الحد الآمن (~900KB). جرّب صورة أصغر.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          avatar: avatarDataUrl,
          avatarUpdatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // immediately show new avatar
      setProfileData(prev => ({ ...prev, avatar: avatarDataUrl }));
      toast.success("تم تحديث صورة البروفايل");
      setAvatarDialogOpen(false);
      if (avatarPreviewUrl) { URL.revokeObjectURL(avatarPreviewUrl); setAvatarPreviewUrl(null); }
      setAvatarDataUrl(null);
    } catch (err) {
      console.error("Failed to save avatar:", err);
      toast.error("فشل في حفظ صورة البروفايل");
    } finally {
      setLoading(false);
    }
  };

  /* ===== UI render ===== */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8 text-right">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar} alt={profileData.fullName || "avatar"} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-2xl">
                    {profileData.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Edit button opens dialog */}
                <Dialog open={avatarDialogOpen} onOpenChange={(v) => {
                  setAvatarDialogOpen(v);
                  if (!v) {
                    if (avatarPreviewUrl) { URL.revokeObjectURL(avatarPreviewUrl); setAvatarPreviewUrl(null); }
                    setAvatarDataUrl(null); setAvatarError(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2"
                      onClick={() => setAvatarDialogOpen(true)}
                      title="تغيير صورة البروفايل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> تغيير صورة البروفايل
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input type="file" accept="image/*" onChange={onAvatarPicked} />
                        <p className="text-xs text-gray-500 mt-2">سيتم تحويل الصورة إلى JPEG Base64 مع ضغط آمن ≤ ~900KB</p>
                      </div>

                      {avatarError && <p className="text-sm text-red-600">{avatarError}</p>}

                      {avatarPreviewUrl && (
                        <div className="relative">
                          <img src={avatarPreviewUrl} alt="preview" className="w-full max-h-60 object-contain rounded-md" />
                          <div className="flex gap-2 justify-end mt-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                              setAvatarPreviewUrl(null); setAvatarDataUrl(null); setAvatarError(null);
                            }}>
                              <X className="w-4 h-4 mr-1" /> حذف
                            </Button>
                            <Button onClick={saveAvatarToFirestore} disabled={loading || !avatarDataUrl}>
                              <Upload className="w-4 h-4 mr-1" /> حفظ
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>إلغاء</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileData.fullName || "—"}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profileData.email || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profileData.phone || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profileData.location || "-"}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {/* عرض النبذة + صور البطاقة تحتها كما طلبت */}
                  {profileData.bio || (language === "ar" ? "لا توجد نبذة شخصية" : "No bio available")}
                </p>

                {/* إذا كانت صور البطاقة متاحة - عرضها تحت النبذة (بدون تغيير tabs) */}
                {(idFrontBase64 || idBackBase64) && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">صورة البطاقة — الوجه</div>
                      {idFrontBase64 ? (
                        // idFrontBase64 متوقع DataURL (data:image/jpeg;base64,...)
                        <img src={idFrontBase64} alt="ID Front" className="w-full max-h-48 object-contain rounded-md border" />
                      ) : (
                        <div className="text-sm text-gray-500">لا توجد</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">صورة البطاقة — الظهر</div>
                      {idBackBase64 ? (
                        <img src={idBackBase64} alt="ID Back" className="w-full max-h-48 object-contain rounded-md border" />
                      ) : (
                        <div className="text-sm text-gray-500">لا توجد</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    {language === "ar" ? "عضو فعال" : "Active Member"}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-700 dark:text-blue-200">
                    {language === "ar" ? "موثق" : "Verified"}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
                variant={isEditing ? "default" : "outline"}
                disabled={loading}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "جاري الحفظ..." : (language === "ar" ? "حفظ" : "Save")}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {language === "ar" ? "تعديل" : "Edit"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* بقية الصفحة (tabs) — لم أفعل عليها تغيير خارج ما طلبته */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="personal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              {language === "ar" ? "البيانات الشخصية" : "Personal Info"}
            </TabsTrigger>

            <TabsTrigger value="requests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              {language === "ar" ? "طلباتي" : "My Requests"}
            </TabsTrigger>

            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              {language === "ar" ? "الإعدادات" : "Settings"}
            </TabsTrigger>

            <TabsTrigger value="security" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              {language === "ar" ? "الأمان" : "Security"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            {/* عرض نفس البيانات الشخصية — مع نبذة (الصور عرضت فوق) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{language === "ar" ? "البيانات الشخصية" : "Personal Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* الحقول تبقى مثل الأصل (لم نغير منطقها) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم الكامل</label>
                    <Input value={profileData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
                    <Input value={profileData.email} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                    <Input value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البلد</label>
                    <Input value={profileData.country} onChange={(e) => handleInputChange("country", e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المدينة</label>
                    <Input value={profileData.city} onChange={(e) => handleInputChange("city", e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                    <Input value={profileData.address} onChange={(e) => handleInputChange("address", e.target.value)} disabled={!isEditing} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نبذة</label>
                  <Textarea value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} disabled={!isEditing} className="min-h-[100px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            {/* محتوى طلباتي — كما كان */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader><CardTitle className="text-gray-900 dark:text-white">طلباتي</CardTitle></CardHeader>
              <CardContent>
                {requestsLoading ? <p className="text-gray-500">جاري التحميل...</p> : (
                  userRequests.length === 0 ? <p className="text-gray-500">لا توجد طلبات بعد.</p> :
                  <div className="space-y-3">
                    {userRequests.map(r => (
                      <div key={r.id} className="p-4 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{r.title}</div>
                          <div className="text-sm text-gray-500">{r.status}</div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/requests/${r.id}`)}>عرض</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader><CardTitle className="text-gray-900 dark:text-white">الإعدادات</CardTitle></CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={async () => { await logout(); navigate("/"); }}>تسجيل الخروج</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            {/* الأمان — اتركتها كما كانت */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader><CardTitle className="text-gray-900 dark:text-white">الأمان</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">إعدادات الأمان والكلمات المرور</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
