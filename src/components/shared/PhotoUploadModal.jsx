import { useState } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";

export default function PhotoUploadModal({ isOpen, onClose, partId, partLabel, onUpload, existingPhoto }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(existingPhoto || null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(partId, file, previewUrl);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(partId, file, previewUrl);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Upload Photo</h3>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mt-0.5">{partLabel}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shadow-sm border border-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div 
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors ${
              dragActive ? "border-teal-500 bg-teal-50" : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
            } ${preview ? "border-solid border-slate-200 bg-slate-50 p-2" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="font-semibold text-sm">Change Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <UploadCloud size={32} />
                </div>
                <p className="text-slate-800 font-bold mb-1 text-center">Drag and drop your photo here</p>
                <p className="text-slate-500 text-sm mb-6 text-center">or browse from your device</p>
                
                <label className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-bold transition shadow-md shadow-teal-500/30 cursor-pointer">
                  Browse Files
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition"
          >
            Close
          </button>
          {preview && (
            <button 
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
