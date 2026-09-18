'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, Clock, FileText } from 'lucide-react';

export interface DocumentTrailStep {
  label: string;
  docNumber?: string;
  docDate?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  href?: string;
}

export interface DocumentTrailProps {
  steps: DocumentTrailStep[];
}

export default function DocumentTrail({ steps }: DocumentTrailProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-blue-600" />
        Document Lifecycle & Audit Trail
      </h4>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs min-w-[140px] transition-all ${
                step.status === 'COMPLETED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                  : step.status === 'ACTIVE'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <Clock className={`w-4 h-4 ${step.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-300'} flex-shrink-0`} />
              )}
              <div className="truncate">
                <p className="text-[11px] font-bold tracking-tight leading-tight">{step.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{step.docNumber || 'Not Created'}</p>
              </div>
            </div>
            {idx < steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
