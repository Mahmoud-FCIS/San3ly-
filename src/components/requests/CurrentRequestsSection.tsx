
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package, Eye, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { ManufacturingRequest } from "@/services/requestService";

interface CurrentRequestsSectionProps {
  requests: ManufacturingRequest[];
  filteredRequests: ManufacturingRequest[];
  onViewRequest: (request: ManufacturingRequest) => void;
  title: string;
}

const CurrentRequestsSection = ({ 
  requests, 
  filteredRequests, 
  onViewRequest,
  title 
}: CurrentRequestsSectionProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'نشط':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'قيد المراجعة':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'قيد التنفيذ':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'مكتمل':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ملغي':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'قيد المراجعة':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'قيد التنفيذ':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'مكتمل':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ملغي':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (filteredRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {filteredRequests.length}
          </Badge>
        </div>
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد طلبات حالية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {filteredRequests.length}
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {request.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(request.status)}
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-3 h-3" />
                    <span>{request.category}</span>
                  </div>
                  
                  {request.budget && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-3 h-3" />
                      <span>{request.budget} ج.م</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewRequest(request)}
                    className="w-full flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CurrentRequestsSection;
