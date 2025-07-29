
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Users, Eye, Trash2, Loader2, Plus, FileText, CreditCard } from "lucide-react";
import { ManufacturingRequest } from "@/services/requestService";

interface RequestCardProps {
  request: ManufacturingRequest;
  isOwned?: boolean;
  isManufacturer?: boolean;
  onView: (request: ManufacturingRequest) => void;
  onDelete?: (request: ManufacturingRequest) => void;
  onAddOffer?: (request: ManufacturingRequest) => void;
  onViewOffers?: (request: ManufacturingRequest) => void;
  deletingRequest?: string | null;
}

const RequestCard = ({ 
  request, 
  isOwned = false, 
  isManufacturer = false,
  onView, 
  onDelete, 
  onAddOffer,
  onViewOffers,
  deletingRequest 
}: RequestCardProps) => {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ أقل من ساعة";
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "منذ يوم واحد";
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const showPaymentButton = isOwned && request.status === 'قيد المراجعة';

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{request.title}</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800 mb-2">
              {request.category}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onView(request)}
            >
              <Eye className="w-4 h-4 ml-2" />
              عرض
            </Button>

            {/* زر إضافة عرض للمصانع */}
            {isManufacturer && !isOwned && request.status === 'نشط' && onAddOffer && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onAddOffer(request)}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة عرض
              </Button>
            )}

            {/* زر عرض العروض للعملاء */}
            {isOwned && onViewOffers && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={() => onViewOffers(request)}
              >
                <FileText className="w-4 h-4 ml-2" />
                العروض
              </Button>
            )}

            {/* زر الدفع */}
            {showPaymentButton && (
              <Button 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  // هنا يمكن إضافة منطق الدفع لاحقاً
                  console.log('الانتقال لصفحة الدفع');
                }}
              >
                <CreditCard className="w-4 h-4 ml-2" />
                الدفع
              </Button>
            )}

            {/* زر الحذف للمالك */}
            {isOwned && onDelete && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onDelete(request)}
                disabled={deletingRequest === request.id}
              >
                {deletingRequest === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {request.description}
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
          {request.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{request.budget} ر.س</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{request.deadline}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{request.quantity}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{getTimeAgo(request.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span>#{request.requestId.slice(-8)}</span>
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
      </CardContent>
    </Card>
  );
};

export default RequestCard;
