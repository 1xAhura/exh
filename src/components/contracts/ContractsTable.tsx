import { useLanguage } from '../../context/LanguageContext';
import type { Contract } from '../../types/contract';

interface ContractsTableProps {
    contracts: Contract[];
    /** When provided, only the most recently added `limit` contracts are shown. */
    limit?: number;
}

export function ContractsTable({ contracts, limit }: ContractsTableProps) {
    const { t } = useLanguage();
    const visibleContracts = limit ? contracts.slice(-limit).reverse() : [...contracts].reverse();

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
                {/* min-width keeps columns readable; the wrapper scrolls on narrow windows.
            HTML tables flip their column order automatically in RTL. */}
                <table className="w-full min-w-[720px] text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.number}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.buyer}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.seller}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.date}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.price}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.car}</th>
                            <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{t.contracts.table.productionDate}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleContracts.map((contract, index) => (
                            <tr key={`${contract.contract_number}-${index}`} className="transition-colors hover:bg-slate-50">
                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{contract.contract_number}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{contract.buyer}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{contract.seller}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{contract.date}</td>
                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{contract.price}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{contract.car.car_name}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{contract.car.production_date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}