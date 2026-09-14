/**
 * HotelsVendors Supplier Checkout Plugin — Phase 2
 *
 * Drop-in JavaScript SDK for suppliers to offer HotelsVendors financing
 * at their checkout. Works with any e-commerce platform.
 *
 * Usage:
 *   <script src="https://hotelsvendors.com/plugin.js" data-api-key="hv_..."></script>
 *
 * Or programmatic:
 *   HotelsVendors.init({ apiKey: 'hv_...', supplierId: 'SUP-001' });
 *   HotelsVendors.showFinancing({ amount: 150000, currency: 'EGP' });
 */

interface HotelsVendorsConfig {
  apiKey: string;
  supplierId: string;
  baseUrl?: string;
  theme?: 'dark' | 'light';
  position?: 'bottom-right' | 'bottom-left' | 'modal';
}

interface FinancingRequest {
  amount: number;
  currency?: string;
  invoiceNumber?: string;
  hotelTaxId?: string;
  hotelName?: string;
  metadata?: Record<string, unknown>;
}

interface FinancingResponse {
  success: boolean;
  orderId?: string;
  invoiceId?: string;
  financingUrl?: string;
  error?: string;
}

declare global {
  interface Window {
    HotelsVendors?: HotelsVendorsPlugin;
  }
}

class HotelsVendorsPlugin {
  private config: HotelsVendorsConfig;
  private container: HTMLDivElement | null = null;

  constructor(config: HotelsVendorsConfig) {
    this.config = {
      baseUrl: 'https://hotelsvendors.com',
      theme: 'dark',
      position: 'modal',
      ...config,
    };
  }

  /**
   * Initialize the plugin on the supplier's checkout page
   */
  static init(config: HotelsVendorsConfig): HotelsVendorsPlugin {
    const plugin = new HotelsVendorsPlugin(config);
    plugin.mount();
    return plugin;
  }

  /**
   * Mount the financing button on the page
   */
  private mount(): void {
    if (typeof document === 'undefined') return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'hotelsvendors-plugin';
    this.container.style.cssText = `
      position: fixed;
      ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
      bottom: 20px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create financing button
    const button = document.createElement('button');
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #12121a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #f5870a; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Pay via HotelsVendors Financing
      </div>
    `;
    button.style.cssText = 'background: none; border: none; padding: 0; cursor: pointer;';
    button.onmouseover = () => {
      const div = button.firstElementChild as HTMLDivElement;
      if (div) {
        div.style.borderColor = 'rgba(245,135,10,0.3)';
        div.style.boxShadow = '0 4px 20px rgba(245,135,10,0.15)';
      }
    };
    button.onmouseout = () => {
      const div = button.firstElementChild as HTMLDivElement;
      if (div) {
        div.style.borderColor = 'rgba(255,255,255,0.1)';
        div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }
    };
    button.onclick = () => this.showModal();

    this.container.appendChild(button);
    document.body.appendChild(this.container);
  }

  /**
   * Show financing modal
   */
  private showModal(): void {
    if (!document) return;

    const modal = document.createElement('div');
    modal.id = 'hotelsvendors-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    `;

    modal.innerHTML = `
      <div style="background: #12121a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h3 style="color: white; font-size: 18px; font-weight: 600; margin: 0;">HotelsVendors Financing</h3>
          <button id="hv-close-modal" style="background: none; border: none; color: #666; cursor: pointer; font-size: 20px;">&times;</button>
        </div>
        <p style="color: #999; font-size: 13px; margin-bottom: 20px;">
          Get 30-90 day credit on this purchase. Powered by Oliv Finance.
        </p>
        <div style="background: rgba(245,135,10,0.05); border: 1px solid rgba(245,135,10,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #999; font-size: 13px;">Order Amount</span>
            <span id="hv-amount" style="color: white; font-weight: 600;">EGP 0</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #999; font-size: 13px;">Platform Fee (2%)</span>
            <span id="hv-fee" style="color: #ff7e1a; font-size: 13px;">EGP 0</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999; font-size: 13px;">You Pay Later</span>
            <span id="hv-net" style="color: #f5870a; font-weight: 600;">EGP 0</span>
          </div>
        </div>
        <button id="hv-apply-btn" style="width: 100%; padding: 14px; background: #f5870a; color: #0c0c12; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;">
          Apply for Financing
        </button>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 12px;">
          By applying, you agree to HotelsVendors Terms and Oliv Finance credit terms.
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handler
    document.getElementById('hv-close-modal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Apply handler
    document.getElementById('hv-apply-btn')?.addEventListener('click', () => {
      this.applyForFinancing();
    });
  }

  /**
   * Apply for financing
   */
  private async applyForFinancing(): Promise<void> {
    // This would redirect to HotelsVendors financing page
    // or open a popup for the hotel to complete the application
    window.open(
      `${this.config.baseUrl}/api/v1/financing/plugin-apply?supplierId=${this.config.supplierId}`,
      '_blank'
    );
  }

  /**
   * Programmatic API: Show financing option with specific amount
   */
  showFinancing(request: FinancingRequest): Promise<FinancingResponse> {
    return new Promise((resolve) => {
      // Calculate fees
      const amount = request.amount;
      const fee = amount * 0.02;
      const net = amount - fee;

      // Show modal with pre-filled amount
      this.showModal();

      // Update amounts in modal
      setTimeout(() => {
        const amountEl = document.getElementById('hv-amount');
        const feeEl = document.getElementById('hv-fee');
        const netEl = document.getElementById('hv-net');

        if (amountEl) amountEl.textContent = `EGP ${amount.toLocaleString()}`;
        if (feeEl) feeEl.textContent = `EGP ${fee.toLocaleString()}`;
        if (netEl) netEl.textContent = `EGP ${net.toLocaleString()}`;
      }, 100);

      resolve({
        success: true,
        financingUrl: `${this.config.baseUrl}/hotel/financing?amount=${amount}&supplier=${this.config.supplierId}`,
      });
    });
  }

  /**
   * Destroy the plugin
   */
  destroy(): void {
    this.container?.remove();
    document.getElementById('hotelsvendors-modal')?.remove();
  }
}

// Auto-initialize from script tag
if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const apiKey = script.getAttribute('data-api-key');
    const supplierId = script.getAttribute('data-supplier-id');
    if (apiKey && supplierId) {
      window.HotelsVendors = HotelsVendorsPlugin.init({
        apiKey,
        supplierId,
      });
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotelsVendorsPlugin;
}

export default HotelsVendorsPlugin;
export type { HotelsVendorsConfig, FinancingRequest, FinancingResponse };
