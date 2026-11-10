import { create } from 'zustand';
import { calculateGstPaise } from '@/utils/currency';

export interface CartItem {
  menuItemId: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string | null;
  isVeg?: boolean;
  notes?: string | null;
}

export interface AppliedOffer {
  code: string;
  title: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  discountPaise: number;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  tableNumber: number | null;
  appliedOffer: AppliedOffer | null;
  specialInstructions: string;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  incrementItem: (menuItemId: string) => void;
  decrementItem: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  setTable: (tableId: string | null, tableNumber: number | null) => void;
  applyOffer: (offer: AppliedOffer) => void;
  removeOffer: () => void;
  setSpecialInstructions: (instructions: string) => void;

  // Computed getters
  getSubtotalPaise: () => number;
  getDiscountPaise: () => number;
  getSubtotalAfterDiscountPaise: () => number;
  getGstPaise: () => number;
  getTotalPaise: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  tableNumber: null,
  appliedOffer: null,
  specialInstructions: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
      };
    });
  },

  incrementItem: (menuItemId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i
      ),
    }));
  },

  decrementItem: (menuItemId) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === menuItemId);
      if (!existing) return state;
      if (existing.quantity <= 1) {
        return {
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      appliedOffer: null,
      specialInstructions: '',
    });
  },

  setTable: (tableId, tableNumber) => {
    set({ tableId, tableNumber });
  },

  applyOffer: (appliedOffer) => {
    set({ appliedOffer });
  },

  removeOffer: () => {
    set({ appliedOffer: null });
  },

  setSpecialInstructions: (specialInstructions) => {
    set({ specialInstructions });
  },

  getSubtotalPaise: () => {
    return get().items.reduce((acc, item) => acc + item.pricePaise * item.quantity, 0);
  },

  getDiscountPaise: () => {
    return get().appliedOffer?.discountPaise || 0;
  },

  getSubtotalAfterDiscountPaise: () => {
    const subtotal = get().getSubtotalPaise();
    const discount = get().getDiscountPaise();
    return Math.max(0, subtotal - discount);
  },

  getGstPaise: () => {
    const subtotalAfter = get().getSubtotalAfterDiscountPaise();
    return calculateGstPaise(subtotalAfter, 5);
  },

  getTotalPaise: () => {
    const subtotalAfter = get().getSubtotalAfterDiscountPaise();
    const gst = get().getGstPaise();
    return subtotalAfter + gst;
  },

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
}));
