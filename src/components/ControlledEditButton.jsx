import React, { useState, useEffect } from 'react';
import { Edit, Lock, Key, CheckCircle, Clock } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { isDirectEditAllowed } from '../config/documentTypes';
import EditRequestModal from './EditRequestModal';

export default function ControlledEditButton({
  documentType,
  documentId,
  documentNumber,
  userRole,
  currentUser,
  onEdit,
  buttonStyle = {},
  buttonText = 'Edit',
  className = ''
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [checking, setChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const role = userRole || currentUser?.role;
  const isDirect = isDirectEditAllowed(documentType, role);

  const checkPermissionStatus = async () => {
    if (isDirect || !documentId) return;

    setChecking(true);
    try {
      const { response, data } = await apiRequest(`/api/edit-permissions/check/${encodeURIComponent(documentType)}/${documentId}`);
      if (response.ok && data.success) {
        setHasPermission(data.hasPermission);
        setActiveRequest(data.request || null);
      }
    } catch (err) {
      console.error('[ControlledEditButton] Error checking permission:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkPermissionStatus();
  }, [documentType, documentId, role]);

  // Direct editing allowed for Quotation (Sales Person), Supplier PO (Purchasers), or CEO/Admin
  if (isDirect) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          ...buttonStyle
        }}
      >
        <Edit size={14} />
        {buttonText}
      </button>
    );
  }

  // CEO Controlled Document handling
  const handleClick = () => {
    if (hasPermission) {
      if (onEdit) onEdit();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {hasPermission ? (
        <button
          type="button"
          onClick={handleClick}
          className={className}
          title="CEO Edit Permission Approved for single-use"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #16a34a',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            ...buttonStyle
          }}
        >
          <CheckCircle size={14} color="#16a34a" />
          {buttonText} (CEO Approved)
        </button>
      ) : activeRequest && activeRequest.status === 'Pending' ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={className}
          title="Click to view pending CEO request details"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #fde68a',
            backgroundColor: '#fffbeb',
            color: '#b45309',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            ...buttonStyle
          }}
        >
          <Clock size={14} />
          {buttonText} (Pending CEO Approval)
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={className}
          title="Click to request CEO Edit Permission"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            ...buttonStyle
          }}
        >
          <Edit size={14} />
          {buttonText}
        </button>
      )}

      {/* Request Modal */}
      <EditRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType={documentType}
        documentId={documentId}
        documentNumber={documentNumber}
        currentUser={currentUser}
        onRequestSubmitted={() => {
          checkPermissionStatus();
        }}
      />
    </div>
  );
}
