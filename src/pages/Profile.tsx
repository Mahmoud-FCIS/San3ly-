// Profile.tsx (modified to add avatar upload popup with base64 <= ~900KB, saved to Firestore)
// Note: Keeps the existing page layout/shape intact.

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

// 🔹 Firebase (نفس استخدامك المعتاد)
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ================= Helpers: convert to JPEG Base64 (<= ~900KB) ================= */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // ~900KB
const MIN_W = 200;
const MIN_H = 200;
const TARGET_LONG_EDGE = 1200;

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
    throw new Error("فقط صور JPEG/PNG/WEBP مسموحة.");
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

  const qualities = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.28, 0.22];
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, q);
    const dataUrl = await blobToDataURL(blob);
    const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }
  }

  // آخر محاولة: تقليل الأبعاد أكثر لو الجودة وحدها لم تكفِ
  let longEdge = Math.max(w, h);
  while (longEdge > 400) {
    longEdge = Math.floor(longEdge * 0.8);
    const scale2 = longEdge / Math.max(w, h);
    const w2 = Math.max(1, Math.round(w * scale2));
    const h2 = Math.max(1, Math.round(h * scale2));
    const canvas2 = document.createElement("canvas");
    canvas2.width = w2; canvas2.height = h2;
    const ctx2 = canvas2.getContext("2d")!;
    ctx2.drawImage(bmp, 0, 0, w2, h2);
    for (const q of qualities) {
      const blob = await canvasToBlob(canvas2, q);
      const dataUrl = await blobToDataURL(blob);
      const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4);
      if (approxBytes <= SAFE_MAX_BYTES) {
        const previewUrl = URL.createObjectURL(blob);
        return { dataUrl, previewUrl };
      }
    }
  }
  throw new Error("تعذّر ضغط الصورة إلى ≤ 900KB. جرّب صورة أصغر.");
}
/* ============================================================================ */

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

  // 🔸 حالة الـ Dialog الخاص بصورة البروفايل
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
    }
  }, [userProfile]);

  useEffect(() => {
    if (currentUser) {
      loadUserRequests();
    }
  }, [currentUser]);

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
    {
      icon: FileText,
      value: userRequests.filter(req => req.status === 'مكتمل').length.toString(),
      labelAr: "طلب مكتمل",
      labelEn: "Completed Requests"
    },
    {
      icon: Factory,
      value: userRequests.filter(req => req.status === 'قيد التنفيذ').length.toString(),
      labelAr: "قيد التنفيذ",
      labelEn: "In Progress"
    },
    {
      icon: Star,
      value: "4.8",
      labelAr: "تقييم العملاء",
      labelEn: "Client Rating"
    }
  ];

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

  /* ================= Avatar Dialog Handlers ================= */
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
      const msg = err?.message || "ملف غير صالح";
      setAvatarError(msg);
      toast.error(msg);
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
      const approxBytes = Math.ceil((avatarDataUrl.length - avatarDataUrl.indexOf(",") - 1) * 3 / 4);
      if (approxBytes > SAFE_MAX_BYTES) {
        throw new Error("حجم الصورة أكبر من الحد الآمن (~900KB)");
      }

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
  /* ========================================================== */

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
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar} alt={profileData.fullName} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-2xl">
                    {profileData.fullName[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* ✓ زر القلم بقي كما هو في مكانه — لكن أصبح يفتح Dialog */}
                <Dialog open={avatarDialogOpen} onOpenChange={(v) => {
                  setAvatarDialogOpen(v);
                  if (!v && avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(""); setAvatarDataUrl(""); setAvatarError(""); }
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
                        <ImageIcon className="w-5 h-5" />
                        تغيير صورة البروفايل
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

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileData.fullName}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profileData.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profileData.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profileData.location}
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
                  {userProfile.accountType && (
                    <Badge variant="outline" className="border-purple-200 text-purple-800 dark:border-purple-700 dark:text-purple-200">
                      {userProfile.accountType === 'client' ? 'عميل' : userProfile.accountType === 'manufacturer' ? 'مصنع' : 'عميل/مصنع'}
                    </Badge>
                  )}
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
                    {loading ? 'جاري الحفظ...' : (language === 'ar' ? 'حفظ' : 'Save')}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* الإحصائيات كما هي */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: FileText, value: userRequests.filter(r => r.status === 'مكتمل').length, label: language === 'ar' ? 'طلب مكتمل' : 'Completed Requests' },
            { icon: Factory, value: userRequests.filter(r => r.status === 'قيد التنفيذ').length, label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
            { icon: Star, value: "4.8", label: language === 'ar' ? 'تقييم العملاء' : 'Client Rating' },
          ].map((s, i) => {
            const Icon = s.icon as any;
            return (
              <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {s.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* التبويبات كما هي */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="personal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'طلباتي' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الأمان' : 'Security'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <Input
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <Input
                      value={profileData.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'البلد' : 'Country'}
                    </label>
                    <Input
                      value={profileData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'المدينة' : 'City'}
                    </label>
                    <Input
                      value={profileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </label>
                    <Input
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'نبذة' : 'Bio'}
                  </label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]"
                  />
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
                    {userRequests.map((req) => (
                      <div key={req.id} className="p-4 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{req.title}</div>
                          <div className="text-sm text-gray-500">{req.status}</div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/requests/${req.id}`)}>عرض</Button>
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
                <CardTitle className="text-gray-900 dark:text-white">الإعدادات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* أبقيت على نفس الشكل والمحتوى */}
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الحالية</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(v => !v)}
                      className="absolute left-3 top-2.5 text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="absolute left-3 top-2.5 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تأكيد كلمة المرور الجديدة</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmNewPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute left-3 top-2.5 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleChangePassword}>تغيير كلمة المرور</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
