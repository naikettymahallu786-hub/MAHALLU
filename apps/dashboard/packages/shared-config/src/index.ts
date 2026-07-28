import { UserRole } from '@mahallu/shared-types';

// ============================================================
// RBAC Permission Matrix
// ============================================================

export const PERMISSIONS = {
  // Members
  MEMBER_VIEW: 'member:view',
  MEMBER_CREATE: 'member:create',
  MEMBER_UPDATE: 'member:update',
  MEMBER_DELETE: 'member:delete',
  MEMBER_EXPORT: 'member:export',

  // Families
  FAMILY_VIEW: 'family:view',
  FAMILY_CREATE: 'family:create',
  FAMILY_UPDATE: 'family:update',
  FAMILY_DELETE: 'family:delete',

  // Finance
  FINANCE_VIEW: 'finance:view',
  FINANCE_CREATE: 'finance:create',
  FINANCE_UPDATE: 'finance:update',
  FINANCE_DELETE: 'finance:delete',
  FINANCE_EXPORT: 'finance:export',

  // Madrasa
  MADRASA_VIEW: 'madrasa:view',
  MADRASA_CREATE: 'madrasa:create',
  MADRASA_UPDATE: 'madrasa:update',
  MADRASA_DELETE: 'madrasa:delete',

  // Students
  STUDENT_VIEW: 'student:view',
  STUDENT_CREATE: 'student:create',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  STUDENT_VIEW_OWN: 'student:view_own',

  // Teachers
  TEACHER_VIEW: 'teacher:view',
  TEACHER_CREATE: 'teacher:create',
  TEACHER_UPDATE: 'teacher:update',
  TEACHER_DELETE: 'teacher:delete',

  // Attendance
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_REPORTS: 'attendance:reports',

  // Homework
  HOMEWORK_VIEW: 'homework:view',
  HOMEWORK_CREATE: 'homework:create',
  HOMEWORK_GRADE: 'homework:grade',
  HOMEWORK_SUBMIT: 'homework:submit',

  // Exams
  EXAM_VIEW: 'exam:view',
  EXAM_CREATE: 'exam:create',
  EXAM_GRADE: 'exam:grade',

  // Payments
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_REFUND: 'payment:refund',
  PAYMENT_SELF: 'payment:self', // Can only pay for self/child

  // Donations
  DONATION_VIEW: 'donation:view',
  DONATION_CREATE: 'donation:create',
  DONATION_EXPORT: 'donation:export',

  // Properties
  PROPERTY_VIEW: 'property:view',
  PROPERTY_CREATE: 'property:create',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',

  // Zakat
  ZAKAT_VIEW: 'zakat:view',
  ZAKAT_MANAGE: 'zakat:manage',
  ZAKAT_DISTRIBUTE: 'zakat:distribute',

  // Nikah
  NIKAH_VIEW: 'nikah:view',
  NIKAH_REGISTER: 'nikah:register',
  NIKAH_APPROVE: 'nikah:approve',

  // Death
  DEATH_VIEW: 'death:view',
  DEATH_CREATE: 'death:create',
  DEATH_UPDATE: 'death:update',

  // Cemetery
  CEMETERY_VIEW: 'cemetery:view',
  CEMETERY_MANAGE: 'cemetery:manage',

  // Events
  EVENT_VIEW: 'event:view',
  EVENT_CREATE: 'event:create',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',

  // Reports
  REPORTS_FINANCIAL: 'reports:financial',
  REPORTS_MEMBER: 'reports:member',
  REPORTS_ACADEMIC: 'reports:academic',
  REPORTS_ALL: 'reports:all',

  // Certificates
  CERTIFICATE_VIEW: 'certificate:view',
  CERTIFICATE_CREATE: 'certificate:create',
  CERTIFICATE_VIEW_OWN: 'certificate:view_own',

  // Notifications
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_BROADCAST: 'notification:broadcast',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Audit Logs
  AUDIT_VIEW: 'audit:view',

  // Tenant Management (Super Admin only)
  TENANT_MANAGE: 'tenant:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role → Permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS) as Permission[],

  [UserRole.SECRETARY]: [
    PERMISSIONS.MEMBER_VIEW, PERMISSIONS.MEMBER_CREATE, PERMISSIONS.MEMBER_UPDATE, PERMISSIONS.MEMBER_EXPORT,
    PERMISSIONS.FAMILY_VIEW, PERMISSIONS.FAMILY_CREATE, PERMISSIONS.FAMILY_UPDATE,
    PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.DONATION_VIEW, PERMISSIONS.DONATION_CREATE, PERMISSIONS.DONATION_EXPORT,
    PERMISSIONS.MADRASA_VIEW,
    PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_REPORTS,
    PERMISSIONS.PAYMENT_VIEW, PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.ZAKAT_VIEW,
    PERMISSIONS.NIKAH_VIEW, PERMISSIONS.NIKAH_REGISTER,
    PERMISSIONS.DEATH_VIEW, PERMISSIONS.DEATH_CREATE,
    PERMISSIONS.CEMETERY_VIEW,
    PERMISSIONS.EVENT_VIEW, PERMISSIONS.EVENT_CREATE, PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.REPORTS_MEMBER, PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.REPORTS_ACADEMIC,
    PERMISSIONS.CERTIFICATE_VIEW, PERMISSIONS.CERTIFICATE_CREATE,
    PERMISSIONS.NOTIFICATION_SEND, PERMISSIONS.NOTIFICATION_BROADCAST,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  [UserRole.TREASURER]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_CREATE, PERMISSIONS.FINANCE_UPDATE, PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.DONATION_VIEW, PERMISSIONS.DONATION_CREATE, PERMISSIONS.DONATION_EXPORT,
    PERMISSIONS.PAYMENT_VIEW, PERMISSIONS.PAYMENT_CREATE, PERMISSIONS.PAYMENT_REFUND,
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.ZAKAT_VIEW, PERMISSIONS.ZAKAT_MANAGE, PERMISSIONS.ZAKAT_DISTRIBUTE,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.CERTIFICATE_VIEW, PERMISSIONS.CERTIFICATE_CREATE,
  ],

  [UserRole.IMAM]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.MADRASA_VIEW,
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.NIKAH_VIEW, PERMISSIONS.NIKAH_REGISTER, PERMISSIONS.NIKAH_APPROVE,
    PERMISSIONS.DEATH_VIEW, PERMISSIONS.DEATH_CREATE, PERMISSIONS.DEATH_UPDATE,
    PERMISSIONS.CEMETERY_VIEW,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
  ],

  [UserRole.MADRASA_PRINCIPAL]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MADRASA_VIEW, PERMISSIONS.MADRASA_CREATE, PERMISSIONS.MADRASA_UPDATE,
    PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.TEACHER_VIEW, PERMISSIONS.TEACHER_CREATE, PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_REPORTS,
    PERMISSIONS.HOMEWORK_VIEW, PERMISSIONS.HOMEWORK_CREATE,
    PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.REPORTS_ACADEMIC,
    PERMISSIONS.CERTIFICATE_VIEW, PERMISSIONS.CERTIFICATE_CREATE,
    PERMISSIONS.NOTIFICATION_SEND, PERMISSIONS.NOTIFICATION_BROADCAST,
  ],

  [UserRole.USTADH]: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.HOMEWORK_VIEW, PERMISSIONS.HOMEWORK_CREATE, PERMISSIONS.HOMEWORK_GRADE,
    PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.NOTIFICATION_SEND,
  ],

  [UserRole.PARENT]: [
    PERMISSIONS.STUDENT_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.PAYMENT_SELF,
    PERMISSIONS.CERTIFICATE_VIEW_OWN,
    PERMISSIONS.EVENT_VIEW,
  ],

  [UserRole.STUDENT]: [
    PERMISSIONS.STUDENT_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.HOMEWORK_VIEW, PERMISSIONS.HOMEWORK_SUBMIT,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.CERTIFICATE_VIEW_OWN,
    PERMISSIONS.EVENT_VIEW,
  ],

  [UserRole.SADAR_MUALIM]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MADRASA_VIEW, PERMISSIONS.MADRASA_CREATE, PERMISSIONS.MADRASA_UPDATE,
    PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.TEACHER_VIEW, PERMISSIONS.TEACHER_CREATE, PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_REPORTS,
    PERMISSIONS.HOMEWORK_VIEW, PERMISSIONS.HOMEWORK_CREATE,
    PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.REPORTS_ACADEMIC,
    PERMISSIONS.CERTIFICATE_VIEW, PERMISSIONS.CERTIFICATE_CREATE,
    PERMISSIONS.NOTIFICATION_SEND, PERMISSIONS.NOTIFICATION_BROADCAST,
  ],
};

// ---- Constants ----

export const PRAYER_TIMES_API = 'https://api.aladhan.com/v1';

export const CALCULATION_METHODS = {
  1: 'University of Islamic Sciences, Karachi',
  2: 'Islamic Society of North America (ISNA)',
  3: 'Muslim World League',
  4: 'Umm Al-Qura University, Makkah',
  8: 'Gulf Region',
  11: 'Majlis Ugama Islam Singapura, Singapore',
  12: 'Union Organization Islamic de France',
  13: 'Diyanet İşleri Başkanlığı, Turkey',
  14: 'Spiritual Administration of Muslims of Russia',
  15: 'Moonsighting Committee Worldwide',
};

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

export const SUPPORTED_LANGUAGES = ['en', 'ml', 'ar'] as const;

export const CERTIFICATE_VALIDITY_DAYS = 180;

export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RELATIONSHIP_TYPES = [
  'Head', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother',
  'Brother', 'Sister', 'Grandfather', 'Grandmother',
  'Father-in-law', 'Mother-in-law', 'Son-in-law', 'Daughter-in-law',
  'Grandson', 'Granddaughter', 'Uncle', 'Aunt', 'Nephew', 'Niece', 'Other',
];

export const MADRASA_SUBJECTS = [
  'Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Hadith', 'Aqeedah',
  'Arabic', 'Islamic History', 'Seerah', 'Tafseer', 'Dua',
  'Malayalam', 'English', 'Mathematics',
];

export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,     // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024,    // 50MB
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
