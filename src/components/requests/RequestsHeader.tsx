
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RequestsHeaderProps {
  userProfile: any;
  canCreateRequests: boolean;
  onRefresh: () => void;
}

const RequestsHeader = ({ userProfile, canCreateRequests, onRefresh }: RequestsHeaderProps) => {
  const navigate = useNavigate();
  const isManufacturer = userProfile?.accountType === 'manufacturer';
  const isBoth = userProfile?.accountType === 'both';

  return (
    <header className="bg-white shadow-sm px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">الطلبات</h1>
          {(isManufacturer || isBoth) && userProfile?.specialization && (
            <Badge className="bg-blue-100 text-blue-800">
              <Factory className="w-3 h-3 ml-1" />
              {userProfile.specialization}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={onRefresh}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          {canCreateRequests && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate('/new-request')}
            >
              <Plus className="w-4 h-4 ml-2" />
              طلب جديد
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default RequestsHeader;
