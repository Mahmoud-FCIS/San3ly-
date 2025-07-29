
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestCard from "./RequestCard";
import { ManufacturingRequest } from "@/services/requestService";

interface AvailableRequestsSectionProps {
  requests: ManufacturingRequest[];
  filteredRequests: ManufacturingRequest[];
  onViewRequest: (request: ManufacturingRequest) => void;
  onAddOffer?: (request: ManufacturingRequest) => void;
  onRefresh: () => void;
}

const AvailableRequestsSection = ({ 
  requests, 
  filteredRequests, 
  onViewRequest, 
  onAddOffer,
  onRefresh 
}: AvailableRequestsSectionProps) => {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          الطلبات المتاحة ({requests.length})
        </h2>
        <Button 
          onClick={onRefresh}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>
      
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {requests.length === 0 
              ? "لا توجد طلبات متاحة في نشاطك حالياً" 
              : "لا توجد طلبات تطابق معايير البحث"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isManufacturer={true}
              onView={onViewRequest}
              onAddOffer={onAddOffer}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default AvailableRequestsSection;
