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
  FileText, Factory, Settings, Shield, Bell, Eye, Lock, EyeOff, LogOut
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserRequests, ManufacturingRequest } from "@/services/requestService";

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
      console.log('🔄 تحميل طلبات المستخدم من الملف الشخصي:', currentUser.uid);
      const requests = await getUserRequests(currentUser.uid);
      setUserRequests(requests);
      console.log('✅ تم تحميل الطلبات بنجاح:', requests.length);
    } catch (error) {
      console.error('❌ خطأ في تحميل طلبات المستخدم:', error);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',  
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط':
        return 'bg-green-600';
      case 'قيد المراجعة':
        return 'bg-orange-600';
      case 'قيد التنفيذ':
        return 'bg-blue-600';
      case 'مكتمل':
        return 'bg-purple-600';
      case 'ملغي':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
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
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("خطأ في تغيير كلمة المرور. تأكد من كلمة المرور الحالية");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
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
                <Button 
                  size="icon" 
                  variant="outline"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' ? stat.labelAr : stat.labelEn}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}
            </TabsTrigger>
            <TabsTrigger 
              value="requests"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'طلباتي' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الأمان' : 'Security'}
            </TabsTrigger>
          </TabsList>

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
                      disabled={true}
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

                {(userProfile.accountType === 'manufacturer' || userProfile.accountType === 'both') && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {language === 'ar' ? 'بيانات المصنع' : 'Factory Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'ar' ? 'اسم المصنع' : 'Factory Name'}
                        </label>
                        <Input
                          value={profileData.factoryName}
                          onChange={(e) => handleInputChange('factoryName', e.target.value)}
                          disabled={!isEditing}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'نبذة شخصية' : 'Bio'}
                  </label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]"
                    placeholder={language === 'ar' ? 'اكتب نبذة عن نفسك...' : 'Write something about yourself...'}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {language === 'ar' ? 'طلباتي' : 'My Requests'} ({userRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
                  </div>
                ) : userRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {request.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>#{request.requestId.slice(-8)}</span>
                            <span>{request.category}</span>
                            <span>{formatDate(request.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {request.budget && (
                            <span className="text-sm font-medium text-green-600">
                              {request.budget} ر.س
                            </span>
                          )}
                          <Badge 
                            className={`${getStatusColor(request.status)} text-white`}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'تلقي إشعارات الطلبات والرسائل' : 'Receive notifications for requests and messages'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? 'الخصوصية' : 'Privacy'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'التحكم في من يمكنه رؤية ملفك الشخصي' : 'Control who can see your profile'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                            placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Confirm new password'}
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
                        <Button
                          onClick={handleChangePassword}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {loading ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowChangePassword(false)}
                          disabled={loading}
                        >
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

        <div className="mt-8 text-center">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
