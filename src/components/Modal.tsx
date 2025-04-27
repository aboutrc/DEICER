import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true
}) => {
  const overlayRoot = document.getElementById('overlay-root');
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Add class to body to prevent scrolling
      document.body.classList.add('modal-open');
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      // Remove class from body when modal is closed
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  // Handle clicking outside the modal to close it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !overlayRoot) return null;

  return createPortal(
    <>
      <div className="modal-backdrop" />
      <div className={`modal-container ${maxWidth} w-full`}>
        <div 
          ref={modalRef}
          className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl"
        >
          {title && (
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          <div className="max-h-[calc(80vh-4rem)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>,
    overlayRoot
  );
};

export default Modal;