# ตัวอย่างเนื้อหาไฟล์ WSGI สำหรับ PythonAnywhere (แท็บ Web -> WSGI configuration file)
# คัดลอกไปวางแทนเนื้อหาเดิม แล้วแก้ค่าที่มี <...> ให้เป็นของคุณ
import os
import sys

# โฟลเดอร์ backend ที่ git clone ไว้ (แก้ชื่อผู้ใช้ PythonAnywhere และชื่อโฟลเดอร์ repo)
sys.path.insert(0, '/home/<ชื่อผู้ใช้>/<ชื่อ-repo>/backend')

os.environ['SECRET_KEY'] = '<สตริงสุ่มยาวๆ เช่น 40 ตัวอักษรขึ้นไป>'
os.environ['SELLER_EMAIL'] = '<อีเมลผู้ขาย>'
os.environ['SELLER_PASSWORD'] = '<รหัสผู้ขายที่ยาวและไม่ซ้ำ>'
os.environ['PROMPTPAY_ID'] = '<เบอร์พร้อมเพย์จริงของร้าน>'
os.environ['FRONTEND_ORIGIN'] = 'https://<โดเมนเว็บบน-vercel>.vercel.app'  # ไม่มี / ท้าย

from app import app as application  # noqa: E402
