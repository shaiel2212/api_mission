FROM node:18

# הגדרת משתנה סביבתי למנוע התקנות שאינן נחוצות
ENV NODE_ENV=production

# יצירת תיקיית עבודה בקונטיינר
WORKDIR /app

# העתקת קובץ התלויות
COPY package.json package-lock.json ./

# התקנת התלויות
RUN npm install --omit=dev

# העתקת שאר קבצי הפרויקט
COPY . .

# הגדרת הפורט להרצה
EXPOSE 5000

# הפעלת האפליקציה
CMD ["node", "app.js"]

# ✅ docker-compose.yml - הקמת שירות Docker
