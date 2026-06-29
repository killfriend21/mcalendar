# Factory Calendar

ระบบปฏิทินและ timeline สำหรับติดตาม project milestone ของทีม

## Features

### Calendar (หน้าหลัก)
- Month view และ Quarter view
- แสดง schedule ของแต่ละ project
- แสดงวันลาของทีม (badge 🏖)
- แสดง milestone จาก timeline เป็น badge ดาว (★)
- แสดงวันหยุดบริษัท

### Timeline
- แสดง milestone ของแต่ละ project ตามไทม์ไลน์รายปี
- เพิ่ม/แก้ไข/ลบ milestone พร้อม label, วันที่, และสถานะ
- สถานะ milestone กำหนดได้เองจาก Admin
- เลื่อนดูปีก่อนหน้า/ถัดไปได้

### Admin Panel
- **สมาชิกทีม** — จัดการชื่อและบทบาทสมาชิก
- **โปรเจกต์** — เพิ่ม/ลบ project พร้อมสีประจำ project
- **วันหยุดบริษัท** — กำหนดวันหยุดประจำปี
- **หุ้น** — ติดตามราคาหลักทรัพย์
- **สถานะ Milestone** — เพิ่ม/ลบ/แก้ไข status option พร้อมสีที่กำหนดเอง
- **ทั่วไป** — ตั้งค่าระบบ

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS, react-big-calendar
- **Deployment**: Docker Compose

## การรัน Local

```bash
docker compose up -d --build
```

เปิด [http://localhost:3001](http://localhost:3001)

## Environment Variables

```env
DATABASE_URL=postgresql://factory_user:factory_password@db:5432/factory_calendar
```

## Database Schema

| Model | คำอธิบาย |
|---|---|
| `Schedule` | ตารางงานของแต่ละ project |
| `Project` | ข้อมูล project และสี |
| `ProjectMilestone` | Milestone ใน timeline (มี status) |
| `MilestoneStatus` | สถานะที่กำหนดเองสำหรับ milestone |
| `Leave` | วันลาของสมาชิก |
| `Member` | สมาชิกทีม |
| `CompanyHoliday` | วันหยุดบริษัท |
| `ProjectTask` | Task ย่อยใน Quarter view |
| `StockWatch` | หลักทรัพย์ที่ติดตาม |
| `AppSetting` | ค่าตั้งต่างๆ ของระบบ |
