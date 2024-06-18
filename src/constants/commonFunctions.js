function hexToRgb(hex) {
    // Convert hex to RGB
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
  }

  function rgbToHex(rgb) {
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    return result
      ? "#" +
          ("0" + parseInt(result[1], 10).toString(16)).slice(-2) +
          ("0" + parseInt(result[2], 10).toString(16)).slice(-2) +
          ("0" + parseInt(result[3], 10).toString(16)).slice(-2)
      : "";
  }

  function getLuminance(r, g, b) {
    // Calculate luminance
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function isColorDark(color) {
    const rgb = hexToRgb(color);
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance < 0.5;
  }

  function setTextColorBasedOnBg(element) {
    const bgColor = getComputedStyle(element).backgroundColor;
    const hexColor = rgbToHex(bgColor);
    const isDark = isColorDark(hexColor);
    element.style.color = isDark ? "#FFFFFF" : "#000000";
  }

  export const DOMContentLoaded = (color) => {
    const element = document.getElementById("myElement");
    // Set a background color for testing
    element.style.backgroundColor = color // Change this value for testing
    setTextColorBasedOnBg(element);
  };