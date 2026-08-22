import React, { useState, useMemo } from 'react';

export type AreaUnit = 'Acres' | 'Sq Ft' | 'Hectares' | 'Square Meters';

interface AreaUnitInputProps {
  value?: number;
  unit?: AreaUnit;
  onChange?: (val: number, unit: AreaUnit) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AreaUnitInput: React.FC<AreaUnitInputProps> = ({
  value = 0,
  unit = 'Acres',
  onChange,
  label = 'Field / Bed Area',
  placeholder = 'e.g. 5',
  className = '',
  disabled = false,
}) => {
  const [localVal, setLocalVal] = useState<string>(value ? value.toString() : '');
  const [localUnit, setLocalUnit] = useState<AreaUnit>(unit);

  const numVal = parseFloat(localVal) || 0;

  // Conversion calculations
  const conversions = useMemo(() => {
    if (numVal <= 0) return null;

    let sqMeters = 0;
    if (localUnit === 'Acres') {
      sqMeters = numVal * 4046.8564224;
    } else if (localUnit === 'Sq Ft') {
      sqMeters = numVal * 0.09290304;
    } else if (localUnit === 'Hectares') {
      sqMeters = numVal * 10000;
    } else if (localUnit === 'Square Meters') {
      sqMeters = numVal;
    }

    const acres = sqMeters / 4046.8564224;
    const sqFt = sqMeters / 0.09290304;
    const hectares = sqMeters / 10000;

    const parts: string[] = [];

    if (localUnit !== 'Sq Ft') {
      parts.push(`${sqFt.toLocaleString(undefined, { maximumFractionDigits: 1 })} sq ft`);
    }
    if (localUnit !== 'Hectares') {
      parts.push(`${hectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} hectares`);
    }
    if (localUnit !== 'Acres') {
      parts.push(`${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} acres`);
    }
    if (localUnit !== 'Square Meters') {
      parts.push(`${sqMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`);
    }

    return parts.slice(0, 3).join(' = ');
  }, [numVal, localUnit]);

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalVal(valStr);
    const n = parseFloat(valStr) || 0;
    onChange?.(n, localUnit);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as AreaUnit;
    setLocalUnit(newUnit);
    onChange?.(numVal, newUnit);
  };

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 shadow-xs">
        <input
          type="number"
          step="any"
          min="0"
          placeholder={placeholder}
          value={localVal}
          disabled={disabled}
          onChange={handleValChange}
          className="flex-1 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none bg-transparent"
        />

        <div className="border-l border-slate-200 bg-slate-50 px-2.5 py-1">
          <select
            value={localUnit}
            disabled={disabled}
            onChange={handleUnitChange}
            className="bg-transparent text-xs font-extrabold text-slate-700 outline-none cursor-pointer"
          >
            <option value="Acres">Acres</option>
            <option value="Sq Ft">Sq Ft</option>
            <option value="Hectares">Hectares</option>
            <option value="Square Meters">Square Meters (m²)</option>
          </select>
        </div>
      </div>

      {conversions && (
        <p className="text-[11px] text-sky-700 font-medium tracking-tight">
          = {conversions}
        </p>
      )}
    </div>
  );
};

export default AreaUnitInput;
