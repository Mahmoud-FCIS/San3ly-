
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createConversation } from "@/services/messageService";
import { getUserProfile } from "@/services/userService";

interface StartConversationButtonProps {
  requestId: string;
  clientId: string;
  manufacturerId: string;
  disabled?: boolean;
}

const StartConversationButton = ({ 
  requestId, 
  clientId, 
  manufacturerId, 
  disabled = false 
}: StartConversationButtonProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!currentUser || disabled) return;
    
    setLoading(true);
    try {
      console.log('🔄 بدء محادثة جديدة:', { requestId, clientId, manufacturerId });
      
      // جلب أسماء المستخدمين
      const [clientProfile, manufacturerProfile] = await Promise.all([
        getUserProfile(clientId),
        getUserProfile(manufacturerId)
      ]);
      
      const clientName = clientProfile?.fullName || 'عميل';
      const manufacturerName = manufacturerProfile?.fullName || 'مصنع';
      
      // إنشاء أو الحصول على المحادثة
      const conversationId = await createConversation(
        requestId,
        clientId,
        manufacturerId,
        clientName,
        manufacturerName
      );
      
      toast({
        title: "تم بدء المحادثة",
        description: "تم إنشاء المحادثة بنجاح، سيتم توجيهك إلى صفحة الرسائل",
      });
      
      // الانتقال إلى صفحة الرسائل
      navigate('/messages');
      
    } catch (error) {
      console.error('❌ خطأ في بدء المحادثة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في بدء المحادثة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartConversation}
      disabled={disabled || loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      {loading ? "جاري البدء..." : "مناقشة الطلب"}
    </Button>
  );
};

export default StartConversationButton;
