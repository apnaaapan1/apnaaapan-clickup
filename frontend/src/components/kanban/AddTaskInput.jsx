import { useEffect, useRef, useState } from 'react';

export default function AddTaskInput({ onSubmit, onCancel }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key === 'Enter') {
      const name = value.trim();
      if (!name) return;
      await onSubmit(name);
      setValue('');
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
      placeholder="Task name..."
    />
  );
}
