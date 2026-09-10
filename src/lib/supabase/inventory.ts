import { supabase } from './client';
import { StockHistoryLog } from '../../types';
import { DbStockHistoryLog } from './types';

export const fetchStockHistoryLogs = async (): Promise<StockHistoryLog[]> => {
  const { data, error } = await supabase
    .from('stock_history_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching stock history logs from Supabase:', error.message);
    return [];
  }

  if (!data) return [];

  return data.map((log: DbStockHistoryLog) => {
    const dt = new Date(log.created_at || Date.now());
    return {
      id: log.id,
      productId: log.product_id,
      productName: log.product_name,
      type: log.type,
      quantity: log.quantity,
      date: dt.toISOString().split('T')[0],
      time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: log.note || undefined,
      adminName: log.admin_name || 'Store Admin',
    };
  });
};

export const logStockAdjustmentInDb = async (
  productId: string,
  productName: string,
  type: 'restock' | 'destock',
  quantity: number,
  note?: string,
  adminName = 'Store Admin'
) => {
  const logId = `log-${Date.now()}`;

  const { error: logErr } = await supabase.from('stock_history_logs').insert([
    {
      id: logId,
      product_id: productId,
      product_name: productName,
      type,
      quantity,
      note: note || null,
      admin_name: adminName,
      created_at: new Date().toISOString(),
    },
  ]);

  if (logErr) console.warn('Could not insert stock log to Supabase:', logErr.message);
};

export const logStockMovementInDb = logStockAdjustmentInDb;
