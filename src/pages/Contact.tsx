
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const Contact = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: Mail,
      titleAr: "البريد الإلكتروني",
      titleEn: "Email",
      valueAr: "info@san3ly.com",
      valueEn: "info@san3ly.com",
      linkType: "mailto"
    },
    {
      icon: Phone,
      titleAr: "الهاتف",
      titleEn: "Phone",
      valueAr: "+970 599 123 456",
      valueEn: "+970 599 123 456",
      linkType: "tel"
    },
    {
      icon: MapPin,
      titleAr: "العنوان",
      titleEn: "Address",
      valueAr: "غزة، فلسطين",
      valueEn: "Gaza, Palestine",
      linkType: null
    },
    {
      icon: Clock,
      titleAr: "ساعات العمل",
      titleEn: "Working Hours",
      valueAr: "الأحد - الخميس: 8:00 - 17:00",
      valueEn: "Sunday - Thursday: 8:00 - 17:00",
      linkType: null
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'نحن هنا لمساعدتك. تواصل معنا في أي وقت وسنكون سعداء للرد على استفساراتك'
              : 'We are here to help you. Contact us anytime and we will be happy to answer your questions'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <MessageSquare className="w-5 h-5" />
                  {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  const content = (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {language === 'ar' ? info.titleAr : info.titleEn}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {language === 'ar' ? info.valueAr : info.valueEn}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <div key={index}>
                      {info.linkType ? (
                        <a 
                          href={`${info.linkType}:${info.valueEn}`}
                          className="block cursor-pointer"
                        >
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'ar' ? 'كيف يمكنني التسجيل في المنصة؟' : 'How can I register on the platform?'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {language === 'ar' 
                        ? 'يمكنك التسجيل بسهولة من خلال النقر على زر "إنشاء حساب" وتعبئة البيانات المطلوبة.'
                        : 'You can register easily by clicking the "Register" button and filling in the required information.'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'ar' ? 'هل التسجيل مجاني؟' : 'Is registration free?'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {language === 'ar' 
                        ? 'نعم، التسجيل في المنصة مجاني بالكامل لجميع المستخدمين.'
                        : 'Yes, registration on the platform is completely free for all users.'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'ar' ? 'كم يستغرق الرد على الطلبات؟' : 'How long does it take to respond to requests?'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {language === 'ar' 
                        ? 'عادة ما يتم الرد على الطلبات خلال 24 ساعة من المصانع المتخصصة.'
                        : 'Requests are usually responded to within 24 hours by specialized factories.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {language === 'ar' ? 'أرسل رسالة' : 'Send Message'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'الموضوع' : 'Subject'}
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'أدخل موضوع الرسالة' : 'Enter message subject'}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[120px]"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Support Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 dark:text-green-200 text-sm font-medium">
              {language === 'ar' ? 'فريق الدعم متاح الآن' : 'Support team is available now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
