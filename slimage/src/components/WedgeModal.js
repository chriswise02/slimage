import React from 'react';
import { TriangleRight } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { WEDGE_COLORS, WEDGE_POSITIONS } from '../constants/appConstants';

const WedgeModal = ({
  isOpen,
  onClose,
  wedgePosition,
  setWedgePosition,
  wedgeColor,
  setWedgeColor,
  onApply
}) => {
  const canApply = wedgeColor && wedgePosition;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Wedge Options"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Color Options */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[#333333]">Color:</label>
          <div className="flex gap-2">
            {Object.entries(WEDGE_COLORS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setWedgeColor(key)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  wedgeColor === key 
                    ? 'bg-[#F0F0F0]' 
                    : 'hover:bg-[#F0F0F0]'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full border-2 border-[#E7E7E7]"
                  style={{ backgroundColor: config.hex }}
                />
                <span className={`text-sm font-medium transition-all ${
                  wedgeColor === key ? `text-[${config.hex}]` : 'text-[#333333]'
                }`}>
                  {config.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Position Options */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[#333333]">Position:</label>
          <div className="flex gap-2">
            {WEDGE_POSITIONS.map((position) => (
              <button
                key={position}
                onClick={() => setWedgePosition(position)}
                className={`p-2 rounded-lg transition-all ${
                  wedgePosition === position 
                    ? 'bg-[#F0F0F0]' 
                    : 'hover:bg-[#F0F0F0]'
                }`}
              >
                <TriangleRight 
                  size={20}
                  className={`transition-all ${position === 'top' ? '-rotate-180' : ''} ${
                    wedgePosition === position 
                      ? (wedgeColor === 'red' ? 'text-[#FF3008]' : wedgeColor === 'pinot' ? 'text-[#4C0C3A]' : 'text-[#333333]')
                      : 'text-[#333333]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-x-3">
        <Button 
          variant="primary" 
          onClick={onApply}
          disabled={!canApply}
        >
          Apply Wedge
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default WedgeModal; 