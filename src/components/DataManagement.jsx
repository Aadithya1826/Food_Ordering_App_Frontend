import React, { useState, useMemo } from 'react';
import {
  Database,
  Calendar,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Info,
  Clock,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { dataManagementService } from '../services/api';
import { toast } from './Toast';

const DataManagement = () => {
  // Compute previous calendar month as default
  const { defaultMonth, availableMonths, currentMonthStr } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed (e.g. 9 for October)
    
    const curStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
    
    // Default to immediate previous calendar month
    const prevDate = new Date(curYear, curMonth - 1, 1);
    const defMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Generate list of the past 24 previous calendar months
    const months = [];
    for (let i = 1; i <= 24; i++) {
      const d = new Date(curYear, curMonth - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: val, label });
    }
    
    return { defaultMonth: defMonth, availableMonths: months, currentMonthStr: curStr };
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  // Confirmation state
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState(null);
  const [deletionError, setDeletionError] = useState(null);

  const handleFetchPreview = async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    setDeletionResult(null);
    setDeletionError(null);
    setHasConfirmedCheckbox(false);
    setConfirmationInput('');

    try {
      const res = await dataManagementService.getPreview(selectedMonth);
      setPreviewData(res);
    } catch (err) {
      console.error('Preview error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to preview data.';
      setPreviewError(msg);
      toast.error(msg);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteDeletion = async () => {
    if (!previewData) return;
    
    const expectedPhrase = previewData.required_confirm_phrase;
    if (confirmationInput.trim() !== expectedPhrase) {
      toast.error(`Confirmation phrase does not match '${expectedPhrase}'`);
      return;
    }

    if (!hasConfirmedCheckbox) {
      toast.error('Please check the confirmation checkbox before proceeding.');
      return;
    }

    setIsDeleting(true);
    setDeletionError(null);

    try {
      const payload = {
        month: selectedMonth,
        confirmation_token: previewData.confirmation_token,
        confirm_phrase: confirmationInput.trim(),
      };

      const res = await dataManagementService.executeDeletion(payload);
      setDeletionResult(res);
      toast.success(res.message || 'Data deleted successfully.');
      setPreviewData(null);
    } catch (err) {
      console.error('Deletion error:', err);
      const msg = err.response?.data?.detail || err.message || 'Deletion failed. Transaction rolled back.';
      setDeletionError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFlow = () => {
    setPreviewData(null);
    setPreviewError(null);
    setDeletionResult(null);
    setDeletionError(null);
    setHasConfirmedCheckbox(false);
    setConfirmationInput('');
  };

  const isConfirmEnabled =
    previewData &&
    previewData.total_records > 0 &&
    hasConfirmedCheckbox &&
    confirmationInput.trim() === previewData.required_confirm_phrase &&
    !isDeleting;

  return (
    <div className="admin-page-mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="desktop-only">
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#111827', margin: 0 }}>
            Data Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Manual permanent deletion of historical sales records to reduce active database storage
          </p>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderLeft: '5px solid #d97706',
          borderRadius: '12px',
          padding: '18px 22px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <ShieldAlert size={26} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#92400e' }}>
            Strict Safeguards Enforced
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
            • <strong>Current Month Protected:</strong> Active records for the current calendar month ({currentMonthStr}) cannot be deleted.<br />
            • <strong>No Automatic Purges:</strong> Deletions only occur upon manual, authorized admin confirmation.<br />
            • <strong>Atomic Transactions:</strong> All deletions execute in safe dependency order and roll back completely if any failure occurs.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b45309' }}>
            <Info size={14} />
            <span>Ensure you have taken a verified database backup before permanently deleting production data.</span>
          </div>
        </div>
      </div>

      {/* Month Selection Card */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151'
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              Select Calendar Month
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Choose a completed calendar month to inspect and purge historical data
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
          <div style={{ flex: '1 1 260px', maxWidth: '340px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
              Previous Calendar Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPreviewData(null);
                setDeletionResult(null);
                setDeletionError(null);
              }}
              disabled={loadingPreview || isDeleting}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                background: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.value}) {m.value === defaultMonth ? '— Previous Month' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFetchPreview}
            disabled={loadingPreview || isDeleting}
            style={{
              alignSelf: 'flex-end',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 22px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loadingPreview ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            {loadingPreview ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Scanning Database...
              </>
            ) : (
              <>
                <Database size={16} />
                Preview Affected Records
              </>
            )}
          </button>
        </div>

        {previewError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={18} />
            <span>{previewError}</span>
          </div>
        )}
      </div>

      {/* Deletion Success Banner */}
      {deletionResult && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#065f46' }}>
                Permanent Deletion Completed Successfully
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>
                {deletionResult.message}
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #d1fae5',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Total Records Purged:</span>
              <strong style={{ color: '#111827', fontSize: '15px' }}>{deletionResult.total_deleted} rows</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Execution Duration:</span>
              <strong style={{ color: '#111827' }}>{deletionResult.execution_time_ms} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Timestamp:</span>
              <span style={{ color: '#374151', fontFamily: 'monospace' }}>{deletionResult.deleted_at}</span>
            </div>

            {deletionResult.deleted_counts && Object.keys(deletionResult.deleted_counts).length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rows Deleted per Table:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '8px' }}>
                  {Object.entries(deletionResult.deleted_counts).map(([tbl, cnt]) => (
                    <div
                      key={tbl}
                      style={{
                        background: '#f9fafb',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <code style={{ color: '#374151' }}>{tbl}</code>
                      <strong>{cnt}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={resetFlow}
            style={{
              background: '#047857',
              color: 'white',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Done & Reset
          </button>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overview Info Bar */}
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span
                  style={{
                    background: '#e0e7ff',
                    color: '#3730a3',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}
                >
                  PREVIEW STAGE
                </span>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  Eligible Data for {previewData.month_name} ({previewData.month})
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>
                  <Clock size={15} color="#6b7280" />
                  <span>Date Range (IST): <strong>{previewData.date_range_display}</strong></span>
                </div>
              </div>

              <div
                style={{
                  background: previewData.total_records > 0 ? '#fef2f2' : '#f3f4f6',
                  border: previewData.total_records > 0 ? '1px solid #fee2e2' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: previewData.total_records > 0 ? '#991b1b' : '#4b5563', textTransform: 'uppercase' }}>
                  Total Eligible Records
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: previewData.total_records > 0 ? '#b91c1c' : '#111827' }}>
                  {previewData.total_records}
                </div>
              </div>
            </div>

            {/* Regulatory Retention Note */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#1e40af',
                lineHeight: '1.5',
                display: 'flex',
                gap: '10px'
              }}
            >
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{previewData.retention_advisory}</div>
            </div>

            {/* Affected Tables Breakdown */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} />
                Breakdown of Affected Tables:
              </h4>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '10px 16px', fontWeight: '600', color: '#4b5563' }}>Table Name</th>
                      <th style={{ padding: '10px 16px', fontWeight: '600', color: '#4b5563' }}>Estimated Row Count</th>
                      <th style={{ padding: '10px 16px', fontWeight: '600', color: '#4b5563' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.affected_tables.map((row, idx) => (
                      <tr
                        key={row.table_name}
                        style={{
                          borderBottom: idx === previewData.affected_tables.length - 1 ? 'none' : '1px solid #f3f4f6',
                          background: row.estimated_count > 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>
                          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                            {row.table_name}
                          </code>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontWeight: '700',
                              color: row.estimated_count > 0 ? '#b91c1c' : '#9ca3af',
                              background: row.estimated_count > 0 ? '#fee2e2' : '#f3f4f6',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {row.estimated_count} rows
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '12.5px' }}>
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Prominent Warning & Confirmation Box */}
          {previewData.total_records > 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                border: '2px solid #ef4444',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626'
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#991b1b' }}>
                    CONFIRMATION REQUIRED FOR PERMANENT DELETION
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>
                    {previewData.permanent_deletion_warning}
                  </p>
                </div>
              </div>

              {/* Step 1: Checkbox */}
              <div
                style={{
                  background: '#fef2f2',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => setHasConfirmedCheckbox(!hasConfirmedCheckbox)}
              >
                <input
                  type="checkbox"
                  id="confirm-deletion-checkbox"
                  checked={hasConfirmedCheckbox}
                  onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#dc2626', cursor: 'pointer' }}
                />
                <label
                  htmlFor="confirm-deletion-checkbox"
                  style={{ fontSize: '13.5px', fontWeight: '600', color: '#7f1d1d', cursor: 'pointer', userSelect: 'none' }}
                >
                  I explicitly confirm that I want to permanently delete all {previewData.total_records} records for {previewData.month_name}. I understand this action cannot be undone.
                </label>
              </div>

              {/* Step 2: Verification Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  To prevent accidental deletion, type the phrase{' '}
                  <code style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 6px', borderRadius: '4px', fontWeight: '700' }}>
                    {previewData.required_confirm_phrase}
                  </code>{' '}
                  in the field below:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={`Type "${previewData.required_confirm_phrase}"`}
                  disabled={isDeleting}
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: confirmationInput.trim() === previewData.required_confirm_phrase ? '2px solid #10b981' : '1px solid #d1d5db',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    outline: 'none',
                    background: '#f9fafb'
                  }}
                />
              </div>

              {deletionError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#b91c1c',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{deletionError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '8px' }}>
                <button
                  onClick={handleExecuteDeletion}
                  disabled={!isConfirmEnabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isConfirmEnabled ? '#dc2626' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 26px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: isConfirmEnabled ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: isConfirmEnabled ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
                  }}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Executing Safe Transaction Deletion...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Permanently Delete Records
                    </>
                  )}
                </button>

                <button
                  onClick={resetFlow}
                  disabled={isDeleting}
                  style={{
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    color: '#4b5563',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isDeleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                color: '#6b7280'
              }}
            >
              <Info size={28} style={{ margin: '0 auto 8px auto', color: '#9ca3af' }} />
              <h4 style={{ margin: '0 0 4px 0', color: '#374151', fontSize: '15px' }}>
                No Records Found for {previewData.month_name}
              </h4>
              <p style={{ margin: 0, fontSize: '13px' }}>
                There are no historical orders or related records eligible for deletion in this month.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataManagement;
