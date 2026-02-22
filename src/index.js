import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import Menu from "./pages/Menu";
import { Provider } from "react-redux";
import store from "./store";
import ReviewMenu from "./pages/ReviewMenu";
import Feedback from "./pages/Feedback";
import OrderHistory from "./pages/OrderHistory";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="/menu/:storeId/:table" element={<Menu />} />
     
      <Route path="/review/:storeId/:table" element={<ReviewMenu />} />
      <Route path="/orders/:storeId/:table" element={<OrderHistory />} />
      <Route path="/feedback/:storeId/:orderId/:customerId" element={<Feedback />} />
      {/*
      <Route path="/" element={<Protected />}>
        <Route path="/" index element={<Dashboard />} />
        <Route path="profile" index element={<Profile />} />
        <Route path="menu" index element={<MenuPage />} />
  </Route>
  
  <Route path="login" element={<MobileNumberLogin />} />
*/}
    </Route>
  )
);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={{ token: { colorPrimary: "#00b96b" } }}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
