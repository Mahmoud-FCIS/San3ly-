import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRequestsBySpecialization,
  getCompletedRequestsByManufacturer,
  getAllCurrentRequests,
  ManufacturingRequest,
  deleteRequest
} from "@/services/requestService";
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

// 🔴 جديد: جلب لحظي من فايرستور لطلبات المستخدم
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  // account type
  const isClient = userProfile?.accountType === "client";
  const isManufacturer = userProfile?.accountType === "manufacturer";
  const isBoth = userProfile?.accountType === "both";
  const canCreateRequests = isClient || isBoth;

  const statuses = ["الكل", "نشط", "قيد المراجعة", "قيد التنفيذ", "مكتمل", "ملغي"];

  // ⏱️ اشترك لحظيًا في طلبات المستخدم (userId) — تظهر فور الإرسال
  useEffect(() => {
    if (!currentUser) return;
    // نعرض "طلباتي" فقط للعملاء أو الحسابين
    if (!(isClient || isBoth)) return;

    const col = collection(db, "manufacturingRequests");
    const q = query(col, where("userId", "==", currentUser.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ManufacturingRequest[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            requestId: data.requestId || d.id,
            title: data.title || "",
            description: data.description || "",
            status: data.status || "نشط",
            ...data,
          } as ManufacturingRequest;
        });

        // حدّث "طلباتي"
        setMyRequests(docs);

        // استخرج الطلبات الحالية (غير مكتملة/غير ملغاة)
        const activeStatuses = new Set(["نشط", "قيد المراجعة", "قيد التنفيذ"]);
        setCurrentRequests(docs.filter((r) => activeStatuses.has(r.status)));
      },
      (err) => {
        console.error("onSnapshot error (myRequests):", err);
      }
    );

    return () => unsub();
  }, [currentUser, isClient, isBoth]);

  // 🌐 تحميل الأقسام الأخرى (متاحة/مكتملة/جارية للمصنّع)
  const loadRequests = async () => {
    if (!currentUser || !userProfile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // للـ manufacturer أو both — جلب الطلبات وفق التخصص
      if (isManufacturer || isBoth) {
        if (userProfile.specialization && userProfile.specialization.trim() !== "") {
          try {
            const specializationRequests = await getRequestsBySpecialization(userProfile.specialization);

            // ✅ إصلاح: استبعد طلبات المستخدم بنفس الـ userId (ليس uid)
            const filteredRequests =
              isBoth
                ? specializationRequests.filter((req) => req.userId !== currentUser.uid)
                : specializationRequests;

            setAvailableRequests(filteredRequests);

            // مكتملة للمصنّع
            try {
              const manufacturerCompletedRequests = await getCompletedRequestsByManufacturer(currentUser.uid);
              setCompletedRequests(manufacturerCompletedRequests);
            } catch (completedError) {
              console.error("خطأ في تحميل الطلبات المكتملة:", completedError);
              setCompletedRequests([]);
            }

            // الطلبات الجارية للمصنّع فقط (لو مش both)
            if (!isBoth) {
              try {
                const manufacturerCurrentRequests = await getAllCurrentRequests(currentUser.uid, "manufacturer");
                setCurrentRequests(manufacturerCurrentRequests);
              } catch (currentError) {
                console.error("خطأ في تحميل الطلبات الحالية للمصنع:", currentError);
              }
            }
          } catch (specializationError: any) {
            const msg =
              specializationError?.message || "خطأ غير معروف في تحميل الطلبات المتاحة";
            setError(msg);
            setAvailableRequests([]);
            console.error("خطأ في تحميل طلبات النشاط:", specializationError);
          }
        } else {
          const msg = "لم يتم تحديد تخصص للمصنع. يرجى تحديث بيانات الحساب وتحديد النشاط المناسب";
          setError(msg);
        }
      }
    } catch (e: any) {
      const msg = e?.message || "خطأ غير معروف في تحميل الطلبات";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // تحميل عند الجاهزية + عند الرجوع من إنشاء طلب ومعه refresh
  useEffect(() => {
    if (currentUser && userProfile) loadRequests();
  }, [currentUser, userProfile?.accountType, userProfile?.specialization]);

  useEffect(() => {
    // رجوع من صفحة NewRequest مع state.refresh=true
    // (تم تمريرها عند navigate بعد الحفظ). 
    // سنعيد تحميل القوائم. :contentReference[oaicite:5]{index=5}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyLocation = location as any;
    if (anyLocation?.state?.refresh) {
      loadRequests();
    }
  }, [location]);

  const handleRefresh = () => loadRequests();

  const handleDeleteRequest = async (request: ManufacturingRequest) => {
    if (!request?.requestId) return;
    setDeletingRequest(request.id || "");
    try {
      await deleteRequest(request.requestId);
      toast({
        title: "تم الحذف",
        description: "تم حذف الطلب بنجاح",
      });
      // myRequests يتم تحديثها تلقائياً من onSnapshot
      loadRequests(); // لتحديث الأقسام الأخرى
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء حذف الطلب",
        variant: "destructive",
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
    return requests.filter((request) => {
      const matchesSearch =
        request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase());
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

      {/* نفس مكوّن الفلاتر الحالي مع تمرير الحالة والبحث */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statuses={statuses}
      />

      <div className="px-4 pb-20 space-y-6">
        {/* الطلبات الحالية — للجميع */}
        <CurrentRequestsSection
          requests={currentRequests}
          filteredRequests={filterRequests(currentRequests)}
          onViewRequest={handleViewRequest}
          title={isClient || isBoth ? "طلباتي الحالية" : "الطلبات الحالية التي أعمل عليها"}
        />

        {/* طلباتي — للعميل و(عميل/مصنع) */}
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

        {/* الطلبات المتاحة — للمصنع و(عميل/مصنع) */}
        {(isManufacturer || isBoth) && (
          <AvailableRequestsSection
            requests={availableRequests}
            filteredRequests={filterRequests(availableRequests)}
            onViewRequest={handleViewRequest}
            onAddOffer={handleAddOffer}
            onRefresh={handleRefresh}
          />
        )}

        {/* المكتملة للعميل */}
        {isClient && (
          <CompletedRequestsSection
            requests={myRequests}
            filteredRequests={filterRequests(myRequests)}
            onViewRequest={handleViewRequest}
            title="طلباتي المكتملة"
          />
        )}

        {/* المكتملة للمصنع */}
        {(isManufacturer || isBoth) && (
          <CompletedRequestsSection
            requests={completedRequests}
            filteredRequests={filterRequests(completedRequests)}
            onViewRequest={handleViewRequest}
            title="الطلبات المكتملة التي قمت بتنفيذها"
          />
        )}
      </div>

      {/* تفاصيل طلب */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        onRequestUpdate={loadRequests}
      />

      {/* إضافة عرض سعر */}
      <AddOfferModal
        request={selectedRequestForOffer}
        isOpen={isAddOfferModalOpen}
        onClose={() => {
          setIsAddOfferModalOpen(false);
          setSelectedRequestForOffer(null);
        }}
        onOfferCreated={loadRequests}
      />

      {/* عروض الطلب */}
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
