import React from 'react'
import { useSelector } from 'react-redux'

function Sidenew() {
  const toggle = useSelector((state) => state.navbar)
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)

  return (
    // Wrap the conditional rendering properly in parentheses
    toggle.home && (
      <div style={{ display: 'flex', padding: '2px', gap: '5px' }}>
        <div>Home</div>
        <div>Master</div>
        <div>Reports</div>
        <div>Expense</div>
        {/* <div>Supports</div> */}
      </div>
    )
  )
}

export default Sidenew
