'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { Plus, DollarSign } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('إيجار');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/expenses');
      setExpenses(res);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/expenses', 'POST', {
        description,
        amount: Number(amount),
        category,
      });
      setShowModal(false);
      setDescription('');
      setAmount('');
      setCategory('إيجار');
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المصروف');
    }
  };

  const totalFixedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>المصاريف الثابتة والتشغيلية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>تسجيل الإيجار، الرواتب، الكهرباء، والصيانة لحساب صافي الربح الدقيق</p>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      <div style={{ marginBottom: '24px' }} className="glass-card">
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مجموع المصاريف المسجلة:</span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
          {totalFixedExpenses.toLocaleString()} د.ع
        </h2>
      </div>

      <div className="glass-card">
        {loading ? (
          <div>جاري التحميل...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>الفئة</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.description}</td>
                    <td><span className="badge badge-progress">{e.category}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--accent-rose)' }}>{e.amount.toLocaleString()} د.ع</td>
                    <td>{new Date(e.date).toLocaleDateString('ar-IQ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>تسجيل مصروف جديد</h2>

            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>بيان / وصف المصروف</label>
                <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: إيجار شهر تشرين" required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>الفئة</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="إيجار">إيجار</option>
                  <option value="رواتب">رواتب</option>
                  <option value="كهرباء وماء">كهرباء وماء</option>
                  <option value="صيانة أدوات">صيانة أدوات</option>
                  <option value="نثريات">نثريات أخرى</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>المبلغ (د.ع)</label>
                <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn-primary">حفظ المصروف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
