import React from 'react';
import { 
  Minimize2, 
  Crop,
  SquareRoundCorner, 
  TriangleRight,
  ChevronLeft
} from 'lucide-react';
import Button from './Button';

const FilterSection = ({ selectedFilter, onFilterSelect, onApplyFilter, onNavigateToUpload }) => {
  return (
    <div className="filter-section mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={onNavigateToUpload}
            className="flex items-center gap-2 text-[#666666] hover:opacity-100 hover:text-[#FF3008] transition-all text-sm"
          >
            <ChevronLeft size={14} />
            Change Image
          </button>
        </div>
        <h2 className="text-xl font-medium text-[#333333] text-center">Choose a Filter</h2>
      </div>
      
      <div className="grid grid-cols-5 gap-3 mb-8">
        {/* Compression Only */}
        <div 
          className={`filter-option p-4 rounded-xl cursor-pointer transition-all text-center ${
            selectedFilter === 'none' ? 'bg-[#FF3008] text-white' : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] text-[#333333]'
          }`}
          onClick={() => onFilterSelect('none')}
        >
          <div className="flex items-center justify-center mb-3">
            <Minimize2 size={24} className="opacity-80" />
          </div>
          <span className="text-xs font-medium">Compress</span>
        </div>

        {/* Custom Crop */}
        <div 
          className={`filter-option p-4 rounded-xl cursor-pointer transition-all text-center ${
            selectedFilter === 'custom-crop' ? 'bg-[#FF3008] text-white' : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] text-[#333333]'
          }`}
          onClick={() => onFilterSelect('custom-crop')}
        >
          <div className="flex items-center justify-center mb-3">
            <Crop size={24} className="opacity-80" />
          </div>
          <span className="text-xs font-medium">Custom Crop</span>
        </div>

        {/* Quadrilateral Mask */}
        <div 
          className={`filter-option p-4 rounded-xl cursor-pointer transition-all text-center ${
            selectedFilter === 'triangular-mask' ? 'bg-[#FF3008] text-white' : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] text-[#333333]'
          }`}
          onClick={() => onFilterSelect('triangular-mask')}
        >
          <div className="flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M2 3 L22 1 L22 12 L2 15 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M2 14 L22 12 L22 21 L2 23 Z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-xs font-medium">Mask</span>
        </div>

        {/* Rounded Corners */}
        <div 
          className={`filter-option p-4 rounded-xl cursor-pointer transition-all text-center ${
            selectedFilter === 'rounded-corners' ? 'bg-[#FF3008] text-white' : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] text-[#333333]'
          }`}
          onClick={() => onFilterSelect('rounded-corners')}
        >
          <div className="flex items-center justify-center mb-3">
            <SquareRoundCorner size={24} className="opacity-80" />
          </div>
          <span className="text-xs font-medium">Rounded Corners</span>
        </div>

        {/* Wedge Filter */}
        <div 
          className={`filter-option p-4 rounded-xl cursor-pointer transition-all text-center ${
            selectedFilter === 'wedge' ? 'bg-[#FF3008] text-white' : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] text-[#333333]'
          }`}
          onClick={() => onFilterSelect('wedge')}
        >
          <div className="flex items-center justify-center mb-3">
            <TriangleRight size={24} className="opacity-80 rotate-180" />
          </div>
          <span className="text-xs font-medium">Wedge</span>
        </div>
      </div>
      
      <div className="text-center space-x-3">
        <Button 
          variant="primary"
          onClick={onApplyFilter}
          disabled={!selectedFilter || selectedFilter === ''}
        >
          {selectedFilter === 'custom-crop' ? 'Configure & Apply' : 
           selectedFilter === 'wedge' ? 'Configure & Apply' : 
           selectedFilter === 'rounded-corners' ? 'Configure & Apply' :
           'Apply & Continue'}
        </Button>
      </div>
    </div>
  );
};

export default FilterSection; 