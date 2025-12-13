import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calculator, Plus, Trash2, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface CalculatorProps {
  onApplyTotal: (total: number) => void;
}

export const SalesCalculator: React.FC<CalculatorProps> = ({ onApplyTotal }) => {
  const [inputs, setInputs] = useState<string[]>(['', '']); // Start with 2 inputs

  const handleInputChange = (index: number, value: string) => {
    if (value.includes('-')) return;
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, '']);
  };

  const removeInput = (index: number) => {
    if (inputs.length <= 1) return;
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const total = inputs.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
        <Calculator className="text-purple-500 w-5 h-5" />
        Calculadora de Cajas
      </h2>
      
      <div className="space-y-3">
        {inputs.map((val, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="number"
              value={val}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={`Monto Caja ${index + 1}`}
              className="flex-1"
              min="0"
            />
            {inputs.length > 1 && (
              <button 
                onClick={() => removeInput(index)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button 
        variant="outline" 
        onClick={addInput}
        className="w-full border-dashed border-2"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Caja
      </Button>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-500">Total Calculado:</span>
          <span className="text-xl font-bold text-purple-600">{formatCurrency(total)}</span>
        </div>
        
        <Button 
          onClick={() => onApplyTotal(total)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          disabled={total <= 0}
        >
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Usar este monto
        </Button>
      </div>
    </div>
  );
};
