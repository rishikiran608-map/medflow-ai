import { describe, it, expect, vi } from "vitest";
const { calculateTravelETA } = require("../services/queuePredictionService");
const { predictNoShowProbability } = require("../services/noShowAIService");
const { sendWhatsAppNotification } = require("../services/whatsappService");

describe("MedFlow AI - Core Services Unit Tests", () => {
  
  // 1. Travel ETA and dynamic commute calculations
  describe("queuePredictionService - calculateTravelETA", () => {
    it("should calculate correct walking duration without traffic delays", () => {
      const result = calculateTravelETA("Walking", 1); // 1 km at 5 km/h = 12 mins
      expect(result.durationMinutes).toBe(12);
      expect(result.trafficDelayMins).toBe(0);
      expect(result.etaTimestamp).toBeDefined();
    });

    it("should include peak hours delay for driving", () => {
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
  });

  // 2. Patient No-Show risk classifier engine
  describe("noShowAIService - predictNoShowProbability", () => {
    it("should classify default safe state for null input", () => {
      const result = predictNoShowProbability(null);
      expect(result.probability).toBe(10);
      expect(result.riskLevel).toBe("Low");
      expect(result.reasons[0]).toContain("Default safe state");
    });

    it("should flag medium risk if patient is waiting and travel has not started", () => {
      const queueItem = {
        queue_status: "Waiting",
        patients: { age: 30 }
      };
      const result = predictNoShowProbability(queueItem);
      expect(result.probability).toBe(50);
      expect(result.riskLevel).toBe("Medium");
      expect(result.reasons).toContain("Has not initiated travel ('I'm On The Way' is pending)");
    });

    it("should flag senior patients and transit commuter risks", () => {
      const queueItem = {
        queue_status: "Arriving",
        travel_mode: "Transit",
        eta_minutes: 10,
        patients: { age: 75 }
      };
      const result = predictNoShowProbability(queueItem);
      expect(result.probability).toBe(40);
      expect(result.riskLevel).toBe("Medium");
      expect(result.reasons).toContain("Public transit is subject to standard schedule delays");
      expect(result.reasons).toContain("Senior patient (requires checkup mobility assistance)");
    });
  });

  // 3. Simulated/Real WhatsApp Notification Service
  describe("whatsappService - sendWhatsAppNotification", () => {
    it("should return success and appropriate metadata on dispatch", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const result = await sendWhatsAppNotification("9876543210", "Test Alert Message");
      
      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

});
