/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      fontSize: {
        "title":     ["17px", { lineHeight: "1.4", fontWeight: "600" }],
        "subtitle":  ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        "body":      ["14px", { lineHeight: "1.6" }],
        "caption":   ["13px", { lineHeight: "1.5" }],
        "label":     ["11px", { lineHeight: "1.4" }],
        "amount-lg": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
        "amount":    ["17px", { lineHeight: "1.2", fontWeight: "600" }],
      },
      colors: {
        // 메인 3색
        primary:  "#3185FC",
        ink:      "#131B23",
        white:    "#FFFFFF",
        // 수입/지출
        income:   "#00B493",
        expense:  "#F04452",
        // 라이트모드 서피스
        surface:  "#FFFFFF",
        "page-bg":"#F2F4F6",
        border:   "#E5E8EB",
        // 다크모드 서피스
        "dark-bg":   "#141920",
        "dark-card": "#1E2530",
        "dark-border":"#2A3340",
        // 텍스트 계층
        "text-primary":  "#131B23",
        "text-secondary":"#4E5968",
        "text-muted":    "#8B95A1",
        "text-disabled": "#B0B8C1",
      },
      spacing: {
        // 여백 토큰
        "page":  "16px", // 페이지 좌우 패딩
        "card":  "20px", // 카드 내부 패딩
        "item":  "14px", // 리스트 아이템 패딩
        "gap-sm":"8px",
        "gap":   "12px",
        "gap-lg":"16px",
        "section":"24px",
      },
      borderRadius: {
        "card": "16px",
        "item": "12px",
        "pill": "999px",
      },
      // 아이콘 컨테이너 크기
      width: {
        "icon-lg": "44px",
        "icon":    "36px",
        "icon-sm": "28px",
      },
      height: {
        "icon-lg": "44px",
        "icon":    "36px",
        "icon-sm": "28px",
      },
      boxShadow: {
        "card":     "0 2px 8px rgba(0,0,0,0.06)",
        "card-lg":  "0 4px 16px rgba(0,0,0,0.10)",
        "primary":  "0 4px 20px rgba(49,133,252,0.40)",
      },
    },
  },
  plugins: [],
};
