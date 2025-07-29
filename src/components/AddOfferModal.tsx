
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, Clock, Weight, FileText, Plus } from "lucide-react";
import { ManufacturingRequest } from "@/services/requestService";
import { createOffer } from "@/services/offerService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddOfferModalProps {
  request: ManufacturingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOfferCreated?: () => void;
}

const AddOfferModal = ({ request, isOpen, onClose, onOfferCreated }: AddOfferModalProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    price: '',
    material: '',
    deliveryTime: '',
    weight: '',
    notes: ''
  });

  if (!request) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    // التحقق من الحقول المطلوبة
    if (!formData.quantity || !formData.price || !formData.material || !formData.deliveryTime) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createOffer(request.requestId, currentUser.uid, formData);
      
      toast({
        title: "تم إنشاء العرض",
        description: "تم إنشاء عرضك بنجاح وإرساله للعميل",
      });
      
      onClose();
      if (onOfferCreated) {
        onOfferCreated();
      }
      
      // إعادة تعيين النموذج
      setFormData({
        quantity: '',
        price: '',
        material: '',
        deliveryTime: '',
        weight: '',
        notes: ''
      });
    } catch (error) {
      console.error('خطأ في إنشاء العرض:', error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء العرض";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            إضافة عرض للطلب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الطلب الأصلي */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">تفاصيل الطلب الأصلي:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">العنوان:</span>
                  <span className="font-medium mr-2">{request.title}</span>
                </div>
                <div>
                  <span className="text-gray-600">الفئة:</span>
                  <span className="font-medium mr-2">{request.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">الكمية المطلوبة:</span>
                  <span className="font-medium mr-2">{request.quantity}</span>
                </div>
                <div>
                  <span className="text-gray-600">الموعد النهائي:</span>
                  <span className="font-medium mr-2">{request.deadline}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* نموذج العرض */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  الكمية المقترحة *
                </Label>
                <Input
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="مثال: 100 قطعة"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  السعر المقترح (ر.س) *
                </Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="مثال: 5000"
                  type="number"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  المواد المقترحة *
                </Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  placeholder="مثال: ألومنيوم عالي الجودة"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  مدة التسليم المقترحة *
                </Label>
                <Input
                  id="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                  placeholder="مثال: 15 يوم عمل"
                  className="w-full"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  الوزن المتوقع
                </Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="مثال: 50 كيلو"
                  className="w-full"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  ملاحظات إضافية
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أي تفاصيل إضافية تريد إضافتها للعرض..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* أزرار العمل */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "جاري الإرسال..." : "إرسال العرض"}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfferModal;
