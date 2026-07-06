import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Require supabase first and spy/mock it in Node's cache
const { supabase, supabaseAdmin } = require("../config/supabase");

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();

vi.spyOn(supabaseAdmin, "from").mockImplementation(() => ({
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  single: mockSingle,
  order: mockOrder,
  maybeSingle: mockMaybeSingle,
}));

vi.spyOn(supabase, "from").mockImplementation(() => ({
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  single: mockSingle,
  order: mockOrder,
  maybeSingle: mockMaybeSingle,
}));

vi.spyOn(supabase.auth, "getUser").mockImplementation(async (token) => {
  if (token === "valid-token") {
    return { data: { user: { id: "user-123", user_metadata: { role: "Patient" } } }, error: null };
  }
  return { data: { user: null }, error: new Error("Invalid token") };
});

// 2. Require queueMetadataStore next and mutate it before requiring services that destructure it
const queueMetadataStore = require("../services/queueMetadataStore");
const originalGetMetadata = queueMetadataStore.getMetadata;

vi.spyOn(queueMetadataStore, "getMetadata").mockImplementation(async (id, patientId) => {
  if (global.getMetadataMock) {
    return global.getMetadataMock(id, patientId);
  }
  // Call original function reference directly to avoid recursion
  return originalGetMetadata.call(queueMetadataStore, id, patientId);
});

// 3. Now require local modules that destructure queueMetadataStore / config/supabase
const { calculateTravelETA, calculateWaitingTime } = require("../services/queuePredictionService");
const { predictNoShowProbability } = require("../services/noShowAIService");
const { sendWhatsAppNotification } = require("../services/whatsappService");
const errorHandler = require("../middleware/errorHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { setMetadata, getMetadata, clearMetadata } = queueMetadataStore;

describe("MedFlow AI - Core Services & Middleware Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.getMetadataMock = null;
  });

  // 1. queuePredictionService - calculateTravelETA
  describe("queuePredictionService - calculateTravelETA", () => {
    it("should calculate correct walking duration without traffic delays", () => {
      const result = calculateTravelETA("Walking", 5); // 5 km at 5 km/h = 60 mins
      expect(result.durationMinutes).toBe(60);
      expect(result.trafficDelayMins).toBe(0);
      expect(result.etaTimestamp).toBeDefined();
    });

    it("should include peak hours delay for driving during rush hours (8-10 AM)", () => {
      const mockDate = new Date();
      mockDate.setHours(9);
      const originalDate = global.Date;

      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = calculateTravelETA("Driving", 10); // 10km at 40km/h = 15 mins + 12 mins delay = 27 mins
      expect(result.durationMinutes).toBe(27);
      expect(result.trafficDelayMins).toBe(12);

      global.Date = originalDate;
    });

    it("should calculate off-peak driving duration correctly", () => {
      const mockDate = new Date();
      mockDate.setHours(14);
      const originalDate = global.Date;

      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = calculateTravelETA("Driving", 10); // 10km at 40km/h = 15 mins + 4 mins delay = 19 mins
      expect(result.durationMinutes).toBe(19);
      expect(result.trafficDelayMins).toBe(4);

      global.Date = originalDate;
    });

    it("should handle transit travel mode with transit delay", () => {
      const result = calculateTravelETA("Transit", 10); // 10km at 20km/h = 30 mins + 5 mins delay = 35 mins
      expect(result.durationMinutes).toBe(35);
      expect(result.trafficDelayMins).toBe(5);
    });

    it("should handle default/undefined travel modes gracefully", () => {
      const result = calculateTravelETA("UnknownMode", 10); // Default speed 30km/h = 20 mins + 0 mins delay = 20 mins
      expect(result.durationMinutes).toBe(20);
      expect(result.trafficDelayMins).toBe(0);
    });
  });

  // 2. queuePredictionService - calculateWaitingTime
  describe("queuePredictionService - calculateWaitingTime", () => {
    it("should predict correct wait time based on queue complexity", async () => {
      // Mock the chainable DB call
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "queue-1", queue_status: "Waiting" },
              { id: "queue-2", queue_status: "Waiting" },
            ],
            error: null,
          }),
        }),
      });

      // Set getMetadataMock globally so the spied implementation matches it
      global.getMetadataMock = async (id) => {
        if (id === "queue-1") return { reason: "Severe chest pain emergency" };
        if (id === "queue-2") return { reason: "Regular checkup follow-up" };
        return { reason: "" };
      };

      const result = await calculateWaitingTime("doctor-1");
      expect(result.patientsWaiting).toBe(2);
      expect(result.estimatedWait).toBe(38); // 30 mins (emergency) + 8 mins (follow-up)
      expect(result.delayProbability).toBe("Medium");
    });
  });

  // 3. noShowAIService - predictNoShowProbability
  describe("noShowAIService - predictNoShowProbability", () => {
    it("should classify default safe state for null/undefined input", () => {
      const result = predictNoShowProbability(null);
      expect(result.probability).toBe(10);
      expect(result.riskLevel).toBe("Low");
      expect(result.reasons[0]).toContain("Default safe state");
    });

    it("should flag risk if patient is waiting and commute has not started", () => {
      const queueItem = {
        queue_status: "Waiting",
        patients: { age: 30 },
      };
      const result = predictNoShowProbability(queueItem);
      expect(result.probability).toBe(50); // 15 base + 35 waiting = 50%
      expect(result.riskLevel).toBe("Medium");
      expect(result.reasons).toContain("Has not initiated travel ('I'm On The Way' is pending)");
    });

    it("should flag senior patient using transit commutes", () => {
      const queueItem = {
        queue_status: "Arriving",
        travel_mode: "Transit",
        eta_minutes: 10,
        patients: { age: 75 },
      };
      const result = predictNoShowProbability(queueItem);
      expect(result.probability).toBe(40); // 15 base + 15 transit + 10 age = 40%
      expect(result.riskLevel).toBe("Medium");
      expect(result.reasons).toContain("Public transit is subject to standard schedule delays");
      expect(result.reasons).toContain("Senior patient (requires checkup mobility assistance)");
    });

    it("should return low risk for checked-in patient", () => {
      const queueItem = {
        queue_status: "Checked In",
        patients: { age: 25 },
      };
      const result = predictNoShowProbability(queueItem);
      expect(result.probability).toBe(15); // 15 base
      expect(result.riskLevel).toBe("Low");
    });
  });

  // 4. errorHandler middleware
  describe("errorHandler middleware", () => {
    it("should return 500 status code for generic errors", () => {
      const err = new Error("Generic server error");
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Generic server error",
        })
      );
    });

    it("should respect the custom statusCode or status property of error object", () => {
      const err = { message: "Payment Required", statusCode: 402 };
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Payment Required",
        })
      );
    });

    it("should hide error details stack trace when in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const err = new Error("Database query timeout details");
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  // 5. authMiddleware
  describe("authMiddleware", () => {
    it("should return 401 unauthorized if authorization header is missing", async () => {
      const req = { headers: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("No token provided"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if header does not start with Bearer", async () => {
      const req = { headers: { authorization: "Basic x1234y" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token value is literally 'null' or 'undefined' string", async () => {
      const req = { headers: { authorization: "Bearer null" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid or expired session token",
        })
      );
    });

    it("should authorize patient and attach custom role metadata on valid token", async () => {
      const req = { headers: { authorization: "Bearer valid-token" } };
      const res = {};
      const next = vi.fn();

      await authMiddleware(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe("Patient");
      expect(next).toHaveBeenCalled();
    });
  });

  // 6. general utilities & store
  describe("whatsappService - sendWhatsAppNotification", () => {
    it("should successfully log simulation details without crashing", async () => {
      const result = await sendWhatsAppNotification("9876543210", "MedFlow QR Verified Token");
      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
    });
  });

  describe("queueMetadataStore - storage functionality", () => {
    it("should set and fetch metadata attributes cleanly", async () => {
      // Mock Supabase select chain for getPatientHistory
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      // Clear metadata override
      global.getMetadataMock = null;

      setMetadata("q-key-1", { test_key: "unit_test_val" });
      const metadata = await getMetadata("q-key-1");
      expect(metadata.test_key).toBe("unit_test_val");
    });

    it("should clear metadata successfully", async () => {
      // Mock Supabase select chain for getPatientHistory
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      // Clear metadata override
      global.getMetadataMock = null;

      setMetadata("q-key-2", { eta: 12 });
      clearMetadata("q-key-2");
      const metadata = await getMetadata("q-key-2");
      expect(metadata.eta).toBeUndefined();
    });
  });
});
