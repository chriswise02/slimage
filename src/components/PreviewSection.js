import React from 'react';
import Button from './Button';
import QualityControls from './QualityControls';
import { FILTER_TITLES } from '../constants/appConstants';

const PreviewSection = ({
  selectedFilter,
  originalImage,
  processedImage,
  processedBlob,
  fileSizeInfo,
  isLoading,
  isTriangularSplit,
  splitBlobs,
  qualityValue,
  onQualityChange,
  onTriangularSplit,
  onDownloadSplit,
  onDownload,
  onReset,
  onNavigateToUpload,
  onNavigateToFilter
}) => {
  return (
    <div className="preview-section">
      <div className="flex items-center justify-center mb-8 gap-6">
        <button 
          onClick={onNavigateToUpload}
          className="text-xs text-[#333333] opacity-60 hover:opacity-100 hover:text-[#FF3008] transition-all"
        >
          Change Image
        </button>
        <button 
          onClick={onNavigateToFilter}
          className="text-xs text-[#333333] opacity-60 hover:opacity-100 hover:text-[#FF3008] transition-all"
        >
          Change Filter
        </button>
        <h2 className="text-xl font-medium text-[#333333]">Preview & Download</h2>
        <div className="text-xs text-[#333333] opacity-60">
          Filter: <span className="font-medium text-[#333333]">{FILTER_TITLES[selectedFilter] || selectedFilter}</span>
        </div>
      </div>
      
      <div className="bg-[#F0F0F0] p-5 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <h4 className="font-medium mb-2 text-[#333333]">Original</h4>
            {originalImage && (
              <img src={originalImage} alt="Original" className="max-w-full max-h-64 mx-auto" />
            )}
            <p className="text-xs text-[#333333] opacity-60 mt-2">
              {fileSizeInfo ? fileSizeInfo.originalSize : 'Original Size'}
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-medium mb-2 text-[#333333]">Processed</h4>
            {isLoading ? (
              <div className="max-w-full max-h-64 mx-auto bg-white rounded-lg flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F0F0F0] border-t-[#FF3008] mx-auto mb-2"></div>
                  <div className="text-xs text-[#333333] opacity-60">Processing quality...</div>
                </div>
              </div>
            ) : processedImage ? (
              <img src={processedImage} alt="Processed" className="max-w-full max-h-64 mx-auto" />
            ) : null}
            <p className="text-xs text-[#333333] opacity-60 mt-2">
              {fileSizeInfo ? (
                <>
                  {fileSizeInfo.size} | 
                  <span className={fileSizeInfo.isIncrease ? 'text-[#FF3008]' : ''}>
                    {fileSizeInfo.savings}
                  </span>
                </>
              ) : (
                'Processed Size'
              )}
            </p>
          </div>
        </div>
      </div>

      <QualityControls 
        qualityValue={qualityValue}
        selectedFilter={selectedFilter}
        onQualityChange={onQualityChange}
      />

      {/* Triangular Split Downloads */}
      {isTriangularSplit && (
        <div className="bg-[#F0F0F0] p-5 rounded-xl mb-6">
          <h4 className="font-medium mb-4 text-center text-[#333333]">Split Download Options</h4>
          <div className="flex justify-center gap-3">
            <Button 
              variant="secondary"
              size="small"
              onClick={() => onTriangularSplit(qualityValue)}
            >
              Generate Split Files
            </Button>
            {splitBlobs && (
              <>
                <Button 
                  variant="primary"
                  size="small"
                  onClick={() => onDownloadSplit('top')}
                >
                  Download Top Half
                </Button>
                <Button 
                  variant="primary"
                  size="small"
                  onClick={() => onDownloadSplit('bottom')}
                >
                  Download Bottom Half
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="text-center space-x-3">
        <Button 
          variant="primary"
          onClick={onDownload}
          disabled={!processedBlob}
        >
          Download Processed Image
        </Button>
        <Button 
          variant="secondary"
          onClick={onReset}
        >
          Process Another Image
        </Button>
      </div>
    </div>
  );
};

export default PreviewSection; 