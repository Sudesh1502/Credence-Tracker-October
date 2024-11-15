import { configureStore, combineReducers } from '@reduxjs/toolkit'
import liveFeaturesReducer from './features/LivetrackingDataSlice.js'
import vehicleReducer from './features/vehicleSlice.js'
import columnVisibilityReducer from './features/columnVisibilitySlice.js'
// Initial state and reducer for sidebar and theme
const initialState = {
  sidebarShow: false,
  // theme: 'light',
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    default:
      return state
  }
}

// Combine reducers
const rootReducer = combineReducers({
  liveFeatures: liveFeaturesReducer,
  sidebar: changeState, // Add your sidebar/theme reducer here
  vehicle: vehicleReducer,
  columnVisibility: columnVisibilityReducer
})

// Create the Redux store
const store = configureStore({
  reducer: rootReducer,
})

export default store
