import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { VscAccount } from 'react-icons/vsc'
import { BiSupport } from 'react-icons/bi'
import { CgLogOut } from 'react-icons/cg'
import { useNavigate } from 'react-router-dom'
import { socket } from '../../features/LivetrackingDataSlice'

const AppHeaderDropdown = () => {
  const token = Cookies.get('authToken')
  const navigate = useNavigate();
  let decodedToken;
  if (token) {
    decodedToken = jwtDecode(token)
  }else{
    navigate('/login');
  }

  const logoutFunc = () => {
    Cookies.remove('authToken')
    Cookies.remove('crdntl')
    socket.disconnect();
    navigate('/login')
    window.location.reload();
  }

  const handleHelpSupportClick = () => {
    navigate('/HelpSupp');  // Navigates to the HelpSupp page
    window.location.reload();
  }


  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 fs-5 pe-0" caret={false}>
        <VscAccount />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end" style={{ width: '200px' }}>
        <CDropdownHeader className="fw-semibold mb-2 text-center" style={{ backgroundColor: "#6c757d", color: "white" }} >
          Account
        </CDropdownHeader>
        <div className="px-2">
          <h3 className="text-center my-0">{(decodedToken && decodedToken.user) ? decodedToken.user.username.slice(0, 12) : decodedToken?.username && decodedToken.username.slice(0, 12)}</h3>
          <p className="text-center small mb-3 mt-0">{(decodedToken && decodedToken.user) ? 'User' : 'SuperAdmin'}</p>
        </div>
        <CDropdownItem onClick={handleHelpSupportClick}>
          <BiSupport className="me-3 fs-5" />
          Help & Support
        </CDropdownItem>
        <CDropdownItem onClick={logoutFunc}>
          <CgLogOut className="me-3 fs-5" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
