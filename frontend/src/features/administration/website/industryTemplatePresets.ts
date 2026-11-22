export interface IndustryTemplatePreset {
  id: string;
  name: string;
  industry: "Corporate" | "Healthcare" | "Education" | "Manufacturing" | "Agency" | "Hospitality";
  description: string;
  badge: string;
  accentColor: string;
  primaryColor: string;
  headerStyle: "clean" | "dark" | "brand" | "glass";
  footerStyle: "dark" | "light" | "brand";
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    trustPills: string;
  };
  slides: {
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
  }[];
  locations: {
    id: string;
    name: string;
    type: "Headquarters" | "Branch Office" | "Manufacturing Plant" | "Regional Warehouse";
    city: string;
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    mapEmbedUrl: string;
    directionsUrl: string;
  }[];
  faqs: { q: string; a: string }[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    schemaType: string;
  };
}

export const INDUSTRY_TEMPLATES: IndustryTemplatePreset[] = [
  {
    id: "corporate-enterprise",
    name: "Corporate Enterprise & Consulting",
    industry: "Corporate",
    badge: "Most Popular",
    description: "Designed for corporate headquarters, financial consultancies, IT conglomerates, and enterprise service firms.",
    primaryColor: "#1d4ed8",
    accentColor: "#3b82f6",
    headerStyle: "glass",
    footerStyle: "dark",
    hero: {
      eyebrow: "Next-Gen Enterprise Management",
      title: "Empowering Global Operations with Unified Cloud Intelligence",
      subtitle: "Streamline workforce, financial ledgers, automated compliance, and client workflows in one sovereign ERP environment.",
      primaryCta: "Schedule Strategic Demo",
      secondaryCta: "Explore Solutions",
      trustPills: "ISO 27001 Certified, SOC 2 Type II, DPDP Indian Data Residency, 99.99% SLA Uptime",
    },
    slides: [
      {
        id: "corp-1",
        eyebrow: "Enterprise Automation",
        title: "Autonomous Corporate Ledgers & Statutory Compliance",
        subtitle: "Real-time consolidated financials across multiple group companies and legal jurisdictions.",
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Explore Finance",
        primaryCtaHref: "/products",
      },
      {
        id: "corp-2",
        eyebrow: "Workforce Mobility",
        title: "Enterprise HRMS & Global Multi-Currency Payroll",
        subtitle: "Integrated biometric attendance, statutory tax calculations, and self-service portals.",
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "View HRMS",
        primaryCtaHref: "/products",
      },
    ],
    locations: [
      {
        id: "corp-loc-1",
        name: "Corporate Headquarters - Mumbai",
        type: "Headquarters",
        city: "Mumbai, Maharashtra",
        address: "Bandra Kurla Complex (BKC), Tower 4, Level 12, Mumbai 400051",
        phone: "+91 (022) 6192-8000",
        email: "corporate@uabindia.in",
        workingHours: "Mon - Fri: 9:00 AM - 6:30 PM IST",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.8277259166946!2d72.86311897597143!3d19.071302882131976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8e6dfd15667%3A0x6b4f706fae999999!2sBandra%20Kurla%20Complex!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=Bandra+Kurla+Complex+Mumbai",
      },
    ],
    faqs: [
      { q: "How does the system ensure data isolation for different group entities?", a: "Each entity runs on an independent tenant schema with row-level security and cryptographically signed session tokens." },
      { q: "Is custom ERP module integration supported?", a: "Yes, our open REST APIs and webhook bus connect seamlessly to external SAP, Salesforce, or legacy systems." },
    ],
    seo: {
      metaTitle: "Corporate Enterprise Cloud Platform | UabIndia",
      metaDescription: "Unified enterprise operating system for finance, HRMS, and multi-region group operations.",
      schemaType: "Corporation",
    },
  },
  {
    id: "healthcare-clinic",
    name: "Multispecialty Hospital & Healthcare Network",
    industry: "Healthcare",
    badge: "NABH / HIPAA Ready",
    description: "Built for hospitals, polyclinics, diagnostic labs, and medical centers with OPD booking and patient workflows.",
    primaryColor: "#059669",
    accentColor: "#10b981",
    headerStyle: "clean",
    footerStyle: "dark",
    hero: {
      eyebrow: "Compassionate Care & Advanced Medicine",
      title: "World-Class Healthcare, Modern Diagnostics & 24x7 Emergency Care",
      subtitle: "Dedicated medical specialists, NABH-accredited laboratory infrastructure, and instant outpatient appointment scheduling.",
      primaryCta: "Book OPD Appointment",
      secondaryCta: "Find a Specialist",
      trustPills: "NABH Accredited, 24x7 Trauma Center, NABL Certified Labs, 50+ Super-Specialists",
    },
    slides: [
      {
        id: "health-1",
        eyebrow: "24x7 Critical Care",
        title: "Advanced Emergency Medicine & Cardiac Care Center",
        subtitle: "Equipped with state-of-the-art cath labs, modular OTs, and dedicated pediatric intensive care.",
        imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Emergency Contact",
        primaryCtaHref: "/contact",
      },
      {
        id: "health-2",
        eyebrow: "Digital Diagnostics",
        title: "Automated Laboratory & Patient Health Record Portal",
        subtitle: "Access verified radiology reports, doctor prescriptions, and health tracking in one secure portal.",
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Access Patient Portal",
        primaryCtaHref: "/login",
      },
    ],
    locations: [
      {
        id: "health-loc-1",
        name: "Main Super-Specialty Medical Center",
        type: "Headquarters",
        city: "New Delhi, Delhi",
        address: "Healthcare Avenue, Sector 14, Institutional Area, New Delhi 110025",
        phone: "+91 (011) 4920-1000",
        email: "emergency@medicare-center.in",
        workingHours: "Emergency: 24/7 · OPD: 8:00 AM - 8:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.83923192776!2d77.06889754725782!3d28.52758200617607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=New+Delhi+Hospital",
      },
    ],
    faqs: [
      { q: "How can I book an outpatient consultation?", a: "You can book directly through our online portal or call our 24x7 helpline." },
      { q: "Do you accept cashless health insurance claims?", a: "Yes, we partner with all major TPAs and government health schemes for direct cashless claims." },
    ],
    seo: {
      metaTitle: "Multispecialty Hospital & Diagnostic Center",
      metaDescription: "NABH-accredited multispecialty healthcare, 24x7 emergency medical response, and outpatient specialist clinics.",
      schemaType: "MedicalBusiness",
    },
  },
  {
    id: "education-academy",
    name: "Higher Education Institute & Academy",
    industry: "Education",
    badge: "Admissions Open",
    description: "Designed for universities, colleges, professional academies, and K-12 institutions with curriculum and admission portals.",
    primaryColor: "#0284c7",
    accentColor: "#38bdf8",
    headerStyle: "brand",
    footerStyle: "dark",
    hero: {
      eyebrow: "Academic Excellence & Career Leadership",
      title: "Shaping Future Leaders Through Innovation, Science & Humanities",
      subtitle: "Globally accredited degree programs, world-class research laboratories, and industry-sponsored campus placement programs.",
      primaryCta: "Apply for 2027 Admissions",
      secondaryCta: "Download Prospectus",
      trustPills: "UGC Recognized, NAAC A++ Grade, 100% Placement Assistance, 150+ Corporate Partners",
    },
    slides: [
      {
        id: "edu-1",
        eyebrow: "Technology & Engineering",
        title: "Next-Generation AI & Computational Research Labs",
        subtitle: "Hands-on project incubation, robotics workshops, and international faculty mentorship.",
        imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "View Engineering Programs",
        primaryCtaHref: "/products",
      },
      {
        id: "edu-2",
        eyebrow: "Campus Life",
        title: "Holistic Student Experience & Global Exchange Programs",
        subtitle: "Modern residential hostels, state-of-the-art sports complexes, and student cultural clubs.",
        imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Explore Campus",
        primaryCtaHref: "/about",
      },
    ],
    locations: [
      {
        id: "edu-loc-1",
        name: "Main University Campus",
        type: "Headquarters",
        city: "Bengaluru, Karnataka",
        address: "Knowledge City, Electronic City Phase 1, Bengaluru 560100",
        phone: "+91 (080) 2852-9000",
        email: "admissions@academy-edu.in",
        workingHours: "Mon - Sat: 8:30 AM - 5:30 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124440.34757351658!2d77.53856381180295!3d12.923722770287712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae144e3a097d7b%3A0x6b7724220b322304!2sElectronic%20City!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=Electronic+City+Bengaluru",
      },
    ],
    faqs: [
      { q: "What is the admission procedure for international students?", a: "International students can submit their verified transcripts via our online admissions desk for scholarship evaluations." },
      { q: "Are hostel and transportation facilities available?", a: "Yes, fully air-conditioned student dormitories and AC bus transit routes are provided across the city." },
    ],
    seo: {
      metaTitle: "Premier Institute of Higher Learning & Research",
      metaDescription: "Apply for undergraduate, postgraduate, and doctorate programs. NAAC A++ accredited university.",
      schemaType: "EducationalOrganization",
    },
  },
  {
    id: "manufacturing-b2b",
    name: "Industrial Manufacturing & Supply Chain",
    industry: "Manufacturing",
    badge: "Direct Factory Pricing",
    description: "Built for industrial manufacturers, OEM suppliers, precision engineers, and bulk wholesale distributors.",
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
    headerStyle: "dark",
    footerStyle: "dark",
    hero: {
      eyebrow: "Precision Engineering & Global Logistics",
      title: "Heavy-Duty Industrial Components & ISO Certified Contract Manufacturing",
      subtitle: "High-volume CNC fabrication, automated assembly lines, and direct factory-to-warehouse wholesale distribution.",
      primaryCta: "Request Wholesale Quotation",
      secondaryCta: "Download Spec Catalog",
      trustPills: "ISO 9001:2015, CE Certified, 50,000 Sq. Ft. Plant, Exporting to 30+ Nations",
    },
    slides: [
      {
        id: "mfg-1",
        eyebrow: "Plant Automation",
        title: "Automated Precision CNC & Heavy Forging Facilities",
        subtitle: "Zero-defect quality assurance with robotic testing rigs and metallurgical verification.",
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "View Capabilities",
        primaryCtaHref: "/products",
      },
      {
        id: "mfg-2",
        eyebrow: "Bulk Supply Chain",
        title: "Containerized Port Freight & Just-In-Time Warehouse Delivery",
        subtitle: "Complete customs documentation, GST tax invoices, and RFID pallet tracking.",
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Wholesale Inquiry",
        primaryCtaHref: "/contact",
      },
    ],
    locations: [
      {
        id: "mfg-loc-1",
        name: "Central Manufacturing Plant & Foundry",
        type: "Manufacturing Plant",
        city: "Pune, Maharashtra",
        address: "MIDC Industrial Area, Phase II, Chakan, Pune 410501",
        phone: "+91 (02135) 678000",
        email: "rfq@precision-mfg.in",
        workingHours: "Plant Operations: 24/7 · Dispatch: 8:00 AM - 7:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121059.03447385558!2d73.78456687980314!3d18.524616458092283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bf2e67461101%3A0x828d43bf9d3e3f32!2sPune!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=Chakan+MIDC+Pune",
      },
    ],
    faqs: [
      { q: "What is your standard minimum order quantity (MOQ)?", a: "MOQs depend on specific part tooling, starting from 500 units for custom forgings and 100 units for standard catalog items." },
      { q: "Do you supply material test certificates (MTC)?", a: "Yes, every batch is dispatched with EN 10204 3.1 chemical and mechanical inspection certificates." },
    ],
    seo: {
      metaTitle: "Precision Industrial Manufacturing & OEM Parts",
      metaDescription: "ISO 9001 certified industrial components, CNC precision machining, and bulk wholesale exports.",
      schemaType: "LocalBusiness",
    },
  },
  {
    id: "creative-agency",
    name: "Digital Innovation & Creative Tech Studio",
    industry: "Agency",
    badge: "Award-Winning Studio",
    description: "Built for design studios, software development firms, digital branding agencies, and creative architects.",
    primaryColor: "#4f46e5",
    accentColor: "#818cf8",
    headerStyle: "dark",
    footerStyle: "dark",
    hero: {
      eyebrow: "Digital Strategy · Brand Identity · Product Engineering",
      title: "We Craft High-Conversion Digital Products and Scalable Web Platforms",
      subtitle: "Helping iconic brands and fast-growth tech startups scale through human-centered design, Next.js architecture, and growth marketing.",
      primaryCta: "Start a Project With Us",
      secondaryCta: "View Showcase Work",
      trustPills: "Featured on Awwwards, 120+ Web Products Launched, 98% Client Retention, Full-Stack Mastery",
    },
    slides: [
      {
        id: "agency-1",
        eyebrow: "Brand Systems",
        title: "Distinctive Visual Identities & Design Systems",
        subtitle: "We translate corporate visions into memorable design languages, interactive web apps, and design tokens.",
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "See Case Studies",
        primaryCtaHref: "/products",
      },
      {
        id: "agency-2",
        eyebrow: "Cloud Software",
        title: "Full-Stack SaaS Engineering & Scalable Microservices",
        subtitle: "Fast, accessible, and resilient digital architectures built for high-throughput enterprise demands.",
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Request Proposal",
        primaryCtaHref: "/contact",
      },
    ],
    locations: [
      {
        id: "agency-loc-1",
        name: "Creative Studio - Bengaluru",
        type: "Headquarters",
        city: "Bengaluru, Karnataka",
        address: "Indiranagar 100ft Road, Level 3, Bengaluru 560038",
        phone: "+91 98450-12345",
        email: "hello@digitalstudio.in",
        workingHours: "Mon - Fri: 10:00 AM - 7:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15551.785390977804!2d77.63346914999999!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae16a7985474d3%3A0x633513a96865239a!2sIndiranagar!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=Indiranagar+Bengaluru",
      },
    ],
    faqs: [
      { q: "What is your typical project kickoff timeline?", a: "Most product design and engineering sprints begin within 10 business days following discovery approval." },
      { q: "Do you offer post-launch maintenance and DevOps support?", a: "Yes, our dedicated engineering squad provides 24/7 uptime monitoring, SLA patches, and continuous delivery." },
    ],
    seo: {
      metaTitle: "Digital Innovation & Full-Stack Creative Agency",
      metaDescription: "Award-winning design, branding, and custom Next.js software development for high-growth enterprises.",
      schemaType: "Organization",
    },
  },
  {
    id: "hospitality-dining",
    name: "Fine Dining, Restaurant & Hospitality Group",
    industry: "Hospitality",
    badge: "Michelin Guide Standard",
    description: "Built for luxury dining restaurants, hotel chains, organic cafes, and event catering venues.",
    primaryColor: "#9a3412",
    accentColor: "#ea580c",
    headerStyle: "dark",
    footerStyle: "dark",
    hero: {
      eyebrow: "Artisan Flavors · Authentic Ingredients · Royal Ambiance",
      title: "An Unforgettable Culinary Journey Celebrating Royal Heritage",
      subtitle: "Experience farm-to-table seasonal gastronomy, sommelier-curated pairings, and exquisite private dining reservations.",
      primaryCta: "Reserve a Table",
      secondaryCta: "Explore Tasting Menu",
      trustPills: "Farm Fresh Ingredients, Certified Master Chefs, Valet Parking, Private Banquet Available",
    },
    slides: [
      {
        id: "rest-1",
        eyebrow: "Master Chefs",
        title: "Signature Degustation Menus & Wood-Fired Specialties",
        subtitle: "Crafted with locally sourced organic spices, slow-braised heritage cuts, and house-baked sourdoughs.",
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "View Degustation Menu",
        primaryCtaHref: "/products",
      },
      {
        id: "rest-2",
        eyebrow: "Exclusive Dining",
        title: "Intimate Private Dining Rooms & Corporate Banqueting",
        subtitle: "Bespoke menus for family anniversaries, corporate executive dinners, and celebration galas.",
        imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
        primaryCtaLabel: "Book Private Dining",
        primaryCtaHref: "/contact",
      },
    ],
    locations: [
      {
        id: "rest-loc-1",
        name: "Flagship Heritage Dining - Jaipur",
        type: "Headquarters",
        city: "Jaipur, Rajasthan",
        address: "Civil Lines, Heritage Boulevard, Jaipur 302006",
        phone: "+91 (0141) 222-9000",
        email: "reservations@heritage-dining.in",
        workingHours: "Lunch: 12:30 PM - 3:30 PM · Dinner: 7:00 PM - 11:30 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113911.23869274944!2d75.71960244795907!3d26.91243364448575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur!5e0!3m2!1sen!2sin!4v1700000000000",
        directionsUrl: "https://maps.google.com/?q=Civil+Lines+Jaipur",
      },
    ],
    faqs: [
      { q: "Is prior table reservation mandatory?", a: "We strongly recommend reserving at least 24 hours in advance, especially for weekend dinner services." },
      { q: "Do you accommodate dietary preferences and vegan menus?", a: "Yes, our chefs offer dedicated vegan, gluten-free, and Jain degustation alternatives upon request." },
    ],
    seo: {
      metaTitle: "Artisan Fine Dining & Heritage Culinary Experience",
      metaDescription: "Reserve your table for bespoke farm-to-table tasting menus, sommelier pairings, and private dining rooms.",
      schemaType: "LocalBusiness",
    },
  },
];
