// ============================================================
// MAHALLU ERP — Shared Types & Interfaces
// ============================================================

// ---- Enums / Const Objects (Node 24 Strip-Types Compatible) ----

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  SECRETARY: 'secretary',
  TREASURER: 'treasurer',
  IMAM: 'imam',
  MADRASA_PRINCIPAL: 'madrasa_principal',
  USTADH: 'ustadh',
  PARENT: 'parent',
  STUDENT: 'student',
  SADAR_MUALIM: 'sadar_mualim',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const MemberStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DECEASED: 'deceased',
  MIGRATED: 'migrated',
} as const;
export type MemberStatus = typeof MemberStatus[keyof typeof MemberStatus];

export const PaymentType = {
  DONATION: 'donation',
  SUBSCRIPTION: 'subscription',
  MADRASA_FEE: 'madrasa_fee',
  RENTAL: 'rental',
  ZAKAT: 'zakat',
  EVENT: 'event',
  SALARY: 'salary',
  MAINTENANCE: 'maintenance',
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const PaymentStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentGateway = {
  RAZORPAY: 'razorpay',
  UPI: 'upi',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
} as const;
export type PaymentGateway = typeof PaymentGateway[keyof typeof PaymentGateway];

export const CertificateType = {
  RESIDENCE: 'residence',
  MEMBERSHIP: 'membership',
  NIKAH: 'nikah',
  STUDENT: 'student',
  COMPLETION: 'completion',
  TRANSFER: 'transfer',
  DEATH: 'death',
  MARRIAGE_CERTIFICATE: 'marriage_certificate',
  MARRIAGE_CLEARANCE: 'marriage_clearance',
  PANCHAYATH_LETTER: 'panchayath_letter',
  VILLAGE_LETTER: 'village_letter',
  OTHER_ORG_LETTER: 'other_org_letter',
  CASTE_CERTIFICATE: 'caste_certificate',
  NOC: 'noc',
} as const;
export type CertificateType = typeof CertificateType[keyof typeof CertificateType];

export const NotificationChannel = {
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in_app',
} as const;
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  HOLIDAY: 'holiday',
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const PropertyType = {
  BUILDING: 'building',
  SHOP: 'shop',
  RENTAL_HOUSE: 'rental_house',
  LAND: 'land',
  EQUIPMENT: 'equipment',
} as const;
export type PropertyType = typeof PropertyType[keyof typeof PropertyType];

export const LeaseStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  PENDING: 'pending',
} as const;
export type LeaseStatus = typeof LeaseStatus[keyof typeof LeaseStatus];

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const Language = {
  EN: 'en',
  ML: 'ml',
  AR: 'ar',
} as const;
export type Language = typeof Language[keyof typeof Language];

// ---- Base Interfaces ----

export interface BaseDocument {
  _id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  gps?: GeoLocation;
}

export interface FileAttachment {
  url: string;
  publicId?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
}

// ---- Tenant ----

export interface ITenant extends BaseDocument {
  name: string;
  nameAr?: string;
  nameML?: string;
  code: string;
  domain?: string;
  address: Address;
  phone: string;
  email: string;
  logo?: FileAttachment;
  banner?: FileAttachment;
  settings: TenantSettings;
  subscriptionPlan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionExpiresAt?: string;
  status: 'active' | 'suspended' | 'pending';
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  language: Language;
  financialYearStartMonth: number;
  paymentGateways: {
    razorpay?: { keyId: string; enabled: boolean };
    upi?: { upiId: string; enabled: boolean };
  };
  features: {
    zakatCalculator: boolean;
    whatsappNotifications: boolean;
    smsNotifications: boolean;
    cemeteryManagement: boolean;
    propertyRental: boolean;
    madrasaPortal: boolean;
  };
}

// ---- User & Auth ----

export interface IUser extends BaseDocument {
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  memberId?: string;
  avatar?: FileAttachment;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  status: 'active' | 'inactive' | 'locked';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: IUser;
  tokens: AuthTokens;
  permissions: string[];
}

// ---- Family & Member ----

export interface IFamily extends BaseDocument {
  familyCode: string;
  headMemberId: string;
  headMember?: IMember;
  members: FamilyMemberRef[];
  address: Address;
  wardNo?: string;
  outstandingBalance: number;
  qrCode?: string;
  photo?: FileAttachment;
  recurringDonationType: 'monthly' | 'yearly' | 'none';
  recurringDonationAmount: number;
}

export interface FamilyMemberRef {
  memberId: string;
  relationship: string;
  isHead: boolean;
}

export interface IMember extends BaseDocument {
  memberId: string;
  name: string;
  nameAr?: string;
  nameML?: string;
  gender: Gender;
  dateOfBirth?: string;
  bloodGroup?: string;
  photo?: FileAttachment;
  aadhaarNumber?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
  qualification?: string;
  familyId?: string;
  relationship?: string;
  status: MemberStatus;
  qrCode?: string;
  userId?: string;
}

// ---- Mosque & Services ----

export interface IMosque extends BaseDocument {
  name: string;
  nameAr?: string;
  nameML?: string;
  address: Address;
  phone: string;
  email?: string;
  imamId?: string;
  imam?: IMember;
  muazzinId?: string;
  muazzin?: IMember;
  committeeMembers: Array<{ memberId: string; role: string; termEnd?: string }>;
  capacity: number;
  prayerTimes: PrayerTimes;
  facilities: string[];
  photos?: FileAttachment[];
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
  updatedAt: string;
}

// ---- Madrasa ----

export interface IMadrasa extends BaseDocument {
  name: string;
  nameAr?: string;
  nameML?: string;
  code: string;
  address: Address;
  principalId?: string;
  principal?: IMember;
  academicYear: string;
  status: 'active' | 'inactive';
}

export interface IClass extends BaseDocument {
  madrasaId: string;
  name: string;
  level: number;
  section?: string;
  medium: 'malayalam' | 'english' | 'arabic';
  academicYear: string;
  ustadhId?: string;
  ustadh?: ITeacher;
  students: string[];
  capacity: number;
  roomNo?: string;
}

export interface ITeacher extends BaseDocument {
  memberId: string;
  member?: IMember;
  employeeId: string;
  qualification: string;
  subjects: string[];
  joiningDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
}

export interface IStudent extends BaseDocument {
  memberId: string;
  member?: IMember;
  admissionNo: string;
  admissionDate: string;
  classId: string;
  class?: IClass;
  madrasaId: string;
  guardianId: string;
  guardian?: IMember;
  familyId?: string;
  rollNo?: number;
  status: 'active' | 'transferred' | 'graduated' | 'dropped';
}

export interface IAttendance extends BaseDocument {
  classId: string;
  date: string;
  markedBy: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }>;
}

// ---- Finance & Payments ----

export interface ITransaction extends BaseDocument {
  transactionNo: string;
  type: 'income' | 'expense';
  category: string;
  subCategory?: string;
  amount: number;
  date: string;
  paymentType: PaymentType;
  paymentGateway?: PaymentGateway;
  gatewayTransactionId?: string;
  payerId?: string; // MemberId or FamilyId
  payerType?: 'Member' | 'Family' | 'External';
  payerName?: string;
  recipientName?: string;
  status: PaymentStatus;
  receiptNo?: string;
  receiptUrl?: string;
  description?: string;
  approvedBy?: string;
  attachments?: FileAttachment[];
}

export interface IDonation extends BaseDocument {
  donationNo: string;
  donorId?: string;
  donorType?: 'Member' | 'Family' | 'Guest';
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  amount: number;
  category: 'general' | 'building' | 'zakat' | 'sadaka' | 'orphan' | 'ramadan' | 'other';
  campaignId?: string;
  paymentGateway?: PaymentGateway;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  receiptNo?: string;
  isAnonymous: boolean;
  notes?: string;
}

export interface ISubscription extends BaseDocument {
  familyId: string;
  family?: IFamily;
  memberId?: string;
  member?: IMember;
  feeType: 'monthly_subscription' | 'madrasa_fee' | 'annual_dues';
  amount: number;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  status: 'unpaid' | 'paid' | 'overdue' | 'waived';
  paidAt?: string;
  transactionId?: string;
}

// ---- Properties & Rentals ----

export interface IProperty extends BaseDocument {
  propertyNo: string;
  name: string;
  type: PropertyType;
  address: Address;
  monthlyRent: number;
  depositAmount: number;
  currentLeaseId?: string;
  status: 'available' | 'leased' | 'maintenance';
  photos?: FileAttachment[];
  documents?: FileAttachment[];
}

export interface ILease extends BaseDocument {
  leaseNo: string;
  propertyId: string;
  property?: IProperty;
  tenantMemberId?: string; // Mahallu Member as tenant
  tenantName: string;
  tenantPhone: string;
  tenantAadhaar?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositPaid: number;
  rentDueDay: number;
  status: LeaseStatus;
  agreementDocument?: FileAttachment;
}

// ---- Special Modules ----

export interface INikah extends BaseDocument {
  nikahNo: string;
  groomId?: string;
  groomName: string;
  groomPhone?: string;
  groomAddress: Address;
  brideId?: string;
  brideName: string;
  bridePhone?: string;
  brideAddress: Address;
  nikahDate: string;
  venue: string;
  maharAmount?: number;
  maharDetails?: string;
  officiatorId?: string;
  officiatorName: string;
  witnesses: Array<{ name: string; phone?: string; address?: string }>;
  certificateId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  feePaid: number;
}

export interface IDeathRecord extends BaseDocument {
  memberId: string;
  member?: IMember;
  deceasedName: string;
  dateOfDeath: string;
  timeOfDeath?: string;
  causeOfDeath?: string;
  placeOfDeath: string;
  janazaDate: string;
  janazaTime?: string;
  janazaMasjid?: string;
  cemeteryPlotNo?: string;
  informantName: string;
  informantRelation: string;
  informantPhone: string;
  certificateId?: string;
  notes?: string;
}

export interface ICemeteryPlot extends BaseDocument {
  plotNo: string;
  section: string;
  row?: string;
  status: 'available' | 'occupied' | 'reserved';
  occupiedByMemberId?: string;
  occupiedByMember?: IMember;
  burialDate?: string;
  notes?: string;
}

export interface ICertificate extends BaseDocument {
  certificateNo: string;
  type: CertificateType;
  recipientId: string;
  recipient?: IMember;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  pdfUrl?: string;
  data: Record<string, unknown>;
  isRevoked: boolean;
}

export interface ICertificateRequest extends BaseDocument {
  requestedBy: string;
  requestedByMember?: IMember;
  type: CertificateType;
  purpose: string;
  details?: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  certificateId?: string;
  notes?: string;
}

export interface INotification extends BaseDocument {
  recipientUserId?: string; // Null if broadcast to tenant
  targetRoles?: UserRole[];
  title: string;
  body: string;
  channels: NotificationChannel[];
  type: 'announcement' | 'reminder' | 'payment_alert' | 'event' | 'system';
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IEvent extends BaseDocument {
  title: string;
  description: string;
  category: 'religious' | 'community' | 'educational' | 'meeting' | 'youth';
  startDate: string;
  endDate: string;
  venue: string;
  organizerName: string;
  isPublic: boolean;
  banner?: FileAttachment;
  rsvps?: Array<{ memberId: string; status: 'attending' | 'declined' | 'maybe' }>;
}
