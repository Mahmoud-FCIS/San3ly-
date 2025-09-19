import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  User, Mail, Phone, MapPin, Edit2, Save, Star,
  FileText, Factory, Settings, Shield, Bell, Eye, Lock, EyeOff, LogOut, Image as ImageIcon, Upload, X
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserRequests, ManufacturingRequest } from "@/services/requestService";

/* ===== لو مشروعك لا يحتوي هذه الاستيرادات سابقاً (خاص بصورة البروفايل) فاحذف هذا القسم ===== */
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
/* ===================================================================== */

/* ==== Helpers: تحويل الصورة إلى JPEG Base64 (≤ ~900KB) ==== */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // ~900KB
const MIN_W = 300;
const MIN_H = 300;
const TARGET_LONG_EDGE = 800;

async function fileToBitmap(file: File) {
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
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}
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

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.28, 0.22];
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, q);
    const dataUrl = await blobToDataURL(blob);
    const approxBytes = Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }
  }
  throw new Error("تعذّر تقليل حجم الصورة إلى الحدّ الآمن. جرّب صورة أوضح أو أصغر.");
}
/* ============================================== */

const Profile = () => {
  const { t, language } = useLanguage();
  const { userProfile, updateProfile, changePassword, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userRequests, setUserRequests] = useState<ManufacturingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: '/placeholder.svg',
    country: '',
    city: '',
    address: '',
    factoryName: ''
  });

  // === (اختياري) لعرض صور البطاقة في "ملفاتي" لو كانت موجودة مسبقاً ===
  const [idFront, setIdFront] = useState<string>("");
  const [idBack, setIdBack] = useState<string>("");

  // Dialog لرفع صورة البروفايل
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string>("");

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        location: `${userProfile.city || ''}, ${userProfile.country || ''}`,
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '/placeholder.svg',
        country: userProfile.country || '',
        city: userProfile.city || '',
        address: userProfile.address || '',
        factoryName: userProfile.factoryName || ''
      });

      if ((userProfile as any).idFrontBase64) setIdFront((userProfile as any).idFrontBase64);
      if ((userProfile as any).idBackBase64) setIdBack((userProfile as any).idBackBase64);
    }
  }, [userProfile]);

  useEffect(() => {
    if (currentUser) {
      loadUserRequests();
      // جلب صور البطاقة من Firestore إذا غير موجودة في الـcontext
      if (!idFront || !idBack) {
        fetchIdImages(currentUser.uid).catch(() => {});
      }
    }
  }, [currentUser]);

  const fetchIdImages = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.data();
      if (data?.idFrontBase64) setIdFront(data.idFrontBase64);
      if (data?.idBackBase64) setIdBack(data.idBackBase64);
    } catch (_e) {}
  };

  const loadUserRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    try {
      const requests = await getUserRequests(currentUser.uid);
      setUserRequests(requests);
    } catch (error) {
      console.error('❌ خطأ في تحميل الطلبات:', error);
      toast.error("خطأ في تحميل الطلبات");
    } finally {
      setRequestsLoading(false);
    }
  };

  const stats = [
    { icon: FileText, value: userRequests.filter(req => req.status === 'مكتمل').length.toString(), labelAr: "طلب مكتمل", labelEn: "Completed Requests" },
    { icon: Factory, value: userRequests.filter(req => req.status === 'قيد التنفيذ').length.toString(), labelAr: "قيد التنفيذ", labelEn: "In Progress" },
    { icon: Star, value: "4.8", labelAr: "تقييم العملاء", labelEn: "Client Rating" }
  ];

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-600';
      case 'قيد المراجعة': return 'bg-orange-600';
      case 'قيد التنفيذ': return 'bg-blue-600';
      case 'مكتمل': return 'bg-purple-600';
      case 'ملغي': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
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
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("خطأ في حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("كلمات المرور الجديدة غير متطابقة");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("تم تغيير كلمة المرور بنجاح");
      setShowChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("خطأ في تغيير كلمة المرور. تأكد من كلمة المرور الحالية");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("خطأ في تسجيل الخروج");
    }
  };

  /* ====== Avatar Dialog Handlers ====== */
  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAvatarError("");
      const f = e.target.files?.[0];
      if (!f) return;
      const { dataUrl, previewUrl } = await fileToSafeBase64(f);
      setAvatarDataUrl(dataUrl);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(previewUrl);
    } catch (err: any) {
      console.error(err);
      setAvatarError(err?.message || "ملف غير صالح");
      toast.error(err?.message || "ملف غير صالح");
    } finally {
      e.target.value = "";
    }
  };

  const onSaveAvatar = async () => {
    if (!currentUser) return;
    if (!avatarDataUrl) {
      toast.error("يرجى اختيار صورة أولاً");
      return;
    }
    try {
      const max = SAFE_MAX_BYTES;
      const size = Math.ceil((avatarDataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
      if (size > max) throw new Error("حجم صورة البروفايل أكبر من الحد الآمن (900KB)");

      await setDoc(
        doc(db, "users", currentUser.uid),
        { avatar: avatarDataUrl, avatarUpdatedAt: serverTimestamp() },
        { merge: true }
      );

      setProfileData(prev => ({ ...prev, avatar: avatarDataUrl }));
      toast.success("تم تحديث صورة البروفايل");
      setAvatarDialogOpen(false);
      if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(""); }
      setAvatarDataUrl("");
    } catch (error: any) {
      console.error("Failed to save avatar:", error);
      toast.error(error?.message || "تعذر حفظ الصورة");
    }
  };
  /* ===================================== */

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8 text-right">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar + edit icon */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar} alt={profileData.fullName} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-2xl">
                    {profileData.fullName[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* فتح نافذة اختيار صورة */}
                <Dialog open={avatarDialogOpen} onOpenChange={(v) => {
                  setAvatarDialogOpen(v);
                  if (!v) {
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(""); setAvatarDataUrl(""); setAvatarError("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2"
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
                        <Input type="file" accept="image/*" onChange={onPickAvatar} />
                        <p className="text-xs text-gray-500 mt-2">JPEG Base64 — حد آمن ≤ 900KB</p>
                      </div>

                      {avatarError && <p className="text-sm text-red-600">{avatarError}</p>}

                      {avatarPreview && (
                        <div className="relative">
                          <img src={avatarPreview} alt="avatar-preview" className="w-full max-h-60 object-cover rounded-md" />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={() => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(""); setAvatarDataUrl(""); }}>
                              <X className="w-4 h-4 mr-1" /> حذف
                            </Button>
                            <Button onClick={onSaveAvatar} disabled={!avatarDataUrl}>
                              <Upload className="w-4 h-4 mr-1" /> حفظ
                            </Button>
                          </div>
                        </div>
                      )}

                      {!avatarPreview && (
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>إلغاء</Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* بيانات المستخدم المختصرة */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileData.fullName}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {profileData.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {profileData.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {profileData.location}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {profileData.bio || (language === 'ar' ? 'لا توجد نبذة شخصية' : 'No bio available')}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    {language === 'ar' ? 'عضو فعال' : 'Active Member'}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-700 dark:text-blue-200">
                    {language === 'ar' ? 'موثق' : 'Verified'}
                  </Badge>
                  {userProfile?.accountType && (
                    <Badge variant="outline" className="border-purple-200 text-purple-800 dark:border-purple-700 dark:text-purple-200">
                      {userProfile.accountType === 'client' ? 'عميل' : userProfile.accountType === 'manufacturer' ? 'مصنع' : 'عميل/مصنع'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* === أزرار التحكم (تعديل/حفظ + تسجيل الخروج) — تم نقل الخروج هنا === */}
              <div className="flex flex-col items-stretch gap-2 w-full md:w-auto">
                <Button
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
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

                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {language === "ar" ? "تسجيل الخروج" : "Logout"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات بسيطة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((s, idx) => (
            <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{language === 'ar' ? s.labelAr : s.labelEn}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="personal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" /> {language === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> {language === 'ar' ? 'طلباتي' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" /> {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" /> {language === 'ar' ? 'الأمان' : 'Security'}
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {language === 'ar' ? 'البيانات الشخصية' : 'Personal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                    <Input value={profileData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <Input value={profileData.email} disabled className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <Input value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'البلد' : 'Country'}</label>
                    <Input value={profileData.country} onChange={(e) => handleInputChange('country', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'المدينة' : 'City'}</label>
                    <Input value={profileData.city} onChange={(e) => handleInputChange('city', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'العنوان' : 'Address'}</label>
                    <Input value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'نبذة' : 'Bio'}</label>
                  <Textarea value={profileData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">طلباتي</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <p className="text-gray-500">جاري التحميل...</p>
                ) : userRequests.length === 0 ? (
                  <p className="text-gray-500">لا توجد طلبات بعد.</p>
                ) : (
                  <div className="space-y-3">
                    {userRequests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{request.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-3">
                            <span>{request.category}</span>
                            <span>{formatDate(request.createdAt as any)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{request.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {request.budget && <span className="text-sm font-medium text-green-600">{request.budget}</span>}
                          <Badge className={`${getStatusColor(request.status)} text-white`}>{request.status}</Badge>
                          <Button variant="outline" onClick={() => navigate(`/requests/${request.id}`)}>عرض</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{language === 'ar' ? 'تلقي إشعارات الطلبات والرسائل' : 'Receive notifications for requests and messages'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">{language === 'ar' ? 'تعديل' : 'Edit'}</Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{language === 'ar' ? 'التحكم في من يمكنه رؤية ملفك الشخصي' : 'Control who can see your profile'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">{language === 'ar' ? 'تعديل' : 'Edit'}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {language === 'ar' ? 'الأمان وكلمة المرور' : 'Security & Password'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                      {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                        </label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="pr-10 pl-10"
                            placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                        </label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="pr-10 pl-10"
                            placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                        </label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmNewPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                            className="pr-10 pl-10"
                            placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleChangePassword} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                          {loading ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                        </Button>
                        <Button variant="outline" onClick={() => setShowChangePassword(false)} disabled={loading}>
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {language === 'ar' ? 'آخر تسجيل دخول' : 'Last Login'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' ? 'اليوم في 10:30 صباحاً' : 'Today at 10:30 AM'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ⛔ تمت إزالة زر تسجيل الخروج من أسفل الصفحة بعد التابات ⛔ */}
      </div>
    </div>
  );
};

export default Profile;
