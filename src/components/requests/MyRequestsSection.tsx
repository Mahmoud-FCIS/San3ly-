
import RequestCard from "./RequestCard";
import { ManufacturingRequest } from "@/services/requestService";

interface MyRequestsSectionProps {
  requests: ManufacturingRequest[];
  filteredRequests: ManufacturingRequest[];
  onViewRequest: (request: ManufacturingRequest) => void;
  onDeleteRequest: (request: ManufacturingRequest) => void;
  onViewOffers?: (request: ManufacturingRequest) => void;
  deletingRequest: string | null;
}

const MyRequestsSection = ({ 
  requests, 
  filteredRequests, 
  onViewRequest, 
  onDeleteRequest,
  onViewOffers,
  deletingRequest 
}: MyRequestsSectionProps) => {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        طلباتي ({requests.length})
      </h2>
      
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">لا توجد طلبات تطابق معايير البحث</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isOwned={true}
              onView={onViewRequest}
              onDelete={onDeleteRequest}
              onViewOffers={onViewOffers}
              deletingRequest={deletingRequest}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MyRequestsSection;
