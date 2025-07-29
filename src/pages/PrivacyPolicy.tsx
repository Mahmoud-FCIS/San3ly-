
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">سياسة الخصوصية</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div className="space-y-6 text-right">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. مقدمة</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                تهتم San3ly بحماية خصوصيتك وأمان معلوماتك الشخصية. هذه السياسة توضح كيفية جمع واستخدام وحماية البيانات التي تقدمها لنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. البيانات التي نجمعها</h2>
              <ul className="list-disc pr-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                <li>معلومات الموقع والعنوان</li>
                <li>بيانات الاستخدام وسجل الأنشطة على المنصة</li>
                <li>معلومات الدفع والمعاملات المالية</li>
                <li>الصور والملفات المرفوعة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. كيفية استخدام البيانات</h2>
              <ul className="list-disc pr-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>تقديم وتحسين الخدمات المقدمة</li>
                <li>التواصل معك بخصوص حسابك والطلبات</li>
                <li>معالجة المدفوعات والمعاملات المالية</li>
                <li>حماية المنصة من الاحتيال والأنشطة المشبوهة</li>
                <li>إرسال التحديثات والإشعارات المهمة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. مشاركة البيانات</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                لا نشارك بياناتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
              </p>
              <ul className="list-disc pr-6 space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>بموافقتك الصريحة</li>
                <li>لتقديم الخدمات المطلوبة (مثل معالجة المدفوعات)</li>
                <li>للامتثال للقوانين والأنظمة</li>
                <li>لحماية حقوقنا وحقوق المستخدمين الآخرين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. أمان البيانات</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                نستخدم أحدث تقنيات الأمان لحماية بياناتك، بما في ذلك التشفير وبروتوكولات الأمان المتقدمة. نقوم بمراجعة وتحديث إجراءات الأمان بانتظام.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. حقوقك</h2>
              <ul className="list-disc pr-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح أو تحديث المعلومات</li>
                <li>حذف حسابك وبياناتك</li>
                <li>الاعتراض على معالجة بياناتك</li>
                <li>نقل بياناتك إلى خدمة أخرى</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. ملفات تعريف الارتباط</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة وتذكر تفضيلاتك. يمكنك التحكم في هذه الملفات من خلال إعدادات المتصفح.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. التحديثات</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                قد نحدث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر البريد الإلكتروني أو المنصة قبل دخولها حيز التنفيذ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. الاتصال</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                لأي أسئلة حول سياسة الخصوصية أو لممارسة حقوقك، يرجى التواصل معنا عبر: privacy@san3ly.com
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
