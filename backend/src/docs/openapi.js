const bearerAuth = [{ bearerAuth: [] }];

const idParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});

const errorResponses = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" },
  500: { $ref: "#/components/responses/InternalServerError" },
};

const jsonBody = (schema, required = true) => ({
  required,
  content: {
    "application/json": { schema },
  },
});

const wrap = (property, ref) => ({
  type: "object",
  properties: { [property]: ref },
});

const arrayWrap = (property, ref) => ({
  type: "object",
  properties: {
    [property]: {
      type: "array",
      items: ref,
    },
  },
});

const messageSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
};

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Bataknese Wedding Budget API",
    version: "1.0.0",
    description: "API documentation for authentication, wedding projects, budget categories, vendors, exports, and admin management.",
  },
  servers: [
    { url: "http://localhost:3001", description: "Local backend" },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Projects" },
    { name: "Categories" },
    { name: "Exports" },
    { name: "Vendors" },
    { name: "Project Vendors" },
    { name: "Reference Data" },
    { name: "Admin" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create account",
        requestBody: jsonBody({ $ref: "#/components/schemas/RegisterRequest" }),
        responses: {
          201: { description: "Registered", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          400: errorResponses[400],
          409: errorResponses[409],
          500: errorResponses[500],
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        requestBody: jsonBody({ $ref: "#/components/schemas/LoginRequest" }),
        responses: {
          200: { description: "Signed in", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          400: errorResponses[400],
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: bearerAuth,
        responses: {
          200: { description: "Current user", content: { "application/json": { schema: wrap("user", { $ref: "#/components/schemas/User" }) } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/auth/change-password": {
      put: {
        tags: ["Auth"],
        summary: "Change password",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/ChangePasswordRequest" }),
        responses: {
          200: { description: "Password changed", content: { "application/json": { schema: messageSchema } } },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List user's projects",
        security: bearerAuth,
        responses: {
          200: { description: "Projects", content: { "application/json": { schema: arrayWrap("projects", { $ref: "#/components/schemas/Project" }) } } },
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/CreateProjectRequest" }),
        responses: {
          201: { description: "Project created", content: { "application/json": { schema: wrap("project", { $ref: "#/components/schemas/Project" }) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get project detail",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        responses: {
          200: { description: "Project", content: { "application/json": { schema: wrap("project", { $ref: "#/components/schemas/Project" }) } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
      put: {
        tags: ["Projects"],
        summary: "Update project",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/UpdateProjectRequest" }),
        responses: {
          200: { description: "Project updated", content: { "application/json": { schema: wrap("project", { $ref: "#/components/schemas/Project" }) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        responses: {
          200: { description: "Project deleted", content: { "application/json": { schema: messageSchema } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{id}/finalize": {
      post: {
        tags: ["Projects"],
        summary: "Finalize project",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        responses: {
          200: { description: "Project finalized", content: { "application/json": { schema: wrap("project", { $ref: "#/components/schemas/Project" }) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{projectId}/events/{eventId}/categories": {
      post: {
        tags: ["Categories"],
        summary: "Add category",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID"), idParam("eventId", "Event ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/CategoryRequest" }),
        responses: {
          201: { description: "Category created", content: { "application/json": { schema: wrap("category", { $ref: "#/components/schemas/BudgetCategory" }) } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{projectId}/events/{eventId}/categories/{id}": {
      put: {
        tags: ["Categories"],
        summary: "Update category",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID"), idParam("eventId", "Event ID"), idParam("id", "Category ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/CategoryRequest" }),
        responses: {
          200: { description: "Category updated", content: { "application/json": { schema: wrap("category", { $ref: "#/components/schemas/BudgetCategory" }) } } },
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID"), idParam("eventId", "Event ID"), idParam("id", "Category ID")],
        responses: {
          200: { description: "Category deleted", content: { "application/json": { schema: messageSchema } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{id}/export/pdf": {
      get: {
        tags: ["Exports"],
        summary: "Download project budget as PDF",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        responses: {
          200: { description: "PDF file", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{id}/export/excel": {
      get: {
        tags: ["Exports"],
        summary: "Download project budget as Excel",
        security: bearerAuth,
        parameters: [idParam("id", "Project ID")],
        responses: {
          200: { description: "Excel file", content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/vendors": {
      get: {
        tags: ["Vendors"],
        summary: "List vendors with optional filters",
        security: bearerAuth,
        parameters: [
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "minCapacity", in: "query", schema: { type: "integer" } },
          { name: "isBatakSpecialist", in: "query", schema: { type: "boolean" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["price_asc", "price_desc", "name"] } },
        ],
        responses: {
          200: { description: "Vendors", content: { "application/json": { schema: arrayWrap("vendors", { $ref: "#/components/schemas/Vendor" }) } } },
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
    },
    "/api/vendors/recommend/{projectId}": {
      get: {
        tags: ["Vendors"],
        summary: "Get vendor recommendations for a project",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID")],
        responses: {
          200: { description: "Recommendations", content: { "application/json": { schema: { $ref: "#/components/schemas/VendorRecommendationsResponse" } } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/vendors/{id}": {
      get: {
        tags: ["Vendors"],
        summary: "Get vendor detail",
        security: bearerAuth,
        parameters: [idParam("id", "Vendor ID")],
        responses: {
          200: { description: "Vendor", content: { "application/json": { schema: wrap("vendor", { $ref: "#/components/schemas/Vendor" }) } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{projectId}/vendors": {
      get: {
        tags: ["Project Vendors"],
        summary: "List selected project vendors",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID")],
        responses: {
          200: { description: "Project vendors", content: { "application/json": { schema: arrayWrap("projectVendors", { $ref: "#/components/schemas/ProjectVendor" }) } } },
          401: errorResponses[401],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
      post: {
        tags: ["Project Vendors"],
        summary: "Add vendor to project",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/AddProjectVendorRequest" }),
        responses: {
          201: { description: "Vendor added", content: { "application/json": { schema: wrap("projectVendor", { $ref: "#/components/schemas/ProjectVendor" }) } } },
          ...errorResponses,
        },
      },
    },
    "/api/projects/{projectId}/vendors/{vendorId}": {
      delete: {
        tags: ["Project Vendors"],
        summary: "Remove vendor from project",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID"), idParam("vendorId", "Vendor ID")],
        responses: {
          200: { description: "Vendor removed", content: { "application/json": { schema: { $ref: "#/components/schemas/RemoveProjectVendorResponse" } } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/projects/{projectId}/vendors/{vendorId}/add-to-budget": {
      post: {
        tags: ["Project Vendors"],
        summary: "Add vendor estimate to matching budget category",
        security: bearerAuth,
        parameters: [idParam("projectId", "Project ID"), idParam("vendorId", "Vendor ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/AddVendorToBudgetRequest" }, false),
        responses: {
          200: { description: "Budget category updated", content: { "application/json": { schema: { $ref: "#/components/schemas/AddVendorToBudgetResponse" } } } },
          ...errorResponses,
        },
      },
    },
    "/api/vendor-types": {
      get: {
        tags: ["Reference Data"],
        summary: "List vendor types",
        security: bearerAuth,
        responses: {
          200: { description: "Vendor types", content: { "application/json": { schema: arrayWrap("vendorTypes", { $ref: "#/components/schemas/VendorType" }) } } },
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
    },
    "/api/master-categories": {
      get: {
        tags: ["Reference Data"],
        summary: "List master categories",
        security: bearerAuth,
        parameters: [{ name: "eventType", in: "query", schema: { $ref: "#/components/schemas/EventType" } }],
        responses: {
          200: { description: "Master categories", content: { "application/json": { schema: arrayWrap("categories", { $ref: "#/components/schemas/MasterCategory" }) } } },
          401: errorResponses[401],
          500: errorResponses[500],
        },
      },
    },
    "/api/admin/vendors": {
      post: {
        tags: ["Admin"],
        summary: "Create vendor",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/VendorRequest" }),
        responses: {
          201: { description: "Vendor created", content: { "application/json": { schema: wrap("vendor", { $ref: "#/components/schemas/Vendor" }) } } },
          ...errorResponses,
        },
      },
    },
    "/api/admin/vendors/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update vendor",
        security: bearerAuth,
        parameters: [idParam("id", "Vendor ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/VendorRequest" }),
        responses: {
          200: { description: "Vendor updated", content: { "application/json": { schema: wrap("vendor", { $ref: "#/components/schemas/Vendor" }) } } },
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete vendor",
        security: bearerAuth,
        parameters: [idParam("id", "Vendor ID")],
        responses: {
          200: { description: "Vendor deleted", content: { "application/json": { schema: messageSchema } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/admin/vendor-types": {
      post: {
        tags: ["Admin"],
        summary: "Create vendor type",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/VendorTypeRequest" }),
        responses: {
          201: { description: "Vendor type created", content: { "application/json": { schema: wrap("vendorType", { $ref: "#/components/schemas/VendorType" }) } } },
          ...errorResponses,
        },
      },
    },
    "/api/admin/vendor-types/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update vendor type",
        security: bearerAuth,
        parameters: [idParam("id", "Vendor type ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/VendorTypeRequest" }),
        responses: {
          200: { description: "Vendor type updated", content: { "application/json": { schema: wrap("vendorType", { $ref: "#/components/schemas/VendorType" }) } } },
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete vendor type",
        security: bearerAuth,
        parameters: [idParam("id", "Vendor type ID")],
        responses: {
          200: { description: "Vendor type deleted", content: { "application/json": { schema: messageSchema } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/admin/master-categories": {
      post: {
        tags: ["Admin"],
        summary: "Create master category",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/MasterCategoryRequest" }),
        responses: {
          201: { description: "Master category created", content: { "application/json": { schema: wrap("category", { $ref: "#/components/schemas/MasterCategory" }) } } },
          ...errorResponses,
        },
      },
    },
    "/api/admin/master-categories/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update master category",
        security: bearerAuth,
        parameters: [idParam("id", "Master category ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/MasterCategoryRequest" }),
        responses: {
          200: { description: "Master category updated", content: { "application/json": { schema: wrap("category", { $ref: "#/components/schemas/MasterCategory" }) } } },
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete master category",
        security: bearerAuth,
        parameters: [idParam("id", "Master category ID")],
        responses: {
          200: { description: "Master category deleted", content: { "application/json": { schema: messageSchema } } },
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users",
        security: bearerAuth,
        responses: {
          200: { description: "Users", content: { "application/json": { schema: arrayWrap("users", { $ref: "#/components/schemas/AdminUser" }) } } },
          401: errorResponses[401],
          403: errorResponses[403],
          500: errorResponses[500],
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create user",
        security: bearerAuth,
        requestBody: jsonBody({ $ref: "#/components/schemas/AdminCreateUserRequest" }),
        responses: {
          201: { description: "User created", content: { "application/json": { schema: wrap("user", { $ref: "#/components/schemas/AdminUser" }) } } },
          ...errorResponses,
        },
      },
    },
    "/api/admin/users/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update user",
        security: bearerAuth,
        parameters: [idParam("id", "User ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/AdminUpdateUserRequest" }),
        responses: {
          200: { description: "User updated", content: { "application/json": { schema: wrap("user", { $ref: "#/components/schemas/AdminUser" }) } } },
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete user",
        security: bearerAuth,
        parameters: [idParam("id", "User ID")],
        responses: {
          200: { description: "User deleted", content: { "application/json": { schema: messageSchema } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
    "/api/admin/users/{id}/reset-password": {
      put: {
        tags: ["Admin"],
        summary: "Reset user password",
        security: bearerAuth,
        parameters: [idParam("id", "User ID")],
        requestBody: jsonBody({ $ref: "#/components/schemas/ResetPasswordRequest" }),
        responses: {
          200: { description: "Password reset", content: { "application/json": { schema: messageSchema } } },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
          500: errorResponses[500],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    responses: {
      BadRequest: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      Unauthorized: { description: "Authentication required or token invalid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      Forbidden: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      NotFound: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      Conflict: { description: "Conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      InternalServerError: { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
    schemas: {
      EventType: { type: "string", enum: ["PESTA_ADAT", "THREE_M"] },
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          isAdmin: { type: "boolean" },
        },
      },
      AdminUser: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            properties: {
              createdAt: { type: "string", format: "date-time" },
              _count: {
                type: "object",
                properties: { projects: { type: "integer" } },
              },
            },
          },
        ],
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          name: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 6 },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["password"],
        properties: { password: { type: "string", minLength: 6 } },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          groomName: { type: "string" },
          brideName: { type: "string" },
          groomDomicile: { type: "string" },
          brideDomicile: { type: "string" },
          weddingDate: { type: "string", format: "date-time" },
          totalBudget: { type: "number" },
          guestCount: { type: "integer", nullable: true },
          eventType: { $ref: "#/components/schemas/EventType" },
          isFinalized: { type: "boolean" },
          finalizedAt: { type: "string", format: "date-time", nullable: true },
          userId: { type: "string", format: "uuid" },
          events: { type: "array", items: { $ref: "#/components/schemas/Event" } },
          vendors: { type: "array", items: { $ref: "#/components/schemas/ProjectVendor" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateProjectRequest: {
        type: "object",
        required: ["groomName", "brideName", "groomDomicile", "brideDomicile", "weddingDate", "totalBudget", "eventType"],
        properties: {
          groomName: { type: "string" },
          brideName: { type: "string" },
          groomDomicile: { type: "string" },
          brideDomicile: { type: "string" },
          weddingDate: { type: "string", format: "date", example: "2026-12-20" },
          totalBudget: { type: "number" },
          guestCount: { type: "integer", nullable: true },
          eventType: { $ref: "#/components/schemas/EventType" },
        },
      },
      UpdateProjectRequest: {
        type: "object",
        properties: {
          groomName: { type: "string" },
          brideName: { type: "string" },
          groomDomicile: { type: "string" },
          brideDomicile: { type: "string" },
          weddingDate: { type: "string", format: "date" },
          totalBudget: { type: "number" },
          guestCount: { type: "integer", nullable: true },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          type: { $ref: "#/components/schemas/EventType" },
          projectId: { type: "string", format: "uuid" },
          categories: { type: "array", items: { $ref: "#/components/schemas/BudgetCategory" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      BudgetCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          plannedBudget: { type: "number" },
          actualCost: { type: "number" },
          notes: { type: "string", nullable: true },
          sortOrder: { type: "integer" },
          eventId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 100 },
          plannedBudget: { type: "number" },
          actualCost: { type: "number" },
          notes: { type: "string", nullable: true },
        },
      },
      MasterCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          eventType: { $ref: "#/components/schemas/EventType" },
          sortOrder: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MasterCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          eventType: { $ref: "#/components/schemas/EventType" },
          sortOrder: { type: "integer" },
        },
      },
      Vendor: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          type: { type: "string" },
          location: { type: "string" },
          minPriceEstimate: { type: "number" },
          maxPriceEstimate: { type: "number" },
          capacity: { type: "integer", nullable: true },
          description: { type: "string", nullable: true },
          contactInfo: { type: "string", nullable: true },
          isBatakSpecialist: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      VendorRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          location: { type: "string" },
          minPriceEstimate: { type: "number" },
          maxPriceEstimate: { type: "number" },
          capacity: { type: "integer", nullable: true },
          description: { type: "string", nullable: true },
          contactInfo: { type: "string", nullable: true },
          isBatakSpecialist: { type: "boolean" },
        },
      },
      VendorType: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          label: { type: "string" },
          defaultCategoryName: { type: "string", nullable: true },
          isPricePerPax: { type: "boolean" },
          sortOrder: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      VendorTypeRequest: {
        type: "object",
        properties: {
          code: { type: "string" },
          label: { type: "string" },
          defaultCategoryName: { type: "string", nullable: true },
          isPricePerPax: { type: "boolean" },
          sortOrder: { type: "integer" },
        },
      },
      ProjectVendor: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          notes: { type: "string", nullable: true },
          estimatedCost: { type: "number", nullable: true },
          projectId: { type: "string", format: "uuid" },
          vendorId: { type: "string", format: "uuid" },
          vendor: { $ref: "#/components/schemas/Vendor" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AddProjectVendorRequest: {
        type: "object",
        required: ["vendorId"],
        properties: {
          vendorId: { type: "string", format: "uuid" },
          notes: { type: "string", nullable: true },
          estimatedCost: { type: "number", nullable: true },
        },
      },
      RemoveProjectVendorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          updatedCategory: {
            oneOf: [{ $ref: "#/components/schemas/BudgetCategory" }, { type: "null" }],
          },
        },
      },
      AddVendorToBudgetRequest: {
        type: "object",
        properties: {
          estimatedCost: { type: "number" },
        },
      },
      AddVendorToBudgetResponse: {
        type: "object",
        properties: {
          category: { $ref: "#/components/schemas/BudgetCategory" },
          event: { type: "string" },
        },
      },
      VendorRecommendationsResponse: {
        type: "object",
        properties: {
          recommendations: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { $ref: "#/components/schemas/Vendor" },
            },
          },
          projectGuestCount: { type: "integer" },
          projectBudget: { type: "number" },
        },
      },
      AdminCreateUserRequest: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          name: { type: "string" },
          isAdmin: { type: "boolean" },
        },
      },
      AdminUpdateUserRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string" },
          isAdmin: { type: "boolean" },
        },
      },
    },
  },
};

module.exports = openapi;
