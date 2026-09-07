import React from 'react';
import { Order } from '../../types';
import { Printer, X, MapPin, Phone, Mail, User, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderPrintInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderPrintInvoiceModal: React.FC<OrderPrintInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Print CSS scoped to isolate printable invoice */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-[95vw] sm:w-full p-4 sm:p-8 space-y-6 shadow-2xl relative my-4 sm:my-8 max-h-[92vh] overflow-y-auto text-left"
      >
        {/* Action Header bar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 no-print">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Fulfillment & Printing</span>
            <h3 className="text-lg font-extrabold text-black">Print Bill & Delivery Shipping Label</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill & Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTAINER */}
        <div id="printable-invoice-container" className="space-y-6 bg-white text-black font-sans text-xs">
          
          {/* BRAND HEADER */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-xl font-black uppercase tracking-tight text-black">AISHU FOODS</h1>
              <p className="text-[11px] font-bold text-neutral-600">Authentic Homemade Sweets, Pickles & Savories</p>
              <p className="text-[10px] text-neutral-500">Prepared fresh with pure A2 Ghee & Cold-Pressed Oils</p>
            </div>
            <div className="text-right space-y-1 font-mono">
              <span className="inline-block bg-black text-white font-extrabold px-2.5 py-1 text-[11px] rounded">
                ORDER #{order.orderNumber}
              </span>
              <p className="text-[10px] font-bold text-neutral-600 mt-1">Date: {order.date}</p>
              {order.trackingCode && <p className="text-[10px] text-neutral-500">Tracking: {order.trackingCode}</p>}
            </div>
          </div>

          {/* CUT & PASTE DELIVERY LABEL SECTION */}
          <div className="border-2 border-dashed border-black rounded-2xl p-4 bg-neutral-50 space-y-3">
            <div className="flex justify-between items-center border-b border-neutral-300 pb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-black flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 no-print" />
                ✂️ DELIVERY SHIPPING LABEL (PASTE ON PACKAGE)
              </span>
              <span className="text-[10px] font-mono font-bold uppercase bg-neutral-200 px-2 py-0.5 rounded text-neutral-800">
                {order.paymentMethod}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-neutral-400">Recipient Name & Contact</p>
                <p className="text-sm font-extrabold text-black uppercase">{order.customerName || 'Valued Customer'}</p>
                <p className="font-mono text-black font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400 no-print" />
                  Ph: {order.customerPhone || 'N/A'}
                </p>
                {order.customerEmail && (
                  <p className="text-neutral-600 text-[10px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400 no-print" />
                    {order.customerEmail}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-neutral-400">Full Shipping Address</p>
                <p className="font-bold text-black text-xs leading-relaxed">
                  {order.deliveryAddress.label && <span className="font-extrabold">[{order.deliveryAddress.label}] </span>}
                  {order.deliveryAddress.address}
                </p>
                <p className="font-black text-black text-xs uppercase">
                  {order.deliveryAddress.city} {order.deliveryAddress.pincode ? `- ${order.deliveryAddress.pincode}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* ITEMIZED BILL TABLE */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 pb-1">
              Itemized Order Bill
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[400px]">
                <thead>
                  <tr className="border-b border-black text-[10px] font-extrabold uppercase text-neutral-600">
                    <th className="py-1.5 font-bold">Item Description</th>
                    <th className="py-1.5 font-bold text-center">Weight</th>
                    <th className="py-1.5 font-bold text-center">Qty</th>
                    <th className="py-1.5 font-bold text-right">Price</th>
                    <th className="py-1.5 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-black font-bold">{item.product.name}</td>
                      <td className="py-2 text-center text-neutral-600 font-mono">{item.selectedWeight}</td>
                      <td className="py-2 text-center text-black font-bold font-mono">{item.quantity}</td>
                      <td className="py-2 text-right text-neutral-600 font-mono">₹{item.unitPrice}</td>
                      <td className="py-2 text-right text-black font-bold font-mono">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BILL SUMMARY TOTALS */}
          <div className="flex justify-between items-end border-t border-black pt-3">
            <div className="space-y-1 max-w-[260px]">
              <p className="text-[10px] font-bold text-neutral-500">Payment Status: <span className="uppercase font-extrabold text-black">{order.paymentStatus || 'completed'}</span></p>
              <p className="text-[10px] font-bold text-neutral-500">Payment Mode: <span className="text-black font-bold">{order.paymentMethod}</span></p>
              {order.adminNotes && <p className="text-[10px] text-neutral-500 italic">Note: {order.adminNotes}</p>}
            </div>

            <div className="w-48 space-y-1 text-right font-mono text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee:</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-black border-t border-black pt-1.5">
                <span>Total Amount:</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* EXPLICIT THANK YOU NOTE LINE */}
          <div className="border-t-2 border-black pt-4 text-center space-y-1 bg-neutral-50 p-3 rounded-xl">
            <p className="text-xs font-black uppercase text-black tracking-wide">
              ❤️ Thank you for shopping with AISHU FOODS! ❤️
            </p>
            <p className="text-[10px] text-neutral-600 italic">
              Every item is handcrafted at home with 100% pure ingredients, cold-pressed oils & traditional love.
            </p>
            <p className="text-[9px] font-mono text-neutral-400 pt-1">
              For customer support or re-orders, visit our website or contact us via WhatsApp.
            </p>
          </div>

        </div>

        {/* Footer print action button for modal view (Hidden in print output) */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-100 text-black text-xs font-bold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice & Label</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
