import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Package,
  PieChart,
  Activity,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { reportsService } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const ReportsManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const result = await reportsService.getReports();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Activity size={48} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} className="spin-animation" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Failed to load analytics data.</p>
      </div>
    );
  }

  const { summary, chart_data, payment_methods, top_items, order_breakdown, total_orders } = data;

  const statCards = [
    {
      title: "Today's Revenue",
      value: `₹${summary.today_revenue.value.toLocaleString()}`,
      change: summary.today_revenue.change,
      icon: IndianRupee,
      bgColor: '#ff6b35',
      lightBg: 'rgba(255, 107, 53, 0.1)',
      positive: summary.today_revenue.change.startsWith('+')
    },
    {
      title: "Weekly Revenue",
      value: `₹${summary.weekly_revenue.value.toLocaleString()}`,
      change: summary.weekly_revenue.change,
      icon: IndianRupee,
      bgColor: '#2d7a4a',
      lightBg: 'rgba(45, 122, 74, 0.1)',
      positive: summary.weekly_revenue.change.startsWith('+')
    },
    {
      title: "Monthly Revenue",
      value: `₹${summary.monthly_revenue.value.toLocaleString()}`,
      change: summary.monthly_revenue.change,
      icon: IndianRupee,
      bgColor: '#ffaa71',
      lightBg: 'rgba(255, 170, 113, 0.1)',
      positive: summary.monthly_revenue.change.startsWith('+')
    },
    {
      title: "Avg. Order Value",
      value: `₹${Math.round(summary.avg_order_value.value).toLocaleString()}`,
      change: summary.avg_order_value.change,
      icon: IndianRupee,
      bgColor: '#8fceaa',
      lightBg: 'rgba(143, 206, 170, 0.1)',
      positive: summary.avg_order_value.change.startsWith('+')
    }
  ];

  return (
    <div className="page-container admin-page-mobile-wrapper" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="desktop-only" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: 'black' }}>
          Reports & Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Your restaurant performance insights
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid-responsive" style={{ marginBottom: '24px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: card.bgColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: card.positive ? '#2d7a4a' : '#d94343',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {card.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.change}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {card.value}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="reports-charts-grid" style={{ marginBottom: '24px', display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Revenue Trend Chart */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Activity size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Revenue Trend</h2>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart_data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8c42" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ff8c42" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 500 }}
                  tickFormatter={(val) => `₹${val / 1000}K`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 8, fill: 'var(--primary)', stroke: 'white', strokeWidth: 3 }}
                  label={{ position: 'top', fill: 'var(--text-dark)', fontSize: 11, fontWeight: 700, formatter: (val) => `₹${(val/1000).toFixed(1)}K` }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <PieChart size={18} color="#ff6b35" />
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Payment Methods</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {payment_methods.map((method, idx) => {
              const maxAmount = Math.max(...payment_methods.map(m => m.value));
              const percentage = maxAmount > 0 ? (method.value / maxAmount) * 100 : 0;
              const colors = ['#ff6b35', '#2d7a4a', '#f4a261', '#6c757d'];

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '500' }}>{method.name}</span>
                    <span style={{ fontWeight: '600' }}>₹{method.value.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: colors[idx % colors.length],
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-responsive-2">
        {/* Top Selling Items */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Package size={18} color="#ff6b35" />
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Top Selling Items</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {top_items.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No items sold yet.</p>
            ) : top_items.map((item, idx) => {
              const maxOrders = Math.max(...top_items.map(i => i.orders));
              const percentage = maxOrders > 0 ? (item.orders / maxOrders) * 100 : 0;

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#ff6b35',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                      <span style={{ fontWeight: '500' }}>{item.name}</span>
                      <span style={{ fontWeight: '600' }}>₹{item.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', flex: 1, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: '#ff6b35',
                          borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '30px', textAlign: 'right' }}>
                        {item.orders}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Breakdown */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <TrendingUp size={18} color="#ff6b35" />
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Order Breakdown</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {order_breakdown.map((breakdown, idx) => {
              const maxBreakdown = Math.max(...order_breakdown.map(b => b.value));
              const percentage = total_orders > 0 ? (breakdown.value / total_orders) * 100 : 0;
              const barPercentage = maxBreakdown > 0 ? (breakdown.value / maxBreakdown) * 100 : 0;
              const colors = ['#ff6b35', '#2d7a4a', '#6c757d'];

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '500' }}>{breakdown.name}</span>
                    <span style={{ fontWeight: '600' }}>{breakdown.value} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '11px' }}>({percentage.toFixed(0)}%)</span></span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barPercentage}%`,
                      background: colors[idx % colors.length],
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Orders per Today</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b35' }}>{total_orders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
