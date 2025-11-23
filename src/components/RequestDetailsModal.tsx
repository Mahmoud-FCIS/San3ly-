import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Package, Weight, Clock, User, MessageCircle } from "lucide-react";
import { ManufacturingRequest, updateRequestStatus } from "@/services/requestService";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import UserRatingDisplay from "./UserRatingDisplay";
import StartConversationButton from "./StartConversationButton";
import ViewRatingsModal from "./ViewRatingsModal";
import { toast } from "sonner";

interface RequestDetailsModalProps {
  request: ManufacturingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdate: () => void;
}

const RequestDetailsModal = ({ request, isOpen, onClose, onRequestUpdate }: RequestDetailsModalProps) => {
  const { currentUser, userProfile } = useAuth();
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);

  useEffect(() => {
    if (request && isOpen) {
      loadClientInfo();
    }
  }, [request, isOpen]);

  const loadClientInfo = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      const profile = await getUserProfile(request.uid);
      setClientName(profile?.fullName || 'عميل');
    } catch (error) {
      console.error('Error loading client info:', error);
      setClientName('عميل');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!request || !currentUser) return;
    
    setAcceptingRequest(true);
    try {
      console.log('🔄 قبول الطلب:', request.requestId, 'بواسطة:', currentUser.uid);
      
      await updateRequestStatus(
        request.requestId, 
        'قيد المراجعة', 
        currentUser.uid
      );
      
      toast.success("تم قبول الطلب بنجاح");
      onRequestUpdate();
      onClose();
      
      console.log('✅ تم قبول الطلب بنجاح');
    } catch (error) {
      console.error('❌ خطأ في قبول الطلب:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`خطأ في قبول الطلب: ${errorMessage}`);
    } finally {
      setAcceptingRequest(false);
    }
  };

  if (!request) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Check if current user is manufacturer and not the owner of the request
  const isManufacturer = userProfile?.accountType === 'manufacturer' || userProfile?.accountType === 'both';
  const isRequestOwner = currentUser?.uid === request.uid;
  const canShowManufacturerActions = isManufacturer && !isRequestOwner && request.status === 'نشط';

  // Check if rating should be shown only for completed requests
  const shouldShowAddRating = request.status === 'مكتمل';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">معلومات العميل</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-gray-700">{clientName}</span>
                      {!loading && (
                        <div className="flex items-center gap-2">
                          <UserRatingDisplay
                            targetUid={request.uid}
                            targetName={clientName}
                            showAddRating={shouldShowAddRating}
                            compact={true}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRatingsModal(true)}
                            className="flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            اعرض التعليقات
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {request.category}
                  </Badge>
                  <Badge 
                    variant={request.status === "نشط" ? "default" : "secondary"}
                    className={
                      request.status === "نشط" ? "bg-green-600" : 
                      request.status === "قيد المراجعة" ? "bg-orange-600" :
                      request.status === "قيد التنفيذ" ? "bg-blue-600" : ""
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">رقم الطلب</p>
                <p className="font-mono text-lg">#{request.requestId.slice(-8)}</p>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">تفاصيل الطلب</h3>
                  <div className="space-y-3">
                    {request.quantity && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm"><strong>الكمية:</strong> {request.quantity}</span>
                      </div>
                    )}
                    {request.material && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-brown-600 rounded-full"></span>
                        <span className="text-sm"><strong>المادة:</strong> {request.material}</span>
                      </div>
                    )}
                    {request.dimensions && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-purple-600 rounded-full"></span>
                        <span className="text-sm"><strong>الأبعاد:</strong> {request.dimensions}</span>
                      </div>
                    )}
                    {request.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-gray-600" />
                        <span className="text-sm"><strong>الوزن:</strong> {request.weight}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">معلومات إضافية</h3>
                  <div className="space-y-3">
                    {request.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm"><strong>الميزانية:</strong> {request.budget} ج.م</span>
                      </div>
                    )}
                    {request.deadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm"><strong>الموعد النهائي:</strong> {request.deadline}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm"><strong>تاريخ الإنشاء:</strong> {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">وصف الطلب</h3>
                <p className="text-gray-700 leading-relaxed">{request.description}</p>
              </CardContent>
            </Card>

            {/* Manufacturer Actions */}
            {canShowManufacturerActions && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">إجراءات المصنع</h3>
                  <div className="flex gap-3">
                    <StartConversationButton
                      requestId={request.requestId}
                      clientId={request.uid}
                      manufacturerId={currentUser?.uid || ''}
                    />
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAcceptRequest}
                      disabled={acceptingRequest}
                    >
                      {acceptingRequest ? 'جاري القبول...' : 'قبول الطلب'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ViewRatingsModal
        targetUid={request?.uid || ''}
        targetName={clientName}
        isOpen={showRatingsModal}
        onClose={() => setShowRatingsModal(false)}
      />
    </>
  );
};

export default RequestDetailsModal;
