import React from 'react';

interface Props {
    headers: string[];
    children: React.ReactNode;
    footer?: React.ReactNode;
    variant?: 'screen' | 'print';
}

const PerformanceBaseTable: React.FC<Props> = ({ headers, children, footer, variant = 'screen' }) => {
    const isPrint = variant === 'print';

    if (isPrint) {
        return (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            {headers.map((h, i) => (
                                <th key={i} className={`py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest ${i === 0 ? 'pl-3' : i === headers.length - 1 ? 'pr-3 text-right' : ''}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {children}
                        {footer}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {headers.map((h, i) => (
                                <th key={i} className={`px-5 py-4 ${i === headers.length - 1 ? 'text-right' : ''}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PerformanceBaseTable;
