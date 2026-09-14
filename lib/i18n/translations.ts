export type Locale = "en" | "ar";

export const defaultLocale: Locale = "en";

export const translations = {
  en: {
    // Navigation
    nav: {
      catalog: "Catalog",
      suppliers: "Suppliers",
      solutions: "Solutions",
      pricing: "Pricing",
      about: "About",
      signIn: "Sign In",
      getStarted: "Get Started",
    },
    // Hero
    hero: {
      badge: "Now serving 200+ Egyptian hotels",
      headline: "The procurement platform built for Egyptian hospitality",
      subheadline:
        "Connect hotels, suppliers, logistics, and factoring on a single compliant platform. From catalog discovery to ETA e-invoice submission.",
      ctaPrimary: "Start Free",
      ctaSecondary: "Explore Catalog",
      stats: {
        skus: "SKUs",
        suppliers: "Suppliers",
        gmv: "EGP GMV",
        delivery: "Delivery",
      },
    },
    // Trust bar
    trust: {
      label: "Trusted by leading hotels",
    },
    // Categories
    categories: {
      title: "Everything your hotel needs",
      subtitle: "Verified suppliers across six core procurement categories.",
      browse: "Browse",
    },
    // Features
    features: {
      title: "Capabilities",
      subtitle:
        "From catalog discovery to ETA-compliant invoicing — one platform, zero fragmentation.",
    },
    // How it works
    howItWorks: {
      title: "How it works",
      subtitle: "From catalog to compliance in three steps",
      steps: {
        discover: {
          title: "Discover",
          desc: "Browse verified suppliers across 6 categories. Filter by price, MOQ, and delivery zone.",
        },
        order: {
          title: "Order",
          desc: "Build purchase orders with AI-suggested bundles. Route through your Authority Matrix.",
        },
        fulfill: {
          title: "Fulfill",
          desc: "Track shared-logistics delivery in real time. Invoice auto-submits to ETA.",
        },
      },
    },
    // Metrics
    metrics: {
      hotels: "Hotels Onboarded",
      clusters: "Coastal Clusters",
      delivery: "Avg. Delivery",
      savings: "Cost Reduction",
    },
    // Pricing
    pricing: {
      title: "Simple, transparent plans",
      subtitle: "No hidden fees. Scale as you grow.",
      starter: {
        name: "Starter",
        price: "0",
        period: "free forever",
        desc: "For small hotels exploring digital procurement",
        cta: "Get Started Free",
      },
      professional: {
        name: "Professional",
        price: "4,500",
        period: "EGP / month",
        desc: "For growing hotels ready to automate",
        cta: "Start 14-Day Trial",
        badge: "Most Popular",
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        period: "tailored pricing",
        desc: "For hotel groups with 5+ properties",
        cta: "Contact Sales",
      },
    },
    // CTA
    cta: {
      title: "Ready to transform your procurement?",
      subtitle:
        "Join 200+ Egyptian hotels and 1,200+ suppliers. Setup takes less than 10 minutes.",
      primary: "Get Started Free",
      secondary: "Browse Catalog",
    },
    // Footer
    footer: {
      tagline: "The Digital Procurement Hub for Egyptian Hospitality.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      copyright: "© 2026 Hotels Vendors. All rights reserved.",
    },
    // Catalog
    catalog: {
      title: "One-Stop Hotel Procurement",
      badge: "Public Marketplace — Browse without signing in",
      searchPlaceholder: "Search products, suppliers, SKUs...",
      filters: "Filters",
      sort: "Sort by",
      viewGrid: "Grid",
      viewList: "List",
      results: "products found",
      noResults: "No products match your search.",
      loginPrompt: "Sign in to add to cart",
      categories: {
        fb: "Food & Beverage",
        hk: "Housekeeping",
        ffe: "Furniture & Fixtures",
        ose: "Operating Supplies",
        gra: "Guest Room Amenities",
        lin: "Linens & Textiles",
        eng: "Engineering",
        spa: "Spa & Recreation",
        it: "IT & Technology",
        sec: "Safety & Security",
      },
    },
    // Language
    language: {
      en: "English",
      ar: "العربية",
    },
    // Dashboard sidebar & common
    dashboard: {
      sidebar: {
        overview: "Overview",
        orders: "Orders",
        invoices: "Invoices",
        products: "Products",
        suppliers: "Suppliers",
        analytics: "Analytics",
        settings: "Settings",
        help: "Help & Support",
        logout: "Log Out",
        catalog: "Catalog",
        factoring: "Factoring",
        shipping: "Shipping & Logistics",
        compliance: "Compliance",
        users: "User Management",
        tenants: "Tenant Management",
        roles: "Roles & Permissions",
        auditLog: "Audit Log",
        health: "System Health",
        reports: "Reports",
      },
      header: {
        dashboard: "Dashboard",
        search: "Search commands...",
        noResults: "No results found.",
      },
      common: {
        welcome: "Welcome back",
        totalOrders: "Total Orders",
        pendingOrders: "Pending Orders",
        totalSpend: "Total Spend",
        recentActivity: "Recent Activity",
        viewAll: "View All",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        today: "Today",
        yesterday: "Yesterday",
        noData: "No data available",
        refresh: "Refresh",
        export: "Export",
        download: "Download",
        upload: "Upload",
        filter: "Filter",
        clearFilters: "Clear Filters",
        bulkActions: "Bulk Actions",
        selectAll: "Select All",
        deselectAll: "Deselect All",
        confirmDelete: "Are you sure you want to delete this?",
        undo: "Undo",
        redo: "Redo",
      },
    },
    // About page
    about: {
      title: "About HotelsVendors",
      subtitle: "Egypt's B2B hospitality procurement infrastructure",
      mission: "Our Mission",
      missionText: "To empower Egyptian hotels with a digital procurement platform that reduces costs, ensures compliance, and connects them with verified suppliers.",
      vision: "Our Vision",
      visionText: "To become the leading procurement infrastructure for Egyptian hospitality — the Amazon of hotel supply chains.",
      values: "Our Values",
      valuesText: "Transparency, compliance, efficiency, and empowerment for SME suppliers across Egypt.",
      team: "Our Team",
      contact: "Get in Touch",
      contactText: "Have questions? We'd love to hear from you.",
      partners: "Trusted Partners",
    },
    // Contact page
    contact: {
      title: "Contact Us",
      subtitle: "We're here to help with your procurement needs",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      company: "Company Name",
      role: "Your Role",
      hotel: "Hotel",
      supplier: "Supplier",
      other: "Other",
      subject: "Subject",
      message: "Your Message",
      send: "Send Message",
      sending: "Sending...",
      success: "Message sent successfully! We'll get back to you within 24 hours.",
      error: "Something went wrong. Please try again or email us directly.",
      offices: "Our Offices",
      cairo: "Cairo, Egypt",
      support: "Support",
      supportEmail: "support@hotelsvendors.com",
      sales: "Sales",
      salesEmail: "sales@hotelsvendors.com",
      general: "General Inquiries",
      generalEmail: "info@hotelsvendors.com",
    },
    // Extended Footer
    footerExtended: {
      about: "About",
      aboutText: "HotelsVendors is Egypt's first B2B hospitality procurement platform, purpose-built for the Egyptian hotel industry.",
      products: "Products",
      marketplace: "Marketplace",
      factoringService: "Invoice Factoring",
      invo: "INVO",
      complianceSolution: "Compliance",
      resources: "Resources",
      blog: "Blog",
      documentation: "Documentation",
      apiReference: "API Reference",
      statusPage: "Status Page",
      contactUs: "Contact Us",
      followUs: "Follow Us",
      newsletter: "Newsletter",
      newsletterText: "Stay updated with the latest in hotel procurement.",
      emailPlaceholder: "Enter your email",
      subscribe: "Subscribe",
    },
  },
  ar: {
    // Navigation
    nav: {
      catalog: "الكتالوج",
      suppliers: "الموردون",
      solutions: "الحلول",
      pricing: "الأسعار",
      about: "عنّا",
      signIn: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
    },
    // Hero
    hero: {
      badge: "نخدم الآن أكثر من 200 فندق مصري",
      headline: "منصة المشتريات الرقمية لقطاع الضيافة في مصر",
      subheadline:
        "ربط الفنادق والموردين وشركات الشحن وجهات التمويل في منصة واحدة متوافقة مع هيئة الضرائب — من التصفح وحتى الفاتورة الإلكترونية.",
      ctaPrimary: "ابدأ مجاناً",
      ctaSecondary: "تصفح الكتالوج",
      stats: {
        skus: "صنف",
        suppliers: "مورد",
        gmv: "مليار جنيه",
        delivery: "ساعة توصيل",
      },
    },
    // Trust bar
    trust: {
      label: "يثق بنا كبار الفنادق",
    },
    // Categories
      categories: {
        title: "كل ما يحتاجه فندقك",
        subtitle: "موردون موثوقون عبر ست فئات مشتريات أساسية.",
        browse: "تسوّق",
      },
    // Features
    features: {
      title: "القدرات",
      subtitle:
        "من اكتشاف الكتالوج إلى الفوترة المتوافقة — منصة واحدة، بدون تجزئة.",
    },
    // How it works
    howItWorks: {
      title: "كيف تعمل المنصة",
      subtitle: "من الكتالوج إلى الامتثال في ثلاث خطوات",
      steps: {
        discover: {
          title: "اكتشف",
          desc: "تصفح موردين موثوقين عبر 6 فئات. صفّل حسب السعر والحد الأدنى ومنطقة التوصيل.",
        },
        order: {
          title: "اطلب",
          desc: "بناء أوامر شراء مع حزم مقترحة بالذكاء الاصطناعي. مرر عبر مصفوفة الصلاحيات.",
        },
        fulfill: {
          title: "نفّذ",
          desc: "تتبع التوصيل اللوجستي المشترك في الوقت الفعلي. يتم إرسال الفاتورة تلقائياً للهيئة الضريبية.",
        },
      },
    },
    // Metrics
    metrics: {
      hotels: "فندق مسجل",
      clusters: "تجمع ساحلي",
      delivery: "متوسط التوصيل",
      savings: "توفير في التكاليف",
    },
    // Pricing
    pricing: {
      title: "خطط بسيطة وشفافة",
      subtitle: "بدون رسوم خفية. توسع مع نموك.",
      starter: {
        name: "البداية",
        price: "0",
        period: "مجاني للأبد",
        desc: "للفنادق الصغيرة التي تستكشف المشتريات الرقمية",
        cta: "ابدأ مجاناً",
      },
      professional: {
        name: "احترافي",
        price: "4,500",
        period: "جنيه / شهر",
        desc: "للفنادق النامية الجاهزة للأتمتة",
        cta: "ابدأ تجربة 14 يوم",
        badge: "الأكثر اختياراً",
      },
      enterprise: {
        name: "مؤسسات",
        price: "مخصص",
        period: "تسعير مخصص",
        desc: "لمجموعات الفنادق ذات 5+ فنادق",
        cta: "تواصل مع المبيعات",
      },
    },
    // CTA
    cta: {
      title: "جاهز لتحويل مشترياتك؟",
      subtitle:
        "انضم إلى 200+ فندق مصري و1,200+ مورد. الإعداد يستغرق أقل من 10 دقائق.",
      primary: "ابدأ مجاناً",
      secondary: "تصفح الكتالوج",
    },
    // Footer
    footer: {
      tagline: "مركز المشتريات الرقمي لقطاع الضيافة المصري.",
      product: "المنتج",
      company: "الشركة",
      legal: "قانوني",
      copyright: "© 2026 Hotels Vendors. جميع الحقوق محفوظة.",
    },
    // Catalog
    catalog: {
      title: "منصة مشتريات الفنادق الشاملة",
      badge: "سوق مفتوح — تسوّق بدون تسجيل",
      searchPlaceholder: "ابحث في المنتجات والموردين والأكواد...",
      filters: "عوامل التصفية",
      sort: "ترتيب حسب",
      viewGrid: "شبكة",
      viewList: "قائمة",
      results: "منتج موجود",
      noResults: "لا توجد منتجات تطابق بحثك.",
      loginPrompt: "سجّل الدخول للإضافة إلى عربة التسوق",
      categories: {
        fb: "الأطعمة والمشروبات",
        hk: "التدبير المنزلي",
        ffe: "الأثاث والتجهيزات",
        ose: "مستلزمات التشغيل",
        gra: "مستلزمات الغرف",
        lin: "المفروشات والمنسوجات",
        eng: "الهندسة",
        spa: "السبا والترفيه",
        it: "تكنولوجيا المعلومات",
        sec: "السلامة والأمان",
      },
    },
    // Language
    language: {
      en: "English",
      ar: "العربية",
    },
    // Dashboard sidebar & common
    dashboard: {
      sidebar: {
        overview: "نظرة عامة",
        orders: "الطلبات",
        invoices: "الفواتير",
        products: "المنتجات",
        suppliers: "الموردون",
        analytics: "التحليلات",
        settings: "الإعدادات",
        help: "المساعدة والدعم",
        logout: "تسجيل الخروج",
      catalog: "تسوّق",
        factoring: "التمويل",
        shipping: "الشحن واللوجستيات",
        compliance: "الامتثال",
        users: "إدارة المستخدمين",
        tenants: "إدارة المستأجرين",
        roles: "الأدوار والصلاحيات",
        auditLog: "سجل المراجعة",
        health: "صحة النظام",
        reports: "التقارير",
      },
      header: {
        dashboard: "لوحة التحكم",
        search: "البحث في الأوامر...",
        noResults: "لا توجد نتائج.",
      },
      common: {
        welcome: "مرحباً بعودتك",
        totalOrders: "إجمالي الطلبات",
        pendingOrders: "الطلبات المعلقة",
        totalSpend: "إجمالي الإنفاق",
        recentActivity: "النشاط الأخير",
        viewAll: "عرض الكل",
        thisMonth: "هذا الشهر",
        lastMonth: "الشهر الماضي",
        today: "اليوم",
        yesterday: "أمس",
        noData: "لا توجد بيانات",
        refresh: "تحديث",
        export: "تصدير",
        download: "تحميل",
        upload: "رفع",
        filter: "تصفية",
        clearFilters: "مسح عوامل التصفية",
        bulkActions: "إجراءات مجمعة",
        selectAll: "تحديد الكل",
        deselectAll: "إلغاء تحديد الكل",
        confirmDelete: "هل أنت متأكد من الحذف؟",
        undo: "تراجع",
        redo: "إعادة",
      },
    },
    // About page
    about: {
      title: "عن هوتيلز فيندورز",
      subtitle: "بنية المشتريات الفندقية B2B في مصر",
      mission: "مهمتنا",
      missionText: "تمكين الفنادق المصرية بمنصة مشتريات رقمية تقلل التكاليف وتوافق المتطلبات الضريبية وتربطها بموردين موثوقين.",
      vision: "رؤيتنا",
      visionText: "أن نصبح بنية المشتريات الرائدة لقطاع الضيافة المصري — أمازون سلاسل التوريد الفندقية.",
      values: "قيمنا",
      valuesText: "الشفافية والامتثال والكفاءة وتمكين الموردين الصغار في جميع أنحاء مصر.",
      team: "فريقنا",
      contact: "تواصل معنا",
      contactText: "لديك أسئلة؟ يسعدنا التواصل معك.",
      partners: "شركاؤنا الموثوقون",
    },
    // Contact page
    contact: {
      title: "تواصل معنا",
      subtitle: "نحن هنا لمساعدتك في احتياجات المشتريات الخاصة بك",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      company: "اسم الشركة",
      role: "دورك",
      hotel: "فندق",
      supplier: "مورد",
      other: "أخرى",
      subject: "الموضوع",
      message: "رسالتك",
      send: "إرسال الرسالة",
      sending: "جاري الإرسال...",
      success: "تم إرسال الرسالة بنجاح! سنتواصل معك خلال 24 ساعة.",
      error: "حدث خطأ. يرجى المحاولة مرة أخرى أو مراسلتنا مباشرة.",
      offices: "مكاتبنا",
      cairo: "القاهرة، مصر",
      support: "الدعم الفني",
      supportEmail: "support@hotelsvendors.com",
      sales: "المبيعات",
      salesEmail: "sales@hotelsvendors.com",
      general: "استفسارات عامة",
      generalEmail: "info@hotelsvendors.com",
    },
    // Extended Footer
    footerExtended: {
      about: "عن المنصة",
      aboutText: "هوتيلز فيندورز هي أول منصة مشتريات فندقية B2B في مصر، مصممة خصيصاً لصناعة الفنادق المصرية.",
      products: "المنتجات",
      marketplace: "السوق",
      factoringService: "تمويل الفواتير",
      invo: "إنفو",
      complianceSolution: "الامتثال",
      resources: "الموارد",
      blog: "المدونة",
      documentation: "التوثيق",
      apiReference: "مرجع API",
      statusPage: "صفحة الحالة",
      contactUs: "تواصل معنا",
      followUs: "تابعنا",
      newsletter: "النشرة الإخبارية",
      newsletterText: "ابقَ على اطلاع بأحدث أخبار المشتريات الفندقية.",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      subscribe: "اشترك",
    },
  },
} as const;

export type Translations = typeof translations.en | typeof translations.ar;

export function getTranslation(locale: Locale): typeof translations[Locale] {
  return translations[locale] || translations.en;
}

export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}
