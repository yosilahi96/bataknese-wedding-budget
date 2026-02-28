import { describe, it, expect } from "vitest";
import { getVendorTypeBadgeColor, buildVendorTypeColorMap } from "../../utils/vendorTypeColors";

describe("vendorTypeColors", () => {
  describe("getVendorTypeBadgeColor", () => {
    it("should return a color object for index 0", () => {
      const color = getVendorTypeBadgeColor(0);
      expect(color).toHaveProperty("bg");
      expect(color).toHaveProperty("text");
      expect(color.bg).toBe("#dbeafe");
    });

    it("should wrap around when index exceeds palette length", () => {
      const color0 = getVendorTypeBadgeColor(0);
      const color12 = getVendorTypeBadgeColor(12);
      expect(color12).toEqual(color0);
    });

    it("should return different colors for different indices", () => {
      const color0 = getVendorTypeBadgeColor(0);
      const color1 = getVendorTypeBadgeColor(1);
      expect(color0).not.toEqual(color1);
    });
  });

  describe("buildVendorTypeColorMap", () => {
    it("should map vendor type codes to colors", () => {
      const vendorTypes = [
        { code: "VENUE" },
        { code: "CATERING" },
        { code: "MUSIC" },
      ];

      const map = buildVendorTypeColorMap(vendorTypes);

      expect(map.VENUE).toHaveProperty("bg");
      expect(map.CATERING).toHaveProperty("bg");
      expect(map.MUSIC).toHaveProperty("bg");
      expect(map.VENUE).not.toEqual(map.CATERING);
    });

    it("should return empty map for empty array", () => {
      const map = buildVendorTypeColorMap([]);
      expect(map).toEqual({});
    });
  });
});
