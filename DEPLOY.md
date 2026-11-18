# วิธี Deploy ฟรี (PythonAnywhere + Vercel)

## 0) อัปโหลดโค้ดขึ้น GitHub
สร้าง repo ว่างบน github.com แล้วรันในโฟลเดอร์โปรเจกต์:
```bash
git remote add origin https://github.com/<ชื่อคุณ>/<ชื่อ-repo>.git
git branch -M main
git push -u origin main
```

## 1) Backend บน PythonAnywhere
1. สมัครบัญชีฟรีที่ pythonanywhere.com
2. เปิด **Bash console** แล้วรัน
   ```bash
   git clone https://github.com/<ชื่อคุณ>/<ชื่อ-repo>.git
   pip install --user flask flask-cors
   ```
   (ถ้า repo เป็น private ให้ใช้ Personal Access Token ตอน clone)
3. แท็บ **Web** → Add a new web app → Manual configuration → Python 3.10–3.12
4. กดลิงก์ **WSGI configuration file** แล้วแทนเนื้อหาทั้งหมดด้วย `backend/pythonanywhere_wsgi.py` (แก้ค่าใน `<...>`)
5. กด **Reload** แล้วเปิด `https://<ชื่อผู้ใช้>.pythonanywhere.com/api/config` ต้องเห็น JSON

## 2) Frontend บน Vercel
1. สมัคร vercel.com ด้วยบัญชี GitHub → Add New Project → เลือก repo
2. **Root Directory** = `frontend`
3. Environment Variables: `NEXT_PUBLIC_API_URL` = `https://<ชื่อผู้ใช้>.pythonanywhere.com`
4. Deploy

## 3) ปิดวงจร CORS
นำลิงก์ Vercel ไปใส่ `FRONTEND_ORIGIN` ใน WSGI (ข้อ 1.4) แล้วกด Reload อีกครั้ง

## ดูแลหลังขึ้นจริง
- PythonAnywhere ฟรีต้องกดต่ออายุแอปในแท็บ Web ทุก 3 เดือน
- สำรอง `backend/swiw.db` และ `backend/uploads/` เป็นระยะ
- อัปเดตโค้ด: `git pull` ในโฟลเดอร์ repo บน PythonAnywhere แล้วกด Reload
