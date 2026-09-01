export type SupportedLocale = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ar';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  currency: string;
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', currency: 'USD' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', currency: 'INR' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', currency: 'EUR' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', currency: 'EUR' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', currency: 'EUR' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', currency: 'AED' },
};

export const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.finance': 'Finance & Accounting',
    'nav.crm': 'CRM & Sales',
    'nav.inventory': 'Inventory & Logistics',
    'nav.procurement': 'Procurement & Purchasing',
    'nav.hrms': 'HRMS & Payroll',
    'nav.reports': 'Consolidated Reports',
    'nav.settings': 'Settings',

    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.create': 'Create New',
    'common.edit': 'Edit',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.export': 'Export to Excel / PDF',
    'common.loading': 'Loading...',
    'common.success': 'Operation completed successfully.',
    'common.error': 'An error occurred. Please try again.',
    'common.status': 'Status',
    'common.actions': 'Actions',

    'finance.consolidatedBalanceSheet': 'Consolidated Balance Sheet',
    'finance.consolidatedPnl': 'Consolidated Income Statement',
    'finance.multiCurrency': 'Multi-Currency FX Engine',
    'finance.taxCalculator': 'Pluggable Tax Calculator',
    'finance.paymentGateways': 'Universal Payment Gateways',
    'finance.runSubscriptionBilling': 'Run Recurring Subscription Billing',

    'inventory.stockTransfer': 'Inter-Warehouse Stock Transfer',
    'inventory.reorderEngine': 'Automated Reorder Engine',
    'inventory.batchTracking': 'Lot & Batch Expiry Tracking',

    'hrms.statutoryPayroll': 'Multi-Country Statutory Payroll',
    'hrms.lifecycleTasks': 'Employee Onboarding & Offboarding',
    'hrms.geoAttendance': 'Geo-Fenced Attendance Verification'
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.finance': 'वित्त एवं लेखा',
    'nav.crm': 'सीआरएम और बिक्री',
    'nav.inventory': 'इन्वेंटरी और लॉजिस्टिक्स',
    'nav.procurement': 'खरीद और सोर्सिंग',
    'nav.hrms': 'मानव संसाधन और पेरोल',
    'nav.reports': 'समेकित रिपोर्ट',
    'nav.settings': 'सेटिंग्स',

    'common.save': 'परिवर्तन सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.create': 'नया बनाएं',
    'common.edit': 'संपादित करें',
    'common.search': 'खोजें...',
    'common.filter': 'फ़िल्टर',
    'common.export': 'निर्यात करें',
    'common.loading': 'लोड हो रहा है...',
    'common.success': 'कार्य सफलतापूर्वक पूर्ण हुआ।',
    'common.error': 'त्रुटि हुई। कृपया पुनः प्रयास करें।',
    'common.status': 'स्थिति',
    'common.actions': 'कार्रवाई',

    'finance.consolidatedBalanceSheet': 'समेकित बैलेंस शीट',
    'finance.consolidatedPnl': 'समेकित लाभ और हानि विवरण',
    'finance.multiCurrency': 'विदेशी मुद्रा विनिमय इंजन',
    'finance.taxCalculator': 'वैश्विक कर कैलकुलेटर',
    'finance.paymentGateways': 'भुगतान गेटवे',
    'finance.runSubscriptionBilling': 'आवर्ती बिलिंग चलाएं',

    'inventory.stockTransfer': 'वेयरहाउस स्टॉक ट्रांसफर',
    'inventory.reorderEngine': 'स्वचालित पुन: आदेश प्रणाली',
    'inventory.batchTracking': 'बैच समाप्ति ट्रैकिंग',

    'hrms.statutoryPayroll': 'वैधानिक पेरोल गणना',
    'hrms.lifecycleTasks': 'ऑनबोर्डिंग एवं ऑफबोर्डिंग कार्य',
    'hrms.geoAttendance': 'जियो-फेंस्ड उपस्थिति सत्यापन'
  },
  es: {
    'nav.dashboard': 'Panel Principal',
    'nav.finance': 'Finanzas y Contabilidad',
    'nav.crm': 'CRM y Ventas',
    'nav.inventory': 'Inventario y Logística',
    'nav.procurement': 'Compras y Aprovisionamiento',
    'nav.hrms': 'RRHH y Nómina',
    'nav.reports': 'Informes Consolidados',
    'nav.settings': 'Configuración',

    'common.save': 'Guardar Cambios',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.create': 'Crear Nuevo',
    'common.edit': 'Editar',
    'common.search': 'Buscar...',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.loading': 'Cargando...',
    'common.success': 'Operación completada con éxito.',
    'common.error': 'Ocurrió un error. Inténtelo de nuevo.',
    'common.status': 'Estado',
    'common.actions': 'Acciones',

    'finance.consolidatedBalanceSheet': 'Balance General Consolidado',
    'finance.consolidatedPnl': 'Estado de Resultados Consolidado',
    'finance.multiCurrency': 'Motor Multidivisa FX',
    'finance.taxCalculator': 'Calculadora de Impuestos',
    'finance.paymentGateways': 'Pasarelas de Pago Universales',
    'finance.runSubscriptionBilling': 'Ejecutar Facturación Recurrente',

    'inventory.stockTransfer': 'Transferencia entre Almacenes',
    'inventory.reorderEngine': 'Motor de Reorden Automatizado',
    'inventory.batchTracking': 'Seguimiento de Lotes y Caducidad',

    'hrms.statutoryPayroll': 'Nómina Estatutaria Global',
    'hrms.lifecycleTasks': 'Gestión de Onboarding y Offboarding',
    'hrms.geoAttendance': 'Verificación de Asistencia por Geocerca'
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.finance': 'Finance & Comptabilité',
    'nav.crm': 'CRM & Ventes',
    'nav.inventory': 'Stocks & Logistique',
    'nav.procurement': 'Achats & Approvisionnement',
    'nav.hrms': 'RH & Paie',
    'nav.reports': 'Rapports consolidés',
    'nav.settings': 'Paramètres',

    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.create': 'Créer',
    'common.edit': 'Modifier',
    'common.search': 'Rechercher...',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.loading': 'Chargement...',
    'common.success': 'Opération effectuée avec succès.',
    'common.error': 'Une erreur est survenue.',
    'common.status': 'Statut',
    'common.actions': 'Actions',

    'finance.consolidatedBalanceSheet': 'Bilan consolidé',
    'finance.consolidatedPnl': 'Compte de résultat consolidé',
    'finance.multiCurrency': 'Moteur multi-devises FX',
    'finance.taxCalculator': 'Calculateur de taxes',
    'finance.paymentGateways': 'Passerelles de paiement',
    'finance.runSubscriptionBilling': 'Exécuter la facturation récurrente',

    'inventory.stockTransfer': 'Transfert entre entrepôts',
    'inventory.reorderEngine': 'Réapprovisionnement automatique',
    'inventory.batchTracking': 'Suivi des lots et péremption',

    'hrms.statutoryPayroll': 'Paie légale multi-pays',
    'hrms.lifecycleTasks': 'Tâches d’intégration et de départ',
    'hrms.geoAttendance': 'Pointage géolocalisé'
  },
  de: {
    'nav.dashboard': 'Dashboard',
    'nav.finance': 'Finanzen & Buchhaltung',
    'nav.crm': 'CRM & Vertrieb',
    'nav.inventory': 'Lager & Logistik',
    'nav.procurement': 'Einkauf & Beschaffung',
    'nav.hrms': 'Personal & Gehalt',
    'nav.reports': 'Konsolidierte Berichte',
    'nav.settings': 'Einstellungen',

    'common.save': 'Änderungen speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.create': 'Neu erstellen',
    'common.edit': 'Bearbeiten',
    'common.search': 'Suchen...',
    'common.filter': 'Filtern',
    'common.export': 'Exportieren',
    'common.loading': 'Laden...',
    'common.success': 'Vorgang erfolgreich abgeschlossen.',
    'common.error': 'Ein Fehler ist aufgetreten.',
    'common.status': 'Status',
    'common.actions': 'Aktionen',

    'finance.consolidatedBalanceSheet': 'Konsolidierte Bilanz',
    'finance.consolidatedPnl': 'Konsolidierte Gewinn- und Verlustrechnung',
    'finance.multiCurrency': 'Mehrwährungs-FX-Engine',
    'finance.taxCalculator': 'Steuerrechner',
    'finance.paymentGateways': 'Zahlungs-Gateways',
    'finance.runSubscriptionBilling': 'Abonnementabrechnung ausführen',

    'inventory.stockTransfer': 'Lagerübergreifender Bestandstransfer',
    'inventory.reorderEngine': 'Automatische Nachbestellung',
    'inventory.batchTracking': 'Chargen- und Verfallsdatenverfolgung',

    'hrms.statutoryPayroll': 'Gesetzliche Gehaltsabrechnung',
    'hrms.lifecycleTasks': 'Onboarding- und Offboarding-Prozesse',
    'hrms.geoAttendance': 'Geofencing-Zeiterfassung'
  },
  ar: {
    'nav.dashboard': 'لوحة القيادة',
    'nav.finance': 'المالية والمحاسبة',
    'nav.crm': 'إدارة العملاء والمبيعات',
    'nav.inventory': 'المخزون والخدمات اللوجستية',
    'nav.procurement': 'المشتريات والتوريد',
    'nav.hrms': 'الموارد البشرية والرواتب',
    'nav.reports': 'التقارير الموحدة',
    'nav.settings': 'الإعدادات',

    'common.save': 'حفظ التغييرات',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.create': 'إنشاء جديد',
    'common.edit': 'تعديل',
    'common.search': 'بحث...',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.loading': 'جاري التحميل...',
    'common.success': 'تمت العملية بنجاح.',
    'common.error': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'common.status': 'الحالة',
    'common.actions': 'الإجراءات',

    'finance.consolidatedBalanceSheet': 'الميزانية العمومية الموحدة',
    'finance.consolidatedPnl': 'بيان الدخل الموحد',
    'finance.multiCurrency': 'محرك أسعار الصرف متعدد العملات',
    'finance.taxCalculator': 'حاسبة الضرائب العالمية',
    'finance.paymentGateways': 'بوابات الدفع الإلكتروني',
    'finance.runSubscriptionBilling': 'تشغيل دورة الفواتير المتكررة',

    'inventory.stockTransfer': 'نقل المخزون بين المستودعات',
    'inventory.reorderEngine': 'محرك إعادة الطلب التلقائي',
    'inventory.batchTracking': 'تتبع الشحنات وتواريخ الانتهاء',

    'hrms.statutoryPayroll': 'حساب الرواتب القانونية',
    'hrms.lifecycleTasks': 'مهام التعيين وإنهاء الخدمة',
    'hrms.geoAttendance': 'التحقق من الحضور عبر السياج الجغرافي'
  }
};
