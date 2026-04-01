import { useEffect, useMemo, useRef, useState } from 'react';

function CustomSelect({
  id,
  name,
  value,
  options,
  onChange,
  placeholder = '',
  label = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
    function () {
      return options.find(function (option) {
        return option.value === value;
      });
    },
    [options, value]
  );

  useEffect(function () {
    function handleOutsideClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return function () {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleOptionSelect(nextValue) {
    onChange({
      target: {
        name,
        value: nextValue,
      },
    });

    setIsOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={isOpen ? 'custom-select custom-select-open' : 'custom-select'}
    >
      <button
        id={id}
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={function () {
          setIsOpen(function (currentValue) {
            return !currentValue;
          });
        }}
      >
        <span className="custom-select-copy">
          {label ? <span className="custom-select-label">{label}</span> : null}
          <span className={selectedOption ? 'custom-select-value' : 'custom-select-placeholder'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <span className="custom-select-arrow" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="custom-select-menu" role="listbox" aria-labelledby={id}>
          {options.map(function (option) {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={
                  isActive
                    ? 'custom-select-option custom-select-option-active'
                    : 'custom-select-option'
                }
                onClick={function () {
                  handleOptionSelect(option.value);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default CustomSelect;
