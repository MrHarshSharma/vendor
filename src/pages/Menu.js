import React, { useEffect, useState } from "react";
import AppLayout from "./AppLayout";
import { PlusCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import { Card, message } from "antd";
import { db } from "../firebase/setup";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../actions/cartActions";
import { DOMContentLoaded } from "../constants/commonFunctions";
// import "./Menu.css";  // Assuming you create a Menu.css file for custom styles

function Menu() {
  const { storeId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const empyMenu = {
    maincourse: [],
    starter: [],
    beverage: [],
  };

  const cart = useSelector((state) => state.cart);
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
        setStoreDetails(docSnap.data());
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  useEffect(() => {
    fetchConfigstore();
  }, []);

  useEffect(() => {
    if (storeDetails !== null) {
      DOMContentLoaded(storeDetails.primaryColor);
    }
  }, [storeDetails]);

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  const hexToRgba = (hex, alpha = 0.5) => {
    if (!hex) {
      return "";
    }
    let r = 0,
      g = 0,
      b = 0;

    // Check if hex value is in the shorthand format (e.g. #03F)
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <AppLayout>
      <div
        className="profile-container"
        style={{ background: hexToRgba(storeDetails?.secondaryColor) }}
      >
        {storeDetails !== null ? (
          <div className="menu-container">
            <div
              id="myElement"
              className="menu-info"
              style={{ backgroundColor: storeDetails.primaryColor }}
            >
              <img
                src={storeDetails.logo}
                style={{ width: "100px", height: "100px" }}
              />
              <span className="restaurant-name">
                {storeDetails.restaurantName}
              </span>
              <hr
                className="separator"
                style={{
                  backgroundColor: storeDetails?.secondaryColor,
                  marginTop: "auto",
                }}
              />
              <span
                className="menu-title"
                style={{ color: storeDetails.secondaryColor }}
              >
                MENU
              </span>
              <span
                className="restaurant-type"
                style={{ textTransform: "capitalize" }}
              >
                {storeDetails.restaurantType}
              </span>
              <hr
                className="separator"
                style={{ backgroundColor: storeDetails?.secondaryColor }}
              />
              <span className="tagline">
                {storeDetails.tagline} at {storeDetails.restaurantName}
              </span>
              <span className="subtagline">{storeDetails.subtagline}</span>
              <div className="menu-categories">
                we offer{" "}
                {Object.keys(storeDetails.menu).map((category, i) => (
                  <span key={category} className="category-item">
                    <span
                      onClick={() => scrollToSection(category)}
                      className="category-link"
                      style={{ textTransform: "capitalize" }}
                    >
                      {category}
                    </span>
                    {Object.keys(storeDetails.menu).length - 2 > i && ", "}
                    {Object.keys(storeDetails.menu).length - 2 == i && " and "}
                  </span>
                ))}
              </div>
              <span className="scroll-icon">
                <RightCircleOutlined />
              </span>
            </div>

            {storeDetails.menu &&
              Object.keys(storeDetails.menu).map((category) => {
                const menuItem = storeDetails.menu[category];
                return (
                  menuItem.length > 0 && (
                    <div
                      className="menu-category"
                      style={{ backgroundColor: "#fff" }}
                    >
                      <Card
                        id={category}
                        title={
                          category.charAt(0).toUpperCase() + category.slice(1)
                        }
                        key={category}
                        className="menu-card"
                        // style={{ backgroundColor: storeDetails.secondaryColor }}
                      >
                     
                        <div className="menu-items">
                          {menuItem.map((item) => (
                            <>
                              {item.available && (
                                <div className='item-menu'>
                                  <div style={{textAlign:'center'}}>
                                    <img
                                      src={item.imageUrl}
                                      style={{
                                        width: "70px",
                                        borderRadius: "5px",
                                      }}
                                    />
                                  </div>
                                  <div key={item.name} className="menu-item">
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                      }}
                                    >
                                      <span style={{color:storeDetails.primaryColor}} >{item.name}</span>
                                      <span style={{color:storeDetails.primaryColor}} className="menu-item-description">
                                        {item.description}
                                      </span>
                                      <div style={{ marginTop: "10px",display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                                      <span style={{color:storeDetails.primaryColor}}>
                                      {item.price} Rs
                                      </span>
                                      <span style={{backgroundColor:hexToRgba(storeDetails.secondaryColor),  padding:'2px 5px', borderRadius:'5px'}}>
                                      <PlusCircleOutlined
                                      style={{ color: "green", cursor: "pointer", }}
                                      onClick={() => {
                                        handleAddToCart(item);
                                        message.success(`${item.name} added to cart`);
                                        }}
                                        />
                                        Add
                                        </span>
                                        </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ))}
                        </div>
                       
                      </Card>
                    </div>
                  )
                );
              })}
          </div>
        ) : (
          <span>Store not configured yet</span>
        )}

        {cart.length > 0 && (
          <div
            onClick={() => {
              navigate(`/review/${storeId}`);
            }}
            className="cart-summary"
            style={{ backgroundColor: storeDetails?.secondaryColor }}
          >
            <span>View and confirm order ({cart.length} items)</span>
            <span className="cart-summary-icon">
              <RightCircleOutlined />
            </span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Menu;
