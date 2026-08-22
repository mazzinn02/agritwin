import React, { useState } from 'react';
import { DigitalTwinCropState } from '../types';
import { Upload, Camera, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  twinState: DigitalTwinCropState;
  onUpdate: (state: Partial<DigitalTwinCropState>) => void;
}

export const DiseaseDetection: React.FC<Props> = ({ twinState, onUpdate }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const simulateAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        diseaseName: 'Early Blight',
        confidence: 89,
        severity: 'Moderate',
        actions: ['Apply fungicide immediately', 'Prune lower affected leaves', 'Reduce overhead watering'],
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">AI Disease Detection Module</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Upload Plant Image</h3>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
            <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-700">Drag & drop or click to upload</p>
            <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
              Select Image
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={simulateAnalysis}
              disabled={analyzing}
              className="flex-1 py-3 bg-slate-900 text-white font-medium rounded-xl text-sm flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Run Disease Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Analysis Results</h3>
          
          {!result && !analyzing && (
            <div className="py-8 text-center text-slate-500">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm">Upload an image and run analysis to see results.</p>
            </div>
          )}

          {analyzing && (
            <div className="py-8 text-center text-slate-500 space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium animate-pulse">Running computer vision models...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Detected Disease</p>
                  <p className="text-xl font-bold text-red-900">{result.diseaseName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Confidence</p>
                  <p className="text-xl font-bold text-red-900">{result.confidence}%</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-2">Severity Indicator</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-2/3 rounded-full" />
                  </div>
                  <span className="text-sm font-bold text-orange-600">{result.severity}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                <p className="text-sm font-bold text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Actions</span>
                </p>
                <ul className="space-y-2">
                  {result.actions.map((act: string, i: number) => (
                    <li key={i} className="text-sm text-emerald-800 flex items-start space-x-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
