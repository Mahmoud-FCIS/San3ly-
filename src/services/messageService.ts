
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  senderName?: string;
}

export interface Conversation {
  id?: string;
  conversationId: string;
  requestId: string;
  clientId: string;
  manufacturerId: string;
  clientName: string;
  manufacturerName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const generateConversationId = (): string => {
  return 'CONV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const createConversation = async (
  requestId: string, 
  clientId: string, 
  manufacturerId: string,
  clientName: string,
  manufacturerName: string
): Promise<string> => {
  try {
    console.log('🔄 إنشاء محادثة جديدة:', { requestId, clientId, manufacturerId });
    
    // البحث عن محادثة موجودة باستخدام استعلام مبسط
    const conversationsRef = collection(db, 'conversations');
    const existingConvQuery = query(
      conversationsRef,
      where('requestId', '==', requestId),
      where('clientId', '==', clientId),
      where('manufacturerId', '==', manufacturerId)
    );
    
    const existingConvSnapshot = await getDocs(existingConvQuery);
    
    if (!existingConvSnapshot.empty) {
      const existingConv = existingConvSnapshot.docs[0].data();
      console.log('✅ محادثة موجودة بالفعل:', existingConv.conversationId);
      return existingConv.conversationId;
    }
    
    const conversationId = generateConversationId();
    
    const conversation: Omit<Conversation, 'id'> = {
      conversationId,
      requestId,
      clientId,
      manufacturerId,
      clientName,
      manufacturerName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    console.log('✅ تم إنشاء المحادثة بنجاح:', docRef.id);
    
    // إرسال رسالة ترحيبية من النظام
    await sendMessage(
      conversationId, 
      'SYSTEM', 
      clientId, 
      `مرحباً ${clientName}، تم بدء محادثة جديدة مع ${manufacturerName} بخصوص طلبك.`,
      'النظام'
    );
    
    return conversationId;
  } catch (error) {
    console.error('❌ خطأ في إنشاء المحادثة:', error);
    throw new Error(`فشل في إنشاء المحادثة: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const sendMessage = async (
  conversationId: string, 
  senderId: string, 
  receiverId: string, 
  messageText: string,
  senderName?: string
): Promise<void> => {
  try {
    console.log('📤 إرسال رسالة:', { conversationId, senderId, messageText });
    
    const message: Omit<Message, 'id'> = {
      conversationId,
      senderId,
      receiverId,
      message: messageText,
      timestamp: new Date(),
      isRead: false,
      senderName: senderName || 'مستخدم'
    };

    await addDoc(collection(db, 'messages'), message);
    
    // تحديث آخر رسالة في المحادثة
    const conversationQuery = query(
      collection(db, 'conversations'),
      where('conversationId', '==', conversationId)
    );
    
    const conversationSnapshot = await getDocs(conversationQuery);
    if (!conversationSnapshot.empty) {
      const conversationDoc = conversationSnapshot.docs[0];
      await updateDoc(conversationDoc.ref, {
        lastMessage: messageText,
        lastMessageTime: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('✅ تم إرسال الرسالة بنجاح');
  } catch (error) {
    console.error('❌ خطأ في إرسال الرسالة:', error);
    throw new Error(`فشل في إرسال الرسالة: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    console.log('📥 جلب رسائل المحادثة:', conversationId);
    
    // استعلام مبسط بدون ترتيب لتجنب مشاكل الفهرسة
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('conversationId', '==', conversationId));
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
      } as Message);
    });
    
    // ترتيب الرسائل محلياً حسب الوقت
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    console.log(`✅ تم جلب ${messages.length} رسالة`);
    return messages;
  } catch (error) {
    console.error('❌ خطأ في جلب الرسائل:', error);
    throw new Error(`فشل في جلب الرسائل: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    console.log('📋 جلب محادثات المستخدم:', userId);
    
    if (!userId) {
      throw new Error('معرف المستخدم مطلوب');
    }
    
    // استعلام مبسط للمحادثات
    const conversationsRef = collection(db, 'conversations');
    
    // جلب المحادثات التي يكون المستخدم عميل فيها
    const clientQuery = query(conversationsRef, where('clientId', '==', userId));
    
    // جلب المحادثات التي يكون المستخدم مصنع فيها
    const manufacturerQuery = query(conversationsRef, where('manufacturerId', '==', userId));
    
    const [clientSnapshot, manufacturerSnapshot] = await Promise.all([
      getDocs(clientQuery),
      getDocs(manufacturerQuery)
    ]);
    
    const conversations: Conversation[] = [];
    const conversationIds = new Set<string>();
    
    // معالجة محادثات العميل
    clientSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!conversationIds.has(data.conversationId)) {
        conversations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          lastMessageTime: data.lastMessageTime?.toDate ? data.lastMessageTime.toDate() : undefined
        } as Conversation);
        conversationIds.add(data.conversationId);
      }
    });
    
    // معالجة محادثات المصنع
    manufacturerSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!conversationIds.has(data.conversationId)) {
        conversations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          lastMessageTime: data.lastMessageTime?.toDate ? data.lastMessageTime.toDate() : undefined
        } as Conversation);
        conversationIds.add(data.conversationId);
      }
    });
    
    // ترتيب المحادثات محلياً حسب آخر تحديث
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    console.log(`✅ تم جلب ${conversations.length} محادثة`);
    return conversations;
  } catch (error) {
    console.error('❌ خطأ في جلب المحادثات:', error);
    throw new Error(`فشل في جلب المحادثات: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const subscribeToMessages = (
  conversationId: string, 
  callback: (messages: Message[]) => void
): (() => void) => {
  console.log('🔄 الاشتراك في رسائل المحادثة:', conversationId);
  
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId));
  
  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
      } as Message);
    });
    
    // ترتيب الرسائل محلياً
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    console.log(`🔄 تحديث الرسائل: ${messages.length} رسالة`);
    callback(messages);
  }, (error) => {
    console.error('❌ خطأ في الاشتراك في الرسائل:', error);
  });
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      isRead: true
    });
  } catch (error) {
    console.error('❌ خطأ في تمييز الرسالة كمقروءة:', error);
    throw error;
  }
};
