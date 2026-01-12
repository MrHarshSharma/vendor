import React, { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import {
  PlusCircleOutlined, RightCircleOutlined, DownOutlined, CloseOutlined,
  MinusOutlined, PlusOutlined, PhoneOutlined, ShoppingOutlined, DeleteOutlined
} from "@ant-design/icons";
import { Card, message, Dropdown, Space, Drawer } from "antd";
import { db } from "../firebase/setup";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, incrementQuantity, decrementQuantity, removeFromCart, clearCart } from "../actions/cartActions";

import { DOMContentLoaded, hexToRgba } from "../constants/commonFunctions";
// import "./Menu.css";  // Assuming you create a Menu.css file for custom styles

import MenuItem from "../components/MenuItem";
import { addStore, setPageLoading } from "../actions/storeActions";
import Withlove from "../components/Withlove";

function Menu() {
  const { storeId } = useParams();
  const { table } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const empyMenu = {
    maincourse: [],
    starter: [],
    beverage: [],
  };

  const [activeCategory, setActiveCategory] = useState("Categories");

  // Drawer State & Cart State
  const [cartDrawerVisible, setCartDrawerVisible] = useState(false);


  const cart = useSelector((state) => state.cartReducer.cart);
  useEffect(() => {
    console.log(cart);
  }, [cart]);

  const [storeDetails, setStoreDetails] = useState(null);

  const fetchConfigstore = async () => {
    try {
      const configRef = doc(db, "configstore", storeId);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        console.log("this user data", docSnap.data());
        const data = docSnap.data();
        setStoreDetails(data);
        dispatch(addStore(data));
        if (data.menu && Object.keys(data.menu).length > 0) {
          setActiveCategory(Object.keys(data.menu)[0]);
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      dispatch(setPageLoading({ payload: false }));
    }
  };

  useEffect(() => {
    fetchConfigstore();
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      // Offset for sticky header
      const headerOffset = 100;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveCategory(sectionId);
    }
  };



  // Prepare Dropdown Items
  const categoryItems = storeDetails?.menu ? Object.keys(storeDetails.menu).map(cat => ({
    key: cat,
    label: (
      <span onClick={() => scrollToSection(cat)} style={{ textTransform: 'capitalize', fontSize: '16px', padding: '10px 20px', display: 'block' }}>
        {cat}
      </span>
    )
  })) : [];

  // Calculate Total (Price * Quantity)
  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AppLayout>
      <div className="profile-container">
        {/* Header */}
        <div className="menu-header">
          {/* Left Side: Title */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="menu-title-text">Menu</span>
            {storeDetails && (
              <Dropdown menu={{ items: categoryItems }} trigger={['click']} overlayStyle={{ minWidth: '150px' }}>
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF', fontSize: '14px' }}>
                  <span style={{ textTransform: 'capitalize' }}>{activeCategory}</span>
                  <DownOutlined style={{ fontSize: '10px' }} />
                </div>
              </Dropdown>
            )}
          </div>

          {/* Right Side: Actions (Phone + Cart) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="icon-btn">
              <PhoneOutlined />
            </button>
            <button className="icon-btn" onClick={() => setCartDrawerVisible(true)}>
              <ShoppingOutlined style={{ fontSize: '22px' }} />
              {cartTotalCount > 0 && <span className="cart-badge">{cartTotalCount}</span>}
            </button>
          </div>
        </div>

        {storeDetails !== null ? (
          <div className="menu-container">
            {/* Grid Content */}
            {storeDetails.menu &&
              Object.keys(storeDetails.menu).map((category) => {
                const menuItem = storeDetails.menu[category];
                return (
                  menuItem.length > 0 && (
                    <div className="menu-category" key={category} id={category}>
                      {/* Category Title */}
                      <h3 style={{
                        color: 'white',
                        fontSize: '22px',
                        fontWeight: '700',
                        padding: '24px 8px 8px 8px',
                        margin: 0,
                        textTransform: 'capitalize'
                      }}>
                        {category}
                      </h3>

                      <div className="menu-items">
                        {menuItem.map((item) => (
                          <MenuItem
                            key={item.name}
                            item={item}
                            inCart={false}
                            storeDetails={storeDetails}
                          />
                        ))}
                      </div>
                    </div>
                  )
                );
              })}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "white" }}>Loading...</div>
        )}



        {/* Cart Drawer */}
        <Drawer
          placement="bottom"
          onClose={() => setCartDrawerVisible(false)}
          open={cartDrawerVisible}
          closable={false}
          height="85vh" // Taller drawer for cart
          className="cart-drawer"
          styles={{
            content: { backgroundColor: '#2B3041', color: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' },
            body: { backgroundColor: '#2B3041', color: 'white' }
          }}
          maskStyle={{ backdropFilter: 'blur(3px)' }}
        >
          <div className="cart-header">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="cart-title">Your Requests</span>
              <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{cartTotalCount} items</span>
            </div>
            <button className="clear-btn" onClick={() => dispatch(clearCart())}>Clear All</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.map((item, index) => (
              <div className="cart-item-card" key={index}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="cart-thumb" />
                ) : (
                  <div className="cart-thumb" style={{ background: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🥘</span>
                  </div>
                )}

                <div className="cart-item-info">
                  <div>
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-price">${item.price}</div>
                  </div>

                  <div className="cart-controls-row">
                    <div className="qty-control-sm">
                      <div className="qty-btn-sm" onClick={() => dispatch(decrementQuantity(item.name))}>
                        <MinusOutlined style={{ fontSize: '12px' }} />
                      </div>
                      <div className="qty-val-sm">{item.quantity}</div>
                      <div className="qty-btn-sm" onClick={() => dispatch(incrementQuantity(item.name))}>
                        <PlusOutlined style={{ fontSize: '12px' }} />
                      </div>
                    </div>
                    <div className="delete-btn" onClick={() => dispatch(removeFromCart(item.name))}>
                      <DeleteOutlined />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total-row">
              <div className="cart-total-label">Total</div>
              <div className="cart-total-value">${cartTotal.toFixed(2)}</div>
            </div>

            <button className="add-cart-btn-large">
              Place Order
            </button>
          </div>
        </Drawer>
      </div >
    </AppLayout >
  );
}

export default Menu;
