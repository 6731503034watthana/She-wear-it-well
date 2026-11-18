"""She wear it well - Flask + SQLite backend."""
import json
import os
import sqlite3
import uuid
from datetime import date, datetime, timedelta
from functools import wraps

from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE_DIR, "swiw.db"))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
SELLER_EMAIL = os.environ.get("SELLER_EMAIL", "seller@swiw.com")
SELLER_PASSWORD = os.environ.get("SELLER_PASSWORD", "5555")
PROMPTPAY_ID = os.environ.get("PROMPTPAY_ID", "0999999999")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # 7 days

CATEGORIES = ["set", "tops", "bottoms", "accessories", "bags"]
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp", "gif"}
# pending -> confirmed -> shipping -> delivered -> returned
NEXT_STATUS = {
    "pending": ["confirmed", "rejected"],
    "confirmed": ["shipping"],
    "shipping": ["delivered"],
    "delivered": ["returned"],
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
CORS(app, origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000"])
serializer = URLSafeTimedSerializer(SECRET_KEY)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    size TEXT NOT NULL DEFAULT '',
    measurements TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    shop_price REAL NOT NULL DEFAULT 0,
    tiers TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total REAL NOT NULL,
    slip_image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_image TEXT NOT NULL DEFAULT '',
    days INTEGER NOT NULL,
    price REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
    product_id INTEGER NOT NULL REFERENCES products(id),
    day TEXT NOT NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, day)
);
"""

# ---------------------------------------------------------------- database
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH, timeout=10)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript(SCHEMA)
    if not db.execute("SELECT 1 FROM users WHERE role='seller' LIMIT 1").fetchone():
        db.execute(
            "INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?,?,?,?,?,?)",
            ("เจ้าของร้าน", SELLER_EMAIL.lower(), "", generate_password_hash(SELLER_PASSWORD), "seller", now_iso()),
        )
    else:
        # ซิงก์อีเมล/รหัสผ่านผู้ขายกับค่าตั้งต้นทุกครั้งที่เริ่มระบบ (ยังไม่มีหน้าเปลี่ยนรหัสผ่าน)
        db.execute(
            "UPDATE users SET email=?, password_hash=? WHERE role='seller'",
            (SELLER_EMAIL.lower(), generate_password_hash(SELLER_PASSWORD)),
        )
    db.commit()
    db.close()


# ---------------------------------------------------------------- helpers
def error(message, status=400):
    return jsonify({"error": message}), status


def image_url(value):
    if not value:
        return ""
    if value.startswith("http"):
        return value
    return request.host_url.rstrip("/") + "/uploads/" + value


def product_to_dict(row):
    tiers = json.loads(row["tiers"])
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "size": row["size"],
        "measurements": row["measurements"],
        "description": row["description"],
        "shop_price": row["shop_price"],
        "tiers": tiers,
        "min_price": min(t["price"] for t in tiers) if tiers else 0,
        "image": image_url(row["image"]),
        "active": bool(row["active"]),
    }


def user_to_dict(row):
    return {k: row[k] for k in ("id", "name", "email", "phone", "address", "role")}


def make_token(user_id):
    return serializer.dumps({"uid": user_id})


def current_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = serializer.loads(header[7:], max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    return get_db().execute("SELECT * FROM users WHERE id=?", (data["uid"],)).fetchone()


def auth_required(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if user is None:
                return error("กรุณาเข้าสู่ระบบ", 401)
            if role and user["role"] != role:
                return error("ไม่มีสิทธิ์เข้าถึง", 403)
            g.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def save_upload(file_storage):
    """Save an uploaded image, return stored filename (or None)."""
    if not file_storage or not file_storage.filename:
        return None
    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in ALLOWED_EXT:
        raise ValueError("รองรับเฉพาะไฟล์รูป png, jpg, jpeg, webp, gif")
    name = f"{uuid.uuid4().hex}.{ext}"
    file_storage.save(os.path.join(UPLOAD_DIR, name))
    return name


def parse_product_form():
    """Validate product fields from multipart form. Returns (data, error_message)."""
    f = request.form
    name = f.get("name", "").strip()
    category = f.get("category", "").strip()
    if not name:
        return None, "กรุณากรอกชื่อสินค้า"
    if category not in CATEGORIES:
        return None, "หมวดหมู่ไม่ถูกต้อง"
    try:
        shop_price = float(f.get("shop_price") or 0)
        raw_tiers = json.loads(f.get("tiers") or "[]")
        tiers = [{"days": int(t["days"]), "price": float(t["price"])} for t in raw_tiers]
    except (ValueError, KeyError, TypeError):
        return None, "ข้อมูลราคาเช่าไม่ถูกต้อง"
    if shop_price < 0:
        return None, "ราคาป้ายต้องไม่ติดลบ"
    if not tiers:
        return None, "กรุณาเพิ่มราคาเช่าอย่างน้อย 1 แบบ"
    if any(t["days"] < 1 or t["price"] <= 0 for t in tiers):
        return None, "จำนวนวันต้อง≥ 1 และราคาต้องมากกว่า 0"
    if len({t["days"] for t in tiers}) != len(tiers):
        return None, "จำนวนวันซ้ำกัน"
    tiers.sort(key=lambda t: t["days"])
    return {
        "name": name,
        "category": category,
        "size": f.get("size", "").strip(),
        "measurements": f.get("measurements", "").strip(),
        "description": f.get("description", "").strip(),
        "shop_price": shop_price,
        "tiers": json.dumps(tiers),
        "image_url": f.get("image_url", "").strip(),
    }, None


def order_to_dict(db, row):
    items = db.execute("SELECT * FROM order_items WHERE order_id=? ORDER BY id", (row["id"],)).fetchall()
    return {
        "id": row["id"],
        "code": row["code"],
        "status": row["status"],
        "total": row["total"],
        "created_at": row["created_at"],
        "customer": {"name": row["customer_name"], "phone": row["customer_phone"], "address": row["customer_address"]},
        "slip_image": image_url(row["slip_image"]),
        "next_status": NEXT_STATUS.get(row["status"], []),
        "items": [
            {
                "product_id": i["product_id"],
                "name": i["product_name"],
                "image": image_url(i["product_image"]),
                "days": i["days"],
                "price": i["price"],
                "start_date": i["start_date"],
                "end_date": i["end_date"],
            }
            for i in items
        ],
    }


# ---------------------------------------------------------------- public
@app.get("/api/config")
def config():
    return jsonify({"promptpay_id": PROMPTPAY_ID, "shop_name": "She wear it well", "categories": CATEGORIES})


@app.get("/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# ---------------------------------------------------------------- auth
@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    password = str(data.get("password", ""))
    if not name or not email or "@" not in email:
        return error("กรุณากรอกชื่อและอีเมลให้ถูกต้อง")
    if len(password) < 6:
        return error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        return error("อีเมลนี้ถูกใช้งานแล้ว", 409)
    cur = db.execute(
        "INSERT INTO users (name, email, phone, address, password_hash, role, created_at) VALUES (?,?,?,?,?,'buyer',?)",
        (name, email, phone, address, generate_password_hash(password), now_iso()),
    )
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify({"token": make_token(user["id"]), "user": user_to_dict(user)}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    user = get_db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], str(data.get("password", ""))):
        return error("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401)
    return jsonify({"token": make_token(user["id"]), "user": user_to_dict(user)})


@app.get("/api/me")
@auth_required()
def me():
    return jsonify({"user": user_to_dict(g.user)})


@app.put("/api/me")
@auth_required()
def update_me():
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        "UPDATE users SET name=?, phone=?, address=? WHERE id=?",
        (str(data.get("name", g.user["name"])).strip() or g.user["name"],
         str(data.get("phone", g.user["phone"])).strip(),
         str(data.get("address", g.user["address"])).strip(), g.user["id"]),
    )
    db.commit()
    return jsonify({"user": user_to_dict(db.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone())})


# ---------------------------------------------------------------- products
@app.get("/api/products")
def list_products():
    db = get_db()
    show_all = request.args.get("all") == "1"
    if show_all:
        user = current_user()
        if not user or user["role"] != "seller":
            return error("ไม่มีสิทธิ์เข้าถึง", 403)
    sql, params = "SELECT * FROM products", []
    where = []
    if not show_all:
        where.append("active=1")
    category = request.args.get("category")
    if category and category != "all":
        where.append("category=?")
        params.append(category)
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY id DESC"
    today = date.today().isoformat()
    booked = {
        r["product_id"]: r
        for r in db.execute(
            "SELECT product_id, MIN(day) AS next_day, COUNT(*) AS c FROM bookings WHERE day>=? GROUP BY product_id",
            (today,),
        )
    }
    products = []
    for r in db.execute(sql, params).fetchall():
        p = product_to_dict(r)
        b = booked.get(r["id"])
        p["next_booked"] = b["next_day"] if b else None  # วันจองที่ใกล้ที่สุด (วันนี้เป็นต้นไป)
        p["booked_days"] = b["c"] if b else 0
        p["rented_now"] = bool(b and b["next_day"] == today)
        products.append(p)
    return jsonify({"products": products})


@app.get("/api/products/<int:pid>")
def get_product(pid):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    if not row:
        return error("ไม่พบสินค้า", 404)
    if not row["active"]:
        user = current_user()
        if not user or user["role"] != "seller":
            return error("ไม่พบสินค้า", 404)
    today = date.today().isoformat()
    booked = [r["day"] for r in db.execute(
        "SELECT day FROM bookings WHERE product_id=? AND day>=? ORDER BY day", (pid, today))]
    product = product_to_dict(row)
    product["booked_dates"] = booked
    return jsonify({"product": product})


@app.post("/api/products")
@auth_required("seller")
def create_product():
    data, err = parse_product_form()
    if err:
        return error(err)
    try:
        image = save_upload(request.files.get("image")) or data["image_url"]
    except ValueError as e:
        return error(str(e))
    db = get_db()
    cur = db.execute(
        "INSERT INTO products (name, category, size, measurements, description, shop_price, tiers, image, created_at)"
        " VALUES (?,?,?,?,?,?,?,?,?)",
        (data["name"], data["category"], data["size"], data["measurements"], data["description"],
         data["shop_price"], data["tiers"], image, now_iso()),
    )
    db.commit()
    row = db.execute("SELECT * FROM products WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify({"product": product_to_dict(row)}), 201


@app.put("/api/products/<int:pid>")
@auth_required("seller")
def update_product(pid):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    if not row:
        return error("ไม่พบสินค้า", 404)
    data, err = parse_product_form()
    if err:
        return error(err)
    try:
        image = save_upload(request.files.get("image")) or data["image_url"] or row["image"]
    except ValueError as e:
        return error(str(e))
    db.execute(
        "UPDATE products SET name=?, category=?, size=?, measurements=?, description=?, shop_price=?, tiers=?, image=?"
        " WHERE id=?",
        (data["name"], data["category"], data["size"], data["measurements"], data["description"],
         data["shop_price"], data["tiers"], image, pid),
    )
    db.commit()
    return jsonify({"product": product_to_dict(db.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone())})


@app.patch("/api/products/<int:pid>/active")
@auth_required("seller")
def toggle_product(pid):
    active = 1 if (request.get_json(silent=True) or {}).get("active") else 0
    db = get_db()
    if not db.execute("SELECT 1 FROM products WHERE id=?", (pid,)).fetchone():
        return error("ไม่พบสินค้า", 404)
    db.execute("UPDATE products SET active=? WHERE id=?", (active, pid))
    db.commit()
    return jsonify({"ok": True, "active": bool(active)})


@app.delete("/api/products/<int:pid>")
@auth_required("seller")
def delete_product(pid):
    db = get_db()
    if not db.execute("SELECT 1 FROM products WHERE id=?", (pid,)).fetchone():
        return error("ไม่พบสินค้า", 404)
    # ลบถาวรได้ ยกเว้นมีออเดอร์ที่ยังดำเนินการอยู่ (ต้องส่ง/รับคืนให้เสร็จก่อน)
    busy = db.execute(
        "SELECT o.code FROM orders o JOIN order_items i ON i.order_id=o.id"
        " WHERE i.product_id=? AND o.status IN ('pending','confirmed','shipping','delivered')",
        (pid,),
    ).fetchall()
    if busy:
        codes = ", ".join(sorted({r["code"] for r in busy}))
        return error(f"ลบไม่ได้ เพราะมีออเดอร์ที่ยังดำเนินการอยู่: {codes} (จัดการให้เสร็จ/ปฏิเสธก่อน หรือกดปิดการเช่าแทน)", 409)

    product = db.execute("SELECT image FROM products WHERE id=?", (pid,)).fetchone()
    files = [product["image"]]
    order_ids = [r["order_id"] for r in db.execute("SELECT DISTINCT order_id FROM order_items WHERE product_id=?", (pid,))]
    db.execute("DELETE FROM bookings WHERE product_id=?", (pid,))
    db.execute("DELETE FROM order_items WHERE product_id=?", (pid,))
    # ออเดอร์ที่เหลือรายการเป็นศูนย์หลังลบสินค้านี้ ลบทิ้งพร้อมสลิปด้วย
    for oid in order_ids:
        if not db.execute("SELECT 1 FROM order_items WHERE order_id=? LIMIT 1", (oid,)).fetchone():
            files.append(db.execute("SELECT slip_image FROM orders WHERE id=?", (oid,)).fetchone()["slip_image"])
            db.execute("DELETE FROM orders WHERE id=?", (oid,))
    db.execute("DELETE FROM products WHERE id=?", (pid,))
    db.commit()
    for name in files:  # ลบไฟล์รูปที่อัปโหลดไว้ในเครื่องด้วย (ลิงก์ภายนอกข้าม)
        if name and not name.startswith("http"):
            try:
                os.remove(os.path.join(UPLOAD_DIR, os.path.basename(name)))
            except OSError:
                pass
    return jsonify({"ok": True, "deleted": True})


# ---------------------------------------------------------------- orders
def release_bookings(db, order_id):
    db.execute("DELETE FROM bookings WHERE order_id=?", (order_id,))


@app.post("/api/orders")
@auth_required("buyer")
def create_order():
    try:
        payload = json.loads(request.form.get("data") or "{}")
    except ValueError:
        return error("ข้อมูลไม่ถูกต้อง")
    name = str(payload.get("name", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    address = str(payload.get("address", "")).strip()
    items = payload.get("items") or []
    if not name or not phone or not address:
        return error("กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่งให้ครบ")
    if not items:
        return error("ตะกร้าว่างเปล่า")
    try:
        slip = save_upload(request.files.get("slip"))
    except ValueError as e:
        return error(str(e))
    if not slip:
        return error("กรุณาแนบสลิปโอนเงิน")

    db = get_db()
    today = date.today()
    try:
        db.execute("BEGIN IMMEDIATE")
        cur = db.execute(
            "INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total, slip_image, created_at)"
            " VALUES (?,?,?,?,0,?,?)",
            (g.user["id"], name, phone, address, slip, now_iso()),
        )
        order_id = cur.lastrowid
        total = 0.0
        for it in items:
            product = db.execute("SELECT * FROM products WHERE id=? AND active=1", (it.get("product_id"),)).fetchone()
            if not product:
                raise ValueError("มีสินค้าในตะกร้าที่ไม่พร้อมให้เช่าแล้ว")
            tier = next((t for t in json.loads(product["tiers"]) if t["days"] == it.get("days")), None)
            if not tier:
                raise ValueError(f"แพ็กเกจเช่าของ {product['name']} ไม่ถูกต้อง")
            try:
                start = date.fromisoformat(str(it.get("start_date")))
            except ValueError:
                raise ValueError("วันที่เช่าไม่ถูกต้อง")
            if start < today:
                raise ValueError("ไม่สามารถเช่าย้อนหลังได้")
            days = [(start + timedelta(days=i)).isoformat() for i in range(tier["days"])]
            for d in days:
                try:
                    db.execute("INSERT INTO bookings (product_id, day, order_id) VALUES (?,?,?)", (product["id"], d, order_id))
                except sqlite3.IntegrityError:
                    raise LookupError(f"{product['name']} ถูกจองแล้วในวันที่ {d} กรุณาเลือกวันใหม่")
            db.execute(
                "INSERT INTO order_items (order_id, product_id, product_name, product_image, days, price, start_date, end_date)"
                " VALUES (?,?,?,?,?,?,?,?)",
                (order_id, product["id"], product["name"], product["image"], tier["days"], tier["price"], days[0], days[-1]),
            )
            total += tier["price"]
        db.execute("UPDATE orders SET total=?, code=? WHERE id=?", (total, f"SWIW-{1000 + order_id}", order_id))
        db.commit()
    except ValueError as e:
        db.rollback()
        return error(str(e))
    except LookupError as e:
        db.rollback()
        return error(str(e), 409)
    row = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
    return jsonify({"order": order_to_dict(db, row)}), 201


@app.get("/api/orders")
@auth_required()
def list_orders():
    db = get_db()
    if g.user["role"] == "seller":
        rows = db.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    else:
        rows = db.execute("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC", (g.user["id"],)).fetchall()
    return jsonify({"orders": [order_to_dict(db, r) for r in rows]})


@app.patch("/api/orders/<int:oid>/status")
@auth_required("seller")
def update_order_status(oid):
    status = (request.get_json(silent=True) or {}).get("status")
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone()
    if not row:
        return error("ไม่พบออเดอร์", 404)
    if status not in NEXT_STATUS.get(row["status"], []):
        return error("ไม่สามารถเปลี่ยนสถานะนี้ได้")
    db.execute("UPDATE orders SET status=? WHERE id=?", (status, oid))
    if status == "rejected":
        release_bookings(db, oid)
    db.commit()
    return jsonify({"order": order_to_dict(db, db.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone())})


@app.post("/api/orders/<int:oid>/cancel")
@auth_required("buyer")
def cancel_order(oid):
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id=? AND user_id=?", (oid, g.user["id"])).fetchone()
    if not row:
        return error("ไม่พบออเดอร์", 404)
    if row["status"] != "pending":
        return error("ยกเลิกได้เฉพาะออเดอร์ที่ยังรอตรวจสลิป")
    db.execute("UPDATE orders SET status='cancelled' WHERE id=?", (oid,))
    release_bookings(db, oid)
    db.commit()
    return jsonify({"order": order_to_dict(db, db.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone())})


@app.get("/api/seller/stats")
@auth_required("seller")
def seller_stats():
    db = get_db()
    valid = "status NOT IN ('rejected','cancelled')"
    return jsonify({
        "orders": db.execute("SELECT COUNT(*) c FROM orders").fetchone()["c"],
        "pending": db.execute("SELECT COUNT(*) c FROM orders WHERE status='pending'").fetchone()["c"],
        "revenue": db.execute(f"SELECT COALESCE(SUM(total),0) s FROM orders WHERE {valid}").fetchone()["s"],
        "products": db.execute("SELECT COUNT(*) c FROM products").fetchone()["c"],
    })


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
