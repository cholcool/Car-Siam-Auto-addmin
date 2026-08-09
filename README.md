# Car Rental Admin System (Car Siam Auto Admin)

ระบบจัดการหลังบ้าน (Admin Dashboard) สำหรับแอปพลิเคชันเช่ารถยนต์ พัฒนาด้วย Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, และ Next-Auth v5

---

## 🚀 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [Next-Auth v5 (Auth.js)](https://authjs.dev/)
- **State Management:** [TanStack React Query v5](https://tanstack.com/query/latest)
- **Form Handling:** React Hook Form & Zod
- **Containerization:** Docker (สำหรับ Local Database)

---

## 🛠️ การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. เตรียมความพร้อม (Prerequisites)
- [Node.js](https://nodejs.org/) (แนะนำ v18 ขึ้นไป)
- [Docker](https://www.docker.com/) (สำหรับรันฐานข้อมูลจำลองในเครื่อง)

### 2. ติดตั้ง Dependencies
```sh
npm install
```

### 3. ตั้งค่า Environment Variables
คัดลอกไฟล์ [.env.example](.env.example) ไปเป็น `.env` และตั้งค่าการเชื่อมต่อฐานข้อมูลและคีย์ต่าง ๆ:
```sh
cp .env.example .env
```

### 4. รัน Database (Local) ด้วย Docker
รัน PostgreSQL Container ผ่าน [docker-compose.yml](docker-compose.yml):
```sh
docker compose up -d
```

### 5. ตั้งค่าฐานข้อมูล (Prisma)
สร้างตารางในฐานข้อมูลและใส่ข้อมูลจำลอง (Seed Data):
```sh
# สร้างตารางใน Database
npm run db:push

# ใส่ข้อมูลจำลองเริ่มต้น
npm run db:seed
```

### 6. รันโปรเจกต์ในโหมดพัฒนา (Development)
```sh
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 📜 คำสั่งที่สำคัญในโปรเจกต์ (Available Scripts)

คำสั่งทั้งหมดถูกกำหนดไว้ใน [package.json](package.json):

- `npm run dev` : รันแอปพลิเคชันในโหมดพัฒนา (Development) พร้อมล้างแคช `.next`
- `npm run build` : คอมไพล์และอัปติไมซ์โค้ดทั้งหมดเพื่อเตรียมใช้งานจริง (Production)
- `npm run start` : เปิดรันเซิร์ฟเวอร์ด้วยไฟล์ที่คอมไพล์แล้ว (ต้องรัน build ก่อน)
- `npm run lint` : ตรวจสอบคุณภาพโค้ดด้วย ESLint
- `npm run typecheck` : ตรวจสอบความถูกต้องของ TypeScript ทั่วทั้งโปรเจกต์
- `npm run format` : จัดฟอร์แมตโค้ดอัตโนมัติด้วย Prettier
- `npm run db:migrate` : บันทึกประวัติการเปลี่ยนแปลงโครงสร้างฐานข้อมูล
- `npm run db:push` : อัปเดตโครงสร้างฐานข้อมูลตาม Schema ล่าสุดทันที
- `npm run db:seed` : เติมข้อมูลจำลองเข้าฐานข้อมูลผ่านสคริปต์ `prisma/seed.ts`

---

## 📁 โครงสร้างโฟลเดอร์ที่สำคัญ

- `/src/app` : หน้าเว็บและ API Routes (Next.js App Router)
- `/src/components` : UI Components ที่ใช้ร่วมกันในระบบ
- `/src/lib` : ฟังก์ชันช่วยเหลือ (Utilities), RBAC, และ Types ต่าง ๆ
- `/prisma` : ไฟล์ Schema และสคริปต์สำหรับจัดการฐานข้อมูล
- `/tests-e2e` : ไฟล์สำหรับทดสอบระบบแบบ End-to-End (Playwright)