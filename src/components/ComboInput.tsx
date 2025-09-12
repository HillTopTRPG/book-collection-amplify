
import * as React from 'react';

import { CheckIcon, ChevronsUpDownIcon, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
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
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) &&
          dropdownRef.current && !dropdownRef.current.contains(target)) {
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
  
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === 'clear-value') {
      setInputValue('');
      setValue('');
    } else {
      const selectedItem = list.find(item => item.value === selectedValue);
      if (selectedItem) {
        setInputValue(selectedItem.label);
        setValue(selectedItem.label);
      }
    }
    setOpen(false);
  };
  
  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <Input
          placeholder={label}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
          onFocus={() => {
            updateDropdownPosition();
            setOpen(list.length > 0);
          }}
          className={`${open ? '' : 'pr-7'} ${className}`}
        />
        {!open && (
          <ChevronsUpDownIcon
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-background dark:text-background cursor-pointer pointer-events-auto z-30 bg-transparent"
            onClick={() => {
              updateDropdownPosition();
              setOpen(!open);
            }}
          />
        )}
      </div>
      
      {open && (inputValue.length > 0 ? filteredList.length > 0 : list.length > 0) && 
        createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[99999] bg-popover border rounded-md shadow-md" 
            style={{
              left: dropdownPosition.left,
              top: dropdownPosition.top,
              width: dropdownPosition.width
            }}
          >
            <Command>
              <CommandList>
                <CommandGroup>
                  {(inputValue.length > 0 ? filteredList : list).map((item) => (
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
                  {(inputValue.length > 0 || list.length > 0) && (
                    <CommandItem
                      key="clear-value"
                      value="clear-value"
                      onSelect={() => handleSelect('clear-value')}
                      className="cursor-pointer rounded-none border-t text-muted-foreground"
                    >
                      <X className="mr-2 h-4 w-4" />
                      値をクリアする
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>,
          document.body
        )
      }
    </div>
  );
}
