import React, { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import {
  DownOutlined,
  MinusOutlined, PlusOutlined, ShoppingOutlined, DeleteOutlined,
  HistoryOutlined
} from "@ant-design/icons";
import { Dropdown, Drawer, Switch, Button, message } from "antd";
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Switch
                  checked={showVeg}
                  onChange={setShowVeg}
                  size="small"
                  style={{ backgroundColor: showVeg ? '#22c55e' : undefined }}
                />
                <span style={{ color: 'white', fontSize: '14px' }}>Veg Only</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Switch
                  checked={showNonVeg}
                  onChange={setShowNonVeg}
                  size="small"
                  style={{ backgroundColor: showNonVeg ? '#ef4444' : undefined }}
                />
                <span style={{ color: 'white', fontSize: '14px' }}>Non-Veg</span>
              </div>
            </div>
            {storeDetails && (
              <Dropdown menu={{ items: categoryItems }} trigger={['click']} overlayStyle={{ minWidth: '150px' }}>
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF', fontSize: '14px' }}>
                  <span style={{ textTransform: 'capitalize' }}>{activeCategory}</span>
                  <DownOutlined style={{ fontSize: '10px' }} />
                </div>
              </Dropdown>
            )}
          </div>

          {/* Right Side: Actions (Orders + Cart) */}
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


        {storeDetails !== null ? (
          <div className="menu-container">
            {/* Grid Content */}
            {storeDetails.menu &&
              Object.keys(storeDetails.menu).map((category) => {
                const menuItem = storeDetails.menu[category];
                // Filter items first
                const filteredItems = menuItem.filter(item => {
                  // Check for Veg status
                  const isVeg = (typeof item.veg_nonveg === 'string' ? item.veg_nonveg.toLowerCase() === 'veg' : item.veg_nonveg === true)
                    || item.isVeg
                    || item.veg
                    || item.vegetarian
                    || (item.type === 'veg');

                  if (isVeg) return showVeg;
                  return showNonVeg;
                });

                // Only render if there are items to show
                return (
                  filteredItems.length > 0 && (
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
                  <div className="cart-thumb" style={{ background: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  height: '56px',
                  backgroundColor: '#F59E0B',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1E2433',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: orderLoading ? 0.7 : 1,
                }}
              >
                Place Order
              </Button>
            )}
          </div>
        </Drawer>

        {/* AI Menu Assistant ChatBot */}
        {storeDetails && (
          <ChatBot storeDetails={storeDetails} storeId={storeId} />
        )}
      </div >
    </AppLayout >
  );
}

export default Menu;
