import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ManufacturingRequest {
  id?: string;
  requestId: string;
  uid: string;
  title: string;
  description: string;
  quantity: string;
  material: string;
  dimensions: string;
  weight: string;
  deadline: string;
  category: string;
  budget: string;
  status: 'نشط' | 'قيد المراجعة' | 'قيد التنفيذ' | 'مكتمل' | 'ملغي';
  acceptedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const generateRequestId = (): string => {
  return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const saveManufacturingRequest = async (uid: string, requestData: any): Promise<string> => {
  try {
    console.log('Saving manufacturing request for user:', uid);
    console.log('Request data:', requestData);
    
    const requestId = generateRequestId();
    
    const request: Omit<ManufacturingRequest, 'id'> = {
      requestId,
      uid,
      title: requestData.title,
      description: requestData.description,
      quantity: requestData.quantity,
      material: requestData.material,
      dimensions: requestData.dimensions || '',
      weight: requestData.weight || '',
      deadline: requestData.deadline,
      category: requestData.category,
      budget: requestData.budget || '',
      status: 'نشط',
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate()
    };

    const docRef = await addDoc(collection(db, 'manufacturingRequests'), request);
    console.log('Manufacturing request saved successfully with ID:', docRef.id);
    console.log('Request ID:', requestId);
    return docRef.id;
  } catch (error) {
    console.error('Error saving manufacturing request:', error);
    console.error('Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message
    });
    throw new Error(`فشل في حفظ الطلب: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getUserRequests = async (uid: string): Promise<ManufacturingRequest[]> => {
  try {
    console.log('Getting requests for user:', uid);
    
    if (!uid) {
      throw new Error('معرف المستخدم مطلوب');
    }
    
    const q = query(
      collection(db, 'manufacturingRequests'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    const requests: ManufacturingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        console.log('Processing document:', doc.id, data);
        
        // Handle Firestore Timestamp conversion properly
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        
        const request: ManufacturingRequest = {
          id: doc.id,
          requestId: data.requestId,
          uid: data.uid,
          title: data.title,
          description: data.description,
          quantity: data.quantity,
          material: data.material,
          dimensions: data.dimensions || '',
          weight: data.weight || '',
          deadline: data.deadline,
          category: data.category,
          budget: data.budget || '',
          status: data.status,
          acceptedBy: data.acceptedBy,
          createdAt,
          updatedAt
        };
        
        requests.push(request);
        console.log('Added request to array:', request.requestId);
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
      }
    });
    
    console.log('Total requests found:', requests.length);
    return requests;
  } catch (error) {
    console.error('Error getting user requests:', error);
    console.error('Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      uid: uid
    });
    
    // Provide detailed error messages in Arabic
    if ((error as any)?.code === 'failed-precondition') {
      throw new Error('يتطلب إنشاء فهرس في قاعدة البيانات. يرجى المحاولة مرة أخرى لاحقاً');
    } else if ((error as any)?.code === 'permission-denied') {
      throw new Error('ليس لديك صلاحية للوصول إلى هذه البيانات');
    } else if ((error as any)?.code === 'unavailable') {
      throw new Error('الخدمة غير متاحة حالياً. يرجى المحاولة مرة أخرى');
    } else {
      throw new Error(`خطأ في استرجاع الطلبات: ${(error as any)?.message || 'خطأ غير معروف'}`);
    }
  }
};

export const getAllActiveRequests = async (): Promise<ManufacturingRequest[]> => {
  try {
    console.log('Getting all active requests...');
    
    const q = query(
      collection(db, 'manufacturingRequests'),
      where('status', '==', 'نشط'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: ManufacturingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        
        requests.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as ManufacturingRequest);
      } catch (docError) {
        console.error('Error processing active request document:', doc.id, docError);
      }
    });
    
    console.log('Found active requests:', requests.length);
    return requests;
  } catch (error) {
    console.error('Error getting active requests:', error);
    throw new Error(`خطأ في استرجاع الطلبات النشطة: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getRequestsBySpecialization = async (specialization: string): Promise<ManufacturingRequest[]> => {
  try {
    console.log('🔍 بدء البحث عن الطلبات حسب النشاط:', specialization);
    
    // التحقق من صحة المدخلات
    if (!specialization || specialization.trim() === '') {
      console.warn('⚠️ لم يتم تحديد نشاط صحيح');
      throw new Error('يجب تحديد نشاط صحيح للبحث');
    }

    // تنظيف النشاط من المسافات الزائدة
    const cleanSpecialization = specialization.trim();
    console.log('✅ النشاط بعد التنظيف:', cleanSpecialization);

    // إنشاء استعلام بسيط بدون orderBy لتجنب مشاكل الفهرسة
    console.log('🔄 إنشاء استعلام Firestore...');
    const requestsCollection = collection(db, 'manufacturingRequests');
    
    // استعلام مبسط للطلبات النشطة فقط
    const activeRequestsQuery = query(
      requestsCollection,
      where('status', '==', 'نشط')
    );

    console.log('📡 تنفيذ الاستعلام...');
    const querySnapshot = await getDocs(activeRequestsQuery);
    console.log(`📊 تم العثور على ${querySnapshot.size} طلب نشط في قاعدة البيانات`);

    if (querySnapshot.empty) {
      console.log('📭 لا توجد طلبات نشطة في قاعدة البيانات');
      return [];
    }

    const matchingRequests: ManufacturingRequest[] = [];
    let processedCount = 0;
    let matchedCount = 0;

    // معالجة كل مستند
    querySnapshot.forEach((docSnapshot) => {
      try {
        processedCount++;
        const data = docSnapshot.data();
        const docId = docSnapshot.id;

        console.log(`🔍 معالجة المستند ${processedCount}/${querySnapshot.size}:`, {
          docId: docId,
          requestId: data.requestId || 'غير محدد',
          title: data.title || 'بدون عنوان',
          category: data.category || 'غير محدد',
          status: data.status || 'غير محدد'
        });

        // التحقق من وجود الحقول المطلوبة
        if (!data.category) {
          console.warn(`⚠️ المستند ${docId} لا يحتوي على حقل category`);
          return;
        }

        if (!data.status) {
          console.warn(`⚠️ المستند ${docId} لا يحتوي على حقل status`);
          return;
        }

        // التحقق من تطابق النشاط بدقة
        const requestCategory = data.category.toString().trim();
        const isExactMatch = requestCategory === cleanSpecialization;

        console.log(`🔍 فحص التطابق:`, {
          requestCategory: requestCategory,
          targetSpecialization: cleanSpecialization,
          isExactMatch: isExactMatch,
          status: data.status
        });

        // إضافة الطلب إذا كان يطابق النشاط والحالة
        if (isExactMatch && data.status === 'نشط') {
          matchedCount++;
          
          // تحويل التواريخ بأمان
          let createdAt: Date;
          let updatedAt: Date;

          try {
            createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
            updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now());
          } catch (dateError) {
            console.warn(`⚠️ خطأ في تحويل التواريخ للمستند ${docId}:`, dateError);
            createdAt = new Date();
            updatedAt = new Date();
          }

          const request: ManufacturingRequest = {
            id: docId,
            requestId: data.requestId || `REQ_${docId.slice(-8)}`,
            uid: data.userId || '',
            title: data.title || 'بدون عنوان',
            description: data.description || '',
            quantity: data.quantity || '',
            material: data.material || '',
            dimensions: data.dimensions || '',
            weight: data.weight || '',
            deadline: data.deadline || '',
            category: data.category || '',
            budget: data.budget || '',
            status: data.status || 'نشط',
            acceptedBy: data.acceptedBy,
            createdAt,
            updatedAt
          };

          matchingRequests.push(request);
          
          console.log(`✅ تم إضافة الطلب المطابق ${matchedCount}:`, {
            requestId: request.requestId,
            title: request.title,
            category: request.category,
            createdAt: request.createdAt.toISOString()
          });
        } else {
          console.log(`❌ الطلب لا يطابق المعايير:`, {
            categoryMatch: isExactMatch,
            statusMatch: data.status === 'نشط',
            actualCategory: requestCategory,
            actualStatus: data.status
          });
        }
      } catch (docError) {
        console.error(`❌ خطأ في معالجة المستند ${docSnapshot.id}:`, docError);
      }
    });

    // ترتيب النتائج حسب تاريخ الإنشاء (الأحدث أولاً)
    matchingRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`🎯 النتيجة النهائية:`, {
      totalProcessed: processedCount,
      totalMatched: matchedCount,
      specialization: cleanSpecialization,
      requests: matchingRequests.map(r => ({
        id: r.requestId,
        title: r.title,
        category: r.category,
        createdAt: r.createdAt.toISOString()
      }))
    });

    if (matchingRequests.length === 0) {
      console.log(`📭 لم يتم العثور على طلبات نشطة في نشاط "${cleanSpecialization}"`);
    } else {
      console.log(`✅ تم العثور على ${matchingRequests.length} طلب نشط في نشاط "${cleanSpecialization}"`);
    }

    return matchingRequests;

  } catch (error) {
    console.error('❌ خطأ في استرجاع الطلبات حسب النشاط:', error);
    console.error('تفاصيل الخطأ:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      specialization: specialization,
      stack: (error as any)?.stack
    });

    // معالجة أنواع مختلفة من الأخطاء
    if ((error as any)?.code === 'failed-precondition') {
      throw new Error('❌ الاستعلام يتطلب إنشاء فهرس في قاعدة البيانات. يرجى إنشاء الفهرس المطلوب والمحاولة مرة أخرى');
    } else if ((error as any)?.code === 'permission-denied') {
      throw new Error('❌ ليس لديك صلاحية للوصول إلى بيانات الطلبات');
    } else if ((error as any)?.code === 'unavailable') {
      throw new Error('❌ خدمة قاعدة البيانات غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً');
    } else if ((error as any)?.code === 'cancelled') {
      throw new Error('❌ تم إلغاء العملية. يرجى المحاولة مرة أخرى');
    } else if ((error as any)?.code === 'deadline-exceeded') {
      throw new Error('❌ انتهت مهلة الاتصال. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى');
    } else {
      throw new Error(`❌ خطأ في استرجاع الطلبات: ${(error as any)?.message || 'خطأ غير معروف'}`);
    }
  }
};

export const acceptRequest = async (requestId: string, acceptedBy: string): Promise<void> => {
  try {
    console.log('Accepting request:', requestId, 'by user:', acceptedBy);
    
    const q = query(
      collection(db, 'manufacturingRequests'),
      where('requestId', '==', requestId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'manufacturingRequests', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        status: 'قيد التنفيذ',
        acceptedBy: acceptedBy,
        updatedAt: Timestamp.now().toDate()
      });
      console.log('Request accepted successfully');
    } else {
      throw new Error('الطلب غير موجود');
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    throw new Error(`خطأ في قبول الطلب: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const deleteRequest = async (requestId: string): Promise<void> => {
  try {
    console.log('Deleting request:', requestId);
    
    const q = query(
      collection(db, 'manufacturingRequests'),
      where('requestId', '==', requestId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'manufacturingRequests', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        status: 'ملغي',
        updatedAt: Timestamp.now().toDate()
      });
      console.log('Request deleted successfully');
    } else {
      throw new Error('الطلب غير موجود');
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    throw new Error(`خطأ في حذف الطلب: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const updateRequestStatus = async (
  requestId: string, 
  status: 'نشط' | 'قيد المراجعة' | 'قيد التنفيذ' | 'مكتمل' | 'ملغي',
  acceptedBy?: string
): Promise<void> => {
  try {
    console.log('🔄 تحديث حالة الطلب:', requestId, status, acceptedBy);
    
    const q = query(
      collection(db, 'manufacturingRequests'),
      where('requestId', '==', requestId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'manufacturingRequests', querySnapshot.docs[0].id);
      const updateData: any = {
        status: status,
        updatedAt: Timestamp.now().toDate()
      };
      
      if (acceptedBy) {
        updateData.acceptedBy = acceptedBy;
      }
      
      await updateDoc(docRef, updateData);
      console.log('✅ تم تحديث حالة الطلب بنجاح');
    } else {
      throw new Error('الطلب غير موجود');
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطلب:', error);
    throw new Error(`خطأ في تحديث حالة الطلب: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getCompletedRequestsByManufacturer = async (manufacturerUid: string): Promise<ManufacturingRequest[]> => {
  try {
    console.log('🔍 البحث عن الطلبات المكتملة للمصنع:', manufacturerUid);
    
    // استعلام مبسط للطلبات المكتملة
    const requestsRef = collection(db, 'manufacturingRequests');
    const q = query(
      requestsRef,
      where('status', '==', 'مكتمل'),
      where('acceptedBy', '==', manufacturerUid)
    );
    
    const querySnapshot = await getDocs(q);
    const requests: ManufacturingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        
        requests.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as ManufacturingRequest);
      } catch (docError) {
        console.error('❌ خطأ في معالجة طلب مكتمل:', doc.id, docError);
      }
    });
    
    // ترتيب محلي حسب آخر تحديث
    requests.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    console.log(`✅ تم العثور على ${requests.length} طلب مكتمل للمصنع`);
    return requests;
  } catch (error) {
    console.error('❌ خطأ في استرجاع الطلبات المكتملة للمصنع:', error);
    throw new Error(`خطأ في استرجاع الطلبات المكتملة: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getAllCurrentRequests = async (userId: string, userType: 'client' | 'manufacturer'): Promise<ManufacturingRequest[]> => {
  try {
    console.log('🔍 جلب جميع الطلبات الحالية للمستخدم:', userId, userType);
    
    const requestsRef = collection(db, 'manufacturingRequests');
    let requests: ManufacturingRequest[] = [];
    
    if (userType === 'client') {
      // جلب جميع طلبات العميل
      const clientQuery = query(requestsRef, where('uid', '==', userId));
      const clientSnapshot = await getDocs(clientQuery);
      
      clientSnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as ManufacturingRequest);
      });
    } else {
      // جلب جميع الطلبات التي قبلها المصنع
      const manufacturerQuery = query(requestsRef, where('acceptedBy', '==', userId));
      const manufacturerSnapshot = await getDocs(manufacturerQuery);
      
      manufacturerSnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as ManufacturingRequest);
      });
    }
    
    // ترتيب محلي حسب آخر تحديث
    requests.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    console.log(`✅ تم العثور على ${requests.length} طلب حالي`);
    return requests;
  } catch (error) {
    console.error('❌ خطأ في جلب الطلبات الحالية:', error);
    throw new Error(`خطأ في جلب الطلبات الحالية: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};
