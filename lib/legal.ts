// lib/legal.ts
// The privacy policy and terms of service, in both languages. Plain data, rendered by
// component/LegalPage.tsx. Keep it true to what the app does (what it stores, who it
// shares with): Google's consent screen links to the privacy policy.

export type LegalSection = { heading: string; paragraphs?: string[]; points?: string[] };
export type LegalDocument = { title: string; updated: string; intro: string; sections: LegalSection[] };

export const LEGAL_CONTACT = 'mizan.org.eg@gmail.com';

const privacyAr: LegalDocument = {
  title: 'سياسة الخصوصية',
  updated: 'آخر تحديث: 23 نوفمبر 2026',
  intro:
    'توضح هذه السياسة البيانات التي يجمعها ميزان (نظام إدارة المبيعات والحسابات على الإنترنت) وكيف نستخدمها ونحميها. باستخدامك للنظام فإنك توافق على ما ورد فيها.',
  sections: [
    {
      heading: 'البيانات التي نجمعها',
      points: [
        'بيانات الحساب: الاسم، والبريد الإلكتروني، وكلمة المرور (نحفظها مشفّرة ولا يمكن قراءتها)، والدور داخل الشركة.',
        'عند تسجيل الدخول بحساب Google: الاسم والبريد الإلكتروني والمعرّف الذي يرسله Google فقط. لا نصل إلى بريدك أو ملفاتك أو أي بيانات أخرى في حسابك.',
        'بيانات الشركة: الاسم، والرقم الضريبي، والسجل التجاري، والعنوان، والهاتف، والشعار.',
        'البيانات التي تدخلها في النظام: العملاء وبيانات التواصل معهم، والفواتير، وعروض الأسعار، والدفعات، والمصروفات والإيصالات، والصفقات، والمهام، والقيود المحاسبية.',
        'سجل العمليات: من قام بكل عملية ومتى، وتسجيلات الدخول وعناوين IP، لحماية حسابك ولكي يراجعها مالك الشركة.',
        'بيانات الاشتراك: الباقة ومواعيد التجديد وسجل المدفوعات. بيانات البطاقة يدخلها العميل في صفحة Paymob مباشرة، ولا نحتفظ إلا بآخر أربعة أرقام ونوع البطاقة ورمز يتيح التجديد التلقائي.',
      ],
    },
    {
      heading: 'كيف نستخدم البيانات',
      points: [
        'تشغيل الخدمة: إصدار الفواتير، وتسجيل الدفعات، وإعداد التقارير والقيود.',
        'إرسال الرسائل اللازمة لعمل النظام: تأكيد البريد، واستعادة كلمة المرور، ودعوات الفريق، والفواتير وعروض الأسعار وتذكيرات الدفع التي يطلب المستخدم إرسالها لعملائه.',
        'تحصيل الاشتراكات وتجديدها.',
        'حماية الحسابات ومنع إساءة الاستخدام.',
      ],
      paragraphs: ['لا نبيع بياناتك، ولا نستخدمها في الإعلانات، ولا نضع في الموقع أدوات تتبّع أو تحليلات إعلانية.'],
    },
    {
      heading: 'بيانات Google',
      paragraphs: [
        'يلتزم استخدام ميزان للمعلومات التي يتلقاها من واجهات Google البرمجية (Google APIs) بسياسة بيانات المستخدمين لخدمات Google API، بما في ذلك متطلبات الاستخدام المحدود. نستخدم بيانات تسجيل الدخول بحساب Google فقط لإنشاء حسابك في ميزان والدخول إليه.',
      ],
    },
    {
      heading: 'مع من نشارك البيانات',
      paragraphs: ['نشارك البيانات فقط مع مقدّمي الخدمات الذين يحتاجهم النظام ليعمل، وبالقدر اللازم:'],
      points: [
        'الاستضافة وقاعدة البيانات: Railway.',
        'إرسال البريد الإلكتروني: Google (Gmail).',
        'الدفع الإلكتروني: Paymob.',
        'تسجيل الدخول بحساب Google: Google.',
      ],
    },
    {
      heading: 'بيانات عملاء شركتك',
      paragraphs: [
        'البيانات التي تدخلها عن عملائك ملك لشركتك، وأنت المسؤول عن جمعها وعن صحتها. ميزان يحفظها ويعالجها نيابةً عنك ولتقديم الخدمة لك فقط. تظهر صفحة الفاتورة أو عرض السعر لمن يملك رابطها فقط.',
      ],
    },
    {
      heading: 'حماية البيانات',
      points: [
        'الاتصال بالنظام مشفّر (HTTPS).',
        'كلمات المرور محفوظة بطريقة تشفير لا يمكن عكسها.',
        'كل مستخدم يرى ما يسمح به دوره فقط، وبيانات كل شركة منفصلة عن غيرها.',
      ],
    },
    {
      heading: 'ملفات تعريف الارتباط (Cookies)',
      paragraphs: [
        'نستخدم ملف تعريف ارتباط واحداً ضرورياً لإبقائك مسجلاً للدخول، ولا يمكن قراءته من صفحات الموقع. لا نستخدم ملفات تعريف ارتباط للإعلانات أو التتبع.',
      ],
    },
    {
      heading: 'مدة الاحتفاظ والحذف',
      paragraphs: [
        'نحتفظ بالبيانات ما دام حساب الشركة قائماً. يمكن لمالك الشركة طلب حذف حساب الشركة وكل بياناتها بمراسلتنا. عند إزالة عضو من الفريق يتوقف دخوله فوراً، وتبقى العمليات التي سجّلها ضمن سجلات الشركة لأنها جزء من حساباتها.',
      ],
    },
    {
      heading: 'حقوقك',
      paragraphs: [
        `يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها بمراسلتنا على ${LEGAL_CONTACT}، وسنرد خلال مدة معقولة.`,
      ],
    },
    {
      heading: 'تعديل هذه السياسة',
      paragraphs: ['قد نعدّل هذه السياسة من وقت لآخر، وسيظهر تاريخ آخر تحديث أعلى الصفحة. في التعديلات الجوهرية سنُبلغ أصحاب الحسابات.'],
    },
    {
      heading: 'التواصل',
      paragraphs: [`لأي سؤال عن الخصوصية: ${LEGAL_CONTACT}`],
    },
  ],
};

const privacyEn: LegalDocument = {
  title: 'Privacy Policy',
  updated: 'Last updated: November 23, 2026',
  intro:
    'This policy explains what data Mizan (an online sales and accounting system) collects, and how we use and protect it. By using the system you agree to it.',
  sections: [
    {
      heading: 'Data we collect',
      points: [
        'Account data: name, email address, password (stored hashed, never readable), and your role in the company.',
        'When you sign in with Google: only the name, email address and account identifier Google sends. We do not access your mailbox, files or any other data in your Google account.',
        'Company data: name, tax number, commercial register, address, phone and logo.',
        'What you enter in the system: customers and their contact details, invoices, quotes, payments, expenses and receipts, deals, tasks and journal entries.',
        "Activity log: who did what and when, sign-ins and IP addresses, to protect your account and for the company owner's review.",
        "Subscription data: plan, renewal dates and payment history. Card details are entered on Paymob's page directly; we keep only the last four digits, the card brand and a token that allows automatic renewal.",
      ],
    },
    {
      heading: 'How we use it',
      points: [
        'To run the service: invoices, payments, reports and journal entries.',
        'To send the emails the system needs: email confirmation, password resets, team invitations, and the invoices, quotes and payment reminders users choose to send to their customers.',
        'To collect and renew subscriptions.',
        'To keep accounts secure and prevent abuse.',
      ],
      paragraphs: ['We do not sell your data, use it for advertising, or run advertising trackers or analytics on the site.'],
    },
    {
      heading: 'Google user data',
      paragraphs: [
        "Mizan's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We use Google sign-in data only to create your Mizan account and sign you in.",
      ],
    },
    {
      heading: 'Who we share data with',
      paragraphs: ['Only the service providers the system needs to work, and only as much as they need:'],
      points: [
        'Hosting and database: Railway.',
        'Email delivery: Google (Gmail).',
        'Online payments: Paymob.',
        'Sign-in with Google: Google.',
      ],
    },
    {
      heading: "Your company's customer data",
      paragraphs: [
        "The data you enter about your customers belongs to your company, and you are responsible for collecting it and for its accuracy. Mizan stores and processes it on your behalf, only to provide the service to you. An invoice or quote page is visible only to people who have its link.",
      ],
    },
    {
      heading: 'Security',
      points: [
        'Connections to the system are encrypted (HTTPS).',
        'Passwords are stored with one-way hashing.',
        "Each user sees only what their role allows, and each company's data is kept separate from every other's.",
      ],
    },
    {
      heading: 'Cookies',
      paragraphs: [
        'We use a single essential cookie to keep you signed in; pages on the site cannot read it. We use no advertising or tracking cookies.',
      ],
    },
    {
      heading: 'Retention and deletion',
      paragraphs: [
        "We keep data for as long as the company's account exists. The company owner can ask us to delete the account and all its data. When a member is removed from a team, their access ends at once, and the records they made stay in the company's books.",
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [`You can ask to see, correct or delete your data by writing to ${LEGAL_CONTACT}; we will answer within a reasonable time.`],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: ['We may change this policy from time to time; the date at the top shows the latest version. We will tell account owners about material changes.'],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about privacy: ${LEGAL_CONTACT}`],
    },
  ],
};

const termsAr: LegalDocument = {
  title: 'الشروط والأحكام',
  updated: 'آخر تحديث: 23 نوفمبر 2026',
  intro: 'تنظّم هذه الشروط استخدامك لميزان. بإنشاء حساب أو استخدام النظام فإنك توافق عليها.',
  sections: [
    {
      heading: 'الخدمة',
      paragraphs: [
        'ميزان نظام على الإنترنت لإدارة العملاء والصفقات وعروض الأسعار والفواتير والدفعات والمصروفات والتقارير والقيود المحاسبية للشركات.',
      ],
    },
    {
      heading: 'الحساب والفريق',
      points: [
        'من ينشئ حساب الشركة يصبح مالكه، وهو المسؤول عن دعوة أعضاء الفريق وتحديد صلاحياتهم وإزالتهم.',
        'أنت مسؤول عن سرية كلمة المرور وعن كل ما يتم من خلال حسابك.',
        'يجب أن تكون البيانات التي تسجّل بها صحيحة.',
      ],
    },
    {
      heading: 'الاستخدام المقبول',
      points: [
        'لا تستخدم النظام في أي نشاط مخالف للقانون، أو لإرسال رسائل مزعجة، أو لانتحال صفة غيرك.',
        'لا تحاول الوصول إلى بيانات شركات أخرى أو تعطيل النظام أو تجاوز حدود الباقات.',
      ],
    },
    {
      heading: 'بياناتك',
      paragraphs: [
        'البيانات التي تدخلها ملك لشركتك. تمنح ميزان الإذن بحفظها ومعالجتها لتقديم الخدمة فقط، كما توضح سياسة الخصوصية.',
      ],
    },
    {
      heading: 'مسؤولية الحسابات والضرائب',
      paragraphs: [
        'ميزان أداة تساعدك على تنظيم حساباتك، ولا يُعد استشارة محاسبية أو ضريبية. أنت المسؤول عن صحة ما تدخله وعن إقراراتك والتزاماتك أمام الجهات المختصة، وننصح بمراجعتها مع محاسبك.',
      ],
    },
    {
      heading: 'الباقات والدفع',
      points: [
        'الباقة المجانية لها حدود (مثل عدد المستخدمين والفواتير الشهرية)، وتظهر حدود كل باقة وسعرها داخل النظام قبل الاشتراك.',
        'الاشتراك المدفوع شهري ويتجدد تلقائياً من البطاقة المحفوظة حتى تلغيه.',
        'يمكنك الإلغاء في أي وقت، وتبقى باقتك حتى نهاية الفترة المدفوعة ثم ترجع للمجانية.',
        'إذا فشل التجديد نعيد المحاولة، وإن لم يتم الدفع خلال 7 أيام ترجع الشركة إلى الباقة المجانية دون حذف بياناتها.',
        'قد نغيّر الأسعار، ولن يسري أي تغيير على فترة دفعت ثمنها بالفعل.',
      ],
    },
    {
      heading: 'توفر الخدمة',
      paragraphs: [
        'نسعى لأن يعمل النظام بشكل متواصل، لكن قد يتوقف أحياناً للصيانة أو لأسباب خارجة عن إرادتنا. تُقدَّم الخدمة "كما هي"، ولا نتحمل المسؤولية عن أي خسارة غير مباشرة تنتج عن استخدامها أو تعذّر استخدامها، في حدود ما يسمح به القانون.',
      ],
    },
    {
      heading: 'الإيقاف والإنهاء',
      paragraphs: [
        'يمكنك التوقف عن استخدام الخدمة في أي وقت وطلب حذف بيانات شركتك. ويحق لنا إيقاف أي حساب يخالف هذه الشروط.',
      ],
    },
    {
      heading: 'تعديل الشروط',
      paragraphs: ['قد نعدّل هذه الشروط، وسيظهر تاريخ آخر تحديث أعلى الصفحة. استمرارك في استخدام النظام بعد التعديل يعني موافقتك عليه.'],
    },
    {
      heading: 'القانون المطبّق',
      paragraphs: ['تخضع هذه الشروط لقوانين جمهورية مصر العربية.'],
    },
    {
      heading: 'التواصل',
      paragraphs: [`لأي سؤال عن هذه الشروط: ${LEGAL_CONTACT}`],
    },
  ],
};

const termsEn: LegalDocument = {
  title: 'Terms of Service',
  updated: 'Last updated: November 23, 2026',
  intro: 'These terms govern your use of Mizan. By creating an account or using the system, you agree to them.',
  sections: [
    {
      heading: 'The service',
      paragraphs: [
        'Mizan is an online system for managing customers, deals, quotes, invoices, payments, expenses, reports and journal entries for businesses.',
      ],
    },
    {
      heading: 'Accounts and teams',
      points: [
        "Whoever creates the company's account becomes its owner, and is responsible for inviting team members, setting their permissions and removing them.",
        'You are responsible for keeping your password secret and for everything done through your account.',
        'The details you sign up with must be accurate.',
      ],
    },
    {
      heading: 'Acceptable use',
      points: [
        'Do not use the system for anything unlawful, to send spam, or to impersonate others.',
        "Do not try to access other companies' data, disrupt the system or get around plan limits.",
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'The data you enter belongs to your company. You allow Mizan to store and process it only to provide the service, as described in the Privacy Policy.',
      ],
    },
    {
      heading: 'Accounting and tax responsibility',
      paragraphs: [
        'Mizan is a tool that helps you organize your books; it is not accounting or tax advice. You are responsible for the accuracy of what you enter and for your filings and obligations to the authorities; we recommend reviewing them with your accountant.',
      ],
    },
    {
      heading: 'Plans and payment',
      points: [
        "The free plan has limits (such as the number of users and invoices per month); each plan's limits and price are shown in the system before you subscribe.",
        'Paid plans are monthly and renew automatically from the saved card until you cancel.',
        'You can cancel at any time; your plan stays until the end of the paid period, then returns to free.',
        "If a renewal fails we retry; if it isn't paid within 7 days, the company returns to the free plan without losing its data.",
        'We may change prices; a change never applies to a period you have already paid for.',
      ],
    },
    {
      heading: 'Availability',
      paragraphs: [
        'We aim to keep the system running at all times, but it may sometimes stop for maintenance or for reasons outside our control. The service is provided "as is", and, as far as the law allows, we are not liable for indirect losses arising from using it or being unable to use it.',
      ],
    },
    {
      heading: 'Suspension and termination',
      paragraphs: [
        "You can stop using the service at any time and ask us to delete your company's data. We may suspend any account that breaks these terms.",
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: ['We may change these terms; the date at the top shows the latest version. Using the system after a change means you accept it.'],
    },
    {
      heading: 'Governing law',
      paragraphs: ['These terms are governed by the laws of the Arab Republic of Egypt.'],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about these terms: ${LEGAL_CONTACT}`],
    },
  ],
};

export const LEGAL = {
  ar: { privacy: privacyAr, terms: termsAr },
  en: { privacy: privacyEn, terms: termsEn },
} as const;
