'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/lib/api';

const AuthCtx = createContext(null);
const CartCtx = createContext(null);
const ToastCtx = createContext(() => {});

export const useAuth = () => useContext(AuthCtx);
export const useCart = () => useContext(CartCtx);
export const useToast = () => useContext(ToastCtx);

export default function Providers({ children }) {
  // ---- auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setAuthLoading(false);
      return;
    }
    api('/api/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const login = async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };
  const register = async (form) => {
    const d = await api('/api/auth/register', { method: 'POST', body: form });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // ---- cart (เก็บในเครื่อง)
  const [cart, setCart] = useState([]);
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('swiw_cart') || '[]'));
    } catch {}
  }, []);
  const saveCart = (next) => {
    setCart(next);
    try {
      localStorage.setItem('swiw_cart', JSON.stringify(next));
    } catch {}
  };
  const addToCart = (item) => saveCart([...cart, { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  const removeFromCart = (key) => saveCart(cart.filter((i) => i.key !== key));
  const clearCart = () => saveCart([]);

  // ---- toast
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'info') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, authLoading, login, register, logout, setUser }}>
      <CartCtx.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <ToastCtx.Provider value={toast}>
          {children}
          <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[90%] max-w-md -translate-x-1/2 flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-xl ${
                  t.type === 'error'
                    ? 'bg-red-600 text-white'
                    : t.type === 'success'
                    ? 'border border-brand-pinkAccent bg-brand-black text-brand-pinkMedium'
                    : 'bg-brand-black text-white'
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>
        </ToastCtx.Provider>
      </CartCtx.Provider>
    </AuthCtx.Provider>
  );
}
