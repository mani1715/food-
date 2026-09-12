import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  MapPin,
  Award,
  ArrowUpRight,
  Printer,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  CreditCard,
  Wallet,
  X,
} from 'lucide-react';

import { AdminTimeframe, getTodayDateStr, getYesterdayDateStr, formatDisplayDate, isDateMatch } from '../../utils/dateFilters';

export const AnalyticsManagementTab: React.FC = () => {
  const {
    products,
    categories,
    orders,
    addToast,
  } = useApp();

  const [timeRange, setTimeRange] = useState<AdminTimeframe>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Filter orders based on selected date calendar picker or quick time range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => isDateMatch(order.date, timeRange, selectedDate));
  }, [orders, timeRange, selectedDate]);

  // Analytical Metrics Calculation
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const completedOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'Delivered' || o.orderStatus === 'delivered').length;
  }, [filteredOrders]);

  const activeOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'Active' || (o.orderStatus && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled')).length;
  }, [filteredOrders]);

  const averageOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return totalRevenue / filteredOrders.length;
  }, [filteredOrders, totalRevenue]);

  // Inventory & Stock Health Metrics
  const outOfStockCount = useMemo(() => {
    return products.filter((p) => !p.inStock || p.inventoryCount === 0 || p.outOfStock).length;
  }, [products]);

  // Sales per Category
  const categorySales = useMemo(() => {
    const map: Record<string, { count: number; totalRev: number }> = {};
    categories.forEach((cat) => {
      map[cat.name] = { count: 0, totalRev: 0 };
    });
    map['Uncategorized'] = { count: 0, totalRev: 0 };

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const catName = item.product.category || 'Uncategorized';
        if (!map[catName]) {
          map[catName] = { count: 0, totalRev: 0 };
        }
        const itemRev = (item.unitPrice || item.product.price) * item.quantity;
        map[catName].count += item.quantity;
        map[catName].totalRev += itemRev;
      });
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalRev - a.totalRev);
  }, [filteredOrders, categories]);

  // Top Sold Products Ranking
  const topProducts = useMemo(() => {
    const productMap: Record<string, { id: string; name: string; category: string; unitsSold: number; totalRevenue: number; image: string }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const pId = item.product.id;
        if (!productMap[pId]) {
          productMap[pId] = {
            id: pId,
            name: item.product.name,
            category: item.product.category || 'General',
            unitsSold: 0,
            totalRevenue: 0,
            image: item.product.image,
          };
        }
        const lineTotal = (item.unitPrice || item.product.price) * item.quantity;
        productMap[pId].unitsSold += item.quantity;
        productMap[pId].totalRevenue += lineTotal;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [filteredOrders]);

  // City Order Distribution
  const citySales = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const city = order.deliveryAddress?.city || 'Hyderabad';
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Payment Gateway Revenue Breakdown (UPI vs Card vs COD)
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalRevenue: number }> = {};

    filteredOrders.forEach((o) => {
      const method = o.paymentMethod || 'UPI / PhonePe';
      if (!map[method]) {
        map[method] = { count: 0, totalRevenue: 0 };
      }
      map[method].count += 1;
      map[method].totalRevenue += (o.total || 0);
    });

    return Object.entries(map).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.totalRevenue,
      percentage: Math.round((data.count / (filteredOrders.length || 1)) * 100),
      revenuePercentage: Math.round((data.totalRevenue / (totalRevenue || 1)) * 100),
    }));
  }, [filteredOrders, totalRevenue]);

  const handlePrintReport = () => {
    addToast('Printing Analytics Summary', 'Preparing clean print view of sales report...', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-8 print:p-0 text-left">
      
      {/* Analytics Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50 p-5 rounded-3xl border border-neutral-200 shadow-subtle print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-black" />
            <h2 className="text-xl font-extrabold text-black tracking-tight">Store Analytics & Revenue Insights</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Real-time revenue, order fulfillment, regional metrics & payment gateway breakdown.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Time Range Filter Buttons */}
          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-2xl shadow-subtle flex-wrap">
            <button
              onClick={() => {
                setTimeRange('all');
                setSelectedDate('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                timeRange === 'all' && !selectedDate
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                setTimeRange('today');
                setSelectedDate(getTodayDateStr());
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                timeRange === 'today'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setTimeRange('yesterday');
                setSelectedDate(getYesterdayDateStr());
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                timeRange === 'yesterday'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                setTimeRange('7d');
                setSelectedDate('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                timeRange === '7d' && !selectedDate
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => {
                setTimeRange('30d');
                setSelectedDate('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                timeRange === '30d' && !selectedDate
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Specific Date Calendar Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-2xl shadow-subtle text-xs font-bold">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) {
                  setTimeRange('custom');
                } else {
                  setTimeRange('all');
                }
              }}
              className="bg-transparent text-black text-xs font-bold focus:outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate('');
                  setTimeRange('all');
                }}
                className="text-neutral-400 hover:text-black cursor-pointer"
                title="Clear selected date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-white border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Selected Custom Date Notification */}
      {selectedDate && (
        <div className="p-3 bg-neutral-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-subtle">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Filtering Analytics for Specific Date: <strong>{selectedDate}</strong></span>
          </div>
          <button
            onClick={() => {
              setSelectedDate('');
              setTimeRange('all');
            }}
            className="text-xs text-neutral-300 hover:text-white underline cursor-pointer"
          >
            Show All Dates
          </button>
        </div>
      )}

      {/* Printable Title header (Only in print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">Aura Homemade Foods — Analytics & Performance Summary</h1>
        <p className="text-xs text-neutral-600">Generated on {new Date().toLocaleDateString('en-IN')} | Period: {selectedDate ? `Date: ${selectedDate}` : timeRange.toUpperCase()}</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Gross Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-subtle space-y-3 relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Total Gross Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-black flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">₹{totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Verified Sales Total</span>
            </div>
          </div>
        </div>

        {/* Total Orders & Fulfillment */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-subtle space-y-3 relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Total Fulfillments</span>
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-black flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">{filteredOrders.length} Orders</div>
            <div className="text-[11px] font-bold text-neutral-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-600 font-extrabold">{completedOrdersCount} Delivered</span>
              <span>•</span>
              <span className="text-amber-600 font-extrabold">{activeOrdersCount} Active</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-subtle space-y-3 relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Average Order Value</span>
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-black flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">₹{averageOrderValue.toFixed(2)}</div>
            <div className="text-[11px] font-semibold text-neutral-400 mt-1">
              Per customer checkout transaction
            </div>
          </div>
        </div>

        {/* Inventory & Stock Health */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-subtle space-y-3 relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Catalog & Stock</span>
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-black flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">{products.length} Products</div>
            <div className="text-[11px] font-bold mt-1 flex items-center gap-1.5">
              {outOfStockCount > 0 ? (
                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {outOfStockCount} Out of Stock
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 100% In Stock
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Visual Graphs & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Category Sales Breakdown Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-neutral-200 shadow-subtle space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-neutral-100">
            <div>
              <h3 className="text-base font-extrabold text-black tracking-tight">Category Revenue Breakdown</h3>
              <p className="text-xs text-neutral-500">Sales volume and gross revenue generated by product category.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-neutral-100 text-black px-3 py-1 rounded-full">
              {categorySales.length} Categories
            </span>
          </div>

          <div className="space-y-4">
            {categorySales.map((cat) => {
              const maxRev = categorySales[0]?.totalRev || 1;
              const percentage = Math.round((cat.totalRev / (totalRevenue || 1)) * 100);
              const barWidth = Math.max(5, Math.round((cat.totalRev / maxRev) * 100));

              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-black flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-black inline-block"></span>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500 font-mono">{cat.count} units sold</span>
                      <span className="text-black font-extrabold font-mono">₹{cat.totalRev.toFixed(2)} ({percentage}%)</span>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Gateways & Order Status Distribution */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Payment Method Distribution Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-black tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black" />
                <span>Payment Gateways</span>
              </h3>
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 font-mono">Revenue Split</span>
            </div>

            <div className="space-y-3">
              {paymentBreakdown.length > 0 ? (
                paymentBreakdown.map((item) => (
                  <div key={item.method} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-black">{item.method}</span>
                      <span className="text-black font-mono font-black">₹{item.revenue.toFixed(2)} ({item.revenuePercentage}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{item.count} checkouts</span>
                      <span className="font-mono">{item.percentage}% order volume</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-black h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.revenuePercentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 text-center py-4">No payment method data available.</p>
              )}
            </div>
          </div>

          {/* Live Fulfillment & Real-Time Stock Health Summary */}
          <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-subtle space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-400">
              <TrendingUp className="w-5 h-5" />
              <h4 className="text-sm font-extrabold tracking-wide uppercase">Real-Time Store Status</h4>
            </div>
            <div>
              <div className="text-3xl font-black">{filteredOrders.length} Total Orders</div>
              <p className="text-xs text-neutral-400 mt-1">
                Live performance metrics updated across catalog items, active orders & payments.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Active Fulfillments</span>
                <span className="font-extrabold text-amber-400 font-mono">
                  {orders.filter((o) => o.status === 'Active').length} Active
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Completed Deliveries</span>
                <span className="font-extrabold text-emerald-400 font-mono">
                  {orders.filter((o) => o.status === 'Delivered' || o.orderStatus === 'delivered').length} Delivered
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Catalog Stock Health</span>
                <span className="font-extrabold text-white font-mono">
                  {products.filter((p) => (p.inventoryCount ?? 100) > 0 && !p.outOfStock).length} / {products.length} In Stock
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Top Best Selling Products & Regional Demand Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top 5 Products Leaderboard */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b pb-4 border-neutral-100">
            <div>
              <h3 className="text-base font-extrabold text-black tracking-tight">Top Best-Selling Products</h3>
              <p className="text-xs text-neutral-500">Highest volume items based on customer demand.</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="divide-y divide-neutral-100">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 text-black text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-neutral-200" />
                    <div>
                      <h4 className="text-xs font-extrabold text-black">{p.name}</h4>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-black font-mono block">₹{p.totalRevenue.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {p.unitsSold} units sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">No product sale data for this period.</p>
            )}
          </div>
        </div>

        {/* Regional Order Density Table */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b pb-4 border-neutral-100">
            <div>
              <h3 className="text-base font-extrabold text-black tracking-tight">Top Ordering Cities</h3>
              <p className="text-xs text-neutral-500">Geographic customer density by city.</p>
            </div>
            <MapPin className="w-5 h-5 text-black" />
          </div>

          <div className="space-y-3">
            {citySales.slice(0, 5).map((item) => (
              <div key={item.city} className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
                <span className="font-bold text-black flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                  {item.city}
                </span>
                <span className="font-mono font-extrabold bg-white border border-neutral-200 px-2.5 py-1 rounded-xl text-black">
                  {item.count} Orders
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
