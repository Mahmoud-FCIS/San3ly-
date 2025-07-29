import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, DollarSign, Package, Weight, MessageSquare, Check, X, Eye, MessageCircle } from "lucide-react";
import { ManufacturingRequest } from "@/services/requestService";
import { getOffersByRequestId, ManufacturingOffer, updateOfferAcceptance } from "@/services/offerService";
import { getUserProfile } from "@/services/userService";
import { updateRequestStatus } from "@/services/requestService";
import { useToast } from "@/hooks/use-toast";
import UserRatingDisplay from "./UserRatingDisplay";
import ViewRatingsModal from "./ViewRatingsModal";

interface ViewOffersModalProps {
  request: ManufacturingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdate: () => void;
}

const ViewOffersModal = ({ request, isOpen, onClose, onRequestUpdate }: ViewOffersModalProps) => {
  const [offers, setOffers] = useState<ManufacturingOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [manufacturerNames, setManufacturerNames] = useState<{[key: string]: string}>({});
  const [selectedOffer, setSelectedOffer] = useState<ManufacturingOffer | null>(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [selectedManufacturerUid, setSelectedManufacturerUid] = useState<string>('');
  const [selectedManufacturerName, setSelectedManufacturerName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && request) {
      loadOffers();
    }
  }, [isOpen, request]);

  const loadOffers = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      const requestOffers = await getOffersByRequestId(request.requestId);
      setOffers(requestOffers);
      
      // جلب أسماء المصانع
      const names: {[key: string]: string} = {};
      for (const offer of requestOffers) {
        if (!names[offer.manufacturerUid]) {
          try {
            const profile = await getUserProfile(offer.manufacturerUid);
            names[offer.manufacturerUid] = profile?.factoryName || profile?.fullName || 'مصنع';
          } catch (error) {
            names[offer.manufacturerUid] = 'مصنع';
          }
        }
      }
      setManufacturerNames(names);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل العروض",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: ManufacturingOffer) => {
    try {
      await updateOfferAcceptance(offer.offerId, 'مقبول');
      await updateRequestStatus(request!.requestId, 'قيد المراجعة');
      
      toast({
        title: "تم القبول",
        description: "تم قبول العرض بنجاح وتحديث حالة الطلب"
      });
      
      onRequestUpdate();
      onClose();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قبول العرض",
        variant: "destructive"
      });
    }
  };

  const handleRejectOffer = async (offer: ManufacturingOffer) => {
    try {
      await updateOfferAcceptance(offer.offerId, 'مرفوض');
      
      toast({
        title: "تم الرفض",
        description: "تم رفض العرض"
      });
      
      loadOffers();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض العرض",
        variant: "destructive"
      });
    }
  };

  const handleViewRatings = (manufacturerUid: string, manufacturerName: string) => {
    setSelectedManufacturerUid(manufacturerUid);
    setSelectedManufacturerName(manufacturerName);
    setShowRatingsModal(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!request) return null;

  // Check if rating should be shown only for completed requests
  const shouldShowAddRating = request.status === 'مكتمل';

  return (
    <>
      <Dialog open={isOpen && !showOfferDetails} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>العروض المقدمة - {request.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري تحميل العروض...</p>
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد عروض لهذا الطلب بعد</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {offers.map((offer) => (
                  <Card key={offer.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {manufacturerNames[offer.manufacturerUid] || 'مصنع'}
                            </h3>
                            <div className="flex items-center gap-2">
                              <UserRatingDisplay
                                targetUid={offer.manufacturerUid}
                                targetName={manufacturerNames[offer.manufacturerUid] || 'مصنع'}
                                showAddRating={shouldShowAddRating}
                                compact={true}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRatings(offer.manufacturerUid, manufacturerNames[offer.manufacturerUid] || 'مصنع')}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                اعرض التعليقات
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{offer.price} ج.م</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">{offer.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm">{offer.deliveryTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Weight className="w-4 h-4 text-purple-600" />
                              <span className="text-sm">{offer.weight}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>المادة:</strong> {offer.material}
                          </p>
                          
                          {offer.notes && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>ملاحظات:</strong> {offer.notes}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            تاريخ العرض: {formatDate(offer.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge 
                            variant={
                              offer.acceptance === 'جديد' ? 'secondary' :
                              offer.acceptance === 'مقبول' ? 'default' : 'destructive'
                            }
                            className={
                              offer.acceptance === 'جديد' ? 'bg-blue-100 text-blue-800' :
                              offer.acceptance === 'مقبول' ? 'bg-green-600' : 'bg-red-600'
                            }
                          >
                            {offer.acceptance}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowOfferDetails(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          عرض التفاصيل
                        </Button>
                        
                        {offer.acceptance === 'جديد' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptOffer(offer)}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectOffer(offer)}
                              className="flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Details Modal */}
      <Dialog open={showOfferDetails} onOpenChange={() => setShowOfferDetails(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل العرض</DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {manufacturerNames[selectedOffer.manufacturerUid] || 'مصنع'}
                </h3>
                <div className="flex items-center gap-2">
                  <UserRatingDisplay
                    targetUid={selectedOffer.manufacturerUid}
                    targetName={manufacturerNames[selectedOffer.manufacturerUid] || 'مصنع'}
                    showAddRating={shouldShowAddRating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRatings(selectedOffer.manufacturerUid, manufacturerNames[selectedOffer.manufacturerUid] || 'مصنع')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    اعرض التعليقات
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><strong>السعر:</strong> {selectedOffer.price} ج.م</p>
                  <p><strong>الكمية:</strong> {selectedOffer.quantity}</p>
                  <p><strong>وقت التسليم:</strong> {selectedOffer.deliveryTime}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>الوزن:</strong> {selectedOffer.weight}</p>
                  <p><strong>المادة:</strong> {selectedOffer.material}</p>
                  <p><strong>الحالة:</strong> {selectedOffer.acceptance}</p>
                </div>
              </div>
              
              {selectedOffer.notes && (
                <div>
                  <strong>ملاحظات:</strong>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedOffer.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                {selectedOffer.acceptance === 'جديد' && (
                  <>
                    <Button
                      onClick={() => {
                        handleAcceptOffer(selectedOffer);
                        setShowOfferDetails(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      قبول العرض
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRejectOffer(selectedOffer);
                        setShowOfferDetails(false);
                      }}
                      className="flex-1"
                    >
                      رفض العرض
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setShowOfferDetails(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ViewRatingsModal
        targetUid={selectedManufacturerUid}
        targetName={selectedManufacturerName}
        isOpen={showRatingsModal}
        onClose={() => setShowRatingsModal(false)}
      />
    </>
  );
};

export default ViewOffersModal;
