import React, { useEffect } from "react";
import { addToCart, decrementQuantity, incrementQuantity, removeFromCart } from "../actions/cartActions";
import { useDispatch, useSelector } from "react-redux";
import { message } from 'antd'
import { LiaRupeeSignSolid } from "react-icons/lia";
import { hexToRgba, renderIngridents } from "../constants/commonFunctions";
import { BiDish } from "react-icons/bi";
import { MdOutlineTimer } from "react-icons/md";
import { GiCampCookingPot } from "react-icons/gi";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  LeftCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { BiFoodTag } from "react-icons/bi";
import CartActionButtons from "./CartActionButtons";

const MenuItem = ({ item, inCart, storeDetails, onOpenDrawer }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
  };

  const cart = useSelector(state => state.cartReducer.cart);
  const cartItem = cart.find(cartItem => cartItem.name === item.name);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Derive Veg status from multiple potential keys
  const isVeg = item.veg_nonveg;



  return (
    <div className="item-menu">
      <div className="card-image-container">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="card-image" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '30px' }}>🥘</span>
          </div>
        )}

        {/* Diet Icon Top Left */}
        <div className={`diet-icon ${item.veg_nonveg === 'Veg' || item.veg_nonveg === 'veg' || item.veg_nonveg === true ? 'veg' : 'non-veg'}`}
          style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px', backdropFilter: 'blur(4px)' }}>
          <div className="diet-dot"></div>
        </div>

        {/* Floating Quantity Selector */}
        <div style={{ position: 'absolute', bottom: '-15px', right: '50%', transform: 'translateX(50%)', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          {quantity === 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dispatch(addToCart(item));
              }}
              className="add-btn"
              style={{ width: '36px', height: '36px', background: 'white', color: '#1F2332' }}
            >
              <PlusOutlined style={{ fontSize: '18px', fontWeight: 'bold' }} />
            </div>
          ) : (
            <div className="qty-box-large" style={{ width: '85px', height: '30px', borderRadius: '8px', padding: '0 4px', background: '#FDD874', justifyContent: 'space-between' }}>
              <div
                style={{ color: '#1F2332', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity === 1) {
                    dispatch(removeFromCart(item.name));
                  } else {
                    dispatch(decrementQuantity(item.name));
                  }
                }}
              >
                <MinusOutlined />
              </div>

              <span style={{ color: '#1F2332', fontWeight: '700', fontSize: '14px' }}>{quantity}</span>

              <div
                style={{ color: '#1F2332', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(incrementQuantity(item.name));
                }}
              >
                <PlusOutlined />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <div>
          <div className="card-title">{item.name}</div>
          <div className="card-desc">{item.description}</div>

          {/* Metadata: Servings & Time */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '11px', color: '#9CA3AF' }}>
            {item.servings && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BiDish style={{ color: '#FDD874' }} /> {item.servings}
              </span>
            )}
            {item.prep_time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdOutlineTimer style={{ color: '#FDD874' }} /> {item.prep_time} mins
              </span>
            )}
          </div>
        </div>

        <div className="card-footer" style={{ marginTop: '0' }}>
          <div className="card-price">
            <span style={{ fontSize: '14px', marginRight: '2px' }}>$</span>{item.price}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
