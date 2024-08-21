import React, { useEffect, useState } from "react";
import SpalashScreen from "../components/SpalashScreen";
import ToolHeader from "../components/ToolHeader";
import { useSelector } from "react-redux";
import Withlove from "../components/Withlove";

function AppLayout({ children }) {
  const isLoaded = useSelector((state) => state.loadingReducer.loading);

  return (
    <div>
      {/*<ToolHeader />*/}
      <div>
        {children}
        {isLoaded && (
          <div className="loadingScreen">
            <SpalashScreen />
          </div>
        )}
        <Withlove />
      </div>
    </div>
  );
}

export default AppLayout;
