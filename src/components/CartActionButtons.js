import React from "react";

import {
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
} from "../actions/cartActions";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";

const getCartItemId = (item) => `${item.name}_${item.price}`;

const CartActionButtons = ({ item }) => {
  const dispatch = useDispatch();
  const itemId = getCartItemId(item);
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        flexDirection: "column",
        justifyContent: "end",
      }}
    >
      <div
        style={{
          display: "flex",

          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px",
            border: "1px solid #d2d2d2",
           borderRadius: "5px",
          
        }}
      >
        {item.quantity > 1 && (
          <span  onClick={() => dispatch(decrementQuantity(itemId))}>
            <MinusCircleOutlined className="smallFont" />
          </span>
        )}
        <span  className="smallFont">{item.quantity}</span>
        <span

          onClick={() => dispatch(incrementQuantity(itemId))}
        >
          <PlusCircleOutlined className="smallFont" />
        </span>
      </div>


        <span
          className="smallFont"
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
          onClick={() => dispatch(removeFromCart(itemId))}
        >
          <DeleteOutlined className="smallFont" />
          Remove
        </span>
    </div>
  );
};

export default CartActionButtons;
