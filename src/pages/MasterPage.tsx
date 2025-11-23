
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Factory, Users, FileText, Filter, Eye, Trash2, MessageSquare, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { collection, getDocs, query, where, deleteDoc, doc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { specializations } from '@/data/specializations';

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  accountType: string;
  specialization?: string;
  factoryName?: string;
  phone?: string;
  city?: string;
  country?: string;
  createdAt: Date;
}

interface Request {
  id: string;
  requestId: string;
  uid: string;
  title: string;
  description: string;
  status: string;
  category: string;
  budget: string;
  createdAt: Date;
}

const MasterPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageInitialized, setPageInitialized] = useState(false);
  const [factories, setFactories] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredFactories, setFilteredFactories] = useState<User[]>([]);
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [factoryFilter, setFactoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  // Check if current user is admin
  const isUserAdmin = () => {
    const adminEmail = currentUser?.email?.toLowerCase();
    return adminEmail === 'admin@gmail.com';
  };

  // Initialize page and check permissions
  useEffect(() => {
    console.log("MasterPage: Checking authentication...", {
      currentUser: currentUser?.email,
      isAdmin: isUserAdmin()
    });

    if (!currentUser) {
      console.log("MasterPage: No authenticated user, redirecting to login");
      navigate('/login');
      return;
    }

    if (!isUserAdmin()) {
      console.log("MasterPage: User is not admin, access denied");
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate('/');
      return;
    }

    console.log("MasterPage: Admin access confirmed, initializing...");
    setPageInitialized(true);
    loadAllData();
  }, [currentUser, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      console.log("Loading all data...");
      await Promise.all([loadFactories(), loadClients(), loadRequests()]);
      console.log("All data loaded successfully");
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const loadFactories = async () => {
    try {
      console.log("Loading factories...");
      const q = query(
        collection(db, 'users'),
        where('accountType', 'in', ['manufacturer', 'both'])
      );
      const querySnapshot = await getDocs(q);
      const factoriesData: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        factoriesData.push({
          id: doc.id,
          uid: data.uid,
          fullName: data.fullName || '',
          email: data.email || '',
          accountType: data.accountType || '',
          specialization: data.specialization || '',
          factoryName: data.factoryName || '',
          phone: data.phone || '',
          city: data.city || '',
          country: data.country || '',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log("Factories loaded:", factoriesData.length);
      setFactories(factoriesData);
      setFilteredFactories(factoriesData);
    } catch (error) {
      console.error('Error loading factories:', error);
    }
  };

  const loadClients = async () => {
    try {
      console.log("Loading clients...");
      const q = query(
        collection(db, 'users'),
        where('accountType', 'in', ['client', 'both', 'manufacturer'])
      );
      const querySnapshot = await getDocs(q);
      const clientsData: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clientsData.push({
          id: doc.id,
          uid: data.uid,
          fullName: data.fullName || '',
          email: data.email || '',
          accountType: data.accountType || '',
          specialization: data.specialization || '',
          factoryName: data.factoryName || '',
          phone: data.phone || '',
          city: data.city || '',
          country: data.country || '',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log("Clients loaded:", clientsData.length);
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadRequests = async () => {
    try {
      console.log("Loading manufacturing requests...");
      const q = query(
        collection(db, 'manufacturingRequests'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requestsData: Request[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          requestId: data.requestId || '',
          uid: data.uid || '',
          title: data.title || '',
          description: data.description || '',
          status: data.status || '',
          category: data.category || '',
          budget: data.budget || '',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log("Requests loaded:", requestsData.length);
      setRequests(requestsData);
      setFilteredRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleFactoryFilter = (specialization: string) => {
    console.log("Filtering factories by specialization:", specialization);
    setFactoryFilter(specialization);
    if (specialization === 'all') {
      setFilteredFactories(factories);
    } else {
      const filtered = factories.filter(factory => factory.specialization === specialization);
      console.log("Filtered factories:", filtered.length);
      setFilteredFactories(filtered);
    }
  };

  const handleClientFilter = (accountType: string) => {
    console.log("Filtering clients by account type:", accountType);
    setClientFilter(accountType);
    if (accountType === 'all') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => client.accountType === accountType);
      console.log("Filtered clients:", filtered.length);
      setFilteredClients(filtered);
    }
  };

  const handleRequestFilter = (status: string) => {
    console.log("Filtering requests by status:", status);
    setRequestFilter(status);
    if (status === 'all') {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request => request.status === status);
      console.log("Filtered requests:", filtered.length);
      setFilteredRequests(filtered);
    }
  };

  const handleSearch = (term: string) => {
    console.log("Searching with term:", term);
    setSearchTerm(term);
    if (term === '') {
      setFilteredFactories(factories);
      setFilteredClients(clients);
      setFilteredRequests(requests);
    } else {
      const searchTerm = term.toLowerCase();
      setFilteredFactories(factories.filter(factory => 
        factory.fullName.toLowerCase().includes(searchTerm) ||
        factory.email.toLowerCase().includes(searchTerm) ||
        factory.factoryName?.toLowerCase().includes(searchTerm)
      ));
      setFilteredClients(clients.filter(client => 
        client.fullName.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm)
      ));
      setFilteredRequests(requests.filter(request => 
        request.title.toLowerCase().includes(searchTerm) ||
        request.description.toLowerCase().includes(searchTerm)
      ));
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      console.log("Deleting user:", user.id);
      await deleteDoc(doc(db, 'users', user.id));
      toast.success(`تم حذف ${user.fullName} بنجاح`);
      loadAllData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("خطأ في حذف المستخدم");
    }
  };

  const handleSendWarning = async () => {
    if (!selectedUser || !warningMessage.trim()) {
      toast.error("يرجى كتابة رسالة التحذير");
      return;
    }

    try {
      console.log("Sending warning to:", selectedUser.uid);
      await addDoc(collection(db, 'messages'), {
        senderId: 'admin',
        receiverId: selectedUser.uid,
        content: `تحذير من الإدارة: ${warningMessage}`,
        timestamp: new Date(),
        type: 'warning',
        read: false
      });

      toast.success(`تم إرسال التحذير إلى ${selectedUser.fullName}`);
      setShowWarningDialog(false);
      setSelectedUser(null);
      setWarningMessage('');
    } catch (error) {
      console.error('Error sending warning:', error);
      toast.error("خطأ في إرسال التحذير");
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Admin logging out...");
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("خطأ في تسجيل الخروج");
    }
  };

  // Show loading screen if page is not initialized yet
  if (!pageInitialized || !currentUser || !isUserAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Master Page - لوحة التحكم الرئيسية
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            إدارة شاملة للموقع والمستخدمين والطلبات - مرحباً {userProfile?.fullName || 'Administrator'}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث في جميع البيانات..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Factory className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {factories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المصانع
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {clients.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي العملاء
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {requests.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الطلبات
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show loading indicator while data is loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <Tabs defaultValue="factories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="factories">المصانع</TabsTrigger>
              <TabsTrigger value="clients">العملاء</TabsTrigger>
              <TabsTrigger value="requests">الطلبات</TabsTrigger>
            </TabsList>

            {/* Factories Tab */}
            <TabsContent value="factories">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>إدارة المصانع</CardTitle>
                    <Select value={factoryFilter} onValueChange={handleFactoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="فلترة حسب التخصص" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التخصصات</SelectItem>
                        {specializations.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredFactories.map((factory) => (
                      <div key={factory.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {factory.fullName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {factory.email} | {factory.factoryName}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{factory.accountType}</Badge>
                            <Badge variant="secondary">
                              {specializations.find(s => s.id === factory.specialization)?.nameAr || factory.specialization}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(factory);
                              setShowWarningDialog(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(factory)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>إدارة العملاء</CardTitle>
                    <Select value={clientFilter} onValueChange={handleClientFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="فلترة حسب نوع الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="client">عميل</SelectItem>
                        <SelectItem value="manufacturer">مصنع</SelectItem>
                        <SelectItem value="both">عميل/مصنع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {client.fullName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {client.email} | {client.phone}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{client.accountType}</Badge>
                            <Badge variant="secondary">
                              {client.city}, {client.country}
                            </Badge>
                            {client.factoryName && (
                              <Badge variant="outline">
                                {client.factoryName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(client);
                              setShowWarningDialog(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(client)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>إدارة الطلبات</CardTitle>
                    <Select value={requestFilter} onValueChange={handleRequestFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="فلترة حسب الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                        <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                        <SelectItem value="مكتمل">مكتمل</SelectItem>
                        <SelectItem value="ملغي">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {request.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge 
                              className={
                                request.status === 'نشط' ? 'bg-green-100 text-green-800' :
                                request.status === 'قيد التنفيذ' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'مكتمل' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {request.status}
                            </Badge>
                            <Badge variant="outline">{request.category}</Badge>
                            <Badge variant="secondary">{request.budget}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Warning Dialog */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال تحذير إلى {selectedUser?.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="اكتب رسالة التحذير هنا..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSendWarning} className="flex-1">
                  إرسال التحذير
                </Button>
                <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Logout Button */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MasterPage;
