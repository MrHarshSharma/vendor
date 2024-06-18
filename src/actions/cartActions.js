// src/actions/cartActions.js
export const ADD_TO_CART = "ADD_TO_CART";
export const REMOVE_FROM_CART = "REMOVE_FROM_CART";
export const INCREMENT_QUANTITY = "INCREMENT_QUANTITY";
export const DECREMENT_QUANTITY = "DECREMENT_QUANTITY";
export const CLEAR_CART = "CLEAR_CART"
export const addToCart = (item) => ({
  type: ADD_TO_CART,
  payload: item,
});

export const removeFromCart = (itemName) => ({
  type: REMOVE_FROM_CART,
  payload: itemName,
});

export const incrementQuantity = (itemName) => ({
  type: INCREMENT_QUANTITY,
  payload: itemName,
});

export const decrementQuantity = (itemName) => ({
  type: DECREMENT_QUANTITY,
  payload: itemName,
});


export const clearCart = () => ({
  type:CLEAR_CART
})