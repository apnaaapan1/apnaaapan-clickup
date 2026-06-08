import { useEffect, useRef, useState } from 'react';
import { linkifyText } from '../../utils/linkifyText';

const fieldClassName =
  'w-full min-h-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm whitespace-pre-wrap';

export default function DescriptionInput({ value, onChange, onBlur, placeholder }) {
  const [editing, setEditing] = useState(!value);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(!value);
    onBlur?.();
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={fieldClassName}
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={`${fieldClassName} cursor-text`}
    >
      {linkifyText(value)}
    </div>
  );
}
