import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { parseDateSafe } from "@/utils/date";

interface FaturamentoChartProps {
  receitas: any[];
  selectedMonth: Date;
}

interface DailyData {
  dia: string;
  faturamentoAtual: number;
  faturamentoAnterior: number;
}

export default function FaturamentoChart({ receitas, selectedMonth }: FaturamentoChartProps) {
  const chartData = useMemo(() => {
    if (!receitas || receitas.length === 0) return [];

    const anoAtual = selectedMonth.getFullYear();
    const mes = selectedMonth.getMonth();
    const anoAnterior = anoAtual - 1;

    // Função para obter faturamento diário de um período
    const getFaturamentoDiario = (ano: number, mes: number) => {
      const primeiroDia = new Date(ano, mes, 1);
      const ultimoDia = new Date(ano, mes + 1, 0);
      
      const receitasPeriodo = receitas.filter(r => {
        // Gráfico deve considerar a data da receita (data_vencimento)
        const dataReceita = parseDateSafe(r.data_vencimento);
        return dataReceita >= primeiroDia && dataReceita <= ultimoDia;
      });

      const faturamentoPorDia: { [key: string]: number } = {};
      
      // Inicializar todos os dias do mês com 0
      for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const data = new Date(ano, mes, dia, 12, 0, 0);
        const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
        faturamentoPorDia[dataStr] = 0;
      }

      // Somar faturamento por dia
      receitasPeriodo.forEach(r => {
        const dataReceita = parseDateSafe(r.data_vencimento);
        const dataStr = `${dataReceita.getFullYear()}-${String(dataReceita.getMonth() + 1).padStart(2, '0')}-${String(dataReceita.getDate()).padStart(2, '0')}`;
        faturamentoPorDia[dataStr] = (faturamentoPorDia[dataStr] || 0) + r.valor;
      });

      return faturamentoPorDia;
    };

    const faturamentoAtual = getFaturamentoDiario(anoAtual, mes);
    const faturamentoAnterior = getFaturamentoDiario(anoAnterior, mes);

    // Criar array de dados para o gráfico
    const dados: DailyData[] = [];
    const ultimoDia = new Date(anoAtual, mes + 1, 0);

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const dataStr = `${anoAtual}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const dataStrAnterior = `${anoAnterior}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      
      dados.push({
        dia: `${dia}`,
        faturamentoAtual: faturamentoAtual[dataStr] || 0,
        faturamentoAnterior: faturamentoAnterior[dataStrAnterior] || 0
      });
    }

    return dados;
  }, [receitas, selectedMonth]);

  const totalAtual = chartData.reduce((sum, item) => sum + item.faturamentoAtual, 0);
  const totalAnterior = chartData.reduce((sum, item) => sum + item.faturamentoAnterior, 0);
  const variacao = totalAtual > 0 && totalAnterior > 0 
    ? ((totalAtual - totalAnterior) / totalAnterior) * 100 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">Dia {label}</p>
          <p className="text-blue-600">
            {selectedMonth.getFullYear()}: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-orange-600">
            {selectedMonth.getFullYear() - 1}: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo dos totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Faturamento {selectedMonth.getFullYear()}</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAtual)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800">Faturamento {selectedMonth.getFullYear() - 1}</h3>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAnterior)}</p>
        </div>
        <div className={`p-4 rounded-lg border ${
          variacao >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="text-sm font-medium">Variação</h3>
          <p className={`text-2xl font-bold ${
            variacao >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">
          Faturamento Diário - {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dia" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="faturamentoAtual" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name={`${selectedMonth.getFullYear()}`}
            />
            <Line 
              type="monotone" 
              dataKey="faturamentoAnterior" 
              stroke="#f97316" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
              name={`${selectedMonth.getFullYear() - 1}`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de barras para comparação */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Comparação por Dia</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dia" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="faturamentoAtual" 
              fill="#3b82f6" 
              name={`${selectedMonth.getFullYear()}`}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="faturamentoAnterior" 
              fill="#f97316" 
              name={`${selectedMonth.getFullYear() - 1}`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 