/**
 * Shared admin form styles for modals and form components
 * Used across TripWizard modals, selectors, and admin forms
 */

/**
 * CSS styles for admin form modals - Apply via <style> tag or className="admin-form-modal"
 * These styles provide consistent input/select/textarea styling with proper focus states
 */
export const ADMIN_MODAL_FIELD_STYLES = `
  .admin-form-modal input,
  .admin-form-modal select,
  .admin-form-modal textarea {
    height: 40px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .admin-form-modal textarea {
    height: auto;
    padding: 8px 12px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder,
  .admin-form-modal select::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
    --tw-ring-offset-width: 0px !important;
    --tw-ring-width: 0px !important;
  }
  .admin-form-modal label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
    display: block;
  }
`;

/**
 * Tailwind classes for admin card containers
 */
export const ADMIN_CARD_STYLES = 'bg-white/5 backdrop-blur-md rounded-xl border border-white/20';

/**
 * Tailwind classes for glass card with hover effect
 */
export const ADMIN_CARD_HOVER_STYLES =
  'bg-white/5 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200';
