import type React from "react";
import { MdCheck } from "react-icons/md";
import Tooltip, { type TooltipPlacement } from "../tooltip";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: boolean;
  tooltipPlacement?: TooltipPlacement;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange = () => {},
  className = "",
  disabled = false,
  tooltip = false,
  tooltipPlacement = "right",
}) => {
  return tooltip ? (
    <Tooltip content={label} placement={tooltipPlacement}>
      <label className={`flex items-center space-x-3 group cursor-pointer ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}>
        <div className="relative w-5 h-5">
          <input
            id={id}
            type="checkbox"
            className={`w-5 h-5 appearance-none cursor-pointer dark:border-gray-700 border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60 ${className}`}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          {checked && (
            <MdCheck
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2 text-white"
              size={20}
            />
          )}
        </div>
        {label && <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>}
      </label>
    </Tooltip>
  ) : (
    <label className={`flex items-center space-x-3 group cursor-pointer ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}>
      <div className="relative w-5 h-5">
        <input
          id={id}
          type="checkbox"
          className={`w-5 h-5 appearance-none cursor-pointer dark:border-gray-700 border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60 ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {checked && (
          <MdCheck
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2 text-white"
            size={20}
          />
        )}
      </div>
      {label && <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>}
    </label>
  );
};

export default Checkbox;
