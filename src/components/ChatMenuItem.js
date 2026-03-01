import React from "react";
import { PlusOutlined, MinusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, incrementQuantity, decrementQuantity, removeFromCart } from "../actions/cartActions";

const getCartItemId = (item) => `${item.name}_${item.price}`;

const ChatMenuItem = ({ item, storeDetails }) => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cartReducer.cart);

  const cartItem = cart.find((ci) => getCartItemId(ci) === getCartItemId(item));
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    dispatch(addToCart(item));
  };

  const handleIncrement = () => {
    dispatch(incrementQuantity(getCartItemId(item)));
  };

  const handleDecrementOrRemove = () => {
    if (quantity === 1) {
      dispatch(removeFromCart(getCartItemId(item)));
    } else {
      dispatch(decrementQuantity(getCartItemId(item)));
    }
  };

  return (
    <div className="chat-menu-item">
      <div className="chat-menu-item-info">
        <span className="chat-menu-item-name">{item.name}</span>
        <span className="chat-menu-item-price">
          {storeDetails?.currencySymbol || "₹"}{item.price}
        </span>
      </div>

      {quantity === 0 ? (
        <button className="chat-add-btn" onClick={handleAdd}>
          <PlusOutlined />
        </button>
      ) : (
        <div className="chat-qty-control">
          <button
            className={`chat-qty-btn ${quantity === 1 ? 'chat-delete-btn' : ''}`}
            onClick={handleDecrementOrRemove}
          >
            {quantity === 1 ? (
              <DeleteOutlined style={{ fontSize: "12px" }} />
            ) : (
              <MinusOutlined style={{ fontSize: "12px" }} />
            )}
          </button>
          <span className="chat-qty-value">{quantity}</span>
          <button className="chat-qty-btn" onClick={handleIncrement}>
            <PlusOutlined style={{ fontSize: "12px" }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMenuItem;
