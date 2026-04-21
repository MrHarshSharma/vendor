import React from "react";
import { addToCart, decrementQuantity, incrementQuantity, removeFromCart } from "../actions/cartActions";
import { useDispatch, useSelector } from "react-redux";
import { BiDish } from "react-icons/bi";
import { MdOutlineTimer } from "react-icons/md";
import {
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const getCartItemId = (item) => `${item.name}_${item.price}`;

const MenuItem = ({ item, storeDetails }) => {
  const dispatch = useDispatch();
  const itemId = getCartItemId(item);

  const cart = useSelector(state => state.cartReducer.cart);
  const cartItem = cart.find(cartItem => getCartItemId(cartItem) === itemId);
  const quantity = cartItem ? cartItem.quantity : 0;



  return (
    <div className="item-menu">
      <div className="card-image-container">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="card-image" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#EEEDEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '30px' }}>🥘</span>
          </div>
        )}


      </div>

      <div className="card-content">
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <div className={`diet-icon ${item.veg_nonveg === 'Veg' || item.veg_nonveg === 'veg' || item.veg_nonveg === true ? 'veg' : 'non-veg'}`}
              style={{ marginTop: '3px', flexShrink: 0 }}>
              <div className="diet-dot"></div>
            </div>
            <div className="card-title">{item.name}</div>
          </div>
          <div className="card-desc">{item.description}</div>

          {/* Metadata: Servings & Time */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '11px', color: '#71717A' }}>
            {item.servings && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BiDish style={{ color: '#71717A' }} /> {item.servings}
              </span>
            )}
            {item.prep_time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdOutlineTimer style={{ color: '#71717A' }} /> {item.prep_time} mins
              </span>
            )}
          </div>
        </div>

        <div className="card-footer" style={{ marginTop: '0' }}>
          <div className="card-price">
            <span style={{ fontSize: '14px', marginRight: '2px' }}>{storeDetails?.currencySymbol || "₹"}</span>{item.price}
          </div>

          {/* Quantity Selector - Right Side */}
          {quantity === 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dispatch(addToCart(item));
              }}
              className="add-btn-text"
            >
              ADD
            </div>
          ) : (
            <div className="qty-box-large" style={{ width: '85px', height: '30px', borderRadius: '8px', padding: '0 4px', background: '#1A1A1A', justifyContent: 'space-between' }}>
              <div
                style={{ color: '#FFFFFF', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity === 1) {
                    dispatch(removeFromCart(itemId));
                  } else {
                    dispatch(decrementQuantity(itemId));
                  }
                }}
              >
                <MinusOutlined />
              </div>
              <span style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '14px' }}>{quantity}</span>
              <div
                style={{ color: '#FFFFFF', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(incrementQuantity(itemId));
                }}
              >
                <PlusOutlined />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
