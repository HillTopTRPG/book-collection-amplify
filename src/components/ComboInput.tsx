
import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type Props = {
  label: string;
  className?: string;
  list: { value: string, label: string }[];
  value: string;
  setValue: (value: string) => void;
};

export default function ComboInput({label, className, list, value, setValue}: Props) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Filter suggestions based on input value
  const filteredList = list.filter((item) => 
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);
  
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setValue(newValue); // Always set the value to allow free text
    
    // Filter suggestions based on new input value
    const newFilteredList = list.filter((item) => 
      item.label.toLowerCase().includes(newValue.toLowerCase())
    );
    
    setOpen(newValue.length > 0 && newFilteredList.length > 0); // Show suggestions if there are matches
  };
  
  const handleSelect = (selectedValue: string) => {
    const selectedItem = list.find(item => item.value === selectedValue);
    if (selectedItem) {
      setInputValue(selectedItem.label);
      setValue(selectedItem.label);
    }
    setOpen(false);
  };
  
  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          placeholder={label}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(inputValue.length > 0 && filteredList.length > 0)}
          className={`pr-8 ${className}`}
        />
        <ChevronsUpDownIcon 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 cursor-pointer" 
          onClick={() => setOpen(!open)}
        />
      </div>
      
      {open && filteredList.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <Command>
            <CommandList>
              <CommandGroup>
                {filteredList.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => handleSelect(item.value)}
                    className="cursor-pointer"
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        inputValue === item.label ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
