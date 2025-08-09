import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { parseDateSafe } from "@/utils/date";

interface FaturamentoPorModalidadeChartProps {
  receitas: any[];
  modalidades: { id: string; nome: string }[];
  selectedMonth: Date;
}

export default function FaturamentoPorModalidadeChart({ receitas, modalidades, selectedMonth }: FaturamentoPorModalidadeChartProps) {
  const data = useMemo(() => {
    if (!receitas) return [];

    const ano = selectedMonth.getFullYear();
    const mes = selectedMonth.getMonth();
    const inicio = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 0, 23, 59, 59);

    // Map dos nomes de modalidades para facilitar matching por descricao
    const nomesModalidades = new Set((modalidades || []).map((m) => (m.nome || "").toLowerCase()));

    const totalPorModalidade: Record<string, number> = {};

    // Inicializa com zero para manter ordem consistente e exibir modalidades sem movimento
    (modalidades || []).forEach((m) => {
      totalPorModalidade[m.nome] = 0;
    });

    // Agrega receitas do mês por modalidade (por descricao equivalente ao nome da modalidade)
    (receitas || []).forEach((r) => {
      const baseDateStr = r.data_recebimento || r.data_vencimento;
      const dt = parseDateSafe(baseDateStr);
      if (!(dt >= inicio && dt <= fim)) return;

      const desc = String(r.descricao || "").toLowerCase();
      let key = (modalidades || []).find((m) => m.nome.toLowerCase() === desc)?.nome;
      if (!key) {
        // tenta contains (ex.: "Cartão Crédito - Visa")
        key = (modalidades || []).find((m) => desc.includes(m.nome.toLowerCase()))?.nome;
      }
      if (!key) key = "Outras";

      totalPorModalidade[key] = (totalPorModalidade[key] || 0) + (r.valor || 0);
    });

    const rows = Object.entries(totalPorModalidade)
      .map(([nome, total]) => ({ modalidade: nome, total }))
      .sort((a, b) => b.total - a.total);

    // Garante "Outras" no final
    const outrasIndex = rows.findIndex((r) => r.modalidade === "Outras");
    if (outrasIndex >= 0) {
      const outras = rows.splice(outrasIndex, 1)[0];
      rows.push(outras);
    }

    return rows;
  }, [receitas, modalidades, selectedMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">{formatCurrency(payload[0]?.value || 0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="modalidade" angle={-20} textAnchor="end" interval={0} height={60} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => formatCurrency(v).replace('R$', '')} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="total" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


