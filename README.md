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

### Integration กับ homer-web (Team Hub)
เมื่อเพิ่ม milestone หรือ project task ใหม่ (เฉพาะ task หลัก ไม่รวม subtask) ระบบจะ push เข้า homer-web dashboard ให้อัตโนมัติเป็น News/Task — ดู [`lib/homerSync.ts`](lib/homerSync.ts) ยืนยันตัวตนด้วย shared API key (`HOMER_WEB_API_KEY`) ถ้า sync พลาด (เช่น homer-web offline) จะไม่กระทบการทำงานปกติของ mcalendar เลย แค่ log error ไว้เฉยๆ

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

# homer-web integration: new milestones/tasks get synced there as News/Tasks.
# Leave blank to disable syncing. Must match homer-web's INTEGRATION_API_KEY.
HOMER_WEB_URL=http://localhost:8922
HOMER_WEB_API_KEY=
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
