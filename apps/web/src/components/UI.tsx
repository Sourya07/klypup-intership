import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, AlertCircle, Info, ExternalLink, X } from 'lucide-react';
import { ResearchCitation } from '../types/api';

// --- BUTTON ---
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}> = ({ children, variant = 'primary', size = 'md', loading, className = '', disabled, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 focus:ring-zinc-900 dark:focus:ring-white dark:focus:ring-offset-black",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 focus:ring-zinc-200 dark:focus:ring-zinc-700",
    outline: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 focus:ring-zinc-200 dark:focus:ring-zinc-800",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 focus:ring-zinc-200 dark:focus:ring-zinc-800"
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// --- INPUT ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || `input-${Math.random()}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

// --- SELECT ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
}> = ({ label, error, children, className = '', id, ...props }) => {
  const selectId = id || `select-${Math.random()}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

// --- CARD ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm overflow-hidden transition-colors ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-zinc-900 dark:text-white leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-zinc-500 dark:text-zinc-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`px-5 py-4 ${className}`} {...props}>
    {children}
  </div>
);

// --- BADGE ---
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    danger: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
    info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- SKELETON ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded ${className}`} />
);

export const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 w-full">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-64" />
  </div>
);

// --- METRIC CARD ---
export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  className?: string;
}> = ({ label, value, change, changeType, description, className = '' }) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';
  
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">{label}</span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{value}</span>
          {change && (
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
              isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
              isNegative ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {isPositive && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />}
              {isNegative && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />}
              {change}
            </span>
          )}
        </div>
        {description && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 block leading-normal">{description}</span>
        )}
      </CardContent>
    </Card>
  );
};

// --- SENTIMENT BADGE ---
export const SentimentBadge: React.FC<{ sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string }> = ({ sentiment }) => {
  if (!sentiment) return null;
  const upper = sentiment.toUpperCase();
  if (upper === 'BULLISH') return <Badge variant="success">Bullish</Badge>;
  if (upper === 'BEARISH') return <Badge variant="danger">Bearish</Badge>;
  return <Badge variant="warning">Neutral</Badge>;
};

// --- FINANCIAL TABLE ---
export const FinancialTable: React.FC<{
  headers: string[];
  rows: Array<{
    label: string;
    values: Array<string | number>;
    isHeader?: boolean;
  }>;
}> = ({ headers, rows }) => (
  <div className="w-full overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 shadow-sm">
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          {headers.map((h, i) => (
            <th 
              key={i} 
              className={`px-4 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-xs ${
                i > 0 ? 'text-right' : ''
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map((row, rIdx) => (
          <tr 
            key={rIdx} 
            className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
              row.isHeader ? 'bg-zinc-50/50 dark:bg-zinc-900/20 font-bold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <td className={`px-4 py-2 text-zinc-900 dark:text-zinc-100 font-medium ${row.isHeader ? 'text-zinc-950 dark:text-white font-extrabold' : ''}`}>
              {row.label}
            </td>
            {row.values.map((v, cIdx) => (
              <td key={cIdx} className="px-4 py-2 text-right font-mono text-xs tabular-nums">
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- CITATION LIST & DRAWER ---
export const CitationList: React.FC<{ citations?: ResearchCitation[] }> = ({ citations = [] }) => {
  const [selectedCitation, setSelectedCitation] = useState<ResearchCitation | null>(null);

  if (citations.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No source citations attached.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
        {citations.map((c, i) => (
          <button
            key={c.id || i}
            onClick={() => setSelectedCitation(c)}
            className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 transition-all text-sm group"
          >
            <div className="space-y-1 pr-4">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block leading-tight">{c.sourceName}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{c.snippet}</p>
            </div>
            {c.relevanceScore && (
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Relevance</span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{c.relevanceScore}%</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Citation Drawer Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl p-6 flex flex-col justify-between animate-slide-left border-l border-zinc-200 dark:border-zinc-800">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Attributed Source</span>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{selectedCitation.sourceName}</h4>
                </div>
                <button 
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider block mb-2">Verified Snippet</span>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                    "{selectedCitation.snippet}"
                  </p>
                </div>

                {selectedCitation.relevanceScore && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider block mb-1">AI Confidence Match</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded overflow-hidden">
                        <div className="bg-zinc-900 dark:bg-white h-full rounded" style={{ width: `${selectedCitation.relevanceScore}%` }}></div>
                      </div>
                      <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">{selectedCitation.relevanceScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex space-x-3">
              {selectedCitation.sourceUrl ? (
                <a 
                  href={selectedCitation.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center font-semibold rounded text-white dark:text-black bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2.5 text-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> View Original Document
                </a>
              ) : (
                <button 
                  disabled
                  className="flex-1 inline-flex items-center justify-center font-medium rounded text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm cursor-not-allowed"
                >
                  Document URL Not Available
                </button>
              )}
              <Button variant="outline" onClick={() => setSelectedCitation(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- PROGRESS STEPPER ---
export const ProgressStepper: React.FC<{
  steps: string[];
  currentStepIndex: number;
  activeMessage?: string;
}> = ({ steps, currentStepIndex, activeMessage }) => (
  <div className="w-full space-y-5 py-4">
    <div className="relative flex items-center justify-between">
      {/* Background connecting line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-100 dark:bg-zinc-800 z-0"></div>
      
      {/* Dynamic filled line */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-900 dark:bg-white transition-all duration-500 z-0"
        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
      ></div>

      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;
        return (
          <div key={idx} className="relative z-10 flex flex-col items-center shrink-0">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                isCompleted ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black' :
                isActive ? 'bg-white border-zinc-900 text-zinc-900 font-bold scale-110 dark:bg-black dark:border-white dark:text-white' :
                'bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-white dark:text-black" />
              ) : (
                <span className="text-xs">{idx + 1}</span>
              )}
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider mt-2 hidden sm:block ${
              isActive ? 'text-zinc-900 dark:text-white font-extrabold' : 'text-zinc-400 dark:text-zinc-600'
            }`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>

    {activeMessage && (
      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg p-4 flex items-start space-x-3">
        <div className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full mt-1 animate-ping shrink-0"></div>
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider block">Current Phase</span>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{activeMessage}</p>
        </div>
      </div>
    )}
  </div>
);

// --- MODAL / DIALOG ---
export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-scale-up">
        <div className="p-6">
          <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-none">{title}</h4>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{message}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 flex justify-end space-x-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

// --- EMPTY & ERROR STATES ---
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-10 bg-white dark:bg-zinc-950 text-center shadow-sm">
    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full text-zinc-400 dark:text-zinc-600 mb-4">
      <Sparkles className="w-6 h-6" />
    </div>
    <h4 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h4>
    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm leading-relaxed">{description}</p>
    {actionText && onAction && (
      <Button variant="primary" className="mt-5" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load resources', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center border border-red-100 dark:border-red-950/35 rounded-lg p-8 bg-red-50/20 dark:bg-red-950/5 text-center">
    <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
    <h4 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h4>
    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm leading-relaxed">{message}</p>
    {onRetry && (
      <Button variant="outline" className="mt-4 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400 focus:ring-red-500" onClick={onRetry}>
        Retry Operation
      </Button>
    )}
  </div>
);

// --- TOAST NOTIFICATIONS ---
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export const Toast: React.FC<{
  type: 'success' | 'error' | 'info';
  text: string;
  onClose: () => void;
}> = ({ type, text, onClose }) => {
  const bgStyles = {
    success: 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-800 dark:border-zinc-200',
    error: 'bg-red-600 text-white border-red-700',
    info: 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-black border-zinc-700 dark:border-zinc-200',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-red-300 dark:text-red-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-300 dark:text-sky-600 shrink-0" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded shadow-xl border text-sm max-w-md w-full animate-slide-up ${bgStyles[type]}`}>
      {icons[type]}
      <span className="flex-1 font-medium">{text}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
