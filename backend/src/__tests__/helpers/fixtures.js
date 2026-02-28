const TEST_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX",
  isAdmin: false,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_ADMIN = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX",
  isAdmin: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_PROJECT = {
  id: "project-1",
  groomName: "Budi",
  brideName: "Sari",
  groomDomicile: "Jakarta",
  brideDomicile: "Medan",
  weddingDate: new Date("2025-06-15"),
  totalBudget: 100000000,
  guestCount: 500,
  eventType: "PESTA_ADAT",
  isFinalized: false,
  finalizedAt: null,
  userId: "user-1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_EVENT = {
  id: "event-1",
  name: "Pesta Adat",
  type: "PESTA_ADAT",
  projectId: "project-1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_CATEGORY = {
  id: "category-1",
  name: "Catering",
  plannedBudget: 50000000,
  actualCost: 0,
  notes: null,
  sortOrder: 1,
  eventId: "event-1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_VENDOR = {
  id: "vendor-1",
  name: "Sari Rasa Catering Batak",
  type: "CATERING",
  location: "Jakarta Timur",
  minPriceEstimate: 55000,
  maxPriceEstimate: 85000,
  capacity: 1000,
  description: "Spesialis masakan Batak",
  contactInfo: "0812-xxxx-2001",
  isBatakSpecialist: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_VENDOR_TYPE = {
  id: "vt-1",
  code: "CATERING",
  label: "Catering",
  defaultCategoryName: "Catering",
  isPricePerPax: true,
  sortOrder: 2,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const TEST_PROJECT_VENDOR = {
  id: "pv-1",
  projectId: "project-1",
  vendorId: "vendor-1",
  notes: null,
  estimatedCost: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

module.exports = {
  TEST_USER,
  TEST_ADMIN,
  TEST_PROJECT,
  TEST_EVENT,
  TEST_CATEGORY,
  TEST_VENDOR,
  TEST_VENDOR_TYPE,
  TEST_PROJECT_VENDOR,
};
