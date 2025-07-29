
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Video, MoreVertical, Send, Paperclip, Smile, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  getUserConversations, 
  getConversationMessages,
  sendMessage,
  subscribeToMessages,
  Conversation,
  Message
} from "@/services/messageService";

const Messages = () => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      subscribeToConversationMessages();
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!currentUser?.uid) {
      setError("المستخدم غير مسجل الدخول");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 تحميل محادثات المستخدم:', currentUser.uid);
      
      const userConversations = await getUserConversations(currentUser.uid);
      console.log('✅ تم تحميل المحادثات بنجاح:', userConversations.length);
      
      setConversations(userConversations);
      setRetryCount(0);
      
      if (userConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(userConversations[0]);
      }
      
      if (userConversations.length === 0) {
        toast.info('لا توجد محادثات حالياً');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل المحادثات:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف في تحميل المحادثات';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // عرض رسالة خطأ مفصلة
      if (errorMessage.includes('permission-denied')) {
        toast.error('ليس لديك صلاحية للوصول إلى الرسائل');
      } else if (errorMessage.includes('unavailable')) {
        toast.error('خدمة الرسائل غير متاحة حالياً، يرجى المحاولة لاحقاً');
      } else if (errorMessage.includes('failed-precondition')) {
        toast.error('يتطلب إعداد إضافي في قاعدة البيانات');
      } else {
        toast.error(`خطأ في تحميل الرسائل: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversationMessages = () => {
    if (!selectedConversation) return;
    
    try {
      // إلغاء الاشتراك السابق
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      console.log('🔄 الاشتراك في رسائل المحادثة:', selectedConversation.conversationId);
      
      // الاشتراك في الرسائل الجديدة
      unsubscribeRef.current = subscribeToMessages(
        selectedConversation.conversationId,
        (newMessages) => {
          console.log('📩 تم استلام رسائل جديدة:', newMessages.length);
          setMessages(newMessages);
        }
      );
    } catch (error) {
      console.error('❌ خطأ في الاشتراك في الرسائل:', error);
      toast.error('خطأ في تحميل الرسائل');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || !userProfile) return;
    
    setSending(true);
    try {
      const receiverId = currentUser.uid === selectedConversation.clientId 
        ? selectedConversation.manufacturerId 
        : selectedConversation.clientId;
      
      console.log('📤 إرسال رسالة:', {
        conversationId: selectedConversation.conversationId,
        senderId: currentUser.uid,
        receiverId: receiverId,
        message: newMessage.trim()
      });
      
      await sendMessage(
        selectedConversation.conversationId,
        currentUser.uid,
        receiverId,
        newMessage.trim(),
        userProfile.fullName || 'مستخدم'
      );
      
      setNewMessage("");
      console.log('✅ تم إرسال الرسالة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`فشل في إرسال الرسالة: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // إصلاح دالة التصفية لتجنب خطأ toLowerCase
  const filteredConversations = conversations.filter(conv => {
    if (!currentUser || !conv) return false;
    
    try {
      const isClient = currentUser.uid === conv.clientId;
      const otherPartyName = isClient ? 
        (conv.manufacturerName || '') : 
        (conv.clientName || '');
      
      // التأكد من أن otherPartyName ليس null أو undefined
      if (!otherPartyName || typeof otherPartyName !== 'string') {
        console.warn('اسم الطرف الآخر غير صحيح في المحادثة:', conv.conversationId, otherPartyName);
        return false;
      }
      
      return otherPartyName.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      console.error('خطأ في تصفية المحادثة:', conv.conversationId, error);
      return false;
    }
  });

  const getOtherPartyInfo = (conversation: Conversation) => {
    if (!currentUser || !conversation) return { name: 'مستخدم', isOnline: false };
    
    try {
      const isClient = currentUser.uid === conversation.clientId;
      const name = isClient ? 
        (conversation.manufacturerName || 'مصنع') : 
        (conversation.clientName || 'عميل');
      
      return {
        name: name,
        isOnline: Math.random() > 0.5 // مؤقت - يمكن تطويره لاحقاً
      };
    } catch (error) {
      console.error('خطأ في الحصول على معلومات الطرف الآخر:', error);
      return { name: 'مستخدم', isOnline: false };
    }
  };

  const formatTime = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('خطأ في تنسيق الوقت:', error);
      return '';
    }
  };

  const formatDate = (date: Date) => {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return formatTime(date);
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "أمس";
      } else {
        return new Intl.DateTimeFormat('ar-SA', {
          month: 'short',
          day: 'numeric'
        }).format(date);
      }
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المحادثات...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">محاولة رقم {retryCount + 1}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              خطأ في تحميل الرسائل
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {error}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={loadConversations}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    جاري إعادة المحاولة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    إعادة المحاولة
                  </>
                )}
              </Button>
              {retryCount > 2 && (
                <div className="text-xs text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium mb-1">نصائح لحل المشكلة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>تأكد من اتصالك بالإنترنت</li>
                    <li>حاول تسجيل الخروج ثم الدخول مرة أخرى</li>
                    <li>امسح ذاكرة التخزين المؤقت للمتصفح</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">الرسائل</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="البحث في المحادثات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>لا توجد محادثات</p>
              <p className="text-xs mt-2">ابدأ محادثة من خلال النظر في الطلبات المتاحة</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParty = getOtherPartyInfo(conversation);
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-600' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {otherParty.name[0] || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      {otherParty.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {otherParty.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.lastMessageTime ? formatDate(conversation.lastMessageTime) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conversation.lastMessage || 'لا توجد رسائل'}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        طلب #{conversation.requestId.slice(-6)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {getOtherPartyInfo(selectedConversation).name[0] || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getOtherPartyInfo(selectedConversation).name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getOtherPartyInfo(selectedConversation).isOnline 
                        ? 'متصل الآن' 
                        : 'غير متصل'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>لا توجد رسائل في هذه المحادثة</p>
                  <p className="text-sm mt-1">ابدأ المحادثة بإرسال رسالة</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.uid
                          ? 'bg-green-600 text-white'
                          : message.senderId === 'SYSTEM'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {message.senderId === 'SYSTEM' && (
                        <p className="text-xs font-medium mb-1">رسالة من النظام</p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === currentUser?.uid 
                          ? 'text-green-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="اكتب رسالة..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    disabled={sending}
                    className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>اختر محادثة للبدء في المراسلة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
