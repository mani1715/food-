import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Plus, Minus, Search, RefreshCw, ShoppingBag, Package } from 'lucide-react';

export const NotificationsManagementTab: React.FC = () => {
  const { products, updateProduct, orders } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

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

  return (
    <div className="space-y-6 text-left">
      
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              filterType === 'all' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              filterType === 'low' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            ⚠️ Low Stock ({lowStockProducts.length})
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              filterType === 'out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-neutral-600 border-neutral-200'
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

      {/* 4. Recent Order Deduction Activity Log */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-black" />
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Live Order Stock Deduction Log</h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Auto-Updated on Order Placement</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
          {orders.slice(0, 5).map((ord) => (
            <div key={ord.id} className="bg-white border border-neutral-200 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-black block">{ord.orderNumber}</span>
                <span className="text-[11px] text-neutral-500 font-medium">Customer: {ord.customerName || 'Guest'} • {ord.items.length} Item(s)</span>
              </div>
              <div className="text-right">
                <div className="flex flex-wrap gap-1 justify-end">
                  {ord.items.map((item, idx) => (
                    <span key={idx} className="bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                      {item.product.name} (-{item.quantity})
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-neutral-400 block mt-0.5">{ord.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
