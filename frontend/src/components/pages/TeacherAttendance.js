import React from 'react';
import { Box, AppBar, Tabs, Tab, Button, Grid, Typography, Paper, Select, MenuItem, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AttendanceList = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* App Bar with Tabs */}
      <AppBar position="static" style={{ backgroundColor: '#f5f5f5', boxShadow: 'none' }}>
        <Tabs value={0}>
          <Tab label="Home" style={{ color: '#000' }} />
          <Tab label="Details" style={{ color: '#000' }} />
          <Tab label="Student" style={{ color: '#000' }} />
        </Tabs>
      </AppBar>

      {/* Timer Box */}
      <Box style={{ textAlign: 'right', padding: '10px' }}>
        <Typography variant="h5" style={{ color: 'red' }}>05:00</Typography>
      </Box>

      {/* Main Content Area */}
      <Box textAlign="center" mt={4}>
        <Typography variant="h4">Attendance List</Typography>
        
        {/* Section Dropdown */}
        <Box mt={2}>
          <Select value="" displayEmpty variant="outlined">
            <MenuItem value="">Section</MenuItem>
            {/* Add more sections as needed */}
          </Select>
        </Box>

        {/* Start Session Button */}
        <Box mt={2}>
          <Button variant="contained" style={{ backgroundColor: '#c4c4c4' }}>Start Session</Button>
        </Box>

        {/* Attendance List */}
        <Box mt={4}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Paper elevation={3} style={{ padding: '10px', backgroundColor: '#3a3a3a', color: '#fff' }}>
                <Typography>Roll No</Typography>
                <Typography>Student Name</Typography>
                <Checkbox />
              </Paper>
            </Grid>

            {/* Example student boxes */}
            {[
              { roll: '21***', name: 'Emaan' },
              { roll: '****', name: 'Jonas' },
              { roll: '****', name: 'Abdullah' },
              { roll: '****', name: 'Yaseen' },
              { roll: '***', name: 'Arooj' },
            ].map((student, index) => (
              <Grid item key={index}>
                <Paper elevation={3} style={{ padding: '10px', backgroundColor: '#e0e0e0' }}>
                  <Typography>{student.roll}</Typography>
                  <Typography>{student.name}</Typography>
                  <Checkbox />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Confirm Button */}
        <Box mt={4}>
          <Button variant="contained" color="primary" onClick={()=>{
                      navigate('/TeacherReportPage');
                }} >Confirm</Button>
        </Box>
      </Box>
    </Box>
  );
}

export default AttendanceList;
