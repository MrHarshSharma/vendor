// src/reducers/cartReducer.js
import { ADD_TO_CART, REMOVE_FROM_CART, INCREMENT_QUANTITY, DECREMENT_QUANTITY, CLEAR_CART } from "../actions/cartActions";

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

const initialState = {
  cart: loadCartFromStorage(),
};

// Helper to generate unique cart item ID
const getCartItemId = (item) => `${item.name}_${item.price}`;

export const cartReducer = (state = initialState, action) => {
  let newState;

  switch (action.type) {
    case ADD_TO_CART:
      const newItemId = getCartItemId(action.payload);
      const existingItemIndex = state.cart.findIndex(
        (item) => getCartItemId(item) === newItemId
      );
      if (existingItemIndex !== -1) {
        // Update item quantity if already in cart
        const updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        newState = { ...state, cart: updatedCart };
      } else {
        // Add new item to cart with quantity 1
        newState = { ...state, cart: [...state.cart, { ...action.payload, quantity: 1 }] };
      }
      saveCartToStorage(newState.cart);
      return newState;

    case REMOVE_FROM_CART:
      newState = {
        ...state,
        cart: state.cart.filter((item) => getCartItemId(item) !== action.payload),
      };
      saveCartToStorage(newState.cart);
      return newState;

    case INCREMENT_QUANTITY:
      newState = {
        ...state,
        cart: state.cart.map((item) =>
          getCartItemId(item) === action.payload
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
      saveCartToStorage(newState.cart);
      return newState;

    case DECREMENT_QUANTITY:
      newState = {
        ...state,
        cart: state.cart.map((item) =>
          getCartItemId(item) === action.payload && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ),
      };
      saveCartToStorage(newState.cart);
      return newState;

    case CLEAR_CART:
      saveCartToStorage([]);
      return { cart: [] };

    default:
      return state;
  }
};
