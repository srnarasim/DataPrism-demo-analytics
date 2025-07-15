/**
 * File Uploader Component
 * Drag-and-drop CSV file upload with validation and progress
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

interface FileUploaderProps {
  onUpload: (file: File, data: any[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  isLoading,
  error,
}) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (result) => {
          if (result.errors.length > 0) {
            console.error('CSV parsing errors:', result.errors);
          }
          
          await onUpload(file, result.data);
        },
        error: (error: any) => {
          console.error('CSV parsing error:', error);
        }
      });
    } catch (err) {
      console.error('File reading error:', err);
    }
  }, [onUpload]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
  } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const getDropzoneStatus = () => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (isDragReject) return 'reject';
    if (isDragActive) return 'active';
    if (acceptedFiles.length > 0) return 'success';
    return 'idle';
  };

  const status = getDropzoneStatus();

  const statusConfig = {
    idle: {
      borderColor: 'border-gray-300',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      icon: Upload,
      title: 'Drop CSV file here, or click to select',
      subtitle: 'Support for files up to 10MB',
    },
    active: {
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      icon: Upload,
      title: 'Drop file to upload',
      subtitle: 'Release to start processing',
    },
    reject: {
      borderColor: 'border-red-400',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      icon: AlertCircle,
      title: 'Invalid file type',
      subtitle: 'Please upload a CSV file',
    },
    loading: {
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      icon: Upload,
      title: 'Processing file...',
      subtitle: 'Please wait while we parse your data',
    },
    success: {
      borderColor: 'border-green-400',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      icon: CheckCircle,
      title: 'File uploaded successfully',
      subtitle: acceptedFiles[0]?.name || '',
    },
    error: {
      borderColor: 'border-red-400',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      icon: AlertCircle,
      title: 'Upload failed',
      subtitle: error || 'Please try again',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${config.borderColor} ${config.bgColor}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Icon className={`w-12 h-12 ${config.textColor}`} />
            )}
          </div>
          
          <div>
            <p className={`text-lg font-medium ${config.textColor}`}>
              {config.title}
            </p>
            <p className={`text-sm mt-1 ${config.textColor} opacity-75`}>
              {config.subtitle}
            </p>
          </div>

          {status === 'idle' && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported format: CSV files with headers</p>
              <p>Maximum file size: 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* File Info */}
      {acceptedFiles.length > 0 && status !== 'error' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <File className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {acceptedFiles[0].name}
              </p>
              <p className="text-xs text-gray-500">
                {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Upload Error
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};