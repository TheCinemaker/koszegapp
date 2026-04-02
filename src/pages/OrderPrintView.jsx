import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { IoPrint, IoArrowBack } from 'react-icons/io5';

export default function OrderPrintView() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, restaurants(name), items:order_items(*)')
                .eq('id', orderId)
                .single();
            
            if (data) setOrder(data);
            setLoading(false);
        };
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        if (order) {
            // Auto-trigger print after a short delay to ensure rendering
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [order]);

    if (loading) return <div className="p-10 text-center font-mono text-sm">Betöltés...</div>;
    if (!order) return <div className="p-10 text-center font-mono text-sm text-red-600">Rendelés nem található.</div>;

    const isCollection = order.address === 'Személyes átvétel';

    return (
        <div className="print-container bg-white text-black p-4 font-mono text-sm mx-auto" style={{ maxWidth: '80mm' }}>
            <style>
                {`
                @media print {
                    body { background: white; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-container { width: 100%; max-width: 100%; border: none; padding: 0; margin: 0; }
                    @page { margin: 0; size: auto; }
                }
                `}
            </style>

            <div className="no-print mb-4 flex justify-between gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors rounded text-black font-bold">
                    <IoArrowBack /> Vissza
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded shadow">
                    <IoPrint /> Nyomtatás
                </button>
            </div>

            <div className="border-b-2 border-black pb-2 mb-2 text-center">
                <h1 className="text-xl font-bold uppercase tracking-widest">KőszegEats</h1>
                <p className="text-[10px]">{new Date(order.created_at).toLocaleString('hu-HU')}</p>
                <p className="font-bold text-base mt-1 bg-black text-white py-1">{order.restaurants?.name || 'Étterem'}</p>
            </div>

            <div className="mb-2 border-b border-black pb-1">
                <p className="font-bold uppercase tracking-wider mb-1 bg-gray-200 inline-block px-1">VEVŐ ADATAI</p>
                <p className="font-bold text-base">{order.customer_name}</p>
                <p className="text-sm">{order.customer_phone}</p>
                <div className="mt-1 font-bold text-sm bg-gray-100 p-1 border border-black/20">
                    {isCollection ? '📦 SZEMÉLYES ÁTVÉTEL' : `🛵 HÁZHOZSZÁLLÍTÁS:\n${order.customer_address}`}
                </div>
            </div>

            <div className="mb-2 border-b-2 border-black pb-2">
                <p className="font-bold uppercase tracking-wider mb-1 bg-gray-200 inline-block px-1">RENDELÉSI TÉTELEK</p>
                <p className="text-[10px] text-gray-600 mb-1">Azonosító: #{order.id.slice(0, 8)}</p>
                
                <div className="mt-2 space-y-2">
                    {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                            <span className="font-bold pr-2">{item.quantity}x {item.name}</span>
                            <span className="whitespace-nowrap">{item.price * item.quantity} Ft</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-right font-black text-xl py-2 mb-2">
                ÖSSZESEN: <span className="bg-black text-white px-2 py-0.5">{order.total_price} Ft</span>
            </div>

            <div className="mb-2 text-sm font-bold border-t border-black pt-2">
                Fizetési mód: {order.payment_method === 'cash' ? 'Készpénz' : 'Kártya / SZÉP Kártya'}
            </div>

            {order.note && (
                <div className="mt-2 p-2 border-2 border-black bg-gray-100">
                    <p className="text-xs uppercase font-black mb-1">MEGJEGYZÉS:</p>
                    <p className="text-base font-bold italic">{order.note}</p>
                </div>
            ) }

            <div className="mt-6 text-center text-[10px] italic border-t border-black pt-2">
                Köszönjük a rendelést!
                <br />
                <span className="font-bold">www.koszegeats.hu</span>
            </div>

            {/* Extra space for printer roll tear-off margin */}
            <div className="h-10"></div>
        </div>
    );
}
