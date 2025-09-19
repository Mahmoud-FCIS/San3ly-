// Profile.tsx (modified)
// - popup on edit icon to pick avatar
// - convert image -> JPEG base64 compressed <= ~900KB
// - save avatar in Firestore users/{uid} and update UI
// - display idFrontBase64 & idBackBase64 under "نبذة" at the end of Personal tab
//
// Assumptions:
// - You have firebase initialized and exported `db` from "@/lib/firebase"
// - Auth context `useAuth()` provides currentUser and userProfile (and updateProfile, changePassword, logout)
// - UI components used (Card, Button, Tabs, Dialog, Avatar...) exist in your project

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  FileText, Factory, Settings, Shield, Eye, EyeOff, LogOut, Image as ImageIcon, Upload, X
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserRequests, ManufacturingRequest } from "@/services/requestService";

/* ======= Image helpers (resize + compress -> JPEG base64 <= ~900KB) ======= */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SAFE_MAX_BYTES = 900 * 1024; // ~900KB
const MIN_W = 200;
const MIN_H = 200;
const TARGET_LONG_EDGE = 1200; // starting resize target

async function fileToBitmap(file: File) {
  // createImageBitmap is widely supported; fallback could be implemented if needed
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

/** Try multiple quality levels until result <= SAFE_MAX_BYTES */
async function fileToSafeBase64(file: File): Promise<{ dataUrl: string; previewUrl: string }> {
  if (!ALLOWED_TYPES.includes(file.type as any)) {
    throw new Error("Only JPEG / PNG / WEBP images are allowed.");
  }
  const bmp = await fileToBitmap(file);
  if (bmp.width < MIN_W || bmp.height < MIN_H) {
    throw new Error(`Image too small (${bmp.width}×${bmp.height}). Minimum ${MIN_W}×${MIN_H}px.`);
  }

  // scale so longest edge = TARGET_LONG_EDGE (if image larger)
  const isLandscape = bmp.width >= bmp.height;
  const scale = Math.min(1, TARGET_LONG_EDGE / (isLandscape ? bmp.width : bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);

  // try decreasing quality levels
  const qualities = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.28, 0.22];
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, q);
    const dataUrl = await blobToDataURL(blob);
    // estimate bytes from base64 length
    const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4);
    if (approxBytes <= SAFE_MAX_BYTES) {
      const previewUrl = URL.createObjectURL(blob);
      return { dataUrl, previewUrl };
    }
  }

  // final attempt: reduce dimensions progressively if quality can't reach threshold
  let longEdge = Math.max(w, h);
  while (longEdge > 400) {
    longEdge = Math.floor(longEdge * 0.8);
    const scale2 = longEdge / Math.max(w, h);
    const w2 = Math.max(1, Math.round(w * scale2));
    const h2 = Math.max(1, Math.round(h * scale2));
    const canvas2 = document.createElement("canvas");
    canvas2.width = w2;
    canvas2.height = h2;
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

  throw new Error("Unable to compress image to safe size (~900KB). Try a smaller image.");
}
/* ====================================================================== */

const Profile = () => {
  const { t, language } = useLanguage();
  const { userProfile, updateProfile, changePassword, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRequests, setUserRequests] = useState<ManufacturingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

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

  // ID images fetched from Firestore (may be stored in userProfile or fetched)
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);

  // Avatar dialog state
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
        location: `${userProfile.city || ''}${userProfile.country ? ', ' + userProfile.country : ''}`,
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '/placeholder.svg',
        country: userProfile.country || '',
        city: userProfile.city || '',
        address: userProfile.address || '',
        factoryName: userProfile.factoryName || ''
      });

      // read ID images from context if present
      if (userProfile.idFrontBase64) setIdFront(userProfile.idFrontBase64);
      if (userProfile.idBackBase64) setIdBack(userProfile.idBackBase64);
    }
  }, [userProfile]);

  useEffect(() => {
    if (currentUser) {
      loadUserRequests();
      // if id images not present in userProfile, fetch from Firestore doc
      if (!userProfile?.idFrontBase64 || !userProfile?.idBackBase64) {
        (async () => {
          try {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            const data = snap.data();
            if (data) {
              if (data.idFrontBase64) setIdFront(data.idFrontBase64);
              if (data.idBackBase64) setIdBack(data.idBackBase64);
            }
          } catch (e) {
            console.warn("Failed to fetch user's ID images:", e);
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUserRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    try {
      const requests = await getUserRequests(currentUser.uid);
      setUserRequests(requests);
    } catch (error) {
      toast.error("خطأ في تحميل الطلبات");
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
    } catch (error) {
      console.error(error);
      toast.error("خطأ في حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Avatar pick & save handlers ===== */
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
      if (e.target) e.target.value = "";
    }
  };

  const onSaveAvatar = async () => {
    if (!currentUser) return;
    if (!avatarDataUrl) {
      toast.error("يرجى اختيار صورة أولاً");
      return;
    }
    try {
      // size check
      const size = Math.ceil((avatarDataUrl.length - avatarDataUrl.indexOf(",") - 1) * 3 / 4);
      if (size > SAFE_MAX_BYTES) {
        throw new Error("حجم الصورة أكبر من الحد الآمن (~900KB)");
      }

      // save to Firestore users/{uid}
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          avatar: avatarDataUrl,
          avatarUpdatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // update UI
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("تم تسجيل الخروج");
    } catch (error) {
      console.error(error);
      toast.error("خطأ في تسجيل الخروج");
    }
  };

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
                    {profileData.fullName[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <Dialog open={avatarDialogOpen} onOpenChange={(v) => {
                  setAvatarDialogOpen(v);
                  if (!v && avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(""); setAvatarDataUrl(""); setAvatarError(""); }
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
                  {profileData.bio || (language === "ar" ? "لا توجد نبذة شخصية" : "No bio available")}
                </p>

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
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
                variant={isEditing ? "default" : "outline"}
                disabled={loading}
              >
                {isEditing ? <><Save className="w-4 h-4 mr-2" /> {loading ? "جاري الحفظ..." : (language === "ar" ? "حفظ" : "Save")}</> :
                  <><Edit2 className="w-4 h-4 mr-2" />{language === "ar" ? "تعديل" : "Edit"}</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userRequests.filter(r => r.status === "مكتمل").length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{language === "ar" ? "طلبات مكتملة" : "Completed"}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userRequests.filter(r => r.status === "قيد التنفيذ").length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{language === "ar" ? "قيد التنفيذ" : "In Progress"}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">4.8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{language === "ar" ? "تقييم العملاء" : "Rating"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: keep layout but inject ID images under Personal tab at the end of bio */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="personal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" /> {language === "ar" ? "البيانات الشخصية" : "Personal Info"}
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> {language === "ar" ? "طلباتي" : "My Requests"}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" /> {language === "ar" ? "الإعدادات" : "Settings"}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" /> {language === "ar" ? "الأمان" : "Security"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{language === "ar" ? "البيانات الشخصية" : "Personal Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                    <Input value={profileData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                    <Input value={profileData.email} disabled className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                    <Input value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "البلد" : "Country"}</label>
                    <Input value={profileData.country} onChange={(e) => handleInputChange("country", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "المدينة" : "City"}</label>
                    <Input value={profileData.city} onChange={(e) => handleInputChange("city", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "العنوان" : "Address"}</label>
                    <Input value={profileData.address} onChange={(e) => handleInputChange("address", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                  </div>
                </div>

                {(userProfile.accountType === "manufacturer" || userProfile.accountType === "both") && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{language === "ar" ? "بيانات المصنع" : "Factory Information"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "اسم المصنع" : "Factory Name"}</label>
                        <Input value={profileData.factoryName} onChange={(e) => handleInputChange("factoryName", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === "ar" ? "نبذة شخصية" : "Bio"}</label>
                  <Textarea value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} disabled={!isEditing} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]" placeholder={language === "ar" ? "اكتب نبذة عن نفسك..." : "Write something about yourself..."} />
                </div>

                {/* ===== Display stored ID images here (under Bio at the end of Personal) ===== */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="font-semibold mb-2">{language === "ar" ? "صور البطاقة المحفوظة" : "Saved ID Images"}</h4>
                  {(idFront || idBack) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium mb-2">{language === "ar" ? "الوجه" : "Front"}</div>
                        {idFront ? (
                          // idFront expected to be dataURL (base64)
                          <img src={idFront} alt="ID Front" className="w-full object-contain max-h-72 rounded-md" />
                        ) : (
                          <p className="text-sm text-gray-500">لا توجد صورة</p>
                        )}
                      </div>

                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium mb-2">{language === "ar" ? "الظهر" : "Back"}</div>
                        {idBack ? (
                          <img src={idBack} alt="ID Back" className="w-full object-contain max-h-72 rounded-md" />
                        ) : (
                          <p className="text-sm text-gray-500">لا توجد صورة</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">{language === "ar" ? "لم تقم بتحميل صور البطاقة بعد." : "You haven't uploaded ID images yet."}</p>
                  )}
                </div>
                {/* ===== end ID images display ===== */}

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{language === "ar" ? "طلباتي" : "My Requests"} ({userRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? <p className="text-gray-500">جاري التحميل...</p> :
                  userRequests.length === 0 ? <p className="text-gray-500">لا توجد طلبات بعد.</p> :
                    <div className="space-y-3">{userRequests.map(r => (
                      <div key={r.id} className="p-4 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{r.title}</div>
                          <div className="text-sm text-gray-500">{r.status}</div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/requests/${r.id}`)}>{language === "ar" ? "عرض" : "View"}</Button>
                      </div>
                    ))}</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{language === "ar" ? "الإعدادات" : "Settings"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />{language === "ar" ? "تسجيل الخروج" : "Log out"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{language === "ar" ? "الأمان" : "Security"}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Keep any security form you had (password change etc.) */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
