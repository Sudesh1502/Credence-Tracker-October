import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactPaginate from 'react-paginate'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  Typography,
  Button,
  InputBase,
  Modal,
  Box,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Select,
} from '@mui/material'
import { RiEdit2Fill, RiAddBoxFill } from 'react-icons/ri'
import { AiFillDelete, AiOutlineUserAdd } from 'react-icons/ai'
import {
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CFormSelect,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CloseIcon from '@mui/icons-material/Close'
import {
  AccountCircle,
  ExpandMoreOutlined,
  LockOutlined,
  MailOutline,
  Phone,
} from '@mui/icons-material'

import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { IoMdAdd } from 'react-icons/io'
import toast, { Toaster } from 'react-hot-toast'
import CIcon from '@coreui/icons-react'
import { cilSettings } from '@coreui/icons';
import jsPDF from 'jspdf'; // For PDF export
import 'jspdf-autotable'; // For table formatting in PDF

const Users = () => {
  // somthing for testing
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [limit, setLimit] = useState(10)
  const [pageCount, setPageCount] = useState()
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Personal Info', 'Permissions']
  const [isSuperAdmin, setSuperAdmin] = useState(false)
  const [filteredData, setFilteredData] = useState([]);
  const [groups, setGroups] = useState([])
  const [currentPage , setCurrentPage] = useState(1)

  // Go to the next step
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  // Go to the previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleModalClose = () => {
    setEditModalOpen(false)
    setAddModalOpen(false)
    setCurrentStep(0)
  }

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '35%',
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    overflowY: 'auto', // Enable vertical scrolling
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    marginTop: '8px',
  }

  // ###############get users ###################
  const fetchUserData = async (page = 1) => {
    const accessToken = Cookies.get('authToken')
    const url = `${import.meta.env.VITE_API_URL}/user?page=${page}&limit=${limit}&search=${searchQuery}`

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      })

      if (response.data.users) {
        setData(response.data.users)
        setPageCount(response.data.totalPages)
        console.log(response.data.users)
        console.log(response.data.totalPages)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      throw error // Re-throw the error for further handling if needed
    }
  }



  const fetchGroups = async () => {
    const accessToken = Cookies.get('authToken')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/group`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      console.log('groups: ', data.groups)
      setGroups(data.groups) // Assuming the API returns { groups: [...] }
    } catch (error) {
      console.log(error)
    }
  }


  useEffect(() => {
    fetchGroups();
  }, [])




  // ##################### Filter data by search query #######################
  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredData(data); // No query, show all drivers
    } else {
      const filtered = data.filter(
        (user) =>
          user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.mobile?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  useEffect(() => {
    fetchUserData()
  }, [limit, searchQuery])

  useEffect(() => {
    filterUsers(searchQuery);
  }, [data, searchQuery]);

  const handlePageClick = (e) => {
    console.log(e.selected + 1)
    let page = e.selected + 1
    setCurrentPage(page)
    setLoading(true)
    fetchUserData(page)
  }

  // ########################## Add User Form #########################
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    groupsAssigned: [],
    permissions: {
      notification: false,
      devices: false,
      driver: false,
      groups: false,
      users: false,
      report: false,
      stop: false,
      travel: false,
      geofence: false,
      maintenance: false,
      status: false,
      distance: false,
      history: false,
      sensor: false,
      idle: false,
      alerts: false,
      vehicle: false,
      geofenceReport: false,
    },
    isAdmin: false,
  })

  const [availablePermissions, setAvailablePermissions] = useState({})

  // Decode token and extract available permissions
  useEffect(() => {
    const token = Cookies.get('authToken')
    if (token) {
      const decodedToken = jwtDecode(token)

      if (decodedToken.superadmin == true) {
        setSuperAdmin(true)
      } else {
        const userPermissions = decodedToken.user || {}

        // Filter permissions from the token
        const filteredPermissions = {}
        Object.keys(formData.permissions).forEach((key) => {
          if (userPermissions[key] === true) {
            filteredPermissions[key] = true
          }
        })

        setAvailablePermissions(filteredPermissions)
      }
    }
  }, [])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))



    console.log("this is value: ", formData);
  }

  // Handle permission changes
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => {
      const updatedPermissions = {
        ...prev.permissions,
        [name]: checked,
      }

      // If all permissions are checked, set isAdmin to true
      const allPermissionsChecked = Object.values(updatedPermissions).every(
        (permission) => permission,
      )

      return {
        ...prev,
        permissions: updatedPermissions,
        isAdmin: allPermissionsChecked,
      }
    })
  }

  // Handle Admin toggle
  const handleAdminToggle = (e) => {
    const isAdmin = e.target.checked
    setFormData((prev) => ({
      ...prev,
      isAdmin,
      permissions: Object.keys(prev.permissions).reduce((acc, key) => {
        acc[key] = isAdmin // Select/unselect all based on admin toggle
        return acc
      }, {}),
    }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    // const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    // const phonePattern = /^[0-9]{10}$/

    // if (!emailPattern.test(formData.email)) {
    //   toast.error('Please enter a valid email address')
    //   return
    // }

    // if (!phonePattern.test(formData.mobile)) {
    //   toast.error('Please enter a valid 10-digit phone number')
    //   return
    // }

    const dataToSubmit = {
      username: formData.username,
      mobile: formData.mobile,
      email: formData.email,
      password: formData.password,
      groupsAssigned: formData.groupsAssigned,
      ...formData.permissions,
    }

    try {
      console.log('dekhte hai')
      const accessToken = Cookies.get('authToken')
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/user`, dataToSubmit, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 201) {
        toast.success('User is created successfully')
        fetchUserData()
        setAddModalOpen(false)
        setCurrentStep(0)
        setFormData({
          username: '',
          email: '',
          mobile: '',
          password: '',
          permissions: {
            notification: false,
            devices: false,
            driver: false,
            groups: false,
            category: false,
            model: false,
            users: false,
            report: false,
            stop: false,
            travel: false,
            geofence: false,
            maintenance: false,
            status: false,
            distance: false,
            history: false,
            sensor: false,
            idle: false,
            alerts: false,
            vehicle: false,
          },
          isAdmin: false,
        })
      } else {
        toast.error(`Error: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error during submission:', error)
      let errorMessage = 'An error occurred'

      if (error.response) {
        errorMessage = error.response.data.message || error.response.data || 'An error occurred'
      } else if (error.request) {
        errorMessage = 'Network error: Please try again later'
      }

      toast.error(errorMessage)
    }
  }
  // #############################################

  // ####################  edit user  ############################

  const handleEditUser = (userData) => {
    console.log(userData)
    setEditModalOpen(true)
    setFormData({
      id: userData._id,
      username: userData.username,
      email: userData.email,
      mobile: userData.mobile,
      groupsAssigned: userData.groupsAssigned,
      permissions: {
        notification: userData.notification,
        devices: userData.devices,
        driver: userData.driver, // userData uses 'driver' instead of 'drivers'
        groups: userData.groups,
        // category: userData.category,
        // model: userData.model,
        users: userData.users,
        report: userData.report,
        stop: userData.stop,
        travel: userData.travel,
        geofence: userData.geofence,
        maintenance: userData.maintenance,
        status: userData.status,
        distance: userData.distance,
        history: userData.history,
        sensor: userData.sensor,
        idle: userData.idle,
        alerts: userData.alerts,
        vehicle: userData.vehicle,
        geofenceReport: userData.geofenceReport,
      },
      isAdmin: userData.isAdmin || false, // Assuming there is an isAdmin field
    })
    console.log('this is before edit', formData)
  }

  const EditUserSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const dataToSubmit = {
      id: formData.id,
      username: formData.username,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
      groupsAssigned: formData.groupsAssigned,
      ...formData.permissions,
    }

    console.log('Data to submit:', dataToSubmit) // Log the data to be submitted

    try {
      // API call
      const accessToken = Cookies.get('authToken')

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/${dataToSubmit.id}`,
        dataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      // Check if the response status is in the 2xx range
      if (response.status === 200) {
        toast.success('User is edited successfully')
        setEditModalOpen(false)
        setCurrentStep(0)
        fetchUserData()
        setLoading(false)

        setFormData({
          username: '',
          email: '',
          mobile: '',
          password: '',
          permissions: {
            notification: false,
            devices: false,
            driver: false,
            groups: false,
            category: false,
            model: false,
            users: false,
            report: false,
            stop: false,
            travel: false,
            geofence: false,
            maintenance: false,
            status: false,
            distance: false,
            history: false,
            sensor: false,
            idle: false,
            alerts: false,
            vehicle: false,
          },
          isAdmin: false,
        })
      } else {
        // Handle other response statuses
        toast.error(`Error: ${response.status} - ${response.statusText}`)
        setLoading(false)
      }
    } catch (error) {
      // Handle error from the server or network error
      console.error('Error during submission:', error) // Log the error for debugging
      let errorMessage = 'An error occurred'

      // Check if the error response exists
      if (error.response) {
        // If the server responded with a status other than 2xx
        errorMessage = error.response.data.message || error.response.data || 'An error occurred'
      } else if (error.request) {
        // If the request was made but no response was received
        errorMessage = 'Network error: Please try again later'
      }

      // Show an alert with the error message
      toast.error(errorMessage)
    }
  }

  //  ######################### delete user #########################

  const deleteUserSubmit = async (item) => {
    confirm('you want to delete this user')
    console.log(item)

    try {
      const accessToken = Cookies.get('authToken')
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/user/${item._id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.status === 200) {
        toast.error('Successfully deleted User!')
        fetchUserData()
      }
    } catch (error) {
      throw error.response ? error.response.data : new Error('An error occurred')
    }
  }



  const exportToExcel = async () => {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Data');
  
    // Define the headers
    worksheet.columns = [
      { header: 'SN', key: 'sn', width: 5 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile No.', key: 'mobile', width: 15 },
      { header: 'Master Permissions', key: 'masterPermissions', width: 40 },
      { header: 'Reports Permissions', key: 'reportsPermissions', width: 40 }
    ];
  
    // Add custom styles to headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true,size: 14, color: { argb: 'FFFFFFFF' } };  // White font
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6C757D' },  // Background color set to #6C757D
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  
    // Map filtered data into the format required for export
    filteredData?.forEach((item, rowIndex) => {
      const masterPermissions = ['users', 'groups', 'devices', 'geofence', 'driver', 'notification', 'maintenance']
        .filter((permission) => item[permission])
        .join(', ') || 'N/A';
  
      const reportsPermissions = [
        'history', 'stop', 'travel', 'status', 'distance', 'idle', 'sensor', 'alerts', 'vehicle', 'geofenceReport'
      ]
        .filter((permission) => item[permission])
        .join(', ') || 'N/A';
  
      // Add rows with mapped data
      worksheet.addRow({
        sn: rowIndex + 1,
        name: item.username || 'N/A',
        email: item.email || 'N/A',
        mobile: item.mobile || 'N/A',
        masterPermissions,
        reportsPermissions
      });
    });
  
    // Write the Excel file to a Blob and save it
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'user_data.xlsx');
  };


  const exportToPDF = async () => {


    const doc = new jsPDF({
      orientation: 'landscape',
    });
    const tableColumn = ['SN', 'Name', 'Email', 'Mobile No.', 'Master Permissions', 'Reports Permissions'];

    const tableRows = filteredData?.map((row, rowIndex) => {
      const masterPermissions = ['users', 'groups', 'devices', 'geofence', 'driver', 'notification', 'maintenance']
        .filter((permission) => row[permission])
        .join(', ') || 'N/A';

      const reportsPermissions = [
        'history', 'stop', 'travel', 'status', 'distance', 'idle', 'sensor', 'alerts', 'vehicle', 'geofenceReport'
      ]
        .filter((permission) => row[permission])
        .join(', ') || 'N/A';

      const rowData = [
        row.username || '--',
        row.email || '--',
        row.mobile || 'N/A',
        masterPermissions,
        reportsPermissions
      ];

      return [rowIndex + 1, ...rowData];
    });

    const columnStyles = {
      2: { cellWidth: 35 } // Index 2 is the 'Email' column, setting width to 60 units (adjust as needed)
    };
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      columnStyles: columnStyles,
    });
    doc.save('user_data.pdf');

  }


  //  ####################################################

  return (
    <div className="d-flex flex-column mx-md-3 mt-3 h-auto">
      <Toaster position="top-center" reverseOrder={false} />
      <div>
        <div className="d-flex justify-content-between mb-2">
          <div>
            <h3>Users</h3>
          </div>

          <div className="d-flex">
            <div className="me-3 d-none d-md-block">
              <input
                type="search"
                className="form-control"
                placeholder="search here...."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={() => setAddModalOpen(true)}
                variant="contained"
                className="btn btn-primary"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
        <div className="mb-2 d-md-none">
          <input
            type="search"
            className="form-control"
            placeholder="search here...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow-1 rounded-3 overflow-hidden">
        <CTable align="middle" className="mb-2 border min-vh-25 rounded-top-3" hover responsive>
          <CTableHead className="text-nowrap ">
            <CTableRow>
            <CTableHeaderCell className=" text-center text-white bg-secondary">
                SN
              </CTableHeaderCell>
              <CTableHeaderCell className=" text-center text-white bg-secondary">
                Name
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center text-white bg-secondary">
                Email
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center text-white bg-secondary">
                Mobile No.
              </CTableHeaderCell>
              <CTableHeaderCell className=" text-center text-white bg-secondary">
                Master Permissions
              </CTableHeaderCell>
              <CTableHeaderCell className=" text-center text-white bg-secondary">
                Reports Permissions
              </CTableHeaderCell>
              <CTableHeaderCell className=" text-center text-white bg-secondary">
                Actions
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
       
          <CTableBody>
            {loading ? (
              <CTableRow>

                <CTableDataCell colSpan="6" className="text-center">
                  <div className="text-nowrap mb-2 text-center w-">
                    <p className="card-text placeholder-glow">
                      <span className="placeholder col-12" />
                    </p>
                    <p className="card-text placeholder-glow">
                      <span className="placeholder col-12" />
                    </p>
                    <p className="card-text placeholder-glow">
                      <span className="placeholder col-12" />
                    </p>
                    <p className="card-text placeholder-glow">
                      <span className="placeholder col-12" />
                    </p>
                  </div>
                </CTableDataCell>
              </CTableRow>
            ) : filteredData.length > 0 ? (
              filteredData?.map((item, index) => (
                <CTableRow key={index} className="p-0">
                  <CTableDataCell className='text-center p-0'>{(currentPage - 1)  * limit + index + 1}</CTableDataCell>
                  <CTableDataCell className="text-center p-0">{item.username}</CTableDataCell>
                  <CTableDataCell className="text-center p-0">{item.email}</CTableDataCell>
                  <CTableDataCell className="text-center p-0">
                    {item.mobile || 'N/A'}
                  </CTableDataCell>

                  {/* Master Column */}
                  <CTableDataCell className="text-center p-0">
                    <CFormSelect id="periods" className="w-75 text-center border-0">
                      <option value="">Master</option>
                      {[
                        'users',
                        'groups',
                        'devices',
                        'geofence',
                        'driver',
                        'notification',
                        'maintenance',
                      ].map(
                        (permission) =>
                          item[permission] && (
                            <option key={permission} value={permission}>
                              {permission.charAt(0).toUpperCase() + permission.slice(1)}
                            </option>
                          ),
                      )}
                    </CFormSelect>
                  </CTableDataCell>

                  {/* Reports Column */}
                  <CTableDataCell className="align-items-center p-0">
                    <CFormSelect id="periods" className="w-75 text-center border-0">
                      <option value="">Reports</option>
                      {[
                        'history',
                        'stop',
                        'travel',
                        'status',
                        'distance',
                        'idle',
                        'sensor',
                        'alerts',
                        'vehicle',
                        'geofenceReport',
                      ].map(
                        (permission) =>
                          item[permission] && (
                            <option key={permission} value={permission}>
                              {permission.charAt(0).toUpperCase() + permission.slice(1)}
                            </option>
                          ),
                      )}
                    </CFormSelect>
                  </CTableDataCell>
                  <CTableDataCell
                    className="text-center d-flex p-0"
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                  >
                    <IconButton aria-label="edit" onClick={() => handleEditUser(item)}>
                      <RiEdit2Fill
                        style={{ fontSize: '20px', color: 'lightBlue', margin: '2px' }}
                      />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => deleteUserSubmit(item)}>
                      <AiFillDelete style={{ fontSize: '20px', color: 'red', margin: '2px' }} />
                    </IconButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            ) : (
              <CTableRow>
                <CTableDataCell colSpan="6" className="text-center">
                  <div
                    className="d-flex flex-column justify-content-center align-items-center"
                    style={{ height: '200px' }}
                  >
                    <p className="mb-0 fw-bold">
                      "Oops! Looks like there's nobody here yet.
                      <br /> Maybe it's time to invite some awesome users!"
                    </p>
                    <div>
                      <button
                        onClick={() => setAddModalOpen(true)}
                        variant="contained"
                        className="btn btn-primary m-3 text-white"
                      >
                        <span>
                          <IoMdAdd className="fs-5" />
                        </span>{' '}
                        Add User
                      </button>
                    </div>
                  </div>
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </div>
      <CDropdown className="position-fixed bottom-0 end-0 m-3">
        <CDropdownToggle
          color="secondary"
          style={{ borderRadius: '50%', padding: '10px', height: '48px', width: '48px' }}
        >
          <CIcon icon={cilSettings} />

        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem onClick={exportToPDF} >PDF</CDropdownItem>
          <CDropdownItem onClick={exportToExcel} >Excel</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
      <div className='d-flex justify-content-center align-items-center'>
        <div className="d-flex">
          {/* Pagination */}
          <div className="me-3"> {/* Adds margin to the right of pagination */}
            <ReactPaginate
              breakLabel="..."
              nextLabel="next >"
              onPageChange={handlePageClick}
              pageRangeDisplayed={5}
              pageCount={pageCount} // Set based on the total pages from the API
              previousLabel="< previous"
              renderOnZeroPageCount={null}
              marginPagesDisplayed={2}
              containerClassName="pagination justify-content-center"
              pageClassName="page-item"
              pageLinkClassName="page-link"
              previousClassName="page-item"
              previousLinkClassName="page-link"
              nextClassName="page-item"
              nextLinkClassName="page-link"
              activeClassName="active"
            />
          </div>
          {/* Form Control */}
          <div style={{ width: "90px" }}>
            <CFormSelect
              aria-label="Default select example"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              options={[
                { label: '10', value: '10' },
                { label: '50', value: '50' },
                { label: '500', value: '500' },
                { label: '5000', value: '5000' }
              ]}
            />
          </div>
        </div>
      </div>

      <Modal open={addModalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            ...style,
            backgroundColor: '#f7f9fc',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '30px',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold', fontSize: '24px' }}>
              <span role="img" aria-label="user">
                <AiOutlineUserAdd className="fs-2" />
              </span>{' '}
              Add User
            </Typography>
            <IconButton onClick={handleModalClose}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Step-by-step form with progress indicator */}
          <div>
            <Stepper activeStep={currentStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {currentStep === 0 && (
              <div className="mt-3">
                {/* Personal Info Step */}
                <TextField
                  label="User Name"
                  variant="outlined"
                  name="username"
                  value={formData.username !== undefined ? formData.username : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  name="email"
                  value={formData.email !== undefined ? formData.email : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  // required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutline />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Mobile Number"
                  variant="outlined"
                  name="mobile"
                  type="phone"
                  value={formData.mobile !== undefined ? formData.mobile : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Password"
                  variant="outlined"
                  name="password"
                  type="password"
                  value={formData.password !== undefined ? formData.password : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl fullWidth sx={{ marginBottom: 2 }} key={"group"}>
                  <InputLabel>Groups</InputLabel>
                  <Select
                    name="groupsAssigned" // Should match the key in formData
                    value={formData.groupsAssigned || []} // This is already an array in formData
                    onChange={handleInputChange}
                    label="Groups"
                    multiple
                  >
                    {groups.map((group) => (
                      <MenuItem key={group._id} value={group._id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mt-3">
                {/* Permissions Step */}
                <Typography sx={{ color: '#333', fontWeight: 'bold', marginTop: '15px' }}>
                  <span role="img" aria-label="permissions">
                    🔒
                  </span>{' '}
                  Permissions
                </Typography>

                <FormControlLabel
                  sx={{ color: 'black' }}
                  control={<Checkbox checked={formData.isAdmin} onChange={handleAdminToggle} />}
                  label="Admin (Select all permissions)"
                />

                {isSuperAdmin ? (
                  <div className="row w-100">
                    <div className="col">
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                          Master
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup sx={{ color: 'black' }}>
                            {[
                              'users',
                              'groups',
                              'devices',
                              'geofence',
                              'driver',
                              'maintenance',
                              'notification',
                            ].map((permission) => (
                              <FormControlLabel
                                key={permission}
                                control={
                                  <Checkbox
                                    name={permission}
                                    checked={formData.permissions[permission]}
                                    onChange={handlePermissionChange}
                                  />
                                }
                                label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                              />
                            ))}
                          </FormGroup>
                        </AccordionDetails>
                      </Accordion>
                    </div>

                    <div className="col">
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                          Reports
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup sx={{ color: 'black' }}>
                            {[
                              'history',
                              'stop',
                              'travel',
                              'idle',
                              'status',
                              'distance',
                              'alerts',
                              'vehicle',
                              'sensor',
                              'geofenceReport',
                            ].map((permission) => (
                              <FormControlLabel
                                key={permission}
                                control={
                                  <Checkbox
                                    name={permission}
                                    checked={formData.permissions[permission]}
                                    onChange={handlePermissionChange}
                                  />
                                }
                                label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                              />
                            ))}
                          </FormGroup>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  </div>
                ) : (
                  Object.keys(availablePermissions).length > 0 && (
                    <div className="row w-100">
                      <div className="col">
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                            Master
                          </AccordionSummary>
                          <AccordionDetails>
                            <FormGroup sx={{ color: 'black' }}>
                              {[
                                'users',
                                'groups',
                                'devices',
                                'geofence',
                                'driver',
                                'maintenance',
                                'notification',
                              ]
                                .filter((permission) => availablePermissions[permission])
                                .map((permission) => (
                                  <FormControlLabel
                                    key={permission}
                                    control={
                                      <Checkbox
                                        name={permission}
                                        checked={formData.permissions[permission]}
                                        onChange={handlePermissionChange}
                                      />
                                    }
                                    label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                                  />
                                ))}
                            </FormGroup>
                          </AccordionDetails>
                        </Accordion>
                      </div>

                      <div className="col">
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                            Reports
                          </AccordionSummary>
                          <AccordionDetails>
                            <FormGroup sx={{ color: 'black' }}>
                              {[
                                'history',
                                'stop',
                                'travel',
                                'idle',
                                'status',
                                'distance',
                                'alerts',
                                'vehicle',
                                'sensor',
                                'geofenceReport',
                              ]
                                .filter((permission) => availablePermissions[permission])
                                .map((permission) => (
                                  <FormControlLabel
                                    key={permission}
                                    control={
                                      <Checkbox
                                        name={permission}
                                        checked={formData.permissions[permission]}
                                        onChange={handlePermissionChange}
                                      />
                                    }
                                    label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                                  />
                                ))}
                            </FormGroup>
                          </AccordionDetails>
                        </Accordion>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between" style={{ marginTop: '20px' }}>
              {currentStep > 0 && (
                <Button onClick={handleBack} variant="outlined">
                  Back
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="contained" color="primary">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} variant="contained" color="primary">
                  Submit
                </Button>
              )}
            </div>
          </div>
        </Box>
      </Modal>
      <Modal open={editModalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            ...style,
            backgroundColor: '#f7f9fc',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '30px',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold', fontSize: '24px' }}>
              <span role="img" aria-label="user">
                <AiOutlineUserAdd className="fs-2" />
              </span>{' '}
              Update User
            </Typography>
            <IconButton onClick={handleModalClose}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Step-by-step form with progress indicator */}
          <div>
            <Stepper activeStep={currentStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {currentStep === 0 && (
              <div className="mt-3">
                {/* Personal Info Step */}
                <TextField
                  label="User Name"
                  variant="outlined"
                  name="username"
                  value={formData.username !== undefined ? formData.username : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  name="email"
                  value={formData.email !== undefined ? formData.email : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutline />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Mobile Number"
                  variant="outlined"
                  name="mobile"
                  type="phone"
                  value={formData.mobile !== undefined ? formData.mobile : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Password"
                  variant="outlined"
                  name="password"
                  type="password"
                  value={formData.password !== undefined ? formData.password : ''}
                  onChange={handleInputChange}
                  sx={{ marginBottom: '10px' }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth sx={{ marginBottom: 2 }} key={"group"}>
                  <InputLabel>{"Group"}</InputLabel>
                  <Select
                    name="groupsAssigned"
                    value={formData.groupsAssigned || []}
                    onChange={handleInputChange}
                    label={"Groups"}
                    multiple
                  >
                    {groups?.map((group) => (
                      <MenuItem key={group._id} value={group._id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mt-3">
                {/* Permissions Step */}
                <Typography sx={{ color: '#333', fontWeight: 'bold', marginTop: '15px' }}>
                  <span role="img" aria-label="permissions">
                    🔒
                  </span>{' '}
                  Permissions
                </Typography>

                <FormControlLabel
                  sx={{ color: 'black' }}
                  control={<Checkbox checked={formData.isAdmin} onChange={handleAdminToggle} />}
                  label="Admin (Select all permissions)"
                />

                <div className="row w-100">
                  <div className="col">
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                        Master
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormGroup sx={{ color: 'black' }}>
                          {[
                            'users',
                            'groups',
                            'devices',
                            'geofence',
                            'driver',
                            'maintenance',
                            'notification'
                          ].map((permission) => (
                            <FormControlLabel
                              key={permission}
                              control={
                                <Checkbox
                                  name={permission}
                                  checked={formData.permissions[permission]}
                                  onChange={handlePermissionChange}
                                />
                              }
                              label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                            />
                          ))}
                        </FormGroup>
                      </AccordionDetails>
                    </Accordion>
                  </div>

                  <div className="col">
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                        Reports
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormGroup sx={{ color: 'black' }}>
                          {[
                            'history',
                            'stop',
                            'travel',
                            'idle',
                            'status',
                            'distance',
                            'alerts',
                            'vehicle',
                            'sensor',
                            'geofenceReport',
                          ].map((permission) => (
                            <FormControlLabel
                              key={permission}
                              control={
                                <Checkbox
                                  name={permission}
                                  checked={formData.permissions[permission]}
                                  onChange={handlePermissionChange}
                                />
                              }
                              label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                            />
                          ))}
                        </FormGroup>
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between" style={{ marginTop: '20px' }}>
              {currentStep > 0 && (
                <Button onClick={handleBack} variant="outlined">
                  Back
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="contained" color="primary">
                  Next
                </Button>
              ) : (
                <Button onClick={EditUserSubmit} variant="contained" color="primary">
                  Submit
                </Button>
              )}
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  )
}

export default Users