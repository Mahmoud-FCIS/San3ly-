import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRequests, getRequestsBySpecialization, getCompletedRequestsByManufacturer, getAllCurrentRequests, ManufacturingRequest, deleteRequest } from "@/services/requestService";
import { useToast } from "@/hooks/use-toast";
import RequestDetailsModal from "@/components/RequestDetailsModal";
import RequestsHeader from "@/components/requests/RequestsHeader";
import SearchAndFilter from "@/components/requests/SearchAndFilter";
import MyRequestsSection from "@/components/requests/MyRequestsSection";
import AvailableRequestsSection from "@/components/requests/AvailableRequestsSection";
import CompletedRequestsSection from "@/components/requests/CompletedRequestsSection";
import CurrentRequestsSection from "@/components/requests/CurrentRequestsSection";
import ErrorDisplay from "@/components/requests/ErrorDisplay";
import LoadingDisplay from "@/components/requests/LoadingDisplay";
import AddOfferModal from "@/components/AddOfferModal";
import ViewOffersModal from "@/components/ViewOffersModal";

const Requests = () => {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [myRequests, setMyRequests] = useState<ManufacturingRequest[]>([]);
  const [availableRequests, setAvailableRequests] = useState<ManufacturingRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<ManufacturingRequest[]>([]);
  const [currentRequests, setCurrentRequests] = useState<ManufacturingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ManufacturingRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null);
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false);
  const [isViewOffersModalOpen, setIsViewOffersModalOpen] = useState(false);
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<ManufacturingRequest | null>(null);

  // Check account types
  const isClient = userProfile?.accountType === 'client';
  const isManufacturer = userProfile?.accountType === 'manufacturer';
  const isBoth = userProfile?.accountType === 'both';
  const canCreateRequests = isClient || isBoth;

  const statuses = ["الكل", "نشط", "قيد المراجعة", "قيد التنفيذ", "مكتمل", "ملغي"];

  const loadRequests = async () => {
    if (!currentUser || !userProfile) {
      console.log("❌ لا يوجد مستخدم حالي أو ملف تعريف");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 تحميل الطلبات للمستخدم:", {
        uid: currentUser.uid,
        accountType: userProfile.accountType,
        specialization: userProfile.specialization
      });
      
      // Load user's own requests for clients and both account types
      if (isClient || isBoth) {
        console.log("📥 تحميل طلبات المستخدم الخاصة...");
        try {
          const userOwnRequests = await getUserRequests(currentUser.uid);
          console.log(`✅ تم تحميل ${userOwnRequests.length} طلب خاص بالمستخدم`);
          setMyRequests(userOwnRequests);
          
          // تحميل جميع الطلبات الحالية للعميل
          const clientCurrentRequests = await getAllCurrentRequests(currentUser.uid, 'client');
          setCurrentRequests(clientCurrentRequests);
        } catch (userRequestsError) {
          console.error("❌ خطأ في تحميل طلبات المستخدم:", userRequestsError);
          const userErrorMessage = userRequestsError instanceof Error ? userRequestsError.message : "خطأ في تحميل طلباتك الخاصة";
          toast({
            title: "تحذير",
            description: `خطأ في تحميل طلباتك الخاصة: ${userErrorMessage}`,
            variant: "destructive"
          });
          setMyRequests([]);
          setCurrentRequests([]);
        }
      }
      
      // Load available requests for manufacturers and both account types
      if (isManufacturer || isBoth) {
        if (userProfile.specialization && userProfile.specialization.trim() !== '') {
          console.log(`🏭 تحميل الطلبات المتاحة للنشاط: "${userProfile.specialization}"`);
          try {
            const specializationRequests = await getRequestsBySpecialization(userProfile.specialization);
            console.log(`📊 تم استرجاع ${specializationRequests.length} طلب من قاعدة البيانات`);
            
            // Filter out own requests for 'both' account type
            const filteredRequests = isBoth 
              ? specializationRequests.filter(req => {
                  const isNotOwn = req.userId !== currentUser.uid;
                  if (!isNotOwn) {
                    console.log(`🚫 تم تصفية الطلب الخاص بالمستخدم: ${req.requestId}`);
                  }
                  return isNotOwn;
                })
              : specializationRequests;
            
            console.log(`✅ تم تحميل ${filteredRequests.length} طلب متاح بعد التصفية`);
            setAvailableRequests(filteredRequests);
            
            // Load completed requests for manufacturers
            try {
              const manufacturerCompletedRequests = await getCompletedRequestsByManufacturer(currentUser.uid);
              console.log(`✅ تم تحميل ${manufacturerCompletedRequests.length} طلب مكتمل للمصنع`);
              setCompletedRequests(manufacturerCompletedRequests);
            } catch (completedError) {
              console.error("❌ خطأ في تحميل الطلبات المكتملة:", completedError);
              setCompletedRequests([]);
            }
            
            // تحميل جميع الطلبات الحالية للمصنع (إذا لم يكن عميل وأصنع)
            if (!isBoth) {
              try {
                const manufacturerCurrentRequests = await getAllCurrentRequests(currentUser.uid, 'manufacturer');
                setCurrentRequests(manufacturerCurrentRequests);
              } catch (currentError) {
                console.error("❌ خطأ في تحميل الطلبات الحالية للمصنع:", currentError);
                setCurrentRequests([]);
              }
            }
            
            // عرض رسالة نجاح
            if (filteredRequests.length > 0) {
              toast({
                title: "تم تحميل الطلبات",
                description: `تم العثور على ${filteredRequests.length} طلب متاح في نشاط "${userProfile.specialization}"`,
                variant: "default"
              });
            }
          } catch (specializationError) {
            console.error("❌ خطأ في تحميل طلبات النشاط:", specializationError);
            const specializationErrorMessage = specializationError instanceof Error 
              ? specializationError.message 
              : "خطأ غير معروف في تحميل الطلبات المتاحة";
            
            setError(specializationErrorMessage);
            setAvailableRequests([]);
            
            toast({
              title: "خطأ في تحميل الطلبات المتاحة",
              description: specializationErrorMessage,
              variant: "destructive"
            });
          }
        } else {
          console.warn("⚠️ لم يتم تحديد تخصص للمصنع");
          const noSpecializationError = "لم يتم تحديد تخصص للمصنع. يرجى تحديث بيانات الحساب وتحديد النشاط المناسب";
          setError(noSpecializationError);
          toast({
            title: "تحديث البيانات مطلوب",
            description: noSpecializationError,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("❌ خطأ عام في تحميل الطلبات:", error);
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف في تحميل الطلبات";
      setError(errorMessage);
      toast({
        title: "خطأ في تحميل الطلبات",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log("✅ انتهى تحميل الطلبات");
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser, userProfile]);

  // Refresh requests when returning from new request page
  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 تحديث الطلبات بسبب تغيير الحالة");
      loadRequests();
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleRefresh = () => {
    console.log("🔄 تحديث يدوي للطلبات");
    loadRequests();
  };

  const handleDeleteRequest = async (request: ManufacturingRequest) => {
    // Check if request can be deleted
    if (request.status !== 'نشط') {
      toast({
        title: "لا يمكن الحذف",
        description: "لا يمكن حذف الطلبات التي قيد التنفيذ أو المكتملة",
        variant: "destructive"
      });
      return;
    }

    setDeletingRequest(request.id || '');
    try {
      await deleteRequest(request.requestId);
      toast({
        title: "تم الحذف",
        description: "تم حذف الطلب بنجاح",
      });
      loadRequests(); // Refresh the list
    } catch (error) {
      console.error('Error deleting request:', error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء حذف الطلب";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeletingRequest(null);
    }
  };

  const handleViewRequest = (request: ManufacturingRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleAddOffer = (request: ManufacturingRequest) => {
    setSelectedRequestForOffer(request);
    setIsAddOfferModalOpen(true);
  };

  const handleViewOffers = (request: ManufacturingRequest) => {
    setSelectedRequest(request);
    setIsViewOffersModalOpen(true);
  };

  const filterRequests = (requests: ManufacturingRequest[]) => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "الكل" || request.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return <LoadingDisplay />;
  }

  if (error && !isClient && !isBoth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RequestsHeader 
          userProfile={userProfile}
          canCreateRequests={canCreateRequests}
          onRefresh={handleRefresh}
        />
        <ErrorDisplay 
          error={error}
          canCreateRequests={canCreateRequests}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RequestsHeader 
        userProfile={userProfile}
        canCreateRequests={canCreateRequests}
        onRefresh={handleRefresh}
      />

      <SearchAndFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statuses={statuses}
      />

      <div className="px-4 pb-20 space-y-6">
        {/* Current Requests Section - for all users */}
        <CurrentRequestsSection
          requests={currentRequests}
          filteredRequests={filterRequests(currentRequests)}
          onViewRequest={handleViewRequest}
          title={isClient || isBoth ? "طلباتي الحالية" : "الطلبات الحالية التي أعمل عليها"}
        />

        {/* My Requests Section - for clients and both account types */}
        {(isClient || isBoth) && (
          <MyRequestsSection
            requests={myRequests}
            filteredRequests={filterRequests(myRequests)}
            onViewRequest={handleViewRequest}
            onDeleteRequest={handleDeleteRequest}
            onViewOffers={handleViewOffers}
            deletingRequest={deletingRequest}
          />
        )}

        {/* Available Requests Section - for manufacturers and both account types */}
        {(isManufacturer || isBoth) && (
          <AvailableRequestsSection
            requests={availableRequests}
            filteredRequests={filterRequests(availableRequests)}
            onViewRequest={handleViewRequest}
            onAddOffer={handleAddOffer}
            onRefresh={handleRefresh}
          />
        )}

        {/* Completed Requests Section */}
        {isClient && (
          <CompletedRequestsSection
            requests={myRequests}
            filteredRequests={filterRequests(myRequests)}
            onViewRequest={handleViewRequest}
            title="طلباتي المكتملة"
          />
        )}

        {(isManufacturer || isBoth) && (
          <CompletedRequestsSection
            requests={completedRequests}
            filteredRequests={filterRequests(completedRequests)}
            onViewRequest={handleViewRequest}
            title="الطلبات المكتملة التي قمت بتنفيذها"
          />
        )}
      </div>

      {/* Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        onRequestUpdate={loadRequests}
      />

      {/* Add Offer Modal */}
      <AddOfferModal
        request={selectedRequestForOffer}
        isOpen={isAddOfferModalOpen}
        onClose={() => {
          setIsAddOfferModalOpen(false);
          setSelectedRequestForOffer(null);
        }}
        onOfferCreated={loadRequests}
      />

      {/* View Offers Modal */}
      <ViewOffersModal
        request={selectedRequest}
        isOpen={isViewOffersModalOpen}
        onClose={() => {
          setIsViewOffersModalOpen(false);
          setSelectedRequest(null);
        }}
        onRequestUpdate={loadRequests}
      />
    </div>
  );
};

export default Requests;
