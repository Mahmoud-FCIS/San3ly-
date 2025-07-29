
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package, Eye, CheckCircle } from "lucide-react";
import { ManufacturingRequest } from "@/services/requestService";

interface CompletedRequestsSectionProps {
  requests: ManufacturingRequest[];
  filteredRequests: ManufacturingRequest[];
  onViewRequest: (request: ManufacturingRequest) => void;
  title: string;
}

const CompletedRequestsSection = ({ 
  requests, 
  filteredRequests, 
  onViewRequest,
  title 
}: CompletedRequestsSectionProps) => {
  const completedRequests = filteredRequests.filter(request => request.status === 'مكتمل');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (completedRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {completedRequests.length}
          </Badge>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد طلبات مكتملة بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {completedRequests.length}
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {completedRequests.map((request) => (
          <Card key={request.id} className="border-2 border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {request.title}
                  </h3>
                  <Badge className="bg-green-600 text-white text-xs">
                    مكتمل
                  </Badge>
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

export default CompletedRequestsSection;
