import React, { useEffect, useState } from 'react'
import SpalashScreen from '../components/SpalashScreen'
import ToolHeader from '../components/ToolHeader'
import { useSelector } from 'react-redux'

function AppLayout({children}) {
  const isLoaded = useSelector(state=>state.loadingReducer.loading)
 
  return (
    <div>
    {/*<ToolHeader />*/}
    <div style={{
      // marginTop:'50px'
    }}>
    {children}
    {isLoaded && (

      <div className='loadingScreen'>
      <SpalashScreen />
      </div>
      )}
    </div>
    </div>
  )
}

export default AppLayout