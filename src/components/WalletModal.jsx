import { useWalletManager } from '@interchain-kit/react';
import { useEffect, useRef } from 'react';
import './WalletModal.css';

export default function WalletModal() {
  const {
    modalIsOpen,
    closeModal,
    wallets,
    chains,
  } = useWalletManager();

  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalIsOpen) closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalIsOpen, closeModal]);

  useEffect(() => {
    document.body.style.overflow = modalIsOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalIsOpen]);

  if (!modalIsOpen) return null;

  const chainId = chains?.[0]?.chain_id || chains?.[0]?.chainId;

  const handleWalletClick = async (wallet) => {
    try {
      if (chainId) {
        await wallet.connect(chainId);
      }
      closeModal();
    } catch (err) {
      console.error('Wallet connect error:', err);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      closeModal();
    }
  };

  const topWallets = wallets?.filter(w => {
    const name = (w.info?.prettyName || w.info?.name || '').toLowerCase();
    return name.includes('keplr') || name.includes('leap');
  });

  const otherWallets = wallets?.filter(w => {
    const name = (w.info?.prettyName || w.info?.name || '').toLowerCase();
    return !name.includes('keplr') && !name.includes('leap');
  });

  return (
    <div
      className="rw-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Select your wallet"
    >
      <div className="rw-panel">
        <div className="rw-header">
          <span className="rw-title">Select your wallet</span>
          <button
            className="rw-close"
            onClick={closeModal}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="rw-body">
          {topWallets?.length > 0 && (
            <div className="rw-grid-top">
              {topWallets.map((wallet) => {
                const name = wallet.info?.prettyName || wallet.info?.name || 'Wallet';
                const logo = wallet.info?.logo;
                const logoUrl = typeof logo === 'string' ? logo : logo?.major || logo?.minor;

                return (
                  <button
                    key={wallet.info?.name}
                    className="rw-wallet-card-top"
                    onClick={() => handleWalletClick(wallet)}
                    title={name}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt={name} className="rw-wallet-icon-top" />
                    ) : (
                      <div className="rw-wallet-icon-placeholder-top">
                        {name.charAt(0)}
                      </div>
                    )}
                    <span className="rw-wallet-name-top">{name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {otherWallets?.length > 0 && (
            <div className="rw-list-bottom">
              {otherWallets.map((wallet) => {
                const name = wallet.info?.prettyName || wallet.info?.name || 'Wallet';
                const logo = wallet.info?.logo;
                const logoUrl = typeof logo === 'string' ? logo : logo?.major || logo?.minor;

                return (
                  <button
                    key={wallet.info?.name}
                    className="rw-wallet-card-bottom"
                    onClick={() => handleWalletClick(wallet)}
                    title={name}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt={name} className="rw-wallet-icon-bottom" />
                    ) : (
                      <div className="rw-wallet-icon-placeholder-bottom">
                        {name.charAt(0)}
                      </div>
                    )}
                    <span className="rw-wallet-name-bottom">{name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
