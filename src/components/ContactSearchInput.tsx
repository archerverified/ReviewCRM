'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/types';
import { Search, X, MapPin, Mail, Building2 } from 'lucide-react';

interface ContactSearchInputProps {
  value: string;
  onChange: (contactId: string, contactName: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function ContactSearchInput({
  value,
  onChange,
  placeholder = 'Search contacts...',
  label,
  className = '',
}: ContactSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [results, setResults] = useState<Business[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial contact name if value is set
  useEffect(() => {
    async function loadInitialContact() {
      if (value && !selectedName) {
        const { data } = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('id', value)
          .single();

        if (data) {
          setSelectedName(data.business_name);
          setSearchTerm(data.business_name);
        }
      }
    }
    loadInitialContact();
  }, [value, selectedName]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2 && searchTerm !== selectedName) {
        setIsLoading(true);
        try {
          const { data } = await supabase
            .from('businesses')
            .select('id, business_name, city, email, contact_name, first_name, last_name')
            .or(
              `business_name.ilike.%${searchTerm}%,` +
              `email.ilike.%${searchTerm}%,` +
              `contact_name.ilike.%${searchTerm}%,` +
              `first_name.ilike.%${searchTerm}%,` +
              `last_name.ilike.%${searchTerm}%,` +
              `city.ilike.%${searchTerm}%`
            )
            .limit(10);

          setResults((data as Business[]) || []);
          setIsOpen(true);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, selectedName]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectContact(contact: Business) {
    setSelectedName(contact.business_name);
    setSearchTerm(contact.business_name);
    onChange(contact.id, contact.business_name);
    setIsOpen(false);
  }

  function clearSelection() {
    setSelectedName('');
    setSearchTerm('');
    onChange('', '');
    setResults([]);
  }

  function getDisplayName(contact: Business): string {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    if (contact.contact_name) {
      return contact.contact_name;
    }
    return contact.business_name;
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && selectedName && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
          {results.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => selectContact(contact)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getDisplayName(contact)[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="font-medium text-gray-900 truncate">
                  {getDisplayName(contact)}
                </div>

                {/* Secondary info */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {contact.business_name && contact.business_name !== getDisplayName(contact) && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" />
                      {contact.business_name}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </span>
                  )}
                  {contact.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {contact.city}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          No contacts found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
