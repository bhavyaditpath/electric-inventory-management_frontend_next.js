import { PurchaseDto } from '@/types/api-types';

const DECIMAL_10_2_MAX = 99999999.99;
const DECIMAL_18_2_MAX = 9999999999999999.99;

const isDecimalWithScale = (value: string, maxScale: number): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const regex = new RegExp(`^\\d+(\\.\\d{1,${maxScale}})?$`);
  return regex.test(trimmed);
};

const toNumber = (value: string): number => Number(value.trim());

export const calculatePurchaseTotalPrice = (quantity: string, pricePerUnit: string): string => {
  const qty = toNumber(quantity);
  const price = toNumber(pricePerUnit);

  if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price <= 0) {
    return '0.00';
  }

  const total = qty * price;
  if (!Number.isFinite(total)) return '0.00';
  return total.toFixed(2);
};

export const validatePurchaseForm = (formData: PurchaseDto): Record<string, string> => {
  const errors: Record<string, string> = {};

  const productName = formData.productName.trim();
  if (!productName) {
    errors.productName = 'Product name is required';
  } else if (productName.length > 255) {
    errors.productName = 'Product name must be 255 characters or less';
  }

  const brand = formData.brand.trim();
  if (!brand) {
    errors.brand = 'Supplier name is required';
  } else if (brand.length > 255) {
    errors.brand = 'Supplier name must be 255 characters or less';
  }

  const unit = formData.unit.trim();
  if (!unit) {
    errors.unit = 'Unit is required';
  } else if (unit.length > 50) {
    errors.unit = 'Unit must be 50 characters or less';
  }

  if (!isDecimalWithScale(formData.quantity, 2)) {
    errors.quantity = 'Quantity must be a valid number with up to 2 decimal places';
  } else {
    const quantity = toNumber(formData.quantity);
    if (quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    } else if (quantity > DECIMAL_10_2_MAX) {
      errors.quantity = 'Quantity exceeds database limit (max 99999999.99)';
    }
  }

  if (!isDecimalWithScale(formData.pricePerUnit, 2)) {
    errors.pricePerUnit = 'Price per unit must be a valid number with up to 2 decimal places';
  } else {
    const pricePerUnit = toNumber(formData.pricePerUnit);
    if (pricePerUnit <= 0) {
      errors.pricePerUnit = 'Price per unit must be greater than 0';
    } else if (pricePerUnit > DECIMAL_10_2_MAX) {
      errors.pricePerUnit = 'Price per unit exceeds database limit (max 99999999.99)';
    }
  }

  const totalPrice = calculatePurchaseTotalPrice(formData.quantity, formData.pricePerUnit);
  if (!isDecimalWithScale(totalPrice, 2)) {
    errors.totalPrice = 'Total price must be a valid number with up to 2 decimal places';
  } else {
    const total = toNumber(totalPrice);
    if (total <= 0) {
      errors.totalPrice = 'Total price must be greater than 0';
    } else if (total > DECIMAL_18_2_MAX) {
      errors.totalPrice = 'Total price exceeds database limit';
    }
  }

  const thresholdText = formData.lowStockThreshold.trim();
  if (!thresholdText) {
    errors.lowStockThreshold = 'Low stock threshold is required';
  } else if (!/^\d+$/.test(thresholdText)) {
    errors.lowStockThreshold = 'Low stock threshold must be a whole number';
  } else {
    const threshold = Number(thresholdText);
    if (!Number.isSafeInteger(threshold)) {
      errors.lowStockThreshold = 'Low stock threshold is not valid';
    } else if (threshold <= 0) {
      errors.lowStockThreshold = 'Low stock threshold must be at least 1';
    }
  }

  return errors;
};
