import React from 'react';

function AlertModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 13, 26, 0.6)',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '28px 32px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
          animation: 'alertSlideIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚠️
          </div>
          <h3
            style={{
              margin: 0,
              color: '#2c2537',
              fontSize: '18px',
              fontWeight: '700',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Attention Required
          </h3>
        </div>
        <p
          style={{
            margin: '0 0 24px',
            color: '#5a4965',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: '42px',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
          }}
        >
          OK
        </button>
      </div>
      <style>{`
        @keyframes alertSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default AlertModal;
