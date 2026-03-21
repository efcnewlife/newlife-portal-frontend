import { CountryCode } from "@/types/common";
import { cn } from "@/utils";
import type React from "react";
import { useEffect, useState } from "react";
import Label from "../label";

interface PhoneInputProps {
  countries: CountryCode[];
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (phoneNumber: string) => void;
  disabled?: boolean;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  selectPosition?: "start" | "end"; // New prop for dropdown position
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries,
  id = "phone-input",
  name,
  label,
  placeholder = "+1 (555) 000-0000",
  value,
  onChange,
  disabled = false,
  error,
  hint,
  required = false,
  selectPosition = "start", // Default position is 'start'
}) => {
  const countryCodes: Record<string, string> = countries.reduce((acc, { name, code }) => ({ ...acc, [name]: code }), {});

  const [selectedCountry, setSelectedCountry] = useState<string>("TWN");
  const [phoneNumber, setPhoneNumber] = useState<string>(value ? value : countryCodes[selectedCountry]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    setPhoneNumber(countryCodes[newCountry]);
    if (onChange) {
      onChange(countryCodes[newCountry]);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(newPhoneNumber);
    }
  };

  // when external value When changing, synchronize internal state
  useEffect(() => {
    if (value) {
      setPhoneNumber(value);
    }
  }, [value]);

  let inputClasses = cn(
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    selectPosition === "start" ? "pl-[96px]" : "pr-[84px]"
  );

  if (disabled) {
    inputClasses = cn(
      inputClasses,
      "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    );
  } else if (error && error !== undefined) {
    inputClasses = cn(
      inputClasses,
      "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
    );
  } else {
    inputClasses = cn(
      inputClasses,
      "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
    );
  }

  return (
    <>
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative flex">
        {/* Dropdown position: Start */}
        {selectPosition === "start" && (
          <div className="absolute">
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={disabled}
              className="appearance-none bg-none rounded-l-lg border-0 border-r border-gray-200 bg-transparent py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {countries.map((country) => (
                <option key={country.name} value={country.name} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  {country.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 flex items-center text-gray-700 pointer-events-none bg-none right-3 dark:text-gray-400">
              <svg className="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Input field */}
        <input
          id={id}
          name={name}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className={inputClasses}
        />

        {/* Dropdown position: End */}
        {selectPosition === "end" && (
          <div className="absolute right-0">
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={disabled}
              className="appearance-none bg-none rounded-r-lg border-0 border-l border-gray-200 bg-transparent py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {countries.map((country) => (
                <option key={country.name} value={country.name} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  {country.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 flex items-center text-gray-700 pointer-events-none right-3 dark:text-gray-400">
              <svg className="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  );
};

export default PhoneInput;
