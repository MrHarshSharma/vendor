import React, { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import {
  MinusOutlined, PlusOutlined, ShoppingOutlined, DeleteOutlined,
  HistoryOutlined, MessageOutlined
} from "@ant-design/icons";
import { Drawer, Switch, Button, message, Skeleton } from "antd";
import { db, auth, provider } from "../firebase/setup";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { incrementQuantity, decrementQuantity, removeFromCart, clearCart } from "../actions/cartActions";
import GoogleButton from "react-google-button";

import MenuItem from "../components/MenuItem";
import ChatBot from "../components/ChatBot";
import { addStore, setPageLoading } from "../actions/storeActions";

const getCartItemId = (item) => `${item.name}_${item.price}`;

function Menu() {
  const { storeId } = useParams();
  const { table } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("Categories");
  const [showVeg, setShowVeg] = useState(true);
  const [showNonVeg, setShowNonVeg] = useState(true);

  // Drawer State & Cart State
  const [cartDrawerVisible, setCartDrawerVisible] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const cart = useSelector((state) => state.cartReducer.cart);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for existing active order
  useEffect(() => {
    const checkExistingOrder = async () => {
      if (!user || !cartDrawerVisible) return;
      try {
        const ordersRef = collection(db, "orders");
        let q = query(ordersRef, where("storeId", "==", storeId), where("table", "==", Number(table)), where("customer.uid", "==", user.uid), where("orderStatus", "==", "accept"));
        let snap = await getDocs(q);
        if (snap.empty) {
          q = query(ordersRef, where("storeId", "==", storeId), where("table", "==", Number(table)), where("customer.uid", "==", user.uid), where("orderStatus", "==", "new"));
          snap = await getDocs(q);
        }
        setHasExistingOrder(!snap.empty);
      } catch {
        setHasExistingOrder(false);
      }
    };
    checkExistingOrder();
  }, [cartDrawerVisible, user, storeId, table]);

  // Place order function
  const placeOrder = async (currentUser) => {
    const orderUser = currentUser || user;
    if (!orderUser) {
      message.error("Please sign in to place an order");
      return;
    }

    if (cart.length === 0) {
      message.error("Your cart is empty");
      return;
    }

    setOrderLoading(true);
    try {
      // Check for existing active order (status = "new" or "accept") for same customer & table
      const ordersRef = collection(db, "orders");

      // First check for "accept" (in-progress) orders
      let existingOrderQuery = query(
        ordersRef,
        where("storeId", "==", storeId),
        where("table", "==", Number(table)),
        where("customer.uid", "==", orderUser.uid),
        where("orderStatus", "==", "accept")
      );

      let existingOrdersSnapshot = await getDocs(existingOrderQuery);

      // If no in-progress order, check for "new" orders (not yet accepted)
      if (existingOrdersSnapshot.empty) {
        existingOrderQuery = query(
          ordersRef,
          where("storeId", "==", storeId),
          where("table", "==", Number(table)),
          where("customer.uid", "==", orderUser.uid),
          where("orderStatus", "==", "new")
        );
        existingOrdersSnapshot = await getDocs(existingOrderQuery);
      }

      if (!existingOrdersSnapshot.empty) {
        // Found an existing in-progress order - append new items to it
        const existingOrderDoc = existingOrdersSnapshot.docs[0];
        const existingOrderData = existingOrderDoc.data();
        const existingItems = existingOrderData.order || [];

        // Merge cart items with existing order items
        const mergedItems = [...existingItems];
        const currentTimestamp = Date.now();

        cart.forEach((newItem) => {
          // Add new items with timestamp to track separately
          mergedItems.push({
            ...newItem,
            addedAt: currentTimestamp,
          });
        });

        // Update the existing order with merged items
        const orderRef = doc(db, "orders", existingOrderDoc.id);
        await updateDoc(orderRef, {
          order: mergedItems,
          lastUpdated: currentTimestamp,
        });

        message.success("Items added to your existing order!");
      } else {
        // No existing in-progress order - create a new one
        const docRef = doc(db, "orders", `order_${Date.now()}`);
        await setDoc(docRef, {
          storeId: storeId,
          table: Number(table),
          customer: orderUser,
          timeStamp: Date.now(),
          order: cart,
          orderStatus: "new",
        });

        message.success("Order placed successfully!");
      }

      // Clear cart after successful order
      setTimeout(() => {
        dispatch(clearCart());
        setCartDrawerVisible(false);
      }, 500);
    } catch (error) {
      console.error("Error placing order", error);
      message.error("Error placing order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  // Sign in with Google and place order
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const customerRef = doc(db, "customer", `customer_${Date.now()}`);

      const userData = {
        storeUser: storeId,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
      };

      await setDoc(customerRef, userData);

      localStorage.setItem("token", result.user.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Place order after successful sign in
      await placeOrder(userData);

      return firebaseUser;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      message.error("Failed to sign in. Please try again.");
    }
  };

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



  // Calculate Total (Price * Quantity)
  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AppLayout>
      <div className="profile-container">
        {/* Sticky Top Section */}
        <div className="sticky-top">
          {/* Header */}
          <div className="menu-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storeDetails?.restaurantName && (
                <span style={{ fontSize: '17px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '-0.3px' }}>
                  {storeDetails.restaurantName}
                </span>
              )}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch
                    checked={showVeg}
                    onChange={setShowVeg}
                    size="small"
                    style={{ backgroundColor: showVeg ? '#16A34A' : undefined }}
                  />
                  <span style={{ color: '#1A1A1A', fontSize: '13px', fontWeight: '500' }}>Veg Only</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch
                    checked={showNonVeg}
                    onChange={setShowNonVeg}
                    size="small"
                    style={{ backgroundColor: showNonVeg ? '#DC2626' : undefined }}
                  />
                  <span style={{ color: '#1A1A1A', fontSize: '13px', fontWeight: '500' }}>Non-Veg</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="icon-btn" onClick={() => navigate(`/orders/${storeId}/${table}`)} title="Order History">
                <HistoryOutlined style={{ fontSize: '22px' }} />
              </button>
              {cartTotalCount > 0 && (
                <button className="icon-btn" onClick={() => setCartDrawerVisible(true)}>
                  <ShoppingOutlined style={{ fontSize: '22px' }} />
                  <span className="cart-badge">{cartTotalCount}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Search Bar */}
          {storeDetails && (
            <div className="ai-search-bar" onClick={() => setChatVisible(true)}>
              <MessageOutlined className="ai-search-icon" />
              <span className="ai-search-text">What are you craving today?</span>
              <span className="ai-search-badge">AI</span>
            </div>
          )}

          {/* Horizontal Category Tabs */}
          {storeDetails?.menu && (
            <div className="category-tabs">
              {Object.keys(storeDetails.menu).map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => scrollToSection(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>


        {storeDetails !== null ? (
          <div className="menu-container">
            {/* Grid Content */}
            {storeDetails.menu && (() => {
              const categories = Object.keys(storeDetails.menu);
              let totalVisible = 0;

              const rendered = categories.map((category) => {
                const menuItem = storeDetails.menu[category];
                const filteredItems = menuItem.filter(item => {
                  const isVeg = (typeof item.veg_nonveg === 'string' ? item.veg_nonveg.toLowerCase() === 'veg' : item.veg_nonveg === true)
                    || item.isVeg
                    || item.veg
                    || item.vegetarian
                    || (item.type === 'veg');

                  if (isVeg) return showVeg;
                  return showNonVeg;
                });

                totalVisible += filteredItems.length;

                return filteredItems.length > 0 ? (
                  <div className="menu-category" key={category} id={category}>
                    <h3 style={{
                      color: '#1A1A1A',
                      fontSize: '18px',
                      fontWeight: '700',
                      padding: '20px 4px 6px 4px',
                      margin: 0,
                      textTransform: 'capitalize',
                      letterSpacing: '-0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {category}
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#A1A1AA' }}>
                        ({filteredItems.length})
                      </span>
                    </h3>

                    <div className="menu-items">
                      {filteredItems.map((item) => (
                        <MenuItem
                          key={item.name}
                          item={item}
                          inCart={false}
                          storeDetails={storeDetails}
                        />
                      ))}
                    </div>
                  </div>
                ) : null;
              });

              if (totalVisible === 0) {
                return (
                  <div className="filter-empty-state">
                    <span style={{ fontSize: '36px' }}>🍽️</span>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginTop: '12px' }}>
                      No items found
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717A', marginTop: '4px' }}>
                      Try adjusting your Veg / Non-Veg filters
                    </div>
                  </div>
                );
              }

              return rendered;
            })()}
          </div>
        ) : (
          <div className="menu-container">
            <div style={{ padding: '20px 4px 6px 4px' }}>
              <Skeleton.Button active size="small" style={{ width: 100, height: 22, borderRadius: 6 }} />
            </div>
            <div className="menu-items">
              {[1, 2, 3, 4].map((i) => (
                <div className="item-menu" key={i} style={{ overflow: 'hidden' }}>
                  <div style={{ width: 110, minHeight: 110, flexShrink: 0, background: '#EEEDEA' }} />
                  <div className="card-content" style={{ gap: 8 }}>
                    <Skeleton.Button active size="small" style={{ width: '70%', height: 16, borderRadius: 4 }} />
                    <Skeleton.Button active size="small" style={{ width: '90%', height: 12, borderRadius: 4 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Skeleton.Button active size="small" style={{ width: 50, height: 12, borderRadius: 4 }} />
                      <Skeleton.Button active size="small" style={{ width: 60, height: 12, borderRadius: 4 }} />
                    </div>
                    <Skeleton.Button active size="small" style={{ width: 60, height: 18, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            content: { backgroundColor: '#FFFFFF', color: '#1A1A1A', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' },
            body: { backgroundColor: '#FFFFFF', color: '#1A1A1A' }
          }}
          maskStyle={{ backdropFilter: 'blur(3px)' }}
        >
          <div className="cart-header">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="cart-title">Your Requests</span>
              <span style={{ color: '#71717A', fontSize: '13px' }}>{cartTotalCount} items</span>
            </div>
            <button className="clear-btn" onClick={() => {
              dispatch(clearCart());
              setCartDrawerVisible(false);
            }}>Clear All</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.map((item, index) => (
              <div className="cart-item-card" key={index}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="cart-thumb" />
                ) : (
                  <div className="cart-thumb" style={{ background: '#EEEDEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🥘</span>
                  </div>
                )}

                <div className="cart-item-info">
                  <div>
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-price">{storeDetails?.currencySymbol || "₹"}{item.price * item.quantity}</div>
                  </div>

                  <div className="cart-controls-row">
                    <div className="qty-control-sm">
                      <div className="qty-btn-sm" onClick={() => dispatch(decrementQuantity(getCartItemId(item)))}>
                        <MinusOutlined style={{ fontSize: '12px' }} />
                      </div>
                      <div className="qty-val-sm">{item.quantity}</div>
                      <div className="qty-btn-sm" onClick={() => dispatch(incrementQuantity(getCartItemId(item)))}>
                        <PlusOutlined style={{ fontSize: '12px' }} />
                      </div>
                    </div>
                    <div className="delete-btn" onClick={() => dispatch(removeFromCart(getCartItemId(item)))}>
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
              <div className="cart-total-value">{storeDetails?.currencySymbol || "₹"}{cartTotal.toFixed(2)}</div>
            </div>

            {!user ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleButton
                  label="Sign in to place order"
                  onClick={signInWithGoogle}
                  style={{ borderRadius: '12px', overflow: 'hidden', width: '100%' }}
                />
              </div>
            ) : (
              <Button
                loading={orderLoading}
                onClick={() => placeOrder()}
                className="add-cart-btn-large"
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: '#1A1A1A',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: orderLoading ? 0.7 : 1,
                  letterSpacing: '-0.1px',
                }}
              >
                {hasExistingOrder ? 'Add to Order' : 'Place Order'}
              </Button>
            )}
          </div>
        </Drawer>

        {/* Sticky Cart Bar */}
        {cartTotalCount > 0 && (
          <div className="sticky-cart-bar" onClick={() => setCartDrawerVisible(true)}>
            <div className="sticky-cart-info">
              <span className="sticky-cart-count">{cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'}</span>
              <span className="sticky-cart-total">{storeDetails?.currencySymbol || "₹"}{cartTotal.toFixed(2)}</span>
            </div>
            <span className="sticky-cart-cta">View Cart →</span>
          </div>
        )}

        {/* AI Menu Assistant ChatBot */}
        {storeDetails && (
          <ChatBot storeDetails={storeDetails} storeId={storeId} visible={chatVisible} onClose={() => setChatVisible(false)} />
        )}
      </div >
    </AppLayout >
  );
}

export default Menu;
