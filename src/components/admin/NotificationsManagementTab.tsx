import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Search,
  RefreshCw,
  ShoppingBag,
  Package,
  Calendar as CalendarIcon,
  Filter,
  X,
  Clock,
  TrendingDown,
  Layers,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { AdminTimeframe, getTodayDateStr, getYesterdayDateStr, formatDisplayDate, isDateMatch, getLocalDateStr } from '../../utils/dateFilters';

export const NotificationsManagementTab: React.FC = () => {
  const { products, updateProduct, orders } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

  // Live Order Stock Deduction Log Timeframe Filter State
  const [logTimeframe, setLogTimeframe] = useState<AdminTimeframe>('all');
  const [logSelectedDate, setLogSelectedDate] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const lowStockProducts = products.filter((p) => (p.inventoryCount ?? 100) < 10 && (p.inventoryCount ?? 100) > 0);
  const outOfStockProducts = products.filter((p) => p.outOfStock || (p.inventoryCount ?? 100) <= 0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const stock = p.inventoryCount ?? 100;
    if (filterType === 'low') return matchesSearch && stock < 10 && stock > 0;
    if (filterType === 'out') return matchesSearch && (stock <= 0 || p.outOfStock);
    return matchesSearch;
  });

  const handleStockUpdate = (productId: string, newCount: number) => {
    const validCount = Math.max(0, newCount);
    updateProduct(productId, {
      inventoryCount: validCount,
      outOfStock: validCount <= 0,
      inStock: validCount > 0,
    });
  };

  // -------------------------------------------------------------
  // STOCK DEDUCTION LOG FILTERING & METRICS
  // -------------------------------------------------------------
  const filteredLogOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Date Filter
      const matchDate = isDateMatch(ord.date, logTimeframe, logSelectedDate);
      if (!matchDate) return false;

      // Text Search Filter
      if (!logSearchQuery.trim()) return true;
      const q = logSearchQuery.toLowerCase();
      const matchOrderNum = ord.orderNumber.toLowerCase().includes(q);
      const matchCustomer = (ord.customerName || '').toLowerCase().includes(q);
      const matchItems = ord.items.some((item) => item.product.name.toLowerCase().includes(q));
      return matchOrderNum || matchCustomer || matchItems;
    });
  }, [orders, logTimeframe, logSelectedDate, logSearchQuery]);

  // Aggregate Deductions by Product on Selected Date/Timeframe
  const deductionStats = useMemo(() => {
    let totalUnitsDeducted = 0;
    const productDeductionMap: Record<string, { product: typeof products[0]; count: number }> = {};

    filteredLogOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        totalUnitsDeducted += item.quantity;
        const prodId = item.product.id;
        if (!productDeductionMap[prodId]) {
          productDeductionMap[prodId] = {
            product: item.product,
            count: 0,
          };
        }
        productDeductionMap[prodId].count += item.quantity;
      });
    });

    const productBreakdown = Object.values(productDeductionMap).sort((a, b) => b.count - a.count);

    return {
      totalUnitsDeducted,
      totalOrders: filteredLogOrders.length,
      uniqueProductsCount: productBreakdown.length,
      productBreakdown,
    };
  }, [filteredLogOrders]);

  const handleSelectTimeframe = (tf: AdminTimeframe) => {
    setLogTimeframe(tf);
    if (tf === 'today') {
      setLogSelectedDate(getTodayDateStr());
    } else if (tf === 'yesterday') {
      setLogSelectedDate(getYesterdayDateStr());
    } else if (tf !== 'custom') {
      setLogSelectedDate('');
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setLogSelectedDate(val);
      setLogTimeframe('custom');
    }
  };

  const handleClearCalendarDate = () => {
    setLogSelectedDate('');
    setLogTimeframe('all');
  };

  const getTimeframeLabel = () => {
    if (logTimeframe === 'today') return `Today (${formatDisplayDate(getTodayDateStr())})`;
    if (logTimeframe === 'yesterday') return `Yesterday (${formatDisplayDate(getYesterdayDateStr())})`;
    if (logTimeframe === 'weekly') return 'Last 7 Days';
    if (logTimeframe === 'monthly') return 'Last 30 Days';
    if (logTimeframe === 'custom' && logSelectedDate) return `Calendar Date: ${formatDisplayDate(logSelectedDate)}`;
    return 'All Time';
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* 1. Header & Quick Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-black" />
            <h2 className="text-xl font-extrabold text-black tracking-tight">Stock Notifications & Inventory Center</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor real-time inventory counts for every product. Stocks automatically decrease when orders are placed and trigger low stock alerts below 10 units.
          </p>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl flex items-center justify-between shadow-subtle">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">Total Catalog Items</span>
            <span className="text-2xl font-black text-black font-mono">{products.length} Products</span>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-xl">
            <Package className="w-5 h-5 text-black" />
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-subtle">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block">Low Stock Alerts (&lt; 10 Units)</span>
            <span className="text-2xl font-black text-amber-900 font-mono">{lowStockProducts.length} Items</span>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-700 animate-pulse" />
          </div>
        </div>

        <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl flex items-center justify-between shadow-subtle">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 block">Completely Out of Stock</span>
            <span className="text-2xl font-black text-rose-900 font-mono">{outOfStockProducts.length} Items</span>
          </div>
          <div className="p-3 bg-rose-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-700" />
          </div>
        </div>
      </div>

      {/* Low Stock Active Notification Alert Banner */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="p-4 bg-black text-white rounded-2xl space-y-2 shadow-modal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base animate-bounce">⚠️</span>
              <span>Active Inventory Notifications: Action Required</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {lowStockProducts.length + outOfStockProducts.length} Alert(s)
            </span>
          </div>
          <p className="text-[11px] text-neutral-300">
            The following products have dropped below 10 units or are sold out. Update stock values below to restore availability in the customer store.
          </p>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter product inventory by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
              filterType === 'all' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
              filterType === 'low' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-amber-600'
            }`}
          >
            ⚠️ Low Stock ({lowStockProducts.length})
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
              filterType === 'out' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-600'
            }`}
          >
            🚨 Out of Stock ({outOfStockProducts.length})
          </button>
        </div>
      </div>

      {/* 3. Product Inventory Table with Instant Update Controls */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status & Notification</th>
                <th className="py-3.5 px-4">Current Stock Units</th>
                <th className="py-3.5 px-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((p) => {
                const stock = p.inventoryCount ?? 100;
                const isOut = p.outOfStock || stock <= 0;
                const isLow = !isOut && stock < 10;

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0" />
                        <div>
                          <p className="font-bold text-black">{p.name}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">ID: {p.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-neutral-700">{p.category}</td>

                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low Stock (&lt; 10 Left)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Healthy Stock</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-base font-black font-mono ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-black'}`}>
                        {stock} units
                      </span>
                    </td>

                    {/* Stock Incrementor / Decrementor */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center border border-neutral-300 rounded-xl p-0.5 bg-neutral-50 shadow-subtle">
                          <button
                            onClick={() => handleStockUpdate(p.id, stock - 1)}
                            className="p-1.5 text-black hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                            title="Decrease Stock by 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            value={stock}
                            onChange={(e) => handleStockUpdate(p.id, Number(e.target.value))}
                            className="w-14 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />

                          <button
                            onClick={() => handleStockUpdate(p.id, stock + 1)}
                            className="p-1.5 text-black hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                            title="Increase Stock by 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleStockUpdate(p.id, 50)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                          title="Set Stock to 50"
                        >
                          Restock (+50)
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. LIVE ORDER STOCK DEDUCTION LOG WITH THAT DAY, YESTERDAY & CALENDAR DATE PICKER */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-subtle">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-black" />
              <h3 className="text-base font-extrabold text-black uppercase tracking-wider">Live Order Stock Deduction Log</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tracks real-time inventory deductions for every customer order. Filter by Today, Yesterday, or pick any specific day from the Calendar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-black text-white font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </span>
          </div>
        </div>

        {/* Filters Bar: Today, Yesterday, This Week, This Month, All Time + Calendar Date Picker */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
          
          {/* Quick Timeframe Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
            <span className="text-xs font-extrabold text-neutral-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>

            <button
              type="button"
              onClick={() => handleSelectTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logTimeframe === 'all' && !logSelectedDate ? 'bg-black text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Time
            </button>

            <button
              type="button"
              onClick={() => handleSelectTimeframe('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logTimeframe === 'today' ? 'bg-black text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handleSelectTimeframe('yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logTimeframe === 'yesterday' ? 'bg-black text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => handleSelectTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logTimeframe === 'weekly' ? 'bg-black text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              This Week (7 Days)
            </button>

            <button
              type="button"
              onClick={() => handleSelectTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logTimeframe === 'monthly' ? 'bg-black text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Interactive Calendar Date Picker Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 cursor-pointer transition-all ${
                  logTimeframe === 'custom' || logSelectedDate
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:border-black'
                }`}
              >
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span>
                  {logSelectedDate ? formatDisplayDate(logSelectedDate) : 'Calendar Date Picker'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              <input
                ref={dateInputRef}
                type="date"
                value={logSelectedDate}
                onChange={handleDateInputChange}
                className="sr-only"
              />
            </div>

            {logSelectedDate && (
              <button
                type="button"
                onClick={handleClearCalendarDate}
                className="p-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                title="Clear Date Filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Live Filter Indicator Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-neutral-100 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-neutral-600">Active View:</span>
            <span className="px-2.5 py-0.5 bg-white text-black font-black rounded-lg border border-neutral-300 font-mono shadow-xs">
              📅 {getTimeframeLabel()}
            </span>
            <span className="text-neutral-500">
              Showing <strong>{filteredLogOrders.length}</strong> order deduction record(s)
            </span>
          </div>

          {/* Search within log */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="Search product or order #..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* KPI Deduction Metrics for Selected Timeframe */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-subtle">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Total Units Deducted</span>
            <span className="text-xl font-black text-rose-600 font-mono">
              -{deductionStats.totalUnitsDeducted} units
            </span>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-subtle">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Orders Deducting Stock</span>
            <span className="text-xl font-black text-black font-mono">
              {deductionStats.totalOrders} orders
            </span>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-subtle">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Catalog Products Deducted</span>
            <span className="text-xl font-black text-black font-mono">
              {deductionStats.uniqueProductsCount} products
            </span>
          </div>
        </div>

        {/* Product Stock Deduction Breakdown Pills */}
        {deductionStats.productBreakdown.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 block">
              Deductions Breakdown by Product on {getTimeframeLabel()}
            </span>
            <div className="flex flex-wrap gap-2">
              {deductionStats.productBreakdown.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white border border-neutral-200 px-3 py-2 rounded-xl flex items-center gap-2 shadow-xs text-xs"
                >
                  <img src={item.product.image} alt={item.product.name} className="w-6 h-6 rounded-lg object-cover border border-neutral-200" />
                  <span className="font-bold text-black">{item.product.name}</span>
                  <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                    -{item.count} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order-by-Order Live Deduction Cards */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
          {filteredLogOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-white border-2 border-dashed border-neutral-200 rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-neutral-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-700">No stock deductions recorded for {getTimeframeLabel()}</p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Try selecting another date from the Calendar picker above or click "All Time" to view all deduction records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTimeframe('all')}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-800 transition-all shadow-subtle"
              >
                View All Time Deductions
              </button>
            </div>
          ) : (
            filteredLogOrders.map((ord) => {
              const totalItemsInOrder = ord.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={ord.id}
                  className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-subtle hover:border-neutral-400 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black font-mono text-sm">{ord.orderNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {ord.orderStatus || ord.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {ord.date}
                      </span>
                      <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200">
                        Total -{totalItemsInOrder} units
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-neutral-600">
                      <span className="font-bold text-black">{ord.customerName || 'Customer'}</span>
                      {ord.customerPhone && <span className="font-mono text-neutral-500"> • {ord.customerPhone}</span>}
                      {ord.deliveryAddress?.city && <span className="text-neutral-500"> • {ord.deliveryAddress.city}</span>}
                    </div>

                    {/* Items deducted badges */}
                    <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                      {ord.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-200 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <img src={item.product.image} alt={item.product.name} className="w-4 h-4 rounded-md object-cover" />
                          <span className="truncate max-w-[140px]">{item.product.name}</span>
                          <span className="font-mono font-black text-rose-600">(-{item.quantity})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
