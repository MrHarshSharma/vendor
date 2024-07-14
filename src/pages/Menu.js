import React, { useEffect, useState } from "react";
import AppLayout from "./AppLayout";
import { PlusCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import { Card, message } from "antd";
import { db } from "../firebase/setup";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { DOMContentLoaded, hexToRgba } from "../constants/commonFunctions";
// import "./Menu.css";  // Assuming you create a Menu.css file for custom styles

import MenuItem from "../components/MenuItem";
import { addStore, setPageLoading } from "../actions/storeActions";

function Menu() {
  const { storeId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const empyMenu = {
    maincourse: [],
    starter: [],
    beverage: [],
  };

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
        setStoreDetails(docSnap.data());
        dispatch(addStore(docSnap.data()));
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      dispatch(setPageLoading({payload: false}));
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
                    <button
                      onClick={() => scrollToSection(category)}
                      className="category-link"
                      style={{
                        textTransform: "capitalize",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid",
                        
                      }}
                    >
                      {category}
                    </button>
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
                                <MenuItem
                                  item={item}
                                  inCart={false}
                                  storeDetails={storeDetails}
                                />
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
          <span>Loading...</span>
        )}

        {cart?.length > 0 && (
          <div
            onClick={() => {
              navigate(`/review/${storeId}`);
            }}
            className="cart-summary"
            style={{ backgroundColor: storeDetails?.secondaryColor, border: `1px solid ${storeDetails?.primaryColor}`}}
          >
            <span>
             Confirm order (
              {cart.reduce((accumulator, item) => {
                return accumulator + item.quantity;
              }, 0)}{" "}
              items)
            </span>
           {/* <span className="cart-summary-icon">
              <RightCircleOutlined />
            </span>*/}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Menu;
